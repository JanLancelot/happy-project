import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import SidebarOffice from "../components/SidebarOffice";

function AddOfficeRequirement() {
  const { currentUser } = useAuth();
  const [educationLevel, setEducationLevel] = useState("");
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDocs(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const userRole = userData.role;

        switch (userRole) {
          case "librarian":
            setOfficeName("Library");
            break;
          case "finance":
            setOfficeName("Finance");
            break;
          case "registrarBasicEd":
            setOfficeName("Basic Education Registrar");
            break;
          case "characterRenewalOfficer":
            setOfficeName("Character Renewal Office");
            break;
          case "principlal":
            setOfficeName("Director/Principal");
            break;
          default:
            setOfficeName("Unknown Office");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!educationLevel) {
      alert("Please select an education level.");
      return;
    }

    setIsAdding(true);

    try {
      const classesRef = collection(db, "classes");
      const q = query(
        classesRef,
        where("educationLevel", "==", educationLevel)
      );
      const classesSnapshot = await getDocs(q);

      const updatePromises = classesSnapshot.docs.map(async (classDoc) => {
        const classDocRef = doc(db, "classes", classDoc.id);

        await updateDoc(classDocRef, {
          officeRequirements: arrayUnion({
            office: officeName,
            name: requirementName,
            description: requirementDescription,
            addedBy: currentUser.uid,
          }),
        });
      });

      await Promise.all(updatePromises);

      setEducationLevel("");
      setRequirementName("");
      setRequirementDescription("");

      alert(
        "Requirement added successfully to all classes in the selected education level!"
      );
    } catch (error) {
      console.error("Error adding requirement: ", error);
      alert("Error adding requirement. Please try again later.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SidebarOffice>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Add Office Requirement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Education Level Selection */}
          <div>
            <label className="block text-gray-700">Education Level:</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Select Education Level</option>
              <option value="elementary">Elementary</option>
              <option value="juniorHighschool">Junior High School</option>
              <option value="seniorHighschool">Senior High School</option>
              <option value="college">College</option>
            </select>
          </div>

          {/* Requirement Name */}
          <div>
            <label className="block text-gray-700">Requirement Name:</label>
            <input
              type="text"
              value={requirementName}
              onChange={(e) => setRequirementName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          {/* Requirement Description */}
          <div>
            <label className="block text-gray-700">Description:</label>
            <textarea
              value={requirementDescription}
              onChange={(e) => setRequirementDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Requirement"}
          </button>
        </form>
      </div>
    </SidebarOffice>
  );
}

export default AddOfficeRequirement;
