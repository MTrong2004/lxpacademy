/**
 * Student Subject Selection & Gate Module
 */

import { getDeviceTypeString } from '../core/device.js';

const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';

export function getSubjectCode() {
  return localStorage.getItem(SUBJECT_STORE) || '';
}

export function syncUserSubjectToProfile(code, supabaseUser) {
  const u = supabaseUser || window.HODSupabase?.getUser?.();
  if (!u) return;
  try {
    const md = u.user_metadata || {};
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: u.id,
        email: u.email,
        full_name: md.full_name || md.name || '',
        avatar_url: md.avatar_url || md.picture || '',
        current_subject: code || getSubjectCode() || '',
        device_info: getDeviceTypeString()
      })
    }).catch(e => console.warn('syncUserSubjectToProfile failed:', e));
  } catch(e) {}
}

export function setSubject(code, supabaseUser) {
  if (code) {
    localStorage.setItem(SUBJECT_STORE, code);
  } else {
    localStorage.removeItem(SUBJECT_STORE);
  }
  syncUserSubjectToProfile(code, supabaseUser);
}
