import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

function ViewClasses() {
  const { currentUser } = useAuth();
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClearedStudents, setShowClearedStudents] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (currentUser) {
        try {
          // Fetch ALL classes
          const allClassesSnapshot = await getDocs(
            collection(db, "classes")
          );

          // Filter teaching classes
          const teachingClasses = allClassesSnapshot.docs.filter(
            (classDoc) => {
              const subjects = classDoc.data().subjects || [];
              return subjects.some(
                (subject) => subject.teacherUid === currentUser.uid
              );
            }
          );
          setTeachingClasses(
            teachingClasses.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };

    fetchClasses();
  }, [currentUser]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject) {
        setStudents([]);
        return;
      }

      try {
        const studentsRef = collection(db, "students");
        const q = query(
          studentsRef,
          where("section", "==", selectedClass.sectionName),
          where(`clearance.${selectedSubject}`, "==", !showClearedStudents)
        );
        const studentsSnapshot = await getDocs(q);
        setStudents(studentsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching students: ", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, showClearedStudents]);

  const handleClassChange = (classId) => {
    const selected = teachingClasses.find((c) => c.id === classId);
    setSelectedClass(selected);
    setSelectedSubject(
      selected?.subjects.find((s) => s.teacherUid === currentUser.uid)
        ?.subject || null
    );
  };

  const handleSubjectChange = (subjectName) => {
    setSelectedSubject(subjectName);
  };

  const handleToggleCleared = () => {
    setShowClearedStudents(!showClearedStudents);
  };

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          View Classes and Students
        </h2>

        {/* Class Selection */}
        <div className="mb-4">
          <label htmlFor="classSelect" className="block text-gray-700">
            Select Class:
          </label>
          <select
            id="classSelect"
            value={selectedClass?.id || ""}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select a class</option>
            {teachingClasses.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.educationLevel} - {classItem.gradeLevel} -{" "}
                {classItem.sectionName}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection (Dynamic) */}
        <div className="mb-4">
          <label htmlFor="subjectSelect" className="block text-gray-700">
            Select Subject:
          </label>
          <select
            id="subjectSelect"
            value={selectedSubject || ""}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            disabled={!selectedClass}
          >
            <option value="">Select a subject</option>
            {selectedClass &&
              selectedClass.subjects
                .filter((subject) => subject.teacherUid === currentUser.uid)
                .map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
          </select>
        </div>

        {/* Toggle Cleared/Uncleared Students */}
        <div className="mb-4 flex items-center">
          <label htmlFor="clearedToggle" className="mr-2">
            Show Cleared Students:
          </label>
          <input
            type="checkbox"
            id="clearedToggle"
            checked={showClearedStudents}
            onChange={handleToggleCleared}
          />
        </div>

        {/* Students Table */}
        {selectedClass && selectedSubject && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Students in {selectedClass.sectionName} - {selectedSubject}
            </h3>
            {students.length === 0 ? (
              <p>No students found.</p>
            ) : (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 border-b border-gray-200">
                      Name
                    </th>
                    <th className="py-2 border-b border-gray-200 text-center">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.uid}>
                      <td className="border px-4 py-2">
                        {student.fullName}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {student.clearance[selectedSubject] ? (
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-green-500"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faTimesCircle}
                            className="text-red-500"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </SidebarFaculty>
  );
}

export default ViewClasses;