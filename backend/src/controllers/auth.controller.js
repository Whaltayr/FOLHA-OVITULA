// backend/src/controllers/auth.controller.js
const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar user E A ROLE à base de dados
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?', 
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou password incorretos' });
    }

    const user = rows[0];

    // 2. Verificar password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(401).json({ message: 'Email ou password incorretos' });
    }

    // 3. GERAR TOKEN COM A ROLE (A CORREÇÃO CRÍTICA)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'author' // Se vier null, assume author por segurança
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Configura cookie (opcional, mas bom para persistência)
    res.cookie('ov_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Envia token e dados do user para o frontend
    res.json({
      message: 'Login com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role // Envia a role para o frontend saber o que mostrar
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

exports.register = async (req, res) => {
    // ... (o teu código de registo atual, não precisamos mudar agora)
    // Se quiseres, posso enviar este também.
};

exports.logout = (req, res) => {
  res.clearCookie('ov_token');
  res.json({ message: 'Logout efetuado' });
};