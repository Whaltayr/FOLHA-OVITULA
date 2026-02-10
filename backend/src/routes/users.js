// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/users.controller');
const { verifyJWT } = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');

// Bloqueio total: Só Admins passam daqui
router.use(verifyJWT);
router.use(requireRole('admin'));

router.get('/', usersCtrl.list);
router.put('/:id', usersCtrl.updateRole);
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;