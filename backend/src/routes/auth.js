// src/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    // query parametrizada para evitar SQL injection
    const [rows] = await pool.execute(
      "SELECT id, email, password, name, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      // evita dizer "email inexistente" por segurança
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // comparar password plain com hash no DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    //create JWT payload (minimal)
    const payload = { id: user.id, rolw: user.role };

    //sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    });

        /* Optional: set HttpOnly cookie (safer against XSS)
    // Note: secure:true should be used in production with HTTPS
    res.cookie('ov_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2, // 2 hours in ms (keep in sync with expiresIn)
    });*/

    // sucesso — devolve user (sem password). Podes adicionar JWT aqui se quiseres.
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
