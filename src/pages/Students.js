import React, { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function Students() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      let q = collection(db, "students");
      if (searchQuery) {
        q = query(
          q,
          where("fullName", ">=", searchQuery),
          where("fullName", "<=", searchQuery + "uf8ff")
        );
      }
      if (selectedLevel) {
        q = query(q, where("educationLevel", "==", selectedLevel));
      }
      const studentsSnapshot = await getDocs(q);
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);
    };

    fetchStudents();
  }, [searchQuery, selectedLevel]);

  return (
    <Sidebar>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Students</h2>
        <Link
          to="/create-student"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Student
        </Link>
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div className="my-4">
          <label htmlFor="level" className="block text-gray-700">
            Filter by Education Level
          </label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Levels</option>
            <option value="elementary">Elementary</option>
            <option value="juniorHighschool">Junior High School</option>
            <option value="seniorHighschool">Senior High School</option>
            <option value="college">College</option>
          </select>
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Education Level</th>
              <th className="py-2">Grade Level</th>
              <th className="py-2">Section</th> 
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="border px-4 py-2">{student.fullName}</td>
                <td className="border px-4 py-2">{student.email}</td>
                <td className="border px-4 py-2">{student.educationLevel}</td>
                <td className="border px-4 py-2">{student.gradeLevel}</td>
                <td className="border px-4 py-2">
                  {student.section ? student.section : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
}

export default Students;
