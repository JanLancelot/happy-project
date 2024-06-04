import React, { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (user && user.uid) {
        setRedirecting(true);
        try {
          const userDocQuery = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
          );
          const userDocSnap = await getDocs(userDocQuery);
          const userData = userDocSnap.docs[0]?.data();

          if (userData) {
            navigate(
              userData.role === "faculty" ? "/add-requirement" : "/dashboard"
            );
          } else {
            console.error("User document not found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setRedirecting(false);
        }
      }
    };

    checkUserRoleAndRedirect();
  }, [user, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    await signInWithEmailAndPassword(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        {error && (
          <p className="text-red-500 text-center mb-4">{error.message}</p>
        )}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            disabled={loading || redirecting}
          >
            {loading || redirecting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;
