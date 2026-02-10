// frontend/src/pages/admin/DashboardHome.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaPenNib, FaUsers, FaListAlt, FaChartLine } from "react-icons/fa";

export default function DashboardHome() {
  const { user } = useAuth(); // Pega os dados do user logado (Tu!)

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Cabeçalho de Boas-vindas */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Olá, <span className="text-blue-600">{user?.name}</span>! 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Bem-vindo ao painel de gestão da Folha Ovitula. O teu nível de acesso é: 
          <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs font-bold uppercase text-gray-700">
            {user?.role}
          </span>
        </p>
      </div>

      {/* GRELHA DE ATALHOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. ESCREVER (Para Todos) */}
        <Link to="/admin/posts/new" className="group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FaPenNib size={20} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">Novo Artigo</h3>
            <p className="text-sm text-gray-500">Escreve uma notícia, publica um vídeo ou lança um podcast.</p>
          </div>
        </Link>

        {/* 2. GERIR ARTIGOS (Para Todos) */}
        <Link to="/admin/posts" className="group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer h-full">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FaListAlt size={20} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {user?.role === 'author' ? 'Meus Artigos' : 'Todos os Artigos'}
            </h3>
            <p className="text-sm text-gray-500">
              {user?.role === 'author' 
                ? 'Vê o estado das tuas publicações.' 
                : 'Aprova, edita ou rejeita publicações da equipa.'}
            </p>
          </div>
        </Link>

        {/* 3. GERIR EQUIPA (SÓ ADMIN) */}
        {user?.role === 'admin' && (
          <Link to="/admin/users" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer h-full border-l-4 border-l-purple-500">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaUsers size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Gerir Equipa</h3>
              <p className="text-sm text-gray-500">Promove utilizadores a Editores ou Autores.</p>
            </div>
          </Link>
        )}

      </div>
    </div>
  );
}