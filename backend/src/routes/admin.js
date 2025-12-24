// src/routes/admin.js
const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const pool = require('../config/db'); // path conforme teu setup

const router = express.Router();

router.get('/me', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute('SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('GET /admin/me error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
