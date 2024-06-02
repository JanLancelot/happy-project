import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaQueryChange = (e) => {
      setIsOpen(e.matches);
    };

    handleMediaQueryChange(mediaQuery); // Set the initial state
    mediaQuery.addListener(handleMediaQueryChange);

    return () => {
      mediaQuery.removeListener(handleMediaQueryChange);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="absolute md:relative top-0 left-0 w-64 h-full bg-gray-800 text-white shadow-lg z-10 md:block"
      >
        <nav className="p-6">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/dashboard/overview" className="block hover:underline">
                Overview
              </Link>
            </li>
            <li>
              <Link to="/dashboard/profile" className="block hover:underline">
                Profile
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" className="block hover:underline">
                Settings
              </Link>
            </li>
            <li>
              <Link to="/dashboard/logout" className="block hover:underline">
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow p-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 bg-blue-600 text-white rounded"
          >
            {isOpen ? 'Close' : 'Menu'}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
