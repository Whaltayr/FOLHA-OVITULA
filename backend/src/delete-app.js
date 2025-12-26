// src/app.js
require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json()); // parse JSON body

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// mount auth routes under /auth
app.use('/auth', authRoutes);

// start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
