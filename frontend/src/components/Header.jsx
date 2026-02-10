import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCategories } from '../services/api';
import { useAuth } from '../context/AuthContext'; // <--- 1. Importar o AuthContext

/*
  Header de dois níveis (Visual Clássico):
  - Upper: logo + nav + search + user actions
  - Lower: categorias
*/

export default function Header() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <--- 2. Aceder ao utilizador

  useEffect(() => {
    let mounted = true;
    async function loadCats() {
      try {
        const data = await getCategories();
        if (!mounted) return;
        const items = data?.data ?? data ?? [];
        setCategories(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Erro ao carregar categorias', err);
      }
    }
    loadCats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  function onSearchSubmit(e) {
    if (e) e.preventDefault();
    const q = (search || '').trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  // Função simples de logout
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b shadow-sm">
      {/* UPPER HEADER: logo + nav minimal + ações */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-black flex items-center justify-center text-white font-bold">FO</div>
            <div className="hidden sm:block">
              <div className="text-lg font-extrabold">Folha Ovitula</div>
              <div className="text-xs text-gray-500 -mt-1">Notícias · Análise</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 ml-6">
            <Link to="/" className="text-sm text-gray-700 hover:text-sky-600">Início</Link>
            <Link to="/sobre" className="text-sm text-gray-700 hover:text-sky-600">Sobre</Link>
          </nav>
        </div>

        {/* AÇÕES: Pesquisa + Lógica de Login/Logout */}
        <div className="flex items-center gap-3">
          <form onSubmit={onSearchSubmit} className="hidden sm:flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="px-3 py-2 border rounded-md text-sm w-48 focus:ring-2 focus:ring-sky-300"
            />
            <button type="submit" className="px-3 py-2 bg-sky-600 text-white rounded-md text-sm">Pesquisar</button>
          </form>

          {/* === AQUI ESTÁ A MUDANÇA (DESKTOP) === */}
          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l pl-3">
              {/* Link para o Painel (Só Equipa) */}
              {['admin', 'editor', 'author'].includes(user.role) && (
                <Link to="/admin" className="text-sm font-bold text-sky-600 hover:underline">
                  Painel
                </Link>
              )}
              
              <span className="text-sm text-gray-700 font-medium hidden lg:inline">
                {user.name?.split(' ')[0]}
              </span>

              <button 
                onClick={handleLogout} 
                className="text-sm text-red-600 hover:underline"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-gray-700 hover:underline ml-2">
              Entrar
            </Link>
          )}

          {/* mobile hamburger */}
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Abrir menu"
            className="md:hidden p-2 rounded-md border"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* LOWER HEADER: categorias (visível em desktop) */}
      <div className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="hidden md:flex items-center gap-3 py-2">
            <Link to="/" className="text-sm px-3 py-1 rounded hover:bg-gray-50">Todas</Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/?category=${encodeURIComponent(cat.slug)}`}
                className="text-sm text-gray-700 hover:text-sky-600 px-3 py-1 rounded"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* MOBILE MENU */}
          {open && (
            <div className="md:hidden px-4 pb-4">
              <div className="flex flex-col gap-2 mt-2">
                <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button type="submit" className="px-3 py-2 bg-sky-600 text-white rounded-md">OK</button>
                </form>

                <div className="pt-2 border-t mt-2">
                  <Link to="/" className="block px-2 py-2 rounded hover:bg-gray-50">Todas</Link>
                  {categories.map(cat => (
                    <Link key={cat.id} to={`/?category=${encodeURIComponent(cat.slug)}`} className="block px-2 py-2 rounded hover:bg-gray-50">
                      {cat.name}
                    </Link>
                  ))}
                  <Link to="/sobre" className="block px-2 py-2 rounded hover:bg-gray-50">Sobre</Link>
                </div>

                {/* === AQUI ESTÁ A MUDANÇA (MOBILE) === */}
                <div className="pt-3 border-t flex flex-col gap-2">
                  {user ? (
                    <>
                      <div className="px-2 text-sm text-gray-500">Olá, <strong>{user.name}</strong></div>
                      
                      {['admin', 'editor', 'author'].includes(user.role) && (
                         <Link to="/admin" className="block text-center py-2 border rounded bg-sky-50 text-sky-700 font-bold">
                           Aceder ao Painel
                         </Link>
                      )}

                      <button 
                        onClick={handleLogout} 
                        className="block w-full text-center py-2 border rounded text-red-600 hover:bg-red-50"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="flex-1 text-center py-2 border rounded bg-gray-50">
                      Entrar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}