import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";

function AddRequirement() {
  const { currentUser } = useAuth();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");

  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      if (!currentUser) return;

      try {
        const allClassesSnapshot = await getDocs(collection(db, "classes"));

        const userSubjects = [];
        allClassesSnapshot.docs.forEach((classDoc) => {
          const subjects = classDoc.data().subjects || [];
          subjects.forEach((subject) => {
            if (
              subject.teacherUid === currentUser.uid &&
              !userSubjects.includes(subject.subject)
            ) {
              userSubjects.push(subject.subject);
            }
          });
        });

        setAvailableSubjects(userSubjects);
      } catch (error) {
        console.error("Error fetching subjects: ", error);
      }
    };

    fetchAvailableSubjects();
  }, [currentUser]);

  useEffect(() => {
    const fetchClassesForSubject = async () => {
      if (!currentUser || !selectedSubject) return;

      try {
        const q = query(
          collection(db, "classes"),
          where("subjects", "array-contains", {
            subject: selectedSubject,
            teacherUid: currentUser.uid,
          })
        );
        const classesSnapshot = await getDocs(q);

        const classesData = classesSnapshot.docs.map((classDoc) => ({
          id: classDoc.id,
          ...classDoc.data(),
        }));

        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes: ", error);
      }
    };

    fetchClassesForSubject();
  }, [currentUser, selectedSubject]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedClass("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject.");
      return;
    }

    try {
      const classDocRef = doc(db, "classes", selectedClass);

      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayUnion({
          name: requirementName,
          description: requirementDescription,
        }),
      });

      setSelectedClass("");
      setSelectedSubject("");
      setRequirementName("");
      setRequirementDescription("");

      alert("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement: ", error);
      alert("Error adding requirement. Please try again later.");
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Add Requirement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-gray-700">
              Select Subject:
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Select a subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-gray-700">
              Select Class:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              disabled={!selectedSubject}
            >
              <option value="">Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.educationLevel} -{" "}
                  {classItem.gradeLevel} -{" "}
                  {classItem.sectionName}
                </option>
              ))}
            </select>
          </div>

          {/* Requirement Name */}
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

          {/* Requirement Description */}
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
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
          >
            Add Requirement
          </button>
        </form>
      </div>
    </Sidebar>
  );
}

export default AddRequirement;