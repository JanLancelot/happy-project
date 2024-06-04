import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classRequirements, setClassRequirements] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;

      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          setStudentData(studentDoc.data());
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  useEffect(() => {
    const fetchClassRequirements = async () => {
      if (!studentData || !studentData.classId) return;

      try {
        const classesRef = collection(db, 'classes');
        const classQuery = query(
          classesRef,
          where('sectionName', '==', studentData.section)
        );
        const classSnapshot = await getDocs(classQuery);

        console.log("Class Snapshot", classSnapshot);
        if (!classSnapshot.empty) {
          const classData = classSnapshot.docs[0].data();
          console.log("Class Data", classData.requirements);
          setClassRequirements(classData.requirements || {});
        }
      } catch (error) {
        console.error('Error fetching class requirements:', error);
      }
    };

    fetchClassRequirements();
  }, [studentData]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  console.log("Class Requirements", classRequirements);
  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Student Clearance
        </h2>

        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Subject</th>
              <th className="py-2">Cleared</th>
              <th className="py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {studentData?.clearance &&
              Object.entries(studentData.clearance).map(
                ([subject, isCleared]) => (
                  <React.Fragment key={subject}>
                    <tr>
                      <td
                        className="border px-4 py-2 cursor-pointer"
                        onClick={() => handleSubjectClick(subject)}
                      >
                        {subject}
                      </td>
                      <td className="border px-4 py-2">
                        {isCleared ? 'Cleared' : 'Not Cleared'}
                      </td>
                      <td className="border px-4 py-2">
                        <button
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleSubjectClick(subject)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>

                    {/* Conditionally render requirement details */}
                    {selectedSubject === subject && (
                      <tr className="bg-gray-100">
                        <td colSpan={3} className="border px-4 py-2">
                          <ul className="list-disc list-inside">
                            {(classRequirements[subject] || []).map(
                              (requirement, index) => (
                                <li key={index}>
                                  <strong>{requirement.name}:</strong>{' '}
                                  {requirement.description}
                                </li>
                              )
                            )}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              )}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
};

export default StudentClearance;