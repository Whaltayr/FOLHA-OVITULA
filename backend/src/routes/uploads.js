// backend/src/routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.memoryStorage(); // Mantemos na memória para processar
const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum ficheiro enviado' });

    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    
    // 1. Gerar nome único
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    let filename = '';
    let outputPath = '';

    if (isImage) {
      // Processamento de Imagem (WebP)
      filename = `${uniqueName}.webp`;
      outputPath = path.join(__dirname, '../../uploads', filename);
      await sharp(req.file.buffer).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);
    } else if (isAudio) {
      // Processamento de Áudio (Apenas guardar)
      const extension = path.extname(req.file.originalname) || '.mp3';
      filename = `${uniqueName}${extension}`;
      outputPath = path.join(__dirname, '../../uploads', filename);
      fs.writeFileSync(outputPath, req.file.buffer); // Grava o buffer original
    } else {
      return res.status(400).json({ message: 'Tipo de ficheiro não suportado' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    res.json({ ok: true, url: fileUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;