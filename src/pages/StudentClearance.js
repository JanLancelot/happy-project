import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SidebarStudent from '../components/SidebarStudent';

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [clearanceData, setClearanceData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null); 

  useEffect(() => {
    const fetchClearanceData = async () => {
      if (!currentUser) return;

      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          const studentData = studentDoc.data();

          const section = studentData.section; 

          const classesRef = collection(db, 'classes');
          const classQuery = query(classesRef, where('sectionName', '==', section));
          const classSnapshot = await getDocs(classQuery);

          if (!classSnapshot.empty) {
            const classData = classSnapshot.docs[0].data();
            setClearanceData(classData.requirements || {}); 
          } else {
            console.log("No class found with this ID");
          }
        }
      } catch (error) {
        console.error('Error fetching clearance data:', error);
      }
    };

    fetchClearanceData();
  }, [currentUser]); 

  const handleSubjectClick = (subject) => {
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Student Clearance</h2>

        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Subject</th>
              <th className="py-2">Cleared</th>
              <th className="py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(clearanceData).map(([subject, requirements]) => (
              <React.Fragment key={subject}>
                <tr>
                  <td
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => handleSubjectClick(subject)} 
                  >
                    {subject}
                  </td>
                  <td className="border px-4 py-2">
                    {currentUser.clearance && currentUser.clearance[subject]
                      ? 'Cleared'
                      : 'Not Cleared'}
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
                
                {selectedSubject === subject && ( 
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="border px-4 py-2">
                      <ul className="list-disc list-inside">
                        {(requirements || []).map((req, index) => (
                          <li key={index}>
                            <strong>{req.name}:</strong> {req.description}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarStudent>
  );
};

export default StudentClearance;