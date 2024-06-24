import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";

function Classes() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter((cls) => {
    const gradeLevel = cls.gradeLevel ? cls.gradeLevel.toLowerCase() : "";
    const sectionName = cls.sectionName ? cls.sectionName.toLowerCase() : "";
    const adviser = cls.adviser ? cls.adviser.toLowerCase() : "";
    const educationLevel = cls.educationLevel ? cls.educationLevel.toLowerCase() : "";

    return (
      gradeLevel.includes(searchTerm.toLowerCase()) ||
      sectionName.includes(searchTerm.toLowerCase()) ||
      adviser.includes(searchTerm.toLowerCase()) ||
      educationLevel.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Classes</h2>
        <Link
          to="/create-class"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Class
        </Link>
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by grade level, section name, adviser, or education level"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Grade Level</th>
              <th className="py-2">Section Name</th>
              <th className="py-2">Adviser</th>
              <th className="py-2">Education Level</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map((cls) => (
              <tr key={cls.id}>
                <td className="border px-4 py-2">{cls.gradeLevel}</td>
                <td className="border px-4 py-2">{cls.sectionName}</td>
                <td className="border px-4 py-2">
                  {cls.adviser ? cls.adviser : "N/A"} 
                </td>
                <td className="border px-4 py-2">{cls.educationLevel}</td>
                <td className="border px-4 py-2">
                  <Link to={`/update-class/${cls.id}`}>
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Update
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
}

export default Classes;