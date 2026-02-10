// backend/src/controllers/users.controller.js
const pool = require('../db/connection');

// Listar todos os utilizadores (Para o Admin ver a equipa)
exports.list = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar utilizadores' });
  }
};

// Atualizar o cargo (Role) de um utilizador
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'editor', 'author', 'reader'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Cargo inválido' });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Cargo atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar cargo' });
  }
};

// Eliminar utilizador
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'Não podes eliminar a tua própria conta.' });
    }
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Utilizador removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover utilizador' });
  }
};