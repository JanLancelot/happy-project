import React, { useState } from 'react';
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

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-screen flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-20 p-2 bg-blue-600 text-white rounded"
      >
        {isOpen ? 'Close' : 'Open'} Menu
      </button>
      <motion.div
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="absolute top-0 left-0 w-64 h-full bg-gray-800 text-white shadow-lg z-10"
      >
        <nav className="p-6">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/" className="block hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="block hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link to="/services" className="block hover:underline">
                Services
              </Link>
            </li>
            <li>
              <Link to="/contact" className="block hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </motion.div>
    </div>
  );
};

export default Sidebar;