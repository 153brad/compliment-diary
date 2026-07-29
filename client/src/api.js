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

export function createGroup(groupName, memberName) {
  return request("/groups", { method: "POST", body: JSON.stringify({ groupName, memberName }) });
}

export function joinGroup(groupCode, memberName) {
  return request(`/groups/${encodeURIComponent(groupCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ memberName }),
  });
}

export function fetchMembers(groupCode) {
  return request(`/groups/${encodeURIComponent(groupCode)}/members`);
}

export function fetchFeed(groupCode, viewerId) {
  return request(`/groups/${encodeURIComponent(groupCode)}/feed?viewerId=${encodeURIComponent(viewerId)}`);
}

export function fetchMonthStatus(groupCode, memberId, monthKey) {
  return request(
    `/groups/${encodeURIComponent(groupCode)}/members/${memberId}/entries?month=${encodeURIComponent(monthKey)}`
  );
}

export function fetchEntry(groupCode, memberId, dateKey) {
  return request(`/groups/${encodeURIComponent(groupCode)}/members/${memberId}/entries/${dateKey}`);
}

export function saveEntry(groupCode, memberId, dateKey, payload) {
  return request(`/groups/${encodeURIComponent(groupCode)}/members/${memberId}/entries/${dateKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleReaction(groupCode, entryId, memberId) {
  return request(`/groups/${encodeURIComponent(groupCode)}/entries/${entryId}/react`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
}
