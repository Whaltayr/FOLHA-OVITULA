import { useAuth } from "../../context/AuthContext"; // O teu contexto de auth
import { Link } from "react-router-dom";
import { FaPenNib, FaCheckDouble, FaUsers, FaChartLine } from "react-icons/fa";

export default function DashboardHome() {
  const { user } = useAuth(); // { name: 'João', role: 'editor' }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Olá, {user?.name}!</h1>
      <p className="text-gray-500 mb-8">Bem-vindo ao painel de gestão da Folha Ovitula.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* === CARD PARA TODOS (Atalhos Comuns) === */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FaPenNib size={20} />
          </div>
          <h3 className="font-bold text-lg mb-2">Escrever Novo Artigo</h3>
          <p className="text-sm text-gray-500 mb-4">Começa uma nova reportagem, vídeo ou podcast.</p>
          <Link to="/admin/posts/new" className="text-blue-600 font-semibold hover:underline">Começar &rarr;</Link>
        </div>

        {/* === CARD SÓ PARA AUTORES === */}
        {user?.role === 'author' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <FaChartLine size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Meus Artigos</h3>
            <p className="text-sm text-gray-500 mb-4">Vê o estado das tuas publicações submetidas.</p>
            <Link to="/admin/posts" className="text-green-600 font-semibold hover:underline">Ver Lista &rarr;</Link>
          </div>
        )}

        {/* === CARD SÓ PARA EDITORES E ADMINS === */}
        {['admin', 'editor'].includes(user?.role) && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition border-l-4 border-l-orange-400">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <FaCheckDouble size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Fila de Revisão</h3>
            <p className="text-sm text-gray-500 mb-4">Existem artigos pendentes à espera de aprovação.</p>
            <Link to="/admin/posts?status=pending" className="text-orange-600 font-semibold hover:underline">Revisar agora &rarr;</Link>
          </div>
        )}

        {/* === CARD SÓ PARA ADMIN === */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition border-l-4 border-l-purple-600">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <FaUsers size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Gerir Equipa</h3>
            <p className="text-sm text-gray-500 mb-4">Adicionar ou remover autores e editores.</p>
            <Link to="/admin/users" className="text-purple-600 font-semibold hover:underline">Gerir Users &rarr;</Link>
          </div>
        )}

      </div>
    </div>
  );
}