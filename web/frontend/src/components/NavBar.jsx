import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function NavBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const linkClass = (path) =>
    `block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      location.pathname === path
        ? 'bg-blue-700 text-white'
        : 'text-gray-200 hover:text-white hover:bg-blue-600'
    }`;

  return (
    <header className={`shadow-md sticky top-0 z-50 transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-blue-900'
    }`}>
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-wide">RiskParix</span>
          <span className={`text-xs leading-tight ${
            isDark ? 'text-gray-300' : 'text-blue-200'
          }`}>Trade with the risk.</span>
        </div>

        {/* Hamburger button for mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white sm:hidden focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Navigation links and theme toggle */}
        <div className={`sm:flex sm:items-center sm:space-x-2 ${
          menuOpen ? 'block' : 'hidden'
        } sm:block`}>
          <nav className="flex items-center space-x-2">
            <Link to="/" className={linkClass('/')}>主页</Link>
            <Link to="/strategy" className={linkClass('/strategy')}>策略分析</Link>
            
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white'
                  : 'bg-blue-700 text-blue-100 hover:bg-blue-600 hover:text-white'
              }`}
              title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDark ? '🌞' : '🌙'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
