// backend/src/routes/uploads.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const sharp = require("sharp"); // A nossa nova ferramenta
const fs = require("fs");

/**
 * CONFIGURAÇÃO DO MULTER
 * Diferença chave: Usamos 'memoryStorage' em vez de 'diskStorage'.
 * Isso guarda o ficheiro na RAM (buffer) para o podermos processar antes de salvar.
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB para não entupir a RAM
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas neste endpoint"), false);
    }
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum ficheiro enviado" });
    }

    // 1. Gerar um nome único
    const crypto = require("crypto");

    // Em vez de Math.random, usa isto:
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${hash}.webp`;

    // 2. Definir o caminho final
    // path.join garante que funciona em Windows (\) e Linux (/)
    const outputPath = path.join(__dirname, "../../uploads", filename);

    // 3. PROCESSAMENTO COM SHARP (A magia)
    // - Pega no buffer (req.file.buffer)
    // - Redimensiona se for gigante (opcional, aqui limitamos a largura a 1200px)
    // - Converte para WebP (formato leve da Google)
    // - Comprime a qualidade para 80% (quase imperceptível, muito mais leve)
    // - Grava no disco (.toFile)
    await sharp(req.file.buffer)
      .resize(1200, null, {
        // Largura 1200px, Altura automática (preserva aspecto)
        withoutEnlargement: true, // Se a imagem for pequena, não estica
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // 4. Retornar a URL pública para o Frontend
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${filename}`;

    res.json({
      ok: true,
      url: fileUrl,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error("Erro no upload:", err);
    res.status(500).json({ message: "Falha ao processar imagem" });
  }
});

module.exports = router;
