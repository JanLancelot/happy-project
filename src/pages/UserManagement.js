import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import SidebarSuper from "../components/SidebarSuper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faUnlock,
  faSort,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [sortStatusAsc, setSortStatusAsc] = useState(null); 
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState(null); 

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setOriginalUsers(usersData); 

        const uniqueRoles = [...new Set(usersData.map((user) => user.role))];
        setAvailableRoles(uniqueRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filteredUsers = [...originalUsers]; 

    if (selectedRole) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === selectedRole
      );
    }

    if (searchQuery) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortStatusAsc !== null) {
      filteredUsers.sort((a, b) => {
        const statusA = a.isLocked ? 1 : 0; 
        const statusB = b.isLocked ? 1 : 0;

        if (sortStatusAsc) {
          return statusA - statusB; 
        } else {
          return statusB - statusA; 
        }
      });
    }

    setUsers(filteredUsers);
  }, [selectedRole, searchQuery, sortStatusAsc, originalUsers]);

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

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkLockUnlock = (action) => {
    setBulkAction(action);
    setIsConfirmModalOpen(true);
  };

  const confirmBulkAction = async () => {
    setIsConfirmModalOpen(false);

    try {
      const updatePromises = selectedUsers.map(async (userId) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          isLocked: bulkAction === "lock", 
        });
      });

      await Promise.all(updatePromises);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, isLocked: bulkAction === "lock" }
            : user
        )
      );

      setSelectedUsers([]); 
      alert(`Selected accounts ${bulkAction}ed successfully!`);
    } catch (error) {
      console.error(`Error during bulk ${bulkAction}:`, error);
      alert(`Error during bulk action. Please try again later.`);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setBulkAction(null);
  };

  const handleSortStatus = () => {
    setSortStatusAsc((prevSort) => !prevSort); 
  };

  return (
    <SidebarSuper>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>

        <div className="mb-4 flex flex-wrap justify-between items-center">
          <div className="flex space-x-4">
            <div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="">All Roles</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkLockUnlock("lock")}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={selectedUsers.length === 0}
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" /> Lock Selected
            </button>
            <button
              onClick={() => handleBulkLockUnlock("unlock")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={selectedUsers.length === 0}
            >
              <FontAwesomeIcon icon={faUnlock} className="mr-2" /> Unlock Selected
            </button>
            <Link to="/create-user"> 
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create User
              </button>
            </Link>
          </div>
        </div>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200 w-8">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={handleSelectAllUsers}
                />
              </th>
              <th className="py-2 border-b border-gray-200">Email</th>
              <th className="py-2 border-b border-gray-200">Role</th>
              <th
                className="py-2 border-b border-gray-200 cursor-pointer"
                onClick={handleSortStatus}
              >
                Status{" "}
                <FontAwesomeIcon
                  icon={faSort}
                  className={`ml-1 ${
                    sortStatusAsc !== null ? (sortStatusAsc ? "transform rotate-180" : "") : ""
                  }`}
                />
              </th>
              <th className="py-2 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
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

        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Confirm Bulk Action
            </h3>
            <p>
              Are you sure you want to{" "}
              <strong>{bulkAction}</strong> the selected accounts?
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeConfirmModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                className={`px-4 py-2 text-white rounded hover:bg-${
                  bulkAction === "lock" ? "red" : "green"
                }-600 bg-${bulkAction === "lock" ? "red" : "green"}-500`}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarSuper>
  );
}

export default UserManagement;