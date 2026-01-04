// backend/src/controllers/posts.controller.js
const pool = require('../config/db');
const { makeSlug, validateTitle } = require('../utils/validation');

/**
 * Helper: detecta erro de duplicado (MySQL2)
 */
function isDuplicateError(err) {
  return err && err.code === 'ER_DUP_ENTRY';
}

/**
 * List public posts (com filtro por categoria opcional)
 * GET /posts?page=&pageSize=&category=<category_slug>
 */
// ===== listPublic =====

// ===== listPublic =====
exports.listPublic = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
    const offset = (page - 1) * pageSize;

    // optional category filter (expect a slug)
    const category = req.query.category ? String(req.query.category).trim() : null;

    // 1) Promoção silenciosa: pending -> published (mantém comportamento atual)
    await pool.execute(
      `UPDATE posts
       SET status = 'published', updated_at = NOW()
       WHERE status = 'pending'
         AND published_at IS NOT NULL
         AND published_at <= NOW()`
    );

    // 2) Build SQL dinamicamente: adiciona filtro por categoria apenas se category for passado
    let sql = `
      SELECT p.id, p.title, p.slug, p.lead, p.featured_url, p.published_at,
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
      // filtro por slug da categoria (seguro, parametrizado)
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    sql += ` ORDER BY p.published_at DESC LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [rows] = await pool.execute(sql, params);

    // 3) Mapear rows para objeto simples para frontend
    const mapped = rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      lead: r.lead,
      featured_url: r.featured_url ? String(r.featured_url) : null,
      published_at: r.published_at,
      category: r.category_id ? {
        id: r.category_id,
        name: r.category_name,
        slug: r.category_slug
      } : null,
      author: r.author_id ? {
        id: r.author_id,
        name: r.author_name
      } : { id: null, name: "Desconhecido" }
    }));

    return res.json({ page, pageSize, data: mapped });
  } catch (err) {
    console.error("listPublic error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



/**
 * Get one post by slug (public). /posts/view/:slug
 */
// ===== getBySlug =====
exports.getBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.execute(
      `SELECT p.id, p.title, p.slug, p.lead, p.content, p.featured_url, p.published_at, p.status,
              u.name AS author_name, c.id AS category_id, c.name AS category, c.slug AS category_slug
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });

    const post = rows[0];
    if (post.status !== 'published') {
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
 * Admin: list all posts (inclui drafts e pending)
 * GET /posts/admin
 */
// ===== adminList =====
exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS author_name, c.id AS category_id, c.name AS category
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC
       LIMIT 200`
    );
    return res.json(rows);
  } catch (err) {
    console.error('adminList error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Admin: create post
 * POST /posts/admin
 * aceita: title, slug, lead, content, featuredUrl, status, categoryId, published_at (ISO or null)
 */
exports.create = async (req, res) => {
  try {
    const {
      title,
      slug,
      lead = null,
      content = '',
      categoryId = null,
      status = 'draft',
      featuredUrl = null,
      published_at // optional: ISO string or null or undefined
    } = req.body;

    // validações básicas
    if (!validateTitle(title)) return res.status(400).json({ message: 'Invalid title (3–255 chars)' });
    const cleanSlug = makeSlug(slug);
    if (!cleanSlug) return res.status(400).json({ message: 'Invalid slug' });

    // Resolve published value (Date object) e status final
    let publishedValue = null;
    if (published_at !== undefined) {
      publishedValue = published_at ? new Date(published_at) : null;
    } else if (status === 'published') {
      // publish now if requested and no published_at provided
      publishedValue = new Date();
    } else {
      publishedValue = null;
    }

    // Decide final status to save
    const allowed = ['draft', 'published', 'pending'];
    let statusToSave = allowed.includes(status) ? status : 'draft';

    if (publishedValue instanceof Date) {
      const now = new Date();
      if (publishedValue.getTime() > now.getTime()) {
        // future date -> mark as pending
        statusToSave = 'pending';
      } else {
        // date in past or now -> ensure published
        statusToSave = 'published';
      }
    } else {
      // publishedValue null: if statusToSave === 'published' and we didn't set publishedValue above, set now
      if (statusToSave === 'published' && publishedValue === null) {
        publishedValue = new Date();
      }
    }

    // INSERT (note: pass JS Date for mysql2 -> converts to datetime)
    const [result] = await pool.execute(
      `INSERT INTO posts
       (title, slug, lead, content, featured_url, status, category_id, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        cleanSlug,
        lead,
        content || '',
        featuredUrl,
        statusToSave,
        categoryId,
        req.user.id,
        publishedValue // Date or null
      ]
    );

    return res.status(201).json({ id: result.insertId, status: statusToSave });
  } catch (err) {
    if (isDuplicateError(err)) return res.status(409).json({ message: 'Slug already in use' });
    console.error('create post error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Admin: update post
 * PUT /posts/admin/:id
 * aceita os mesmos campos do create; se frontend não enviar published_at, mantemos a existente
 */
exports.update = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: 'Invalid post id' });

    const {
      title,
      slug,
      lead,
      content,
      categoryId = null,
      status,         // optional
      featuredUrl = null,
      published_at    // optional: ISO string or null
    } = req.body;

    // garantir existencia
    const [existingRows] = await pool.execute('SELECT id, status, published_at, slug FROM posts WHERE id = ? LIMIT 1', [postId]);
    if (!existingRows.length) return res.status(404).json({ message: 'Post not found' });
    const currentPost = existingRows[0];

    // interpretar published_at vindo do frontend
    let newPublishedValue;
    if (published_at !== undefined) {
      newPublishedValue = published_at ? new Date(published_at) : null;
    } else {
      // manter existente
      newPublishedValue = currentPost.published_at ? new Date(currentPost.published_at) : null;
    }

    // decide status final
    const allowed = ['draft', 'published', 'pending'];
    let statusToSave = currentPost.status; // default keep

    if (newPublishedValue instanceof Date) {
      const now = new Date();
      if (newPublishedValue.getTime() > now.getTime()) {
        statusToSave = 'pending';
      } else {
        // newPublishedValue in past or now -> honor requested status if provided (published), else promote pending->published
        if (status !== undefined && allowed.includes(status)) {
          statusToSave = status;
          if (statusToSave === 'pending' && newPublishedValue.getTime() <= Date.now()) statusToSave = 'published';
        } else {
          if (currentPost.status === 'pending' && newPublishedValue.getTime() <= Date.now()) statusToSave = 'published';
        }
      }
    } else {
      // newPublishedValue === null
      if (status !== undefined && allowed.includes(status)) statusToSave = status;
    }

    // build update dynamically
    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (!validateTitle(title)) return res.status(400).json({ message: 'Invalid title' });
      fields.push('title = ?'); values.push(title.trim());
    }
    if (slug !== undefined) {
      const clean = makeSlug(slug);
      if (!clean) return res.status(400).json({ message: 'Invalid slug' });
      fields.push('slug = ?'); values.push(clean);
    }
    if (lead !== undefined) { fields.push('lead = ?'); values.push(lead); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (featuredUrl !== undefined) { fields.push('featured_url = ?'); values.push(featuredUrl); }
    if (categoryId !== undefined) { fields.push('category_id = ?'); values.push(categoryId); }

    // always set statusToSave (explicit)
    fields.push('status = ?'); values.push(statusToSave);

    // published_at handling: if frontend sent published_at explicitly, use it; else, possibly set NOW() when promoting pending->published
    if (published_at !== undefined) {
      fields.push('published_at = ?'); values.push(newPublishedValue);
    } else {
      // if we're promoting pending->published and existing published_at is null -> set NOW()
      if (currentPost.status === 'pending' && statusToSave === 'published' && !currentPost.published_at) {
        fields.push('published_at = ?'); values.push(new Date());
      }
      // otherwise keep existing published_at (no change)
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const sql = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
    values.push(postId);

    try {
      await pool.execute(sql, values);
      return res.json({ ok: true, status: statusToSave });
    } catch (err) {
      if (isDuplicateError(err)) return res.status(409).json({ message: 'Slug already in use' });
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
