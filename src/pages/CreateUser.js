import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SidebarSuper from "../components/SidebarSuper"; 

function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !role) {
      alert("Please fill in all fields.");
      return;
    }

    setIsLoading(true); 

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: email,
        role: role,
        isLocked: false, 
      });

      alert("User created successfully!");
      navigate("/user-management"); 
    } catch (error) {
      console.error("Error creating user: ", error);
      alert("Error creating user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarSuper>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Create User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Select Role</option>
              <option value="librarian">Librarian</option>
              <option value="characterRenewalOfficer">Character Renewal Officer</option>
              <option value="finance">Finance</option>
              <option value="registrarBasicEd">Basic Education Registrar</option>
              <option value="directorPrincipal">Director/Principal</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create User"} 
          </button>
        </form>
      </div>
    </SidebarSuper>
  );
}

export default CreateUser;