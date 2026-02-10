// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// parse JSON bodies
app.use(express.json());

// === A CORREÇÃO ESTÁ AQUI ===
// Aumentamos o limite para 50mb para aceitar artigos longos ou imagens em Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS: permite o frontend local (Vite) acessar a API
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// cookies parsing (opcional — usamos tokens no header)
app.use(cookieParser());

// serve arquivos de uploads (pasta project/uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// rotas - certifique-se que os ficheiros existem em src/routes
app.use('/auth', require('./routes/auth'));       // login
app.use('/posts', require('./routes/posts'));     // posts públicos + admin
app.use('/admin', require('./routes/admin'));     // admin endpoints (me)
app.use('/categories', require('./routes/categories')); // nova rota categories
app.use('/uploads', require('./routes/uploads')); // rota POST /uploads (multer)

// start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));

// === promoção periódica de posts agendados (pending -> published) ===
const pool = require('./config/db'); // pool mysql2

async function promoteScheduledJob() {
  try {
    const [result] = await pool.execute(
      `UPDATE posts
       SET status = 'published', updated_at = NOW()
       WHERE status = 'pending'
         AND published_at IS NOT NULL
         AND published_at <= NOW()`
    );
    const affected = result.affectedRows ?? result.affected_rows ?? 0;
    if (affected > 0) {
      console.log(`[Job] Promoted ${affected} scheduled posts at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[Job] promoteScheduledJob error', err);
  }
}

// roda a cada minuto; para produção usar cron/worker separado
const INTERVAL_MS = 60 * 1000;
setInterval(promoteScheduledJob, INTERVAL_MS);
// roda uma vez na inicialização
promoteScheduledJob();
