// frontend/src/pages/admin/AdminPosts.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminPosts, deletePost } from '../../services/api';
import { assetUrl } from '../../../../backend/src/utils/asset';

// Tradução de status (backend → humano)
// Mantemos aqui porque é regra de UI, não de negócio
const LABEL = {
  published: 'Publicado',
  draft: 'Rascunho',
  pending: 'Agendado'
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca os posts assim que a página carrega
  useEffect(() => {
    getAdminPosts()
      .then(setPosts)
      .catch(err => setError(err.message || 'Erro ao carregar posts'))
      .finally(() => setLoading(false));
  }, []);

  // Apagar post (com confirmação humana)
  async function handleDelete(id) {
    if (!confirm('Deseja realmente apagar este artigo?')) return;
    try {
      await deletePost(id);
      // remove da lista sem recarregar a página
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Erro ao apagar artigo');
    }
  }

  if (loading) return <div className="p-6">Carregando artigos…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artigos</h1>
        <Link
          to="/admin/posts/new"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Novo artigo
        </Link>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {posts.map(post => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-xl shadow-sm border flex gap-4"
          >
            {/* Imagem de destaque */}
            {post.featured_url ? (
              <img
                src={assetUrl(post.featured_url)}
                alt={post.title}
                className="w-32 h-20 object-cover rounded"
                // se a imagem quebrar, escondemos para não estragar o layout
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              // placeholder visual quando não há imagem
              <div className="w-32 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                Sem imagem
              </div>
            )}

            {/* Conteúdo textual */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  {/* Título */}
                  <h2 className="text-lg font-semibold">
                    {post.title || 'Sem título'}
                  </h2>

                  {/* Meta: autor + status + data */}
                  <div className="text-sm text-gray-500 mt-1">
                    <span>Autor: {post.author_name || 'Desconhecido'}</span>
                    <span className="mx-2">•</span>
                    <span>Status: {LABEL[post.status]}</span>
                    {post.published_at && (
                      <>
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(post.published_at).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                  >
                    Apagar
                  </button>
                </div>
              </div>

              {/* Excerpt */}
              {post.lead && (
                <p className="text-gray-700 mt-2 text-sm">
                  {post.lead}
                </p>
              )}
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Nenhum artigo encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
