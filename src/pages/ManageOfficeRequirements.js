import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarOffice from "../components/SidebarOffice";
import Modal from "../components/Modal";
import Select from "react-select";

function ManageOfficeRequirements() {
  const { currentUser } = useAuth();
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [userDepartment, setUserDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      if (!currentUser) return;

      try {
        const requirementsRef = collection(db, "officeRequirements");
        const q = query(requirementsRef, where("addedBy", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        const requirementsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOfficeRequirements(requirementsData);
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };

    fetchOfficeRequirements();
  }, [currentUser]);

  useEffect(() => {
    const fetchEducationLevels = async () => {
      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const uniqueEducationLevels = [
          ...new Set(
            classesSnapshot.docs.map((doc) => doc.data().educationLevel)
          ),
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
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);
        const userData = userDoc.docs[0].data();
        const userRole = userData.role;
        setUserDepartment(userData.department || null);

        switch (userRole) {
          case "librarian":
            setOfficeName("Librarian"); 
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
          case "College Library":
            setOfficeName("College Library");
            break;
          case "Guidance Office":
            setOfficeName("Guidance Office");
            break;
          case "Office of The Dean":
            setOfficeName("Office of The Dean");
            break;
          case "Office of the Finance Director":
            setOfficeName("Office of the Finance Director");
            break;
          case "Office of the Registrar":
            setOfficeName("Office of the Registrar");
            break;
          case "Property Custodian":
            setOfficeName("Property Custodian");
            break;
          case "Student Council":
            setOfficeName("Student Council");
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

  const handleOpenEditModal = (requirement) => {
    setRequirementToEdit({
      ...requirement,
      originalEducationLevels: requirement.educationLevels,
    });
    setSelectedEducationLevels(
      requirement.educationLevels.map((level) => ({
        value: level,
        label: level,
      }))
    );
    setIsEditing(true);
  };

  const handleCloseEditModal = () => {
    setIsEditing(false);
    setRequirementToEdit(null);
    setSelectedEducationLevels([]); 
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault(); 

    try {
      if (!requirementToEdit) return;

      const updatedEducationLevels = selectedEducationLevels.map(
        (level) => level.value
      );

      await updateDoc(doc(db, "officeRequirements", requirementToEdit.id), {
        educationLevels: updatedEducationLevels,
        name: requirementToEdit.name,
        description: requirementToEdit.description,
      });

      setOfficeRequirements((prevRequirements) =>
        prevRequirements.map((req) =>
          req.id === requirementToEdit.id
            ? { 
                ...req, 
                educationLevels: updatedEducationLevels, 
                name: requirementToEdit.name, 
                description: requirementToEdit.description 
              }
            : req
        )
      );

      handleCloseEditModal();
      alert("Office requirement updated successfully!");
    } catch (error) {
      console.error("Error updating office requirement:", error);
      alert("Error updating requirement. Please try again later.");
    }
  };

  const openDeleteModal = (requirement) => {
    setRequirementToDelete(requirement);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setRequirementToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteRequirement = async () => {
    try {
      if (!requirementToDelete) return;

      await deleteDoc(doc(db, "officeRequirements", requirementToDelete.id));

      setOfficeRequirements((prevRequirements) =>
        prevRequirements.filter((req) => req.id !== requirementToDelete.id)
      );

      closeDeleteModal();
      alert("Office requirement deleted successfully!");
    } catch (error) {
      console.error("Error deleting office requirement:", error);
      alert("Error deleting requirement. Please try again later.");
    }
  };

  return (
    <SidebarOffice>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Manage Office Requirements
        </h2>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Office</th>
              <th className="py-2 border-b border-gray-200">
                Requirement Name
              </th>
              <th className="py-2 border-b border-gray-200">
                Education Levels
              </th>
              <th className="py-2 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {officeRequirements.map((requirement) => (
              <tr key={requirement.id}>
                <td className="border px-4 py-2">{requirement.office}</td>
                <td className="border px-4 py-2">{requirement.name}</td>
                <td className="border px-4 py-2">
                  {requirement.educationLevels.join(", ")}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleOpenEditModal(requirement)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(requirement)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal isOpen={isEditing} onClose={handleCloseEditModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Edit Office Requirement
            </h3>
            {requirementToEdit && ( 
              <form onSubmit={handleSaveEdit} className="space-y-4"> 
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
                    value={requirementToEdit.name}
                    onChange={(e) =>
                      setRequirementToEdit({
                        ...requirementToEdit,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">
                    Description:
                  </label>
                  <textarea
                    value={requirementToEdit.description}
                    onChange={(e) =>
                      setRequirementToEdit({
                        ...requirementToEdit,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCloseEditModal}
                    className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Confirm Delete
            </h3>
            <p>
              Are you sure you want to delete this requirement?
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDeleteModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequirement}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarOffice>
  );
}

export default ManageOfficeRequirements;