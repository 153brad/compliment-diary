async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || "요청을 처리하지 못했어요.");
  }
  return body;
}

export function createPerson(deviceKey, displayName) {
  return request("/persons", { method: "POST", body: JSON.stringify({ deviceKey, displayName }) });
}

export function createGroup(deviceKey, displayName, groupName) {
  return request("/groups", { method: "POST", body: JSON.stringify({ deviceKey, displayName, groupName }) });
}

export function joinGroup(groupCode, deviceKey, displayName) {
  return request(`/groups/${encodeURIComponent(groupCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ deviceKey, displayName }),
  });
}

export function leaveGroup(groupCode, personId) {
  return request(`/groups/${encodeURIComponent(groupCode)}/leave`, {
    method: "POST",
    body: JSON.stringify({ personId }),
  });
}

export function fetchMyGroups(personId) {
  return request(`/persons/${personId}/groups`);
}

export function fetchMembers(groupCode) {
  return request(`/groups/${encodeURIComponent(groupCode)}/members`);
}

export function fetchFeed(groupCode, viewerId) {
  return request(`/groups/${encodeURIComponent(groupCode)}/feed?viewerId=${encodeURIComponent(viewerId)}`);
}

export function fetchStreak(personId) {
  return request(`/persons/${personId}/streak`);
}

export function fetchMonthStatus(personId, monthKey) {
  return request(`/persons/${personId}/entries?month=${encodeURIComponent(monthKey)}`);
}

export function fetchEntry(personId, dateKey) {
  return request(`/persons/${personId}/entries/${dateKey}`);
}

export function saveEntry(personId, dateKey, payload) {
  return request(`/persons/${personId}/entries/${dateKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleReaction(groupCode, entryId, personId) {
  return request(`/groups/${encodeURIComponent(groupCode)}/entries/${entryId}/react`, {
    method: "POST",
    body: JSON.stringify({ personId }),
  });
}
