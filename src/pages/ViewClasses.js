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
  const [advisoryClasses, setAdvisoryClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); 
  const [students, setStudents] = useState([]); 

  useEffect(() => {
    const fetchClasses = async () => {
      if (currentUser) {
        try {
          const allClassesSnapshot = await getDocs(collection(db, "classes"));

          const teachingClasses = allClassesSnapshot.docs.filter((classDoc) => {
            const subjects = classDoc.data().subjects || [];
            return subjects.some(
              (subject) => subject.teacherUid === currentUser.uid
            );
          });
          setTeachingClasses(
            teachingClasses.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );

          const advisoryClasses = allClassesSnapshot.docs.filter(
            (classDoc) => {
              return classDoc.data().adviserUid === currentUser.uid;
            }
          );
          setAdvisoryClasses(
            advisoryClasses.map((doc) => ({
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
      if (!selectedClass) {
        setStudents([]); 
        return;
      }

      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("sectionName", "==", selectedClass));
        const querySnapshot = await getDocs(q);

        const studentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  const handleClassSelect = (sectionName) => {
    setSelectedClass(sectionName);
  };

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Your Classes</h2>

        {/* Teaching Classes */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Teaching</h3>
          {teachingClasses.length === 0 ? (
            <p>You are not currently assigned to any teaching classes.</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">
                    Education Level
                  </th>
                  <th className="py-2 border-b border-gray-200">
                    Grade Level
                  </th>
                  <th className="py-2 border-b border-gray-200">
                    Section Name
                  </th>
                  <th className="py-2 border-b border-gray-200">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {teachingClasses.map((classItem) => (
                  <tr
                    key={classItem.id}
                    onClick={() => handleClassSelect(classItem.sectionName)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">
                      {classItem.educationLevel}
                    </td>
                    <td className="border px-4 py-2">
                      {classItem.gradeLevel}
                    </td>
                    <td className="border px-4 py-2">
                      {classItem.sectionName}
                    </td>
                    <td className="border px-4 py-2">
                      {classItem.subjects
                        .filter(
                          (subject) => subject.teacherUid === currentUser.uid
                        )
                        .map((subject) => subject.subject)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Advisory Classes */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Advisory</h3>
          {advisoryClasses.length === 0 ? (
            <p>You are not currently an adviser for any classes.</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">
                    Education Level
                  </th>
                  <th className="py-2 border-b border-gray-200">
                    Grade Level
                  </th>
                  <th className="py-2 border-b border-gray-200">
                    Section Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {advisoryClasses.map((classItem) => (
                  <tr
                    key={classItem.id}
                    onClick={() => handleClassSelect(classItem.sectionName)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">
                      {classItem.educationLevel}
                    </td>
                    <td className="border px-4 py-2">
                      {classItem.gradeLevel}
                    </td>
                    <td className="border px-4 py-2">
                      {classItem.sectionName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Student List for Selected Class */}
        {selectedClass && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">
              Students in{" "}
              {
                teachingClasses.find((c) => c.id === selectedClass)
                  ?.sectionName ||
                advisoryClasses.find((c) => c.id === selectedClass)
                  ?.sectionName
              }
            </h3>
            {students.length === 0 ? (
              <p>No students found in this class.</p>
            ) : (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 border-b border-gray-200">Name</th>
                    <th className="py-2 border-b border-gray-200">
                      Clearance Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="border px-4 py-2">
                        {student.fullName}
                      </td>
                      <td className="border px-4 py-2">
                        {Object.values(student.clearance).every(
                          (value) => value
                        ) ? (
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