import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import SidebarFaculty from "../components/SidebarFaculty";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Legend } from "recharts";
import ReactToPrint from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";

function ClassDetailsForAdviser() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const componentRef = useRef(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [newRequirementName, setNewRequirementName] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] =
    useState("");

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

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const openAddRequirementModal = () => {
    setIsRequirementModalOpen(true);
  };

  const closeAddRequirementModal = () => {
    setIsRequirementModalOpen(false);
    setNewRequirementName("");
    setNewRequirementDescription("");
  };

  const handleAddRequirement = async () => {
    try {
      const classDocRef = doc(db, "classes", classId);
      await updateDoc(classDocRef, {
        [`requirements.Class Adviser`]: arrayUnion({
          name: newRequirementName,
          description: newRequirementDescription,
          teacherUid: currentUser.uid,
        }),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          "Class Adviser": [
            ...(prevData.requirements["Class Adviser"] || []),
            {
              name: newRequirementName,
              description: newRequirementDescription,
              teacherUid: currentUser.uid,
            },
          ],
        },
      }));

      closeAddRequirementModal();
      alert("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement:", error);
      alert("Error adding requirement. Please try again later.");
    }
  };

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

        <div className="mb-4">
          <button
            onClick={openAddRequirementModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Adviser Requirement
          </button>
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
                <th className="py-2 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <React.Fragment key={student.uid}>
                  <tr
                    key={student.uid}
                    onClick={() => handleStudentClick(student.uid)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">{student.fullName}</td>
                    <td className="border px-4 py-2 text-center">
                      {student.completionPercentage}%
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <FontAwesomeIcon
                        icon={
                          expandedStudent === student.uid
                            ? faAngleUp
                            : faAngleDown
                        }
                      />
                    </td>
                  </tr>
                  {expandedStudent === student.uid && (
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="border px-4 py-2">
                        <table className="min-w-full">
                          <thead>
                            <tr>
                              <th className="py-2 border-b border-gray-200">
                                Subject
                              </th>
                              <th className="py-2 border-b border-gray-200 text-center">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(student.clearance)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([subject, isCleared]) => (
                                <tr key={subject}>
                                  <td className="border px-4 py-2">
                                    {subject}
                                  </td>
                                  <td className="border px-4 py-2 text-center">
                                    {isCleared ? (
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Clearance Completion</h3>
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
        {/* Modal for Adding Requirement */}
        <Modal
          isOpen={isRequirementModalOpen}
          onClose={closeAddRequirementModal}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Requirement</h3>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="requirementName"
              >
                Requirement Name:
              </label>
              <input
                type="text"
                id="requirementName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newRequirementName}
                onChange={(e) => setNewRequirementName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="requirementDescription"
              >
                Description:
              </label>
              <textarea
                id="requirementDescription"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newRequirementDescription}
                onChange={(e) => setNewRequirementDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeAddRequirementModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRequirement}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarFaculty>
  );
}

export default ClassDetailsForAdviser;
