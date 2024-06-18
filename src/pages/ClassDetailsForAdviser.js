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

        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={openAddRequirementModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Adviser Requirement
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={selectedStudentIds.length === 0}
            onClick={() => handleClearSelectedStudents("Class Adviser")}
          >
            Clear Selected Students
          </button>
        </div>

        <div className="mb-8">
          <PieChart width={400} height={300}>
            <Pie
              data={chartData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
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

        <h3 className="text-xl font-semibold mb-2">Students</h3>
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="py-2 px-4 bg-gray-200">Student Name</th>
              <th className="py-2 px-4 bg-gray-200">Completion</th>
              <th className="py-2 px-4 bg-gray-200">Disciplinary Records</th>
              <th className="py-2 px-4 bg-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <React.Fragment key={student.uid}>
                <tr
                  onClick={() => handleStudentClick(student.uid)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td className="py-2 px-4 border-b">{student.fullName}</td>
                  <td className="py-2 px-4 border-b">
                    {student.completionPercentage}%
                  </td>
                  <td className="py-2 px-4 border-b">
                    {student.disciplinaryRecords.length}
                  </td>
                  <td className="py-2 px-4 border-b flex justify-between">
                    <button
                      onClick={() =>
                        handleClearStudent(student.uid, "Class Adviser")
                      }
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Clear Student
                    </button>
                    <FontAwesomeIcon
                      icon={
                        expandedStudent === student.uid
                          ? faAngleUp
                          : faAngleDown
                      }
                      className="text-gray-500"
                    />
                  </td>
                </tr>
                {expandedStudent === student.uid && (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-2 px-4 border-b bg-gray-50 text-sm"
                    >
                      <div className="mb-2">
                        <strong>Clearance:</strong>
                        <ul>
                          {Object.entries(student.clearance).map(
                            ([subject, cleared]) => (
                              <li key={subject}>
                                {subject}:{" "}
                                {cleared ? (
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
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <strong>Disciplinary Records:</strong>
                        <ul>
                          {student.disciplinaryRecords.length > 0 ? (
                            student.disciplinaryRecords.map((record, index) => (
                              <li key={index}>
                                {moment(record.date.toDate()).format(
                                  "MMMM D, YYYY"
                                )}
                                : {record.description}
                              </li>
                            ))
                          ) : (
                            <li>No disciplinary records</li>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isRequirementModalOpen}
        onClose={closeAddRequirementModal}
      >
        <h2 className="text-xl font-semibold mb-4">Add Adviser Requirement</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddRequirement();
          }}
        >
          <div className="mb-4">
            <label className="block mb-1">Requirement Name</label>
            <input
              type="text"
              value={newRequirementName}
              onChange={(e) => setNewRequirementName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Requirement Description</label>
            <textarea
              value={newRequirementDescription}
              onChange={(e) => setNewRequirementDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeAddRequirementModal}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Requirement
            </button>
          </div>
        </form>
      </Modal>
    </SidebarFaculty>
  );
}

export default ClassDetailsForAdviser;
