import { createClient } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(dataDir, "app.db")}`,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

await client.execute("PRAGMA foreign_keys = ON;");
await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    name TEXT NOT NULL,
    color_index INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(group_id, name)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    entry_date TEXT NOT NULL,
    done_well_text TEXT NOT NULL DEFAULT '',
    done_well_from_photo INTEGER NOT NULL DEFAULT 0,
    endured_text TEXT NOT NULL DEFAULT '',
    endured_from_photo INTEGER NOT NULL DEFAULT 0,
    word_to_me_text TEXT NOT NULL DEFAULT '',
    word_to_me_from_photo INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(member_id, entry_date)
  );

  CREATE TABLE IF NOT EXISTS reactions (
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (entry_id, member_id)
  );
`);

function randomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let code = "";
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

export async function getGroupByCode(code) {
  const res = await client.execute({ sql: "SELECT * FROM groups WHERE code = ?", args: [code] });
  return res.rows[0];
}

export async function createGroup(name) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    if (await getGroupByCode(code)) continue;
    const res = await client.execute({
      sql: "INSERT INTO groups (code, name) VALUES (?, ?)",
      args: [code, name],
    });
    return { id: Number(res.lastInsertRowid), code, name };
  }
  throw new Error("그룹 코드 생성에 실패했어요. 다시 시도해주세요.");
}

export async function getMemberById(id) {
  const res = await client.execute({ sql: "SELECT * FROM members WHERE id = ?", args: [id] });
  return res.rows[0];
}

export async function getMemberByGroupAndName(groupId, name) {
  const res = await client.execute({
    sql: "SELECT * FROM members WHERE group_id = ? AND name = ?",
    args: [groupId, name],
  });
  return res.rows[0];
}

export async function listMembersByGroup(groupId) {
  const res = await client.execute({
    sql: "SELECT * FROM members WHERE group_id = ? ORDER BY id ASC",
    args: [groupId],
  });
  return res.rows;
}

export async function createMember(groupId, name) {
  const colorIndex = (await listMembersByGroup(groupId)).length;
  const res = await client.execute({
    sql: "INSERT INTO members (group_id, name, color_index) VALUES (?, ?, ?)",
    args: [groupId, name, colorIndex],
  });
  return getMemberById(Number(res.lastInsertRowid));
}

export async function getEntry(memberId, date) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE member_id = ? AND entry_date = ?",
    args: [memberId, date],
  });
  return res.rows[0];
}

export async function getEntryById(entryId) {
  const res = await client.execute({ sql: "SELECT * FROM entries WHERE id = ?", args: [entryId] });
  return res.rows[0];
}

export async function upsertEntry(memberId, date, fields) {
  await client.execute({
    sql: `INSERT INTO entries (
       member_id, entry_date,
       done_well_text, done_well_from_photo,
       endured_text, endured_from_photo,
       word_to_me_text, word_to_me_from_photo,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(member_id, entry_date) DO UPDATE SET
       done_well_text = excluded.done_well_text,
       done_well_from_photo = excluded.done_well_from_photo,
       endured_text = excluded.endured_text,
       endured_from_photo = excluded.endured_from_photo,
       word_to_me_text = excluded.word_to_me_text,
       word_to_me_from_photo = excluded.word_to_me_from_photo,
       updated_at = datetime('now','localtime')`,
    args: [
      memberId,
      date,
      fields.doneWellText,
      fields.doneWellFromPhoto ? 1 : 0,
      fields.enduredText,
      fields.enduredFromPhoto ? 1 : 0,
      fields.wordToMeText,
      fields.wordToMeFromPhoto ? 1 : 0,
    ],
  });
  return getEntry(memberId, date);
}

export async function listRecentEntriesForMember(memberId, sinceDate) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE member_id = ? AND entry_date >= ? ORDER BY entry_date DESC",
    args: [memberId, sinceDate],
  });
  return res.rows;
}

export async function listEntriesForMonth(memberId, monthPrefix) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE member_id = ? AND entry_date LIKE ? ORDER BY entry_date ASC",
    args: [memberId, `${monthPrefix}%`],
  });
  return res.rows;
}

export async function listEntriesForDate(groupId, date) {
  const res = await client.execute({
    sql: `SELECT entries.*, members.name AS member_name, members.color_index AS member_color_index
       FROM entries
       JOIN members ON members.id = entries.member_id
       WHERE members.group_id = ? AND entries.entry_date = ?`,
    args: [groupId, date],
  });
  return res.rows;
}

export async function toggleReaction(entryId, memberId) {
  const existingRes = await client.execute({
    sql: "SELECT 1 FROM reactions WHERE entry_id = ? AND member_id = ?",
    args: [entryId, memberId],
  });
  const existing = existingRes.rows.length > 0;
  if (existing) {
    await client.execute({
      sql: "DELETE FROM reactions WHERE entry_id = ? AND member_id = ?",
      args: [entryId, memberId],
    });
  } else {
    await client.execute({
      sql: "INSERT INTO reactions (entry_id, member_id) VALUES (?, ?)",
      args: [entryId, memberId],
    });
  }
  return {
    reactionCount: await countReactions(entryId),
    reacted: !existing,
  };
}

export async function countReactions(entryId) {
  const res = await client.execute({
    sql: "SELECT COUNT(*) AS c FROM reactions WHERE entry_id = ?",
    args: [entryId],
  });
  return res.rows[0].c;
}

export async function hasReacted(entryId, memberId) {
  const res = await client.execute({
    sql: "SELECT 1 FROM reactions WHERE entry_id = ? AND member_id = ?",
    args: [entryId, memberId],
  });
  return res.rows.length > 0;
}

export default client;
