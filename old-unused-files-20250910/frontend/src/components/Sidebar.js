import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Wand2, 
  Clock, 
  Users, 
  Settings,
  BarChart3
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      to: '/generate',
      icon: Wand2,
      label: 'Generate Try-On',
      description: 'Create new images'
    },
    {
      to: '/queue',
      icon: Clock,
      label: 'Queue Monitor',
      description: 'Track job progress'
    },
    {
      to: '/models',
      icon: Users,
      label: 'Model Gallery',
      description: 'View available models'
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Configure platform'
    }
  ];

  return (
    <aside className="bg-white w-64 min-h-screen border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-kustom-500 to-kustom-700 rounded-lg flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Kustompedia</h2>
            <p className="text-xs text-gray-500">Try-On Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 group ${
                      isActive
                        ? 'bg-kustom-50 text-kustom-700 border-r-2 border-kustom-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <BarChart3 className="h-4 w-4" />
            <span>Internal Tool v1.0</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            For Kustompedia Team Use
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
