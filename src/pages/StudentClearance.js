import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, storage } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import SidebarStudent from "../components/SidebarStudent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);

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
    const fetchClassData = async () => {
      if (!studentData || !studentData.section) return;

      try {
        const classesRef = collection(db, 'classes');
        const classQuery = query(
          classesRef,
          where('sectionName', '==', studentData.section)
        );
        const classSnapshot = await getDocs(classQuery);

        if (!classSnapshot.empty) {
          setClassData(classSnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
      }
    };

    fetchClassData();
  }, [studentData]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRequestClearance = async () => {
    if (!studentData || !selectedSubject || !classData) return;

    setIsUploading(true);

    try {
      const teacherSubject = classData.subjects.find(
        (sub) => sub.subject === selectedSubject
      );
      const teacherUid = teacherSubject ? teacherSubject.teacherUid : null; 

      let fileURL = null;
      if (file) {
        const storageRef = ref(storage, `clearance_requests/${currentUser.uid}/${selectedSubject}/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      const clearanceRequestsRef = collection(db, 'clearanceRequests');
      await addDoc(clearanceRequestsRef, {
        studentId: currentUser.uid,
        studentName: studentData.fullName,
        classId: studentData.classId,
        subject: selectedSubject,
        teacherUid: teacherUid, 
        timestamp: serverTimestamp(),
        fileURL: fileURL,
        status: 'pending',
      });

      alert('Clearance requested successfully!');
      setSelectedSubject(null);
      setFile(null); 
    } catch (error) {
      console.error('Error requesting clearance:', error);
      alert('Error requesting clearance. Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Student Clearance</h2>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Subject</th>
              <th className="py-2 border-b border-gray-200 text-center">Cleared</th>
              <th className="py-2 border-b border-gray-200">Details</th>
            </tr>
          </thead>
          <tbody>
            {studentData?.clearance &&
              Object.entries(studentData.clearance).map(([subject, isCleared]) => (
                <React.Fragment key={subject}>
                  <tr>
                    <td
                      className="border px-4 py-2 cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {subject}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {isCleared ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                      ) : (
                        <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                      )}
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

                  {/* Expandable Section for Requirements & Request */}
                  {selectedSubject === subject && classData?.requirements?.[subject] && (
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="border px-4 py-2">
                        {/* Requirements List */}
                        <ul className="list-disc list-inside">
                          {(classData.requirements[subject] || []).map((requirement, index) => (
                            <li key={index}>
                              <strong>{requirement.name}:</strong> {requirement.description}
                            </li>
                          ))}
                        </ul>

                        {/* Request Clearance Section (if requirements exist) */}
                        {classData.requirements[subject]?.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Optional: Submit Files (e.g., proof of payment, documents)
                            </label>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                            />
                            <button
                              onClick={handleRequestClearance}
                              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                              disabled={isUploading}
                            >
                              {isUploading ? 'Requesting...' : 'Request Clearance'}
                            </button>
                          </div>
                        )}
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