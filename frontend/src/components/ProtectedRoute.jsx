// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. SE AINDA ESTIVER A CARREGAR O USER DO LOCALSTORAGE...
  // Mostra um spinner ou tela em branco em vez de expulsar a pessoa.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 2. SE JÁ CARREGOU E NÃO HÁ USER...
  // Então sim, manda para o login.
  if (!user) {
    // O "state={{ from: location }}" ajuda a voltar para onde estavas depois de logar (opcional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. VERIFICAÇÃO DE HIERARQUIA (Admin > Editor > Author)
  if (role) {
    const ROLE_LEVELS = {
      reader: 0,
      author: 1,
      editor: 2,
      admin: 3
    };

    const userLevel = ROLE_LEVELS[user.role] || 0;
    const requiredLevel = ROLE_LEVELS[role] || 0;

    if (userLevel < requiredLevel) {
      // Se não tiver nível suficiente, manda para a Home ou mostra erro
      return <Navigate to="/" replace />;
    }
  }

  // 4. SE PASSOU TUDO, MOSTRA A PÁGINA
  return children;
}