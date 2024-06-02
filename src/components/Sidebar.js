import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOutsideClick = (event) => {
    if (isOpen && !event.target.closest(".sidebar")) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleMediaQueryChange = (e) => {
      setIsOpen(e.matches);
    };

    handleMediaQueryChange(mediaQuery);
    mediaQuery.addListener(handleMediaQueryChange);
    document.addEventListener("click", handleOutsideClick);

    return () => {
      mediaQuery.removeListener(handleMediaQueryChange);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
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
            className="p-2 bg-blue-600 text-white rounded md:hidden"
          >
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Sidebar;
