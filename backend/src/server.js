// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // opcional, facilita cookies
const app = express();
const path = require('path');




app.use(express.json());


// Se quiser garantir preflight responses:
app.use( cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

//Cookies
app.use(cookieParser()); // se quiser ler cookies via req.cookies

// 2) servir estático de uploads e montar rota de upload (router usa multer para POST)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/uploads', require('./routes/uploads'));


// rotas
app.use('/auth', require('./routes/auth'));    // já tens
app.use('/admin', require('./routes/admin'));  // proteger
app.use('/posts', require('./routes/posts'));  // public + admin

// em src/server.js (ou app.js) — na área de rotas
app.use('/admin/maintenance', require('./routes/maintenance'));



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));


const pool = require('./config/db'); // garante que existe no topo do ficheiro

// Função que promove scheduled posts (reutiliza mesma lógica do endpoint)
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

// roda a cada minuto (60 * 1000 ms)
// NOTA: para produção considera usar node-cron ou um worker separado.
const INTERVAL_MS = 60 * 1000;
setInterval(promoteScheduledJob, INTERVAL_MS);
// opcional: rodar imediatamente ao iniciar
promoteScheduledJob();





