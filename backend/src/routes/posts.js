// backend/src/routes/posts.js
const express = require('express');
const router = express.Router();
const postsCtrl = require('../controllers/posts.controller');
const verifyJWT = require('../middleware/verifyJWT');
const requireRole = require('../middleware/requireRole');

// Public endpoints
router.get('/', postsCtrl.listPublic);              // GET /posts?page=1&pageSize=10&category=slug
router.get('/view/:slug', postsCtrl.getBySlug);     // GET /posts/view/:slug

// Admin endpoints (protected)
router.get('/admin', verifyJWT, requireRole('admin'), postsCtrl.adminList);   // GET /posts/admin
router.post('/admin', verifyJWT, requireRole('admin'), postsCtrl.create);    // POST /posts/admin
router.put('/admin/:id', verifyJWT, requireRole('admin'), postsCtrl.update); // PUT /posts/admin/:id
router.delete('/admin/:id', verifyJWT, requireRole('admin'), postsCtrl.remove); // DELETE /posts/admin/:id

module.exports = router;
