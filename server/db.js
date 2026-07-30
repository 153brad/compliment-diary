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
  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_key TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    color_index INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id),
    group_id INTEGER NOT NULL REFERENCES groups(id),
    joined_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(person_id, group_id)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id),
    entry_date TEXT NOT NULL,
    done_well_text TEXT NOT NULL DEFAULT '',
    done_well_from_photo INTEGER NOT NULL DEFAULT 0,
    endured_text TEXT NOT NULL DEFAULT '',
    endured_from_photo INTEGER NOT NULL DEFAULT 0,
    word_to_me_text TEXT NOT NULL DEFAULT '',
    word_to_me_from_photo INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(person_id, entry_date)
  );

  CREATE TABLE IF NOT EXISTS reactions (
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    person_id INTEGER NOT NULL REFERENCES persons(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (entry_id, person_id)
  );
`);

// recovery_code was added after the initial persons table shipped, so existing
// databases need a migration + one-time backfill rather than a fresh CREATE TABLE.
const personsCols = (await client.execute("PRAGMA table_info(persons)")).rows.map((r) => r.name);
if (!personsCols.includes("recovery_code")) {
  await client.execute("ALTER TABLE persons ADD COLUMN recovery_code TEXT");
}
await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_recovery_code ON persons(recovery_code)");

function randomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let code = "";
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

// Longer & from a bigger charset than group codes: this one guards access to
// someone's whole diary history, not just an invite to join a group.
function randomRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function generateUniqueRecoveryCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomRecoveryCode();
    if (!(await getPersonByRecoveryCode(code))) return code;
  }
  throw new Error("복구 코드 생성에 실패했어요.");
}

for (const row of (await client.execute("SELECT id FROM persons WHERE recovery_code IS NULL")).rows) {
  await client.execute({
    sql: "UPDATE persons SET recovery_code = ? WHERE id = ?",
    args: [await generateUniqueRecoveryCode(), row.id],
  });
}

// --- persons ---------------------------------------------------------------

export async function getPersonById(id) {
  const res = await client.execute({ sql: "SELECT * FROM persons WHERE id = ?", args: [id] });
  return res.rows[0];
}

export async function getPersonByDeviceKey(deviceKey) {
  const res = await client.execute({ sql: "SELECT * FROM persons WHERE device_key = ?", args: [deviceKey] });
  return res.rows[0];
}

export async function getPersonByRecoveryCode(recoveryCode) {
  const res = await client.execute({ sql: "SELECT * FROM persons WHERE recovery_code = ?", args: [recoveryCode] });
  return res.rows[0];
}

async function countPersons() {
  const res = await client.execute("SELECT COUNT(*) AS c FROM persons");
  return res.rows[0].c;
}

export async function ensurePerson(deviceKey, displayName) {
  const existing = await getPersonByDeviceKey(deviceKey);
  if (existing) return existing;
  const colorIndex = await countPersons();
  const recoveryCode = await generateUniqueRecoveryCode();
  const res = await client.execute({
    sql: "INSERT INTO persons (device_key, display_name, color_index, recovery_code) VALUES (?, ?, ?, ?)",
    args: [deviceKey, displayName, colorIndex, recoveryCode],
  });
  return getPersonById(Number(res.lastInsertRowid));
}

// --- groups & memberships ----------------------------------------------------

export async function getGroupByCode(code) {
  const res = await client.execute({ sql: "SELECT * FROM groups WHERE code = ?", args: [code] });
  return res.rows[0];
}

export async function createGroup(name) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    if (await getGroupByCode(code)) continue;
    const res = await client.execute({ sql: "INSERT INTO groups (code, name) VALUES (?, ?)", args: [code, name] });
    return { id: Number(res.lastInsertRowid), code, name };
  }
  throw new Error("그룹 코드 생성에 실패했어요. 다시 시도해주세요.");
}

export async function createMembership(personId, groupId) {
  await client.execute({
    sql: "INSERT OR IGNORE INTO memberships (person_id, group_id) VALUES (?, ?)",
    args: [personId, groupId],
  });
}

export async function deleteMembership(personId, groupId) {
  await client.execute({
    sql: "DELETE FROM memberships WHERE person_id = ? AND group_id = ?",
    args: [personId, groupId],
  });
}

export async function isPersonInGroup(personId, groupId) {
  const res = await client.execute({
    sql: "SELECT 1 FROM memberships WHERE person_id = ? AND group_id = ?",
    args: [personId, groupId],
  });
  return res.rows.length > 0;
}

export async function listGroupsForPerson(personId) {
  const res = await client.execute({
    sql: `SELECT groups.id AS group_id, groups.code AS group_code, groups.name AS group_name, memberships.joined_at AS joined_at
          FROM memberships JOIN groups ON groups.id = memberships.group_id
          WHERE memberships.person_id = ?
          ORDER BY memberships.joined_at ASC`,
    args: [personId],
  });
  return res.rows;
}

export async function listPersonsInGroup(groupId) {
  const res = await client.execute({
    sql: `SELECT persons.* FROM memberships JOIN persons ON persons.id = memberships.person_id
          WHERE memberships.group_id = ? ORDER BY memberships.id ASC`,
    args: [groupId],
  });
  return res.rows;
}

// --- entries -----------------------------------------------------------------

export async function getEntry(personId, date) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE person_id = ? AND entry_date = ?",
    args: [personId, date],
  });
  return res.rows[0];
}

export async function getEntryById(entryId) {
  const res = await client.execute({ sql: "SELECT * FROM entries WHERE id = ?", args: [entryId] });
  return res.rows[0];
}

export async function upsertEntry(personId, date, fields) {
  await client.execute({
    sql: `INSERT INTO entries (
       person_id, entry_date,
       done_well_text, done_well_from_photo,
       endured_text, endured_from_photo,
       word_to_me_text, word_to_me_from_photo,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(person_id, entry_date) DO UPDATE SET
       done_well_text = excluded.done_well_text,
       done_well_from_photo = excluded.done_well_from_photo,
       endured_text = excluded.endured_text,
       endured_from_photo = excluded.endured_from_photo,
       word_to_me_text = excluded.word_to_me_text,
       word_to_me_from_photo = excluded.word_to_me_from_photo,
       updated_at = datetime('now','localtime')`,
    args: [
      personId,
      date,
      fields.doneWellText,
      fields.doneWellFromPhoto ? 1 : 0,
      fields.enduredText,
      fields.enduredFromPhoto ? 1 : 0,
      fields.wordToMeText,
      fields.wordToMeFromPhoto ? 1 : 0,
    ],
  });
  return getEntry(personId, date);
}

export async function listRecentEntriesForPerson(personId, sinceDate) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE person_id = ? AND entry_date >= ? ORDER BY entry_date DESC",
    args: [personId, sinceDate],
  });
  return res.rows;
}

export async function listEntriesForMonth(personId, monthPrefix) {
  const res = await client.execute({
    sql: "SELECT * FROM entries WHERE person_id = ? AND entry_date LIKE ? ORDER BY entry_date ASC",
    args: [personId, `${monthPrefix}%`],
  });
  return res.rows;
}

export async function listEntriesForDateInGroup(groupId, date) {
  const res = await client.execute({
    sql: `SELECT entries.*
          FROM entries
          JOIN memberships ON memberships.person_id = entries.person_id
          WHERE memberships.group_id = ? AND entries.entry_date = ?`,
    args: [groupId, date],
  });
  return res.rows;
}

// --- reactions -----------------------------------------------------------------

export async function toggleReaction(entryId, personId) {
  const existingRes = await client.execute({
    sql: "SELECT 1 FROM reactions WHERE entry_id = ? AND person_id = ?",
    args: [entryId, personId],
  });
  const existing = existingRes.rows.length > 0;
  if (existing) {
    await client.execute({
      sql: "DELETE FROM reactions WHERE entry_id = ? AND person_id = ?",
      args: [entryId, personId],
    });
  } else {
    await client.execute({
      sql: "INSERT INTO reactions (entry_id, person_id) VALUES (?, ?)",
      args: [entryId, personId],
    });
  }
  return { reactionCount: await countReactions(entryId), reacted: !existing };
}

export async function countReactions(entryId) {
  const res = await client.execute({ sql: "SELECT COUNT(*) AS c FROM reactions WHERE entry_id = ?", args: [entryId] });
  return res.rows[0].c;
}

export async function hasReacted(entryId, personId) {
  const res = await client.execute({
    sql: "SELECT 1 FROM reactions WHERE entry_id = ? AND person_id = ?",
    args: [entryId, personId],
  });
  return res.rows.length > 0;
}

export default client;
