import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Legend } from "recharts";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";

function ClassDetails() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearanceFilter, setClearanceFilter] = useState("all");
  const componentRef = useRef(null);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || !currentUser) return;

      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDoc(classDocRef);

        if (classDocSnapshot.exists()) {
          const data = classDocSnapshot.data();
          setClassData(data);

          const firstSubject = data.subjects.find(
            (s) => s.teacherUid === currentUser.uid
          )?.subject;
          setSelectedSubject(firstSubject);
        }
      } catch (error) {
        console.error("Error fetching class data: ", error);
      }
    };

    fetchClassData();
  }, [classId, currentUser]);

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

  const getFilteredStudents = () => {
    return students.filter((student) => {
      const nameMatch = student.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (clearanceFilter === "all") {
        return nameMatch;
      } else {
        const isCleared = student.clearance[selectedSubject];
        return clearanceFilter === "cleared"
          ? isCleared && nameMatch
          : !isCleared && nameMatch;
      }
    });
  };

  const handleSubjectChange = (subjectName) => {
    setSelectedSubject(subjectName);
  };

  const handleClearanceFilterChange = (e) => {
    setClearanceFilter(e.target.value);
  };

  const chartData = [
    {
      name: "Cleared",
      value: students.filter((student) => student.clearance[selectedSubject])
        .length,
    },
    {
      name: "Uncleared",
      value: students.filter((student) => !student.clearance[selectedSubject])
        .length,
    },
  ];

  const handleExportExcel = () => {
    const filteredData = getFilteredStudents().map((student) => ({
      Name: student.fullName,
      Cleared: student.clearance[selectedSubject] ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clearance Status");
    XLSX.writeFile(
      wb,
      `${classData.sectionName}_${selectedSubject}_clearance.xlsx`
    );
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

        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="search" className="block text-gray-700">
              Search:
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div>
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
        </div>

        {selectedSubject && (
          <div ref={componentRef}>
            <h3 className="text-xl font-semibold mb-2">
              Students - {selectedSubject}
            </h3>

            <div className="mb-4 flex justify-end space-x-2">
              <ReactToPrint
                trigger={() => (
                  <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Print Table
                  </button>
                )}
                content={() => componentRef.current}
              />
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Export to Excel
              </button>
            </div>

            {getFilteredStudents().length === 0 ? (
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
                  {getFilteredStudents().map((student) => (
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

        {selectedSubject && students.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">
              Clearance Progress - {selectedSubject}
            </h3>
            <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#4CAF50" : "#F44336"}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </div>
        )}
      </div>
    </SidebarFaculty>
  );
}

export default ClassDetails;
