// src/utils/validation.js
function makeSlug(v) {
  return String(v || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\- ]+/g, '')   // remove chars não alfanum/hyphen/space
    .replace(/\s+/g, '-')        // spaces -> hyphen
    .replace(/--+/g, '-')
    .slice(0, 255);
}

function validateTitle(title) {
  const t = String(title || '').trim();
  return t.length >= 3 && t.length <= 255;
}

module.exports = { makeSlug, validateTitle };
