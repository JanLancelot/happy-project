import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../components/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Lock, BookOpen, UserPlus, Building } from "lucide-react";

function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const collegeRoles = [
    "College Library",
    "Guidance Office",
    "Office of The Dean",
    "Office of the Finance Director",
    "Office of the Registrar",
    "Property Custodian",
    "Student Council",
  ];

  const otherRoles = [
    "librarian",
    "characterRenewalOfficer",
    "finance",
    "registrarBasicEd",
    "directorPrincipal",
  ];

  const departments = [
    "College of Health Sciences",
    "College of Business Administration",
    "College of Computer Studies",
    "College of Accountancy",
    "College of Education",
    "College of Arts and Sciences",
    "College of Hospitality Management and Tourism",
    "College of Maritime Education",
    "School of Mechanical Engineering",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !email ||
      !password ||
      !role ||
      (educationLevel === "college" &&
        (role === "Office of The Dean" || role === "Student Council") &&
        !department)
    ) {
      alert("Please fill in all required fields.");
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
        department:
          role === "Office of The Dean" || role === "Student Council"
            ? department
            : null,
        educationLevel: educationLevel,
        isLocked: false,
      });

      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: new Date(),
        userId: currentUser.uid,
        actionType: "create_user",
        email: currentUser.email,
        details: {
          createdUserEmail: email,
          createdUserRole: role,
          educationLevel: educationLevel,
          department: department,
        },
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
    <Sidebar>
      <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <UserPlus className="mr-2" size={28} />
            Create User
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <Mail className="mr-2" size={18} />
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <Lock className="mr-2" size={18} />
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <BookOpen className="mr-2" size={18} />
                Education Level:
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                <option value="">Select Education Level</option>
                <option value="elementary">Elementary</option>
                <option value="junior high school">Junior High School</option>
                <option value="senior high school">Senior High School</option>
                <option value="college">College</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <User className="mr-2" size={18} />
                Role:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                <option value="">Select Role</option>
                {educationLevel === "college"
                  ? collegeRoles.map((collegeRole) => (
                      <option key={collegeRole} value={collegeRole}>
                        {collegeRole}
                      </option>
                    ))
                  : otherRoles.map((otherRole) => (
                      <option key={otherRole} value={otherRole}>
                        {otherRole}
                      </option>
                    ))}
              </select>
            </div>
            {educationLevel === "college" &&
              (role === "Office of The Dean" || role === "Student Council") && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                    <Building className="mr-2" size={18} />
                    Department:
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            <motion.button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2" size={20} />
                  Create User
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </Sidebar>
  );
}

export default CreateUser;