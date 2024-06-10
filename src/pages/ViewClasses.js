import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";

function ViewClasses() {
  const { currentUser } = useAuth();
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [advisoryClasses, setAdvisoryClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!currentUser) return;

      try {
        const teachingQuery = query(
          collection(db, "classes"),
          where("subjects", "array-contains-any", [
            { teacherUid: currentUser.uid },
          ])
        );
        const teachingSnapshot = await getDocs(teachingQuery);
        setTeachingClasses(
          teachingSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        const advisoryQuery = query(
          collection(db, "classes"),
          where("adviserUid", "==", currentUser.uid)
        );
        const advisorySnapshot = await getDocs(advisoryQuery);
        setAdvisoryClasses(
          advisorySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, [currentUser]);

  return (
    <Sidebar>
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
                  <tr key={classItem.id}>
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
                  <tr key={classItem.id}>
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
      </div>
    </Sidebar>
  );
}

export default ViewClasses;