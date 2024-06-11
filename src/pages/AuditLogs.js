import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import SidebarSuper from "../components/SidebarSuper";
import moment from "moment"; 

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all"); 
  const [filterUser, setFilterUser] = useState(""); 

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsRef = collection(db, "auditLogs");
        let q = query(logsRef, orderBy("timestamp", "desc")); 

        if (filterAction !== "all") {
          q = query(q, where("actionType", "==", filterAction));
        }

        if (filterUser) {
          q = query(q, where("userId", "==", filterUser));
        }

        const logsSnapshot = await getDocs(q);
        const logsData = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      }
    };

    fetchLogs();
  }, [filterAction, filterUser]);

  return (
    <SidebarSuper>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Audit Logs</h2>

        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="filterAction" className="block text-gray-700 mb-1">
              Filter by Action:
            </label>
            <select
              id="filterAction"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">All Actions</option>
              <option value="login_success">Successful Login</option>
              <option value="login_failed">Failed Login</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterUser" className="block text-gray-700 mb-1">
              Filter by User ID:
            </label>
            <input
              type="text"
              id="filterUser"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        </div>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Timestamp</th>
              <th className="py-2 border-b border-gray-200">User ID</th>
              <th className="py-2 border-b border-gray-200">Action Type</th>
              <th className="py-2 border-b border-gray-200">Email</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="border px-4 py-2">
                  {moment(log.timestamp.toDate()).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </td>
                <td className="border px-4 py-2">{log.userId}</td>
                <td className="border px-4 py-2">{log.actionType}</td>
                <td className="border px-4 py-2">{log.email}</td> 
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarSuper>
  );
}

export default AuditLogs;