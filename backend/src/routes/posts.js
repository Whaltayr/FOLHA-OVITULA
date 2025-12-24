const express = require('express');
const router = express.Router();

// teste simples
router.get('/', (req, res) => {
  res.json({ message: 'Posts route working' });
});

module.exports = router;
