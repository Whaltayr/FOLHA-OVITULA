// frontend/src/pages/admin/ManageUsers.jsx
import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api"; // Usa o nosso fetch inteligente

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar lista de utilizadores ao entrar
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      // Precisas de garantir que tens a rota GET /users no backend!
      const data = await apiFetch('/users'); 
      setUsers(data);
    } catch (err) {
      setError("Erro ao carregar utilizadores. (Verifica se a rota /users existe no backend)");
    } finally {
      setLoading(false);
    }
  }

  // Função para mudar o cargo
  async function changeRole(userId, newRole, userName) {
    const confirmMsg = `Tem a certeza que quer mudar ${userName} para ${newRole}?`;
    if (!window.confirm(confirmMsg)) return;

    // Atualização Otimista (Muda na tela logo para parecer rápido)
    const oldUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: { role: newRole }
      });
    } catch (err) {
      alert("Erro ao mudar cargo");
      setUsers(oldUsers); // Reverte se falhou
    }
  }

  // Função para apagar utilizador
  async function deleteUser(userId) {
    if (!window.confirm("ATENÇÃO: Isto vai apagar o utilizador e TODOS os artigos dele!")) return;

    try {
      await apiFetch(`/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Erro ao apagar utilizador");
    }
  }

  if (loading) return <div className="p-10 text-center">A carregar equipa...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gerir Equipa & Utilizadores</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nome</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Cargo Atual</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 font-medium">{user.name}</td>
                <td className="p-4 text-gray-500">{user.email}</td>
                <td className="p-4">
                  <select 
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value, user.name)}
                    className={`
                      px-3 py-1 rounded text-xs font-bold uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                      ${user.role === 'editor' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                      ${user.role === 'author' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                      ${user.role === 'reader' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                    `}
                  >
                    <option value="reader">Leitor</option>
                    <option value="author">Autor</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline"
                  >
                    Apagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}