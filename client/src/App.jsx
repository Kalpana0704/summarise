import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { QuizPage } from './pages/QuizPage';
import { RegisterPage } from './pages/RegisterPage';
import { SharedQuizPage } from './pages/SharedQuizPage';

function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isProfile = pathname === '/profile';

  const pageBg = isHome
    ? 'min-h-screen bg-black'
    : isProfile
      ? 'min-h-screen bg-gray-400'
      : 'min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50';

  return (
    <div className={pageBg}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/share/:shareId" element={<SharedQuizPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/quiz/:id" element={<QuizPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
