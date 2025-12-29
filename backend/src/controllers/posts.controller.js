// src/controllers/posts.controller.js
const pool = require("../config/db");
const { makeSlug, validateTitle } = require("../utils/validation");

/**
 * List public posts (published). Supports pagination via ?page=1&pageSize=10
 */
exports.listPublic = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.execute(
      //alteramos para mostrar apenas aqules que tem published_at not null escondendo todos os drafts
      `SELECT id, title, slug, lead, featured_url, published_at 
       FROM posts WHERE status='published' AND published_at IS NOT NULL
       ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    return res.json({ page, pageSize, data: rows });
  } catch (err) {
    console.error("listPublic error", err);
    return res.status(500).json({ message: "Internal server error" });
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
    if (!rows.length) return res.status(404).json({ message: "Not found" });

    const post = rows[0];
    // If not published and no admin, block (optional)
    if (post.status !== "published") {
      // if request has no user or not admin, block
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    return res.json({ post });
  } catch (err) {
    console.error("getBySlug error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: list all posts (including drafts)
 */
exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM posts ORDER BY created_at DESC LIMIT 200`
    );
    return res.json(rows);
  } catch (err) {
    console.error("adminList error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// exemplo de wrapper para tratar erros duplicados
function isDuplicateError(err) {
  // mysql2 fornece err.code === 'ER_DUP_ENTRY'
  return err && err.code === "ER_DUP_ENTRY";
}

/**
 * Admin: create post
 */

exports.create = async (req, res) => {
  try {
    // Desestrutura do body — public_at pode ser undefined/null/ISO
    const {
      title,
      slug,
      lead = null,
      content = '',
      categoryId = null,
      status = "draft",      // status solicitado pelo frontend
      featuredUrl = null,
      published_at           // opcional: ISO string ou null
    } = req.body;

    // Validações
    if (!validateTitle(title)) {
      return res.status(400).json({ message: "Invalid title (3–255 chars)" });
    }
    const cleanSlug = makeSlug(slug);
    if (!cleanSlug) return res.status(400).json({ message: "Invalid slug" });

    // 1) Resolver publishedValue (null ou Date object)
    let publishedValue = null;
    if (published_at !== undefined) {
      publishedValue = published_at ? new Date(published_at) : null;
    } else if (status === 'published') {
      // se frontend pediu publicar e não enviou published_at, publicar agora
      publishedValue = new Date();
    } else {
      publishedValue = null;
    }

    // 2) Decidir status final a gravar:
    //    - se publishedValue é uma data no futuro -> forçar 'pending' (agendado)
    //    - senão, usar status pedido (accept only allowed values).
    let statusToSave = status;
    const allowed = ['draft','published','pending'];
    if (!allowed.includes(statusToSave)) statusToSave = 'draft';

    if (publishedValue instanceof Date) {
      const now = new Date();
      if (publishedValue.getTime() > now.getTime()) {
        // publicação no futuro => marca como pending (agendado)
        statusToSave = 'pending';
      } else {
        // publicação já passou/é agora => se pediram outra coisa respeitamos (ou 'published')
        if (statusToSave === 'pending') {
          // se explicitamente pediram pending mas data já passou, promovemos a published
          statusToSave = 'published';
        }
      }
    } else {
      // publishedValue === null -> se pediram 'published' mas null, backend já definiu NOW() acima
      // (mas aqui publishedValue null só quando status !== published e não veio published_at)
    }

    // 3) INSERT com ordem correta
    const [result] = await pool.execute(
      `INSERT INTO posts
        (title, slug, lead, content, featured_url, status, category_id, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        cleanSlug,
        lead,
        content || "",
        featuredUrl,
        statusToSave,         // <- status final decidido
        categoryId,
        req.user.id,
        publishedValue        // Date object ou null
      ]
    );

    return res.status(201).json({ id: result.insertId, status: statusToSave });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Slug already in use" });
    }
    console.error("create post error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: update post
 */
/**
 * Admin: update post
 */
exports.update = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "Invalid post id" });

    // 0) Ler o body (inclui published_at opcional)
    const {
      title,
      slug,
      lead,
      content,
      categoryId = null,
      status,              // pode ser undefined
      featuredUrl = null,
      published_at         // opcional: ISO or null
    } = req.body;

    // 1) Garantir que o post existe
    const [existingRows] = await pool.execute(
      "SELECT id, status, published_at, slug FROM posts WHERE id = ? LIMIT 1",
      [postId]
    );
    if (!existingRows.length) return res.status(404).json({ message: "Post not found" });

    const currentPost = existingRows[0];

    // 2) Interpretar published_at vindo do frontend
    let newPublishedValue;
    if (published_at !== undefined) {
      // frontend explicitamente enviou algo (pode ser null)
      newPublishedValue = published_at ? new Date(published_at) : null;
    } else {
      // frontend não enviou published_at -> mantemos o existente (não mudamos)
      newPublishedValue = currentPost.published_at ? new Date(currentPost.published_at) : null;
    }

    // 3) Decidir status final:
    //    - se newPublishedValue é futuro -> pending
    //    - senão, se frontend enviou status usamos (valida), caso contrário mantemos o atual
    const allowed = ['draft','published','pending'];
    let statusToSave = currentPost.status; // default: manter o atual

    if (newPublishedValue instanceof Date) {
      const now = new Date();
      if (newPublishedValue.getTime() > now.getTime()) {
        // agendado para o futuro -> pending
        statusToSave = 'pending';
      } else {
        // data no passado/atual -> se frontend pediu 'published' ou 'pending', validamos/respeitamos
        if (status !== undefined && allowed.includes(status)) {
          statusToSave = status;
          // se frontend pediu 'pending' mas data já passou, promovemos a 'published'
          if (statusToSave === 'pending' && newPublishedValue.getTime() <= Date.now()) {
            statusToSave = 'published';
          }
        } else {
          // se frontend não pediu, e current era 'pending' mas date já passou -> promover a published
          if (currentPost.status === 'pending' && newPublishedValue.getTime() <= Date.now()) {
            statusToSave = 'published';
          }
        }
      }
    } else {
      // newPublishedValue === null -> se frontend pediu 'published', então status='published'
      if (status !== undefined && allowed.includes(status)) {
        statusToSave = status;
      }
      // se não veio status nem published_at mantemos status atual
    }

    // 4) Preparar fields dinâmicos (inclui lead e published_at)
    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (!validateTitle(title)) return res.status(400).json({ message: "Invalid title" });
      fields.push("title = ?"); values.push(title.trim());
    }
    if (slug !== undefined) {
      const clean = makeSlug(slug);
      if (!clean) return res.status(400).json({ message: "Invalid slug" });
      fields.push("slug = ?"); values.push(clean);
    }
    if (lead !== undefined) { fields.push("lead = ?"); values.push(lead); }
    if (content !== undefined) { fields.push("content = ?"); values.push(content); }
    if (featuredUrl !== undefined) { fields.push("featured_url = ?"); values.push(featuredUrl); }
    if (categoryId !== undefined) { fields.push("category_id = ?"); values.push(categoryId); }

    // sempre setamos o statusToSave (pode ser igual ao atual, mas isto garante coerência)
    if (statusToSave !== undefined) {
      fields.push("status = ?");
      values.push(statusToSave);
    }

    // published_at — se frontend enviou (published_at !== undefined) usamos explicitamente,
    // caso contrário, se houve mudança por lógica (ex: promoção pending->published) devemos gravar o date atual ou manter existente.
    if (published_at !== undefined) {
      // frontend quis alterar (pode ser null)
      fields.push("published_at = ?");
      values.push(newPublishedValue);
    } else {
      // frontend não enviou published_at: mas se statusToSave moved from pending->published and published_at was null,
      // podemos setar published_at = NOW() (decisão opcional). Vamos só lidar com case where
      if (currentPost.status === 'pending' && statusToSave === 'published' && !currentPost.published_at) {
        // caso raro: promover pending sem data -> definimos agora
        fields.push("published_at = ?");
        values.push(new Date());
      }
      // caso contrário mantemos published_at como estava (não adicionamos campo)
    }

    if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });

    // 5) Montar SQL e executar
    const sql = `UPDATE posts SET ${fields.join(", ")} WHERE id = ?`;
    values.push(postId);

    try {
      await pool.execute(sql, values);
      return res.json({ ok: true, status: statusToSave });
    } catch (err) {
      if (err && err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Slug already in use" });
      }
      console.error("update post error (db execute):", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  } catch (err) {
    console.error("update post error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: delete post
 */
exports.remove = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "Invalid post id" });

    await pool.execute("DELETE FROM posts WHERE id = ?", [postId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("delete post error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
