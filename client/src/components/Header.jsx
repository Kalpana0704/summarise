import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Story Quiz" className="h-10 w-10 rounded-lg shadow-sm" />
          <span className="text-xl font-extrabold tracking-wide text-brand-700">Story Quiz</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 transition ${isActive ? 'bg-brand-50 text-brand-500' : 'text-brand-700 hover:bg-brand-50'}`
            }
          >
            Home
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition ${isActive ? 'bg-brand-50 text-brand-500' : 'text-brand-700 hover:bg-brand-50'}`
                }
              >
                Profile
              </NavLink>
              <span className="hidden text-brand-700 sm:inline">{user.email}</span>
              <button
                onClick={() => logout()}
                className="rounded-md bg-brand-700 px-3 py-2 text-white transition hover:bg-brand-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-brand-700 hover:text-brand-500">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-brand-500 px-3 py-2 text-white transition hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
