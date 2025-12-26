// frontend/src/services/auth.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
//used to be called login
export async function loginRequest(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Login failed');
  }
  return res.json(); // espera { token, user } ou similar
}
