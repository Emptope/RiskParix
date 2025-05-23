import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const linkClass = (path) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200 ${location.pathname === path ? 'bg-blue-700 text-white' : 'text-gray-200 hover:text-white hover:bg-blue-600'}`;

  return (
    <header className="bg-blue-900 shadow-md sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo & Brand */}
        <div>
          <h1 className="text-xl font-bold text-white">RiskParix</h1>
          <p className="text-xs text-blue-200 leading-tight">Trade with the risk.</p>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-2">
          <Link to="/" className={linkClass('/')}>主页</Link>
          <Link to="/strategy" className={linkClass('/strategy')}>策略分析</Link>
        </nav>
      </div>
    </header>
  );
}