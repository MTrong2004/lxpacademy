/**
 * Client authentication and Bearer token helpers for Learning Hub.
 */

export function getSupabaseUser() {
  return window.HODSupabase?.getUser?.() || null;
}

export function isUserLoggedIn() {
  return !!getSupabaseUser();
}

export function getUserProfile() {
  return window.HODSupabase?.getProfile?.() || null;
}

export function isUserApproved() {
  const p = getUserProfile();
  return !p || p.approved !== false;
}

export function isUserStaff() {
  const p = getUserProfile();
  if (!p) return false;
  return ['admin', 'editor'].includes(p.role);
}
