import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { Link } from "react-router-dom";

function ViewClasses() {
  const { currentUser } = useAuth();
  const [teachingClasses, setTeachingClasses] = useState([]);

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
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };

    fetchClasses();
  }, [currentUser]);

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Your Classes</h2>

        {teachingClasses.length === 0 ? (
          <p>You are not currently assigned to any teaching classes.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 border-b border-gray-200">Education Level</th>
                <th className="py-2 border-b border-gray-200">Grade Level</th>
                <th className="py-2 border-b border-gray-200">Section Name</th>
              </tr>
            </thead>
            <tbody>
              {teachingClasses.map((classItem) => (
                <tr key={classItem.id}>
                  <td className="border px-4 py-2">{classItem.educationLevel}</td>
                  <td className="border px-4 py-2">{classItem.gradeLevel}</td>
                  <td className="border px-4 py-2">
                    <Link to={`/class-details/${classItem.id}`}>
                      {classItem.sectionName}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SidebarFaculty>
  );
}

export default ViewClasses;