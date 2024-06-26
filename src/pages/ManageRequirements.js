import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayRemove,
  deleteField,
  getDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import Modal from "../components/Modal";

function ManageRequirements() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classData, setClassData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editRequirement, setEditRequirement] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!currentUser) return;

      const q = query(
        collection(db, "classes"),
        where("subjects", "array-contains-any", [
          { teacherUid: currentUser.uid },
        ])
      );

      const classesSnapshot = await getDocs(q);
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
    };

    fetchClasses();
  }, [currentUser]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (selectedClass) {
        try {
          const classDocRef = doc(db, "classes", selectedClass);
          const classDocSnapshot = await getDoc(classDocRef);
          if (classDocSnapshot.exists()) {
            setClassData(classDocSnapshot.data());
          } else {
            setClassData(null); 
          }
        } catch (error) {
          console.error("Error fetching class data: ", error);
        }
      }
    };

    fetchClassData();
  }, [selectedClass]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSubject(""); 
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleEditRequirement = (requirement) => {
    setEditRequirement({ ...requirement });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const subjectRequirements = classData.requirements[selectedSubject];

      const requirementIndex = subjectRequirements.findIndex(
        (req) => req.name === editRequirement.originalName
      );

      if (requirementIndex !== -1) {
        subjectRequirements[requirementIndex] = {
          name: editRequirement.name,
          description: editRequirement.description,
          teacherUid: currentUser.uid,
        };

        await updateDoc(classDocRef, {
          [`requirements.${selectedSubject}`]: subjectRequirements,
        });

        setClassData((prevData) => ({
          ...prevData,
          requirements: {
            ...prevData.requirements,
            [selectedSubject]: subjectRequirements,
          },
        }));

        setIsEditing(false);
        setEditRequirement(null);
        alert("Requirement updated successfully!");
      } else {
        alert("Error finding requirement to update.");
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
      alert("Error updating requirement. Please try again later.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditRequirement(null);
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
      const classDocRef = doc(db, "classes", selectedClass);
      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayRemove({
          name: requirementToDelete.name,
          description: requirementToDelete.description,
          teacherUid: currentUser.uid,
        }),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [selectedSubject]: prevData.requirements[selectedSubject].filter(
            (req) => req.name !== requirementToDelete.name
          ),
        },
      }));

      closeDeleteModal();
      alert("Requirement deleted successfully!");
    } catch (error) {
      console.error("Error deleting requirement:", error);
      alert("Error deleting requirement. Please try again later.");
    }
  };

//   const classData = classes.find((c) => c.id === selectedClass);

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Manage Requirements</h2>

        <div className="mb-4">
          <label htmlFor="classSelect" className="block text-gray-700">
            Select Class:
          </label>
          <select
            id="classSelect"
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select a class</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.educationLevel} - {classItem.gradeLevel} -{" "}
                {classItem.sectionName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="subjectSelect" className="block text-gray-700">
            Select Subject:
          </label>
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            disabled={!selectedClass}
          >
            <option value="">Select a subject</option>
            {selectedClass &&
              classData?.subjects
                .filter((subject) => subject.teacherUid === currentUser.uid)
                .map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
          </select>
        </div>

        {selectedClass && selectedSubject && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Requirements:</h3>
            <ul className="list-disc list-inside space-y-2">
              {classData.requirements[selectedSubject]
                .filter((requirement) => requirement.teacherUid === currentUser.uid)
                .map((requirement) => (
                  <li key={requirement.name} className="flex items-center justify-between">
                    <div>
                      <strong>{requirement.name}:</strong> {requirement.description}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          handleEditRequirement({
                            ...requirement,
                            originalName: requirement.name, 
                          })
                        }
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(requirement)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <Modal isOpen={isEditing} onClose={handleCancelEdit}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Requirement</h3>
            {editRequirement && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700">
                    Requirement Name:
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editRequirement.name}
                    onChange={(e) =>
                      setEditRequirement({
                        ...editRequirement,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-gray-700">
                    Description:
                  </label>
                  <textarea
                    id="description"
                    value={editRequirement.description}
                    onChange={(e) =>
                      setEditRequirement({
                        ...editRequirement,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>
              Are you sure you want to delete the requirement "
              {requirementToDelete?.name}"?
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
    </SidebarFaculty>
  );
}

export default ManageRequirements;