// backend/src/controllers/posts.controller.js
const pool = require('../db/connection');
const { makeSlug, validateTitle } = require('../utils/validation');

// Auxiliar para erros de duplicado (MySQL Error 1062)
const isDuplicateError = (err) => err.code === 'ER_DUP_ENTRY' || err.errno === 1062;

/**
 * =================================================================================
 * ÁREA PÚBLICA (Frontend)
 * =================================================================================
 */

/**
 * A função mais importante: Lista posts públicos, filtra e auto-publica agendados.
 */
exports.listPublic = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
    const offset = (page - 1) * pageSize;

    // query params opcionais
    const category = req.query.category ? String(req.query.category).trim() : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    // 1) Promoção silenciosa: pending -> published (O teu "Auto-Publisher")
    await pool.execute(
      `UPDATE posts
       SET status = 'published', updated_at = NOW()
       WHERE status = 'pending'
         AND published_at IS NOT NULL
         AND published_at <= NOW()`
    );

    // 2) Construir SQL dinamicamente
    // ADICIONEI: p.video_url, p.type (Essencial para o player funcionar)
    let sql = `
      SELECT p.id, p.title, p.slug, p.lead, p.featured_url, p.published_at, 
             p.video_url, p.type,
             c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
             u.id AS author_id, u.name AS author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.published_at IS NOT NULL
        AND p.published_at <= NOW()
    `;
    const params = [];

    if (category) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    if (q) {
      const pattern = `%${q}%`;
      sql += ` AND (p.title LIKE ? OR p.slug LIKE ? OR p.lead LIKE ? OR p.content LIKE ?)`;
      params.push(pattern, pattern, pattern, pattern);
    }

    sql += ` ORDER BY p.published_at DESC LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [rows] = await pool.execute(sql, params);

    // 3) Mapear rows para objeto simples (Mantive a tua estrutura)
    const mapped = rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      lead: r.lead,
      featured_url: r.featured_url ? String(r.featured_url) : null,
      video_url: r.video_url, // Novo campo
      type: r.type,           // Novo campo
      published_at: r.published_at,
      category: r.category_id ? {
        id: r.category_id,
        name: r.category_name,
        slug: r.category_slug
      } : null,
      author: r.author_id ? {
        id: r.author_id,
        name: r.author_name
      } : { id: null, name: "Redação" }
    }));

    return res.json({ page, pageSize, data: mapped });
  } catch (err) {
    console.error("listPublic error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Lê um post específico pelo Slug (Público)
 */
exports.getBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    // ADICIONEI: p.video_url, p.type
    const [rows] = await pool.execute(
      `SELECT p.id, p.title, p.slug, p.lead, p.content, p.featured_url, 
              p.video_url, p.type, p.published_at, p.status,
              u.name AS author_name, c.id AS category_id, c.name AS category, c.slug AS category_slug
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );
    
    if (!rows.length) return res.status(404).json({ message: 'Post não encontrado' });

    const post = rows[0];

    // Se não for público, só admin pode ver
    if (post.status !== 'published') {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    return res.json({ post });
  } catch (err) {
    console.error('getBySlug error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * =================================================================================
 * ÁREA ADMIN (Backoffice)
 * =================================================================================
 */

exports.create = async (req, res) => {
  try {
    const {
      title, slug, lead = null, content = '', categoryId = null, status = 'draft',
      featuredUrl = null, image = null, video_url = null, type = 'article', published_at
    } = req.body;

    // Compatibilidade frontend antigo/novo
    const finalImage = image || featuredUrl || null;

    if (!validateTitle(title)) return res.status(400).json({ message: 'Título inválido' });

    const cleanSlug = makeSlug(slug || title);
    if (!cleanSlug) return res.status(400).json({ message: 'Slug inválido' });

    // Lógica de agendamento
    let publishedValue = null;
    if (published_at !== undefined) {
      publishedValue = published_at ? new Date(published_at) : null;
    } else if (status === 'published') {
      publishedValue = new Date();
    }

    let statusToSave = ['draft', 'published', 'pending'].includes(status) ? status : 'draft';
    if (publishedValue instanceof Date) {
      const now = new Date();
      statusToSave = publishedValue.getTime() > now.getTime() ? 'pending' : 'published';
    } else if (statusToSave === 'published' && publishedValue === null) {
      publishedValue = new Date();
    }

    const [result] = await pool.execute(
      `INSERT INTO posts
       (title, slug, lead, content, featured_url, video_url, type, status, category_id, author_id, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title.trim(), cleanSlug, lead, content, finalImage, video_url, type, statusToSave, categoryId, req.user.id, publishedValue]
    );

    return res.status(201).json({ id: result.insertId, status: statusToSave, slug: cleanSlug, message: 'Criado com sucesso' });
  } catch (err) {
    if (isDuplicateError(err)) return res.status(409).json({ message: 'Slug já existe' });
    console.error('Erro create:', err);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

exports.update = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: 'ID inválido' });

    const {
      title, slug, lead, content, categoryId, status, 
      featuredUrl, image, video_url, type, published_at
    } = req.body;

    const [existing] = await pool.execute('SELECT id FROM posts WHERE id = ?', [postId]);
    if (existing.length === 0) return res.status(404).json({ message: 'Não encontrado' });

    const fields = [];
    const values = [];

    if (image !== undefined || featuredUrl !== undefined) {
      fields.push('featured_url = ?');
      values.push(image || featuredUrl);
    }
    if (title !== undefined) { fields.push('title = ?'); values.push(title.trim()); }
    if (slug !== undefined) { fields.push('slug = ?'); values.push(makeSlug(slug)); }
    if (lead !== undefined) { fields.push('lead = ?'); values.push(lead); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (video_url !== undefined) { fields.push('video_url = ?'); values.push(video_url); }
    if (type !== undefined) { fields.push('type = ?'); values.push(type); }
    if (categoryId !== undefined) { fields.push('category_id = ?'); values.push(categoryId); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (published_at !== undefined) {
      fields.push('published_at = ?');
      values.push(published_at ? new Date(published_at) : null);
    }

    if (fields.length === 0) return res.status(400).json({ message: 'Nada para atualizar' });

    const sql = `UPDATE posts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    values.push(postId);

    await pool.execute(sql, values);
    return res.json({ ok: true });
  } catch (err) {
    if (isDuplicateError(err)) return res.status(409).json({ message: 'Slug em uso' });
    console.error('Erro update:', err);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

exports.remove = async (req, res) => {
    try {
        await pool.execute('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Post eliminado' });
    } catch (error) {
        console.error('Erro delete:', error);
        res.status(500).json({ message: 'Erro ao eliminar' });
    }
};

exports.adminList = async (req, res) => {
  try {
    // Lógica Inteligente:
    // Se for 'author', vê só os dele.
    // Se for 'admin' ou 'editor', vê todos.
    
    let sql = `
      SELECT p.*, u.name AS author_name, c.id AS category_id, c.name AS category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    const params = [];

    // O FILTRO MÁGICO
    if (req.user.role === 'author') {
      sql += ` WHERE p.author_id = ?`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 200`;

    const [rows] = await pool.execute(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('adminList error', err);
    return res.status(500).json({ message: 'Erro interno' });
  }
};