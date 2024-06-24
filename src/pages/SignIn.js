import React, { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          switch (userData.role) {
            case "faculty":
              navigate("/approve-clearance-faculty");
              break;
            case "student":
              navigate("/student-clearance");
              break;
            case "super-admin":
              navigate("/user-management");
              break;
            case "librarian":
            case "characterRenewalOfficer":
            case "finance":
            case "registrarBasicEd":
            case "College Library":
            case "Guidance Office":
            case "Office of The Dean":
            case "Office of the Finance Director":
            case "Office of the Registrar":
            case "Property Custodian":
            case "Student Council":
            case "directorPrincipal":
              navigate("/add-office-requirement");
              break;
            default:
              navigate("/dashboard");
          }
        } else {
          console.error("No such document!");
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isLocked) {
        setLocalError(
          "Your account is locked due to multiple failed sign-in attempts."
        );
        return;
      }
    }

    await signInWithEmailAndPassword(email, password);

    const auditLogsRef = collection(db, "auditLogs");

    if (error) {
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const failedAttempts = userData.failedSignInAttempts || 0;

        if (failedAttempts >= 2) {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: 3,
            isLocked: true,
          });
          setLocalError(
            "Your account is locked due to multiple failed sign-in attempts."
          );
        } else {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: failedAttempts + 1,
          });
          setLocalError("Invalid email or password.");
        }

        await addDoc(auditLogsRef, {
          timestamp: serverTimestamp(),
          userId: userDoc.id,
          actionType: "login_failed",
          email: email,
        });
      }
    } else {
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          failedSignInAttempts: 0,
        });

        await addDoc(auditLogsRef, {
          timestamp: serverTimestamp(),
          userId: userDoc.id,
          actionType: "login_success",
          email: email,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-lg shadow-md max-w-md w-full"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-semibold mb-6 text-center text-gray-800"
        >
          Sign In
        </motion.h1>
        <AnimatePresence>
          {(error || localError) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-600 text-center mb-4 text-sm"
            >
              {localError || error.message}
            </motion.p>
          )}
        </AnimatePresence>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            disabled={loading}
            whileHover={{ backgroundColor: "#2563EB" }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;