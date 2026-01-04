// frontend/src/components/Header.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCategories } from '../services/api';

/*
  Header de dois níveis:
  - Upper: logo + nav + input de pesquisa (agora navega para /search?q=...)
  - Lower: categorias (links para /?category=slug) — Home lê esse param
*/

export default function Header() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false); // menu mobile
  const [search, setSearch] = useState('');
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadCats() {
      try {
        const data = await getCategories();           // GET /categories
        if (!mounted) return;
        const items = data?.data ?? data ?? [];      // lidar com várias formas de resposta
        setCategories(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Erro ao carregar categorias', err);
      }
    }
    loadCats();
    return () => { mounted = false; };
  }, []);

  // fechar mobile menu quando muda a rota
  useEffect(() => setOpen(false), [loc.pathname]);

  // usa react-router para navegar (sem reload)
  function onSearchSubmit(e) {
    if (e) e.preventDefault();
    const q = (search || '').trim();
    if (!q) return;
    // navega para /search com query param q
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  // navegação mobile/links de categoria: mantêm comportamento para home (filtro por categoria)
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
            <Link to="/about" className="text-sm text-gray-700 hover:text-sky-600">Sobre</Link>
          </nav>
        </div>

        {/* ações: pesquisa pequena + Entrar */}
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

          <Link to="/login" className="text-sm text-gray-700 hover:underline">Entrar</Link>

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

          {/* mobile menu quando aberto (aplica tanto upper quanto categorias) */}
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
                </div>

                <div className="pt-3 border-t flex gap-2">
                  <Link to="/login" className="flex-1 text-center py-2 border rounded">Entrar</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
