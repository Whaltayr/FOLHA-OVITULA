export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">Folha Ovitula</h1>
          <nav className="text-sm text-gray-600">
            Notícias · Política · Economia
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t text-sm text-gray-500">
        <div className="max-w-6xl mx-auto px-4 py-4">
          © 2025 · Folha Ovitula
        </div>
      </footer>

    </div>
  );
}
