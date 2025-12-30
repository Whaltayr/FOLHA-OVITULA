// src/routes/categories.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, slug FROM categories ORDER BY name');
    return res.json(rows);
  } catch (err) {
    console.error('GET /categories error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
