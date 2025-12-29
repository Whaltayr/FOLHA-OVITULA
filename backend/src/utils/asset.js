// frontend/src/utils/asset.js
export function assetUrl(path) {
  if (!path) return null;
  // se já for url absoluta, retorna tal qual
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // senão prefixa com API base (VITE_API_URL) — fallback para localhost
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // garantir barra apenas uma vez
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
