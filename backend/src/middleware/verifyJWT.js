const jwt = require('jsonwebtoken');

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  if (req.cookies && req.cookies.ov_token) return req.cookies.ov_token;
  return null;
}

module.exports = (req, res, next) => {
  console.log('\n🟡 [BACKEND-MIDDLEWARE] VerifyJWT Chamado');
  console.log(`🟡 [BACKEND-MIDDLEWARE] URL Pedido: ${req.method} ${req.originalUrl}`);
  
  const token = getToken(req);

  if (!token) {
    console.log('🟡 [BACKEND-MIDDLEWARE] ❌ NENHUM TOKEN ENCONTRADO!');
    return res.status(401).json({ message: 'No token provided' });
  }

  // console.log('🟡 [BACKEND-MIDDLEWARE] Token recebido:', token.substring(0, 15) + '...');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🟡 [BACKEND-MIDDLEWARE] ✅ Token Válido! Payload:', payload);
    
    req.user = payload; // Anexa o user ao request
    next();
  } catch (err) {
    console.log('🟡 [BACKEND-MIDDLEWARE] ❌ Erro ao verificar token:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};