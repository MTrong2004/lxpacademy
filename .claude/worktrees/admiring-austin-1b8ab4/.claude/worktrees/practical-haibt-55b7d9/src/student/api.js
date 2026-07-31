/**
 * Student API Fetch Helpers for Learning Hub
 */

import { lhWarn } from '../core/log.js';

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach Supabase access token if available
  try {
    const session = window.HODSupabase?.getSession?.();
    if (session?.access_token) {
      defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    lhWarn('fetchApi:token', e);
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, mergedOptions);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function fetchSubjects() {
  return fetchApi('/subjects?ts=' + Date.now(), { cache: 'no-store' });
}

export async function fetchQuestions(subjectCode) {
  return fetchApi(`/questions?subject_code=${encodeURIComponent(subjectCode)}&ts=${Date.now()}`, { cache: 'no-store' });
}
