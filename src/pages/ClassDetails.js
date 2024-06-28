import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
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
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

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
    setSelectedStudentIds([]); 
  };

  const handleClearanceFilterChange = (e) => {
    setClearanceFilter(e.target.value);
    setSelectedStudentIds([]);
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
  
    const headerCellStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "FFFF00" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  
    const bodyCellStyle = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  
    const headers = ["A1", "B1"];
    headers.forEach((header) => {
      ws[header].s = headerCellStyle;
    });
  
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!ws[cell_ref]) continue;
        ws[cell_ref].s = bodyCellStyle;
      }
    }
  
    const wscols = [
      { wpx: 200 }, 
      { wpx: 100 }, 
    ];
    ws["!cols"] = wscols;
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clearance Status");
    XLSX.writeFile(
      wb,
      `${classData.sectionName}_${selectedSubject}_clearance.xlsx`
    );
  };
  

const handleClearStudent = async (studentId) => {
  if (!selectedSubject) return;

  try {
    const q = query(collection(db, "students"), where("uid", "==", studentId));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          [`clearance.${selectedSubject}`]: true,
        });
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.uid === studentId
            ? {
                ...student,
                clearance: { ...student.clearance, [selectedSubject]: true },
              }
            : student
        )
      );

      alert("Student clearance updated successfully!");
    } else {
      console.error("No student found with the given ID");
      alert("No student found with the given ID");
    }
  } catch (error) {
    console.error("Error updating student clearance: ", error);
    alert("Error updating clearance. Please try again later.");
  }
};

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === getFilteredStudents().length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(
        getFilteredStudents().map((student) => student.uid)
      );
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(
        selectedStudentIds.filter((id) => id !== studentId)
      );
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleClearSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select students to clear.");
      return;
    }

    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }

    try {
      const updatePromises = selectedStudentIds.map(async (studentId) => {
        await handleClearStudent(studentId);
      });
      await Promise.all(updatePromises);

      alert("Selected students cleared successfully!");
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    }
  };

  if (!classData) {
    return <div>Loading class details...</div>; 
  }

  return (
    <Sidebar>
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
                    <th className="py-2 border-b border-gray-200 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudentIds.length ===
                          getFilteredStudents().length
                        }
                        onChange={handleSelectAllStudents}
                      />
                    </th>
                    <th className="py-2 border-b border-gray-200">Student ID</th>
                    <th className="py-2 border-b border-gray-200">Name</th>
                    <th className="py-2 border-b border-gray-200 text-center">
                      Cleared
                    </th>
                    <th className="py-2 border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredStudents().map((student) => (
                    <tr key={student.uid}>
                      <td className="border px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.uid)}
                          onChange={() => handleSelectStudent(student.uid)}
                        />
                      </td>
                      <td className="border px-4 py-2">
                        {student.studentId}
                      </td>
                      <td className="border px-4 py-2">
                        {student.fullName}
                      </td>
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
                      <td className="border px-4 py-2">
                        {!student.clearance[selectedSubject] && (
                          <button
                            onClick={() => handleClearStudent(student.uid)}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Mark Cleared
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4">
              <button
                onClick={handleClearSelectedStudents}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={selectedStudentIds.length === 0}
              >
                Clear Selected Students
              </button>
            </div>
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
    </Sidebar>
  );
}

export default ClassDetails;