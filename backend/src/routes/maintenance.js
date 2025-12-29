// src/routes/maintenance.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');

// POST /admin/maintenance/promote-scheduled
// Protegido: só admins podem executar.
router.post('/promote-scheduled', verifyJWT, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE posts
       SET status = 'published', updated_at = NOW()
       WHERE status = 'pending'
         AND published_at IS NOT NULL
         AND published_at <= NOW()`
    );

    // mysql2 pode devolver affectedRows ou affected_rows dependendo da versão
    const affected = result.affectedRows ?? result.affected_rows ?? 0;
    return res.json({ ok: true, affectedRows: affected });
  } catch (err) {
    console.error('promote-scheduled error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
