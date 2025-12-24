// src/middleware/verifyJWT.js
const jwt = require('jsonwebtoken');

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  if (req.cookies && req.cookies.ov_token) return req.cookies.ov_token;
  // fallback: try raw cookie header
  if (req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split('; ').map(c=>{
      const [k, ...v] = c.split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    }));
    return cookies.ov_token;
  }
  return null;
}

module.exports = (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
