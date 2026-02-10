const ROLE_LEVELS = {
  author: 1,
  editor: 2,
  admin: 3
};

module.exports = function requireRole(minimumRole) {
  return (req, res, next) => {
    console.log(`\n🔵 [BACKEND-ROLE] Verificando permissões para: ${minimumRole}`);
    
    if (!req.user || !req.user.role) {
      console.log('🔵 [BACKEND-ROLE] ❌ User sem role no request (verifyJWT falhou?)');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role;
    const userLevel = ROLE_LEVELS[userRole] || 0;
    const requiredLevel = ROLE_LEVELS[minimumRole] || 0;

    console.log(`🔵 [BACKEND-ROLE] User é: "${userRole}" (Lv ${userLevel})`);
    console.log(`🔵 [BACKEND-ROLE] Exige:  "${minimumRole}" (Lv ${requiredLevel})`);

    if (userLevel >= requiredLevel) {
      console.log('🔵 [BACKEND-ROLE] ✅ Permissão Concedida!');
      return next();
    }

    console.log('🔵 [BACKEND-ROLE] ⛔ ACESSO NEGADO!');
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  };
};