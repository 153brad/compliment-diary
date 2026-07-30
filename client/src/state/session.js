const DEVICE_KEY_STORAGE = "compliment-diary:device-key";
const PERSON_STORAGE = "compliment-diary:person";

/** A permanent per-browser identity. Created once, never cleared by leaving
 * a group — only the person's group memberships change, not who they are. */
export function getOrCreateDeviceKey() {
  try {
    let key = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY_STORAGE, key);
    }
    return key;
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to a
    // session-lifetime key so the app still works, just without persistence.
    return crypto.randomUUID();
  }
}

/** { personId, displayName, activeGroupCode, activeGroupId, activeGroupName } */
export function loadPersonSession() {
  try {
    const raw = localStorage.getItem(PERSON_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.personId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersonSession(session) {
  try {
    localStorage.setItem(PERSON_STORAGE, JSON.stringify(session));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function clearPersonSession() {
  try {
    localStorage.removeItem(PERSON_STORAGE);
  } catch {
    // ignore
  }
}
