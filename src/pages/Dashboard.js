import React from "react";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  return (
    <Sidebar>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to the Dashboard</h2>
        <p>This is your main dashboard content.</p>
      </div>
    </Sidebar>
  );
};

export default Dashboard;
