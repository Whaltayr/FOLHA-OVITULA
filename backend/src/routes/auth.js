const express = require("express");
const bcrypt = require("bcrypt"); // Ou 'bcryptjs' se for o que tens instalado
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Confirma se o caminho da DB está certo

const router = express.Router();

router.post("/login", async (req, res) => {
  console.log("\n🔴 [BACKEND] ROTA LOGIN CHAMADA");
  const { email, password } = req.body || {};

  console.log(`🔴 [BACKEND] Email recebido: ${email}`);

  if (!email || !password) {
    console.log("🔴 [BACKEND] Erro: Falta email ou password");
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, password, name, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      console.log("🔴 [BACKEND] Erro: Utilizador não encontrado na BD");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    console.log(`🔴 [BACKEND] User encontrado: ID=${user.id}, Nome=${user.name}, ROLE=${user.role}`);

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("🔴 [BACKEND] Erro: Password incorreta");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // AQUI É O PONTO CRÍTICO: O PAYLOAD DO TOKEN
    const payload = { id: user.id, role: user.role };
    console.log("🔴 [BACKEND] Gerando Token com Payload:", payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    });

    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    
    console.log("🔴 [BACKEND] Login Sucesso! A enviar resposta...");
    return res.json({ token, user: safeUser });

  } catch (err) {
    console.error("🔴 [BACKEND] CRASH NO LOGIN:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;