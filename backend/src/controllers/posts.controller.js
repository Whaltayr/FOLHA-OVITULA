// src/controllers/posts.controller.js
const pool = require('../config/db');
const { makeSlug, validateTitle } = require('../utils/validation');


/**
 * List public posts (published). Supports pagination via ?page=1&pageSize=10
 */
exports.listPublic = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.execute(
      `SELECT id, title, slug, lead, featured_url, published_at 
       FROM posts WHERE status='published' 
       ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    return res.json({ page, pageSize, data: rows });
  } catch (err) {
    console.error('listPublic error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get one post by slug (public)
 */
exports.getBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.execute(
      `SELECT id, title, slug, lead, content, featured_url, published_at, status FROM posts WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });

    const post = rows[0];
    // If not published and no admin, block (optional)
    if (post.status !== 'published') {
      // if request has no user or not admin, block
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    return res.json({ post });
  } catch (err) {
    console.error('getBySlug error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Admin: list all posts (including drafts)
 */
exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM posts ORDER BY created_at DESC LIMIT 200`);
    return res.json(rows);
  } catch (err) {
    console.error('adminList error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// exemplo de wrapper para tratar erros duplicados
function isDuplicateError(err) {
  // mysql2 fornece err.code === 'ER_DUP_ENTRY'
  return err && err.code === 'ER_DUP_ENTRY';
}


/**
 * Admin: create post
 */

exports.create = async (req, res) => {
  try {
    const { title, slug, content, categoryId = null, status = 'draft', featuredUrl = null } = req.body;

    if (!validateTitle(title)) {
      return res.status(400).json({ message: 'Invalid title (3–255 chars)' });
    }

    const cleanSlug = makeSlug(slug);
    if (!cleanSlug) {
      return res.status(400).json({ message: 'Invalid slug' });
    }

    const [result] = await pool.execute(
      `INSERT INTO posts (title, slug, content, featured_url, status, category_id, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), cleanSlug, content || '', featuredUrl, status, categoryId, req.user.id]
    );

    return res.status(201).json({ id: result.insertId });

  } catch (err) {
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: 'Slug already in use' });
    }
    console.error('create post error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



/**
 * Admin: update post
 */
exports.update = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: 'Invalid post id' });

    // 1) Garantir que o post existe — evita atualizar algo inexistente
    const [existingRows] = await pool.execute('SELECT id, slug FROM posts WHERE id = ? LIMIT 1', [postId]);
    if (!existingRows.length) return res.status(404).json({ message: 'Post not found' });

    const { title, slug, content, categoryId = null, status, featuredUrl = null } = req.body;

    // 2) Validações mínimas de entrada (se vierem)
    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (!validateTitle(title)) {
        return res.status(400).json({ message: 'Invalid title (must be 3-255 chars)' });
      }
      fields.push('title = ?');
      values.push(title.trim());
    }

    if (slug !== undefined) {
      const clean = makeSlug(slug);
      if (!clean) return res.status(400).json({ message: 'Invalid slug' });
      fields.push('slug = ?');
      values.push(clean);
    }

    if (content !== undefined) {
      fields.push('content = ?');
      values.push(content);
    }

    if (featuredUrl !== undefined) {
      fields.push('featured_url = ?');
      values.push(featuredUrl);
    }

    if (categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(categoryId);
    }

    if (status !== undefined) {
      // opcional: validar status para ser 'draft' ou 'published'
      if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({ message: "Invalid status; allowed: 'draft' or 'published'" });
      }
      fields.push('status = ?');
      values.push(status);
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    // 3) Montar e executar UPDATE
    values.push(postId); // valor para WHERE id = ?
    const sql = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await pool.execute(sql, values);
      return res.json({ ok: true });
    } catch (err) {
      // 4) Tratar erro de slug duplicado de forma amigável
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Slug already in use' });
      }
      console.error('update post error (db execute):', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } catch (err) {
    console.error('update post error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Admin: delete post
 */
exports.remove = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: 'Invalid post id' });

    await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('delete post error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
