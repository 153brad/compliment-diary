import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getPersonById,
  ensurePerson,
  getGroupByCode,
  createGroup,
  createMembership,
  deleteMembership,
  isPersonInGroup,
  listGroupsForPerson,
  listPersonsInGroup,
  getEntry,
  getEntryById,
  upsertEntry,
  listRecentEntriesForPerson,
  listEntriesForMonth,
  listEntriesForDateInGroup,
  toggleReaction,
  countReactions,
  hasReacted,
} from "./db.js";
import { computeStreak, statusForRow } from "./lib/streak.js";
import { colorForIndex, initialOf } from "./lib/colors.js";
import { todayISO, daysAgoISO, isValidDate, isValidMonth } from "./lib/date.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// "gemini-2.5-flash" is no longer available to new API keys — use the rolling
// lightweight-flash alias instead so this keeps working as Google rotates models.
const GEMINI_MODEL = "gemini-flash-latest";
const STREAK_LOOKBACK_DAYS = 60;
const ITEM_LABELS = { doneWell: "하나", endured: "둘", wordToMe: "셋" };

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// ---------------------------------------------------------------------------
// OCR (unchanged)
// ---------------------------------------------------------------------------

const OCR_PROMPT =
  "이 사진에는 손글씨로 적힌 칭찬 일기 문장이 있어. 사진 속 손글씨 문장을 정확히 읽어서 텍스트로만 답해줘. " +
  "따옴표, 설명, 사족 없이 읽은 문장 그대로만 반환해. 여러 줄이면 줄바꿈 없이 자연스럽게 이어서 반환해.";

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

app.post("/api/ocr", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버 .env에 GEMINI_API_KEY를 설정해주세요." });
  }

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "imageBase64가 필요해요." });
  }
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return res.status(400).json({ error: "지원하지 않는 이미지 형식이에요." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: mediaType } },
      { text: OCR_PROMPT },
    ]);

    const text = (result.response.text() || "").trim();
    if (!text) {
      return res.status(422).json({ error: "사진에서 글자를 읽지 못했어요. 다시 시도해주세요." });
    }
    res.json({ text });
  } catch (err) {
    console.error("[ocr] gemini call failed:", err);
    res.status(502).json({ error: "사진을 인식하는 중 문제가 생겼어요. 다시 시도해주세요." });
  }
});

// ---------------------------------------------------------------------------
// Persons / groups / memberships / entries / reactions
// ---------------------------------------------------------------------------

function personPublic(person) {
  const { avatarBg, avatarColor } = colorForIndex(person.color_index);
  return { id: person.id, name: person.display_name, initial: initialOf(person.display_name), avatarBg, avatarColor };
}

function rowToEntryPayload(row) {
  if (!row) return null;
  return {
    doneWell: { text: row.done_well_text, fromPhoto: !!row.done_well_from_photo },
    endured: { text: row.endured_text, fromPhoto: !!row.endured_from_photo },
    wordToMe: { text: row.word_to_me_text, fromPhoto: !!row.word_to_me_from_photo },
  };
}

function formatTimeLabel(sqliteLocalDatetime) {
  // sqliteLocalDatetime looks like "YYYY-MM-DD HH:MM:SS" (local time) — the
  // feed only ever shows today's rows, so a bare "오늘 ..." prefix is safe.
  const timePart = sqliteLocalDatetime.split(" ")[1] || "00:00:00";
  const [hStr, mStr] = timePart.split(":");
  const h = Number(hStr);
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `오늘 ${period} ${h12}:${mStr}`;
}

function ringProgressForRow(row) {
  if (!row) return 0;
  const filled = [row.done_well_text, row.endured_text, row.word_to_me_text].filter(Boolean).length;
  return filled / 3;
}

async function streakFor(personId) {
  const recent = await listRecentEntriesForPerson(personId, daysAgoISO(STREAK_LOOKBACK_DAYS));
  return computeStreak(recent, todayISO());
}

async function requireGroup(req, res) {
  const group = await getGroupByCode(req.params.code);
  if (!group) {
    res.status(404).json({ error: "그룹 코드를 찾을 수 없어요." });
    return null;
  }
  return group;
}

async function requirePerson(res, personId) {
  const person = await getPersonById(Number(personId));
  if (!person) {
    res.status(404).json({ error: "사용자를 찾을 수 없어요." });
    return null;
  }
  return person;
}

function validDeviceKey(deviceKey) {
  return typeof deviceKey === "string" && deviceKey.length > 0 && deviceKey.length <= 100;
}

// --- person bootstrap (no group required) -----------------------------------

app.post("/api/persons", async (req, res) => {
  const deviceKey = req.body?.deviceKey;
  const displayName = (req.body?.displayName || "").trim();
  if (!validDeviceKey(deviceKey)) return res.status(400).json({ error: "잘못된 요청이에요." });
  if (!displayName) return res.status(400).json({ error: "이름을 입력해주세요." });

  const person = await ensurePerson(deviceKey, displayName);
  res.json({ personId: person.id, displayName: person.display_name });
});

// --- groups & membership ------------------------------------------------------

app.post("/api/groups", async (req, res) => {
  const deviceKey = req.body?.deviceKey;
  const displayName = (req.body?.displayName || "").trim();
  const groupName = (req.body?.groupName || "").trim();
  if (!validDeviceKey(deviceKey)) return res.status(400).json({ error: "잘못된 요청이에요." });
  if (!displayName) return res.status(400).json({ error: "이름을 입력해주세요." });

  const person = await ensurePerson(deviceKey, displayName);
  const group = await createGroup(groupName || "우리 다정한 친구들");
  await createMembership(person.id, group.id);
  res.json({
    groupCode: group.code,
    groupId: group.id,
    groupName: group.name,
    personId: person.id,
    displayName: person.display_name,
  });
});

app.post("/api/groups/:code/join", async (req, res) => {
  const group = await requireGroup(req, res);
  if (!group) return;

  const deviceKey = req.body?.deviceKey;
  const displayName = (req.body?.displayName || "").trim();
  if (!validDeviceKey(deviceKey)) return res.status(400).json({ error: "잘못된 요청이에요." });
  if (!displayName) return res.status(400).json({ error: "이름을 입력해주세요." });

  const person = await ensurePerson(deviceKey, displayName);
  await createMembership(person.id, group.id);
  res.json({
    groupCode: group.code,
    groupId: group.id,
    groupName: group.name,
    personId: person.id,
    displayName: person.display_name,
  });
});

app.post("/api/groups/:code/leave", async (req, res) => {
  const group = await requireGroup(req, res);
  if (!group) return;

  const person = await requirePerson(res, req.body?.personId);
  if (!person) return;

  await deleteMembership(person.id, group.id);
  res.json({ ok: true });
});

app.get("/api/persons/:personId/groups", async (req, res) => {
  const person = await requirePerson(res, req.params.personId);
  if (!person) return;

  const rows = await listGroupsForPerson(person.id);
  res.json(rows.map((r) => ({ groupId: r.group_id, groupCode: r.group_code, groupName: r.group_name, joinedAt: r.joined_at })));
});

app.get("/api/groups/:code/members", async (req, res) => {
  const group = await requireGroup(req, res);
  if (!group) return;

  const today = todayISO();
  const rawPersons = await listPersonsInGroup(group.id);
  const members = await Promise.all(
    rawPersons.map(async (p) => {
      const recent = await listRecentEntriesForPerson(p.id, daysAgoISO(STREAK_LOOKBACK_DAYS));
      const todayRow = recent.find((r) => r.entry_date === today);
      return {
        ...personPublic(p),
        streak: computeStreak(recent, today),
        status: statusForRow(todayRow),
        ringProgress: ringProgressForRow(todayRow),
      };
    })
  );
  members.sort((a, b) => b.streak - a.streak);
  res.json(members);
});

app.get("/api/groups/:code/feed", async (req, res) => {
  const group = await requireGroup(req, res);
  if (!group) return;

  const viewerId = Number(req.query.viewerId) || null;
  const today = todayISO();
  const rowsByPerson = new Map((await listEntriesForDateInGroup(group.id, today)).map((r) => [r.person_id, r]));

  const posts = [];
  for (const p of await listPersonsInGroup(group.id)) {
    const row = rowsByPerson.get(p.id);
    const status = statusForRow(row);
    if (status === "none") continue;

    const post = {
      memberId: p.id,
      ...personPublic(p),
      status,
      timeLabel: row ? formatTimeLabel(row.updated_at) : "작성 중",
    };

    if (status === "done") {
      post.entryId = row.id;
      post.items = [
        { label: ITEM_LABELS.doneWell, text: row.done_well_text, fromPhoto: !!row.done_well_from_photo },
        { label: ITEM_LABELS.endured, text: row.endured_text, fromPhoto: !!row.endured_from_photo },
        { label: ITEM_LABELS.wordToMe, text: row.word_to_me_text, fromPhoto: !!row.word_to_me_from_photo },
      ];
      post.reactionCount = await countReactions(row.id);
      post.viewerReacted = viewerId ? await hasReacted(row.id, viewerId) : false;
    }
    posts.push(post);
  }
  res.json(posts);
});

// --- personal entries (no group required) -------------------------------------

app.get("/api/persons/:personId/streak", async (req, res) => {
  const person = await requirePerson(res, req.params.personId);
  if (!person) return;
  res.json({ streak: await streakFor(person.id) });
});

app.get("/api/persons/:personId/entries", async (req, res) => {
  const person = await requirePerson(res, req.params.personId);
  if (!person) return;

  const month = req.query.month;
  if (!isValidMonth(month)) return res.status(400).json({ error: "month는 YYYY-MM 형식이어야 해요." });

  const map = {};
  for (const row of await listEntriesForMonth(person.id, month)) {
    const status = statusForRow(row);
    if (status !== "none") map[row.entry_date] = status;
  }
  res.json(map);
});

app.get("/api/persons/:personId/entries/:date", async (req, res) => {
  const person = await requirePerson(res, req.params.personId);
  if (!person) return;

  if (!isValidDate(req.params.date)) return res.status(400).json({ error: "date는 YYYY-MM-DD 형식이어야 해요." });
  res.json(rowToEntryPayload(await getEntry(person.id, req.params.date)));
});

app.put("/api/persons/:personId/entries/:date", async (req, res) => {
  const person = await requirePerson(res, req.params.personId);
  if (!person) return;

  if (!isValidDate(req.params.date)) return res.status(400).json({ error: "date는 YYYY-MM-DD 형식이어야 해요." });

  const { doneWell, endured, wordToMe } = req.body || {};
  const row = await upsertEntry(person.id, req.params.date, {
    doneWellText: doneWell?.text || "",
    doneWellFromPhoto: !!doneWell?.fromPhoto,
    enduredText: endured?.text || "",
    enduredFromPhoto: !!endured?.fromPhoto,
    wordToMeText: wordToMe?.text || "",
    wordToMeFromPhoto: !!wordToMe?.fromPhoto,
  });

  res.json({
    entry: rowToEntryPayload(row),
    completed: statusForRow(row) === "done",
    streak: await streakFor(person.id),
  });
});

// --- reactions (group-scoped: only fellow group members can react) -----------

app.post("/api/groups/:code/entries/:entryId/react", async (req, res) => {
  const group = await requireGroup(req, res);
  if (!group) return;

  const entryId = Number(req.params.entryId);
  const entry = await getEntryById(entryId);
  if (!entry || !(await isPersonInGroup(entry.person_id, group.id))) {
    return res.status(404).json({ error: "게시물을 찾을 수 없어요." });
  }

  const reactingPerson = await requirePerson(res, req.body?.personId);
  if (!reactingPerson) return;
  if (!(await isPersonInGroup(reactingPerson.id, group.id))) {
    return res.status(403).json({ error: "이 그룹의 멤버만 반응할 수 있어요." });
  }

  res.json(await toggleReaction(entryId, reactingPerson.id));
});

// ---------------------------------------------------------------------------
// Serve the built client (production: `npm run build` output) as static files.
// Placed after all /api routes so API responses always take priority.
// ---------------------------------------------------------------------------

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const port = Number(process.env.PORT) || Number(process.env.SERVER_PORT) || 5175;
app.listen(port, "0.0.0.0", () => {
  console.log(`[server] listening on http://0.0.0.0:${port}`);
});
