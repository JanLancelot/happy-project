import React from "react";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-100 p-4">
        <header className="bg-white shadow-md rounded p-4 mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </header>
      </div>
    </Sidebar>
  );
}
export default Dashboard;
