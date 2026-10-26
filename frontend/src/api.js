const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  let response;
  let token = '';
  try { token = JSON.parse(localStorage.getItem('campusconnect-session') || '{}').token || ''; } catch { /* Ignore a damaged browser session. */ }
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Could not reach the CampusConnect API. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed.');
    error.fields = data.errors || {};
    throw error;
  }
  return data;
}

