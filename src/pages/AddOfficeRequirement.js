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
import { useAuth } from "../components/AuthContext";
import SidebarOffice from "../components/SidebarOffice";
import Select from "react-select";
import Modal from "../components/Modal";

function AddOfficeRequirement() {
  const { currentUser } = useAuth();
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchEducationLevels = async () => {
      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const uniqueEducationLevels = [
          ...new Set(classesSnapshot.docs.map((doc) => doc.data().educationLevel)),
        ];
        setEducationLevels(
          uniqueEducationLevels.map((level) => ({ value: level, label: level }))
        );
      } catch (error) {
        console.error("Error fetching education levels:", error);
      }
    };

    fetchEducationLevels();
  }, []);

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

    if (!selectedEducationLevels.length) {
      alert("Please select at least one education level.");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const confirmAddRequirement = async () => {
    setIsConfirmModalOpen(false);
    setIsAdding(true);

    try {
      const selectedLevelValues = selectedEducationLevels.map(
        (level) => level.value
      );

      const updatePromises = selectedLevelValues.map(async (level) => {
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where("educationLevel", "==", level));
        const classesSnapshot = await getDocs(q);

        const classUpdatePromises = classesSnapshot.docs.map(
          async (classDoc) => {
            const classDocRef = doc(db, "classes", classDoc.id);
            await updateDoc(classDocRef, {
              officeRequirements: arrayUnion({
                office: officeName,
                name: requirementName,
                description: requirementDescription,
                addedBy: currentUser.uid,
              }),
            });
          }
        );

        await Promise.all(classUpdatePromises);
      });

      await Promise.all(updatePromises);

      setEducationLevels([]);
      setSelectedEducationLevels([]);
      setRequirementName("");
      setRequirementDescription("");

      alert(
        "Requirement added successfully to selected education levels!"
      );
    } catch (error) {
      console.error("Error adding requirement: ", error);
      alert("Error adding requirement. Please try again later.");
    } finally {
      setIsAdding(false);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <SidebarOffice>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Add Office Requirement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">
              Education Levels:
            </label>
            <Select
              isMulti
              value={selectedEducationLevels}
              onChange={setSelectedEducationLevels}
              options={educationLevels}
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              Requirement Name:
            </label>
            <input
              type="text"
              value={requirementName}
              onChange={(e) => setRequirementName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              Description:
            </label>
            <textarea
              value={requirementDescription}
              onChange={(e) =>
                setRequirementDescription(e.target.value)
              }
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

          <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Confirm Requirement Addition
              </h3>
              <p>
                Are you sure you want to add this requirement to
                the selected education levels?
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeConfirmModal}
                  className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddRequirement}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </Modal>
        </form>
      </div>
    </SidebarOffice>
  );
}

export default AddOfficeRequirement;