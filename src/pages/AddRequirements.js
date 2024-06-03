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
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Sidebar";

function AddRequirement() {
  const [user, setUser] = useState(null);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [requirementName, setRequirementName] = useState("");
  const [newRequirements, setNewRequirements] = useState([
    { name: "" },
  ]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!user) return;

      const q = query(
        collection(db, "classes"),
        where("subjects", "array-contains-any", [
          { teacherUid: user.uid },
        ])
      );

      console.log("Query result", q);

      const classesSnapshot = await getDocs(q);
      console.log("Classes Snapshot", classesSnapshot);
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeacherClasses(classesData);
    };

    fetchTeacherClasses();
  }, [user]);

  const handleAddRequirement = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject!");
      return;
    }

    if (newRequirements.some((req) => req.name.trim() === "")) {
      alert("Please fill in all requirement names!");
      return;
    }

    try {
      const teacherDocRef = doc(db, "teachers", user.uid);

      const teacherDoc = await getDocs(teacherDocRef);
      const teacherData = teacherDoc.data();
      const subjectIndex = teacherData.subjects.findIndex(
        (s) => s.subject === selectedSubject
      );

      if (subjectIndex !== -1) {
        await updateDoc(teacherDocRef, {
          [`subjects.${subjectIndex}.requirements`]: arrayUnion(
            ...newRequirements
          ),
        });

        console.log("Requirements added successfully!");
        setNewRequirements([{ name: "" }]);
      } else {
        console.error("Subject not found in teacher's document!");
      }
    } catch (error) {
      console.error("Error adding requirements: ", error);
    }
  };

  const handleRequirementNameChange = (index, value) => {
    const updatedRequirements = [...newRequirements];
    updatedRequirements[index].name = value;
    setNewRequirements(updatedRequirements);
  };

  const addRequirementField = () => {
    setNewRequirements([...newRequirements, { name: "" }]);
  };

  const removeRequirementField = (index) => {
    const updatedRequirements = newRequirements.filter((_, i) => i !== index);
    setNewRequirements(updatedRequirements);
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Add Requirement</h2>

        {/* Class Selection */}
        <div className="mb-4">
          <label htmlFor="classSelect" className="block text-gray-700">
            Select Class:
          </label>
          <select
            id="classSelect"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select a class</option>
            {teacherClasses.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.educationLevel} - {classItem.gradeLevel} -{" "}
                {classItem.sectionName}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        <div className="mb-4">
          <label htmlFor="subjectSelect" className="block text-gray-700">
            Select Subject:
          </label>
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            disabled={!selectedClass}
          >
            <option value="">Select a subject</option>
            {selectedClass &&
              teacherClasses
                .find((c) => c.id === selectedClass)
                ?.subjects.map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
          </select>
        </div>

        {/* Requirement Input */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Requirements:</label>
          {newRequirements.map((requirement, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                placeholder="Requirement Name"
                value={requirement.name}
                onChange={(e) =>
                  handleRequirementNameChange(index, e.target.value)
                }
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mr-2"
              />
              <button
                type="button"
                onClick={() => removeRequirementField(index)}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRequirementField}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-700"
          >
            Add More Requirements
          </button>
        </div>
      </div>
    </Sidebar>
  );
}

export default AddRequirement;
