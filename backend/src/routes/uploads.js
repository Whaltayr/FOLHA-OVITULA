// src/routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');
const crypto = require('crypto');

// ====== Storage seguro e naming único ======
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads')); // pasta ../uploads
  },
  filename: function (req, file, cb) {
    // gerar nome único: timestamp + random + extensão original (sanitizada)
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9.]/g, ''); // pequena sanitização
    const base = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, `${base}${safeExt}`);
  }
});

// ====== File filter: aceita só imagens (jpg, png, webp, gif) ======
function fileFilter (req, file, cb) {
  const allow = /^(image\/jpeg|image\/png|image\/webp|image\/gif)$/;
  if (allow.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de ficheiro inválido. Apenas imagens são permitidas.'), false);
  }
}

// limites: por exemplo 5MB
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * POST /uploads
 * Protected: apenas admins (ou autores/autenticados conforme config)
 * Recebe um campo 'file' no multipart/form-data e devolve { url: '/uploads/xxxx.jpg' }
 */
router.post('/', verifyJWT, requireRole('admin'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum ficheiro enviado' });

    // Construir URL relativa (frontend usa VITE_API_URL + returned.url)
    const url = `/uploads/${req.file.filename}`;
    return res.json({ ok: true, url });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ message: 'Erro ao enviar ficheiro' });
  }
});

module.exports = router;
