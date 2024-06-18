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
      const studentsCollectionRef = collection(db, "students");
      const querySnapshot = await getDocs(
        query(studentsCollectionRef, where("uid", "==", studentId))
      );

      if (!querySnapshot.empty) {
        const studentDocRef = querySnapshot.docs[0].ref;
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
      } else {
        console.log("No student document found with the provided studentId");
      }
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

        <div className="mb-4">
          <button
            onClick={openAddRequirementModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Adviser Requirement
          </button>
        </div>

        <Modal
          isOpen={isRequirementModalOpen}
          onClose={closeAddRequirementModal}
        >
          <h3 className="text-lg font-semibold mb-4">Add New Requirement</h3>
          <div>
            <label className="block mb-2">
              Requirement Name:
              <input
                type="text"
                value={newRequirementName}
                onChange={(e) => setNewRequirementName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </label>
            <label className="block mb-2">
              Description:
              <textarea
                value={newRequirementDescription}
                onChange={(e) => setNewRequirementDescription(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              ></textarea>
            </label>
            <button
              onClick={handleAddRequirement}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Requirement
            </button>
          </div>
        </Modal>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Student Name</th>
                <th className="py-2 px-4 border-b">
                  Class Adviser Requirement
                </th>
                <th className="py-2 px-4 border-b">Completion Status</th>
                <th className="py-2 px-4 border-b">Disciplinary Records</th>
                <th className="py-2 px-4 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <React.Fragment key={student.uid}>
                  <tr>
                    <td className="py-2 px-4 border-b">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center">
                        {student.clearance["Class Adviser"] ? (
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
                        <span className="ml-2">
                          {student.clearance["Class Adviser"]
                            ? "Cleared"
                            : "Not Cleared"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {student.completionPercentage}%
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {student.disciplinaryRecords.length > 0 ? (
                        <span>{student.disciplinaryRecords.length}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {student.clearance["Class Adviser"] ? null : (
                        <button
                          onClick={() =>
                            handleClearStudent(student.uid, "Class Adviser")
                          }
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Clear
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleStudentClick(student.uid)}
                        className="text-blue-500 hover:underline"
                      >
                        {expandedStudent === student.uid ? (
                          <FontAwesomeIcon icon={faAngleUp} />
                        ) : (
                          <FontAwesomeIcon icon={faAngleDown} />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedStudent === student.uid && (
                    <tr>
                      <td colSpan="6" className="py-2 px-4 border-b bg-gray-50">
                        <h4 className="font-semibold mb-2">Requirements:</h4>
                        <ul className="list-disc list-inside">
                          {Object.entries(student.clearance).map(
                            ([requirement, status]) => (
                              <li key={requirement}>
                                {requirement}:{" "}
                                {status ? (
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
                        <h4 className="font-semibold mt-4 mb-2">
                          Disciplinary Records:
                        </h4>
                        {student.disciplinaryRecords.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {student.disciplinaryRecords.map(
                              (record, index) => (
                                <li key={index}>
                                  {record.description} -{" "}
                                  {moment(record.date).format("MMMM D, YYYY")}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p>No disciplinary records.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center mb-8">
          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              <Cell key={`cell-0`} fill="#4caf50" />
              <Cell key={`cell-1`} fill="#f44336" />
            </Pie>
            <Legend />
          </PieChart>
        </div>
      </div>
    </SidebarFaculty>
  );
}

export default ClassDetailsForAdviser;
