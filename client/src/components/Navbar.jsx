import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Code2, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`text-sm font-medium transition-colors relative py-1 ${
        isActive(to)
          ? 'text-black'
          : 'text-neutral-500 hover:text-black'
      }`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-black rounded-full" />
      )}
    </Link>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-black tracking-tight">DSA Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/questions">Questions</NavLink>
            <NavLink to="/companies">Companies</NavLink>
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
            {user && <NavLink to="/revise">Revise</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-100 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-black">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 rounded-lg transition-colors">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-black" />
            ) : (
              <Menu className="h-5 w-5 text-black" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-neutral-200">
            <div className="container mx-auto px-4 py-4 space-y-1">
              <MobileNavLink to="/" active={isActive('/')} onClick={() => setMobileMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/questions" active={isActive('/questions')} onClick={() => setMobileMenuOpen(false)}>
                Questions
              </MobileNavLink>
              <MobileNavLink to="/companies" active={isActive('/companies')} onClick={() => setMobileMenuOpen(false)}>
                Companies
              </MobileNavLink>
              {user && (
                <>
                  <MobileNavLink to="/dashboard" active={isActive('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink to="/revise" active={isActive('/revise')} onClick={() => setMobileMenuOpen(false)}>
                    Revise
                  </MobileNavLink>
                </>
              )}
              {user?.role === 'admin' && (
                <MobileNavLink to="/admin" active={isActive('/admin')} onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </MobileNavLink>
              )}

              <div className="pt-4 mt-4 border-t border-neutral-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2 bg-neutral-100 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-black">{user.name}</div>
                        <div className="text-xs text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2.5 text-sm font-medium text-black border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors">
                        Login
                      </button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-xl transition-colors">
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

    </>
  );
};

// Mobile Nav Link Component
const MobileNavLink = ({ to, active, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active
        ? 'bg-black text-white'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;