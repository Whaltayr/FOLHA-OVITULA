// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/users.controller');

// === ZONA DE IMPORTAÇÃO SEGURA ===
// Importamos o módulo inteiro primeiro
const verifyJWTRaw = require('../middleware/verifyJWT');
const requireRoleRaw = require('../middleware/requireRole');

// Lógica para extrair a função, venha ela como "module.exports" ou "exports.verifyJWT"
const verifyJWT = verifyJWTRaw.verifyJWT || verifyJWTRaw;
const requireRole = requireRoleRaw.requireRole || requireRoleRaw;

// Debug para o terminal (para teres a certeza que carregou)
console.log('--- DEBUG USERS ROUTE ---');
console.log('verifyJWT carregado?', typeof verifyJWT === 'function' ? '✅ SIM' : '❌ NÃO');
console.log('requireRole carregado?', typeof requireRole === 'function' ? '✅ SIM' : '❌ NÃO');

// Se falhar a carregar, não deixamos o servidor crashar, mas avisamos
if (typeof verifyJWT !== 'function') {
  throw new Error('ERRO CRÍTICO: verifyJWT não é uma função. Verifica backend/src/middleware/verifyJWT.js');
}

// === ROTAS ===

// Aplica segurança a todas as rotas abaixo
router.use(verifyJWT);
router.use(requireRole('admin'));

// Lista de Utilizadores
router.get('/', usersCtrl.list);

// Atualizar Cargo
router.put('/:id', usersCtrl.updateRole);

// Apagar Utilizador
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;