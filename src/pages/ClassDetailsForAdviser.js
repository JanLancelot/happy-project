import React, { useState, useEffect, useRef } from "react";
import { collection, getDoc, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Legend } from "recharts";
import ReactToPrint from "react-to-print";

function ClassDetailsForAdviser() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const componentRef = useRef(null);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;
  
      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDoc(classDocRef);
  
        if (classDocSnapshot.exists()) { 
          const data = classDocSnapshot.data();
          setClassData(data);
        }
      } catch (error) {
        console.error("Error fetching class data: ", error);
      }
    };
  
    fetchClassData();
  }, [classId]);

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

        const studentsWithCompletion = studentsSnapshot.docs.map((doc) => {
          const studentData = doc.data();
          const totalRequirements = Object.keys(studentData.clearance).length;
          const completedRequirements = Object.values(
            studentData.clearance
          ).filter((cleared) => cleared).length;
          const completionPercentage = Math.round(
            (completedRequirements / totalRequirements) * 100
          );

          return {
            ...studentData,
            completionPercentage,
          };
        });

        setStudents(studentsWithCompletion);
      } catch (error) {
        console.error("Error fetching students: ", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, [classData]);

  const chartData = [
    {
      name: "Completed",
      value: students.filter((student) => student.completionPercentage === 100)
        .length,
    },
    {
      name: "Incomplete",
      value: students.filter((student) => student.completionPercentage < 100)
        .length,
    },
  ];

  if (!classData) {
    return <div>Loading class details...</div>;
  }

  return (
    <SidebarFaculty>
      <div className="container mx-auto p-4" ref={componentRef}>
        <h2 className="text-2xl font-semibold mb-4">
          Advisory Class Details: {classData.sectionName}
        </h2>

        <div className="mb-4 flex justify-end">
          <ReactToPrint
            trigger={() => (
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Print
              </button>
            )}
            content={() => componentRef.current}
          />
        </div>

        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 border-b border-gray-200">Name</th>
                <th className="py-2 border-b border-gray-200 text-center">
                  Completion (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.uid}>
                  <td className="border px-4 py-2">{student.fullName}</td>
                  <td className="border px-4 py-2 text-center">
                    {student.completionPercentage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">
            Clearance Completion
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
      </div>
    </SidebarFaculty>
  );
}

export default ClassDetailsForAdviser;