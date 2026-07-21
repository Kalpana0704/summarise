import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function getInitials(email) {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const navLinkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 transition ${
      isActive
        ? 'bg-gray-600 text-white shadow-sm'
        : 'text-gray-700 hover:bg-gray-500/40 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-500/60 bg-gray-400/95 shadow-md backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Story Quiz"
              className="h-11 w-11 rounded-xl border border-gray-500/50 object-cover shadow-sm transition group-hover:scale-105 group-hover:shadow-md"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-400 bg-brand-500" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
              Story Quiz
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-gray-600 sm:block">
              Learn smarter
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-3">
          <NavLink to="/" className={navLinkCls}>
            Home
          </NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className={navLinkCls}>
                Profile
              </NavLink>

              <div className="relative ml-1" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-500 bg-gray-300 text-sm font-bold text-gray-800 shadow-sm transition hover:border-gray-600 hover:bg-gray-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.email)
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gray-500 bg-gray-300 shadow-xl">
                    <div className="border-b border-gray-400 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Signed in as
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-gray-900">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-400/60"
                      >
                        My Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-100/80"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-500/40 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-500 px-4 py-2 text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
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
