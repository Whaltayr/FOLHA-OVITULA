import Header from "../components/Header";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      
      {/* Header */}
      <Header/>

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
