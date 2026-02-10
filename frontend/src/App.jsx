// App.jsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Páginas Públicas
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import SearchResults from "./pages/SearchResults";

// Componentes de Proteção
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas de Admin
// import AdminDashboard from "./pages/admin/AdminDashboard"; // (Opcional: Podes remover se já não usares)
import DashboardHome from "./pages/admin/DashboardHome";    // <--- A nova Home do Admin
import AdminPosts from "./pages/admin/AdminPosts";          // Lista de Artigos
import AdminPostForm from "./pages/admin/AdminPostForm";    // Criar/Editar Artigo
import ManageUsers from "./pages/admin/ManageUsers";        // <--- Gestão de Equipa

export default function App() {
  return (
    <MainLayout>
      <Routes>
        {/* === ROTAS PÚBLICAS === */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/post/:slug" element={<PostDetail />} />

        {/* === ROTAS PROTEGIDAS (ADMINISTRATIVAS) === */}
        
        {/* 1. DASHBOARD PRINCIPAL */}
        {/* Mudámos role="admin" para "author" para que Autores e Editores também consigam entrar */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="author">
              <DashboardHome />
            </ProtectedRoute>
          }
        />

        {/* 2. GESTÃO DE USUÁRIOS (Só Admin) */}
        {/* Esta rota é EXCLUSIVA para o Admin */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute role="admin">
              <ManageUsers />
            </ProtectedRoute>
          } 
        />

        {/* 3. LISTA DE POSTS */}
        {/* Autores também podem ver a lista (o backend filtra o que eles veem) */}
        <Route
          path="/admin/posts"
          element={
            <ProtectedRoute role="author">
              <AdminPosts />
            </ProtectedRoute>
          }
        />

        {/* 4. CRIAR NOVO POST */}
        <Route
          path="/admin/posts/new"
          element={
            <ProtectedRoute role="author">
              <AdminPostForm />
            </ProtectedRoute>
          }
        />

        {/* 5. EDITAR POST EXISTENTE */}
        <Route
          path="/admin/posts/:id/edit"
          element={
            <ProtectedRoute role="author">
              <AdminPostForm />
            </ProtectedRoute>
          }
        />

        {/* Rota 404 */}
        <Route
          path="*"
          element={<div className="p-10 text-center text-gray-500">Página não encontrada (404)</div>}
        />
      </Routes>
    </MainLayout>
  );
}