import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import SidebarSuper from "../components/SidebarSuper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";

function UserManagement() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleLockUnlock = async (userId, currentStatus) => {
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        isLocked: !currentStatus,
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isLocked: !currentStatus } : user
        )
      );

      alert(
        `User account ${!currentStatus ? "locked" : "unlocked"} successfully!`
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Error updating user status. Please try again later.");
    }
  };

  return (
    <SidebarSuper>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Email</th>
              <th className="py-2 border-b border-gray-200">Role</th>
              <th className="py-2 border-b border-gray-200">Status</th>
              <th className="py-2 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role}</td>
                <td className="border px-4 py-2">
                  {user.isLocked ? "Locked" : "Unlocked"}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleLockUnlock(user.id, user.isLocked)}
                    className={`px-4 py-2 rounded ${
                      user.isLocked
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={user.isLocked ? faUnlock : faLock}
                      className="mr-2"
                    />
                    {user.isLocked ? "Unlock" : "Lock"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarSuper>
  );
}

export default UserManagement;
