import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Folha Ovitula</h1>
        <nav className="space-x-2">
          <Link
            to="/admin/posts"
            className="px-5 py-1 bg-gray-200 border rounded-4xl hover:bg-gray-50 transition-colors"
          >
            Posts
          </Link>
          <Link
            to="/"
            className="px-5 py-1.5 text-sm bg-gray-200 text-gray-700 border rounded-4xl hover:bg-gray-50 transition-colors"
          >
            Ver Site
          </Link>
        </nav>
      </header>

      <section className="mt-6 grid gap-6">
        <div className="bg-white p-6  rounded shadow">
          <h2 className="font-semibold">Ações rápidas</h2>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/admin/posts/new"
            className="px-4 py-2 bg-blue-600 rounded text-white hover:-translate-y-1.25 transition-transform"
          >Novo Post</Link>
          <Link to="/admin/posts" className="px-4 py-2 bg-gray-300 rounded hover:-translate-y-1.25 transition-transform">
            Gerir Posts</Link>
        </div>
      </section>
    </div>
  );
}
