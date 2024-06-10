import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";

function ClassDetails() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [clearanceFilter, setClearanceFilter] = useState("all");

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;

      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDocs(classDocRef);

        if (!classDocSnapshot.empty) {
          const data = classDocSnapshot.docs[0].data();
          setClassData(data);
          setSelectedSubject(
            data.subjects.find((s) => s.teacherUid === currentUser.uid)
              ?.subject || null
          );
        }
      } catch (error) {
        console.error("Error fetching class data: ", error);
      }
    };

    fetchClassData();
  }, [classId, currentUser.uid]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classData) {
        setStudents([]);
        return;
      }

      try {
        const studentsRef = collection(db, "students");
        const q = query(
          studentsRef,
          where("section", "==", classData.sectionName)
        );
        const studentsSnapshot = await getDocs(q);
        setStudents(studentsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching students: ", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, [classData]);

  useEffect(() => {
    if (clearanceFilter === "all") {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(
        students.filter((student) => {
          const isCleared = student.clearance[selectedSubject];
          return clearanceFilter === "cleared" ? isCleared : !isCleared;
        })
      );
    }
  }, [clearanceFilter, students, selectedSubject]);

  const handleSubjectChange = (subjectName) => {
    setSelectedSubject(subjectName);
  };

  const handleClearanceFilterChange = (e) => {
    setClearanceFilter(e.target.value);
  };

  if (!classData) {
    return <div>Loading class details...</div>;
  }

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Class Details: {classData.sectionName}
        </h2>

        <div className="mb-4">
          <label htmlFor="subjectSelect" className="block text-gray-700">
            Select Subject:
          </label>
          <select
            id="subjectSelect"
            value={selectedSubject || ""}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            disabled={!classData}
          >
            <option value="">Select a subject</option>
            {classData &&
              classData.subjects
                .filter((subject) => subject.teacherUid === currentUser.uid)
                .map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="clearanceFilter" className="block text-gray-700">
            Filter by Clearance:
          </label>
          <select
            id="clearanceFilter"
            value={clearanceFilter}
            onChange={handleClearanceFilterChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="all">All Students</option>
            <option value="cleared">Cleared</option>
            <option value="uncleared">Uncleared</option>
          </select>
        </div>

        {selectedSubject && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Students - {selectedSubject}
            </h3>
            {filteredStudents.length === 0 ? (
              <p>No students found.</p>
            ) : (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 border-b border-gray-200">Name</th>
                    <th className="py-2 border-b border-gray-200 text-center">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.uid}>
                      <td className="border px-4 py-2">{student.fullName}</td>
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

export default ClassDetails;