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
import { useAuth } from "../components/AuthContext";
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
import moment from "moment";

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
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

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

        const studentsWithCompletion = await Promise.all(
          studentsSnapshot.docs.map(async (doc) => {
            const studentData = doc.data();

            const disciplinaryRecordsRef = collection(
              db,
              "disciplinaryRecords"
            );
            console.log("StudentData uid dp: ", studentData.id);
            const disciplinaryQuery = query(
              disciplinaryRecordsRef,
              where("studentId", "==", studentData.uid)
            );
            const disciplinarySnapshot = await getDocs(disciplinaryQuery);
            const disciplinaryRecords = disciplinarySnapshot.docs.map(
              (recordDoc) => recordDoc.data()
            );

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
              disciplinaryRecords,
            };
          })
        );

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

  const handleClearStudent = async (studentId, subject) => {
    try {
      const studentDocRef = doc(db, "students", studentId);
      await updateDoc(studentDocRef, {
        [`clearance.${subject}`]: true,
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.uid === studentId
            ? {
                ...student,
                clearance: { ...student.clearance, [subject]: true },
                completionPercentage: calculateCompletionPercentage(
                  student,
                  subject,
                  true
                ), 
              }
            : student
        )
      );

      alert("Student clearance updated successfully!");
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      alert("Error updating clearance. Please try again later.");
    }
  };

  const handleSelectAllStudents = (subject) => {
    const filteredStudents = students.filter(
      (student) => !student.clearance[subject]
    );
    const allSelected = selectedStudentIds.length === filteredStudents.length;

    if (allSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((student) => student.uid));
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

  const handleClearSelectedStudents = async (subject) => {
    if (selectedStudentIds.length === 0) {
      alert("Please select students to clear.");
      return;
    }

    try {
      const updatePromises = selectedStudentIds.map(async (studentId) => {
        await handleClearStudent(studentId, subject);
      });
      await Promise.all(updatePromises);

      alert("Selected students cleared successfully!");
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    }
  };

  const calculateCompletionPercentage = (student, subject, newStatus) => {
    const totalRequirements = Object.keys(student.clearance).length;
    let completedRequirements = Object.values(student.clearance).filter(
      (cleared) => cleared
    ).length;

    if (newStatus === true) {
      completedRequirements++;
    } else if (newStatus === false && student.clearance[subject]) {
      completedRequirements--;
    }

    return Math.round((completedRequirements / totalRequirements) * 100);
  };

  if (!classData) {
    return <div>Loading class details...</div>;
  }

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
                <th className="py-2 border-b border-gray-200 w-8">
                  <input
                    type="checkbox"
                    onChange={() => handleSelectAllStudents("Class Adviser")}
                  />
                </th>
                <th className="py-2 border-b border-gray-200">Name</th>
                <th className="py-2 border-b border-gray-200 text-center">
                  Disciplinary Records
                </th>
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
                    <td className="border px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.uid)}
                        onChange={() => handleSelectStudent(student.uid)}
                      />
                    </td>
                    <td className="border px-4 py-2">{student.fullName}</td>
                    <td className="border px-4 py-2 text-center">
                      {student.disciplinaryRecords.length}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {student.completionPercentage}%
                    </td>{" "}
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
                      <td colSpan={5} className="border px-4 py-2">
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Clearances:</h4>
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="py-2 border-b border-gray-200">
                                  Subject
                                </th>
                                <th className="py-2 border-b border-gray-200 text-center">
                                  Status
                                </th>
                                <th className="py-2 border-b border-gray-200">
                                  Action
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
                                    <td className="border px-4 py-2">
                                      {!isCleared && (
                                        <button
                                          onClick={() =>
                                            handleClearStudent(
                                              student.uid,
                                              subject
                                            )
                                          }
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
                          <div className="mt-4">
                            <button
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                              disabled={selectedStudentIds.length === 0}
                              onClick={() =>
                                handleClearSelectedStudents("Class Adviser")
                              }
                            >
                              Clear Selected Students
                            </button>
                          </div>
                        </div>

                        {student.disciplinaryRecords.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Disciplinary Records:
                            </h4>
                            <table className="min-w-full">
                              <thead>
                                <tr>
                                  <th className="py-2 border-b border-gray-200">
                                    Date
                                  </th>
                                  <th className="py-2 border-b border-gray-200">
                                    Violations
                                  </th>
                                  <th className="py-2 border-b border-gray-200">
                                    Sanctions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {student.disciplinaryRecords.map((record) => (
                                  <tr key={record.timestamp}>
                                    <td className="border px-4 py-2">
                                      {moment(record.timestamp.toDate()).format(
                                        "YYYY-MM-DD"
                                      )}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {record.violations.join(", ")}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {record.sanctions.join(", ")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
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
