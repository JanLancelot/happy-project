import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarOffice from "../components/SidebarOffice"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

function OfficeClearanceManual() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "students");
        const snapshot = await getDocs(studentsRef);

        let studentsData = snapshot.docs.map((doc) => {
          const studentData = doc.data();
          const clearance = studentData.clearance || {};
          const totalRequirements = Object.keys(clearance).length;
          const completedRequirements = Object.values(clearance).filter(
            (cleared) => cleared
          ).length;
          const completionPercentage =
            totalRequirements > 0
              ? Math.round((completedRequirements / totalRequirements) * 100)
              : 0;
          return {
            ...studentData,
            clearance,
            completionPercentage,
          };
        });

        studentsData = studentsData.filter((student) => student.section);

        setStudents(studentsData);
        setOriginalStudents(studentsData);

        const uniqueSections = [
          ...new Set(studentsData.map((student) => student.section)),
        ];
        const uniqueEducationLevels = [
          ...new Set(studentsData.map((student) => student.educationLevel)),
        ];
        setAvailableSections(uniqueSections);
        setAvailableEducationLevels(uniqueEducationLevels);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);
        const userData = userDoc.docs[0].data();
        const userRole = userData.role;

        switch (userRole) {
          case "librarian":
            setOfficeName("Librarian");
            break;
          case "finance":
            setOfficeName("Finance");
            break;
          case "registrarBasicEd":
            setOfficeName("Basic Education Registrar");
            break;
          case "characterRenewalOfficer":
            setOfficeName("Character Renewal Office");
            break;
          case "College Library":
            setOfficeName("College Library");
            break;
          case "Guidance Office":
            setOfficeName("Guidance Office");
            break;
          case "Office of The Dean":
            setOfficeName("Office of The Dean");
            break;
          case "Office of the Finance Director":
            setOfficeName("Office of the Finance Director");
            break;
          case "Office of the Registrar":
            setOfficeName("Office of the Registrar");
            break;
          case "Property Custodian":
            setOfficeName("Property Custodian");
            break;
          case "Student Council":
            setOfficeName("Student Council");
            break;
          default:
            setOfficeName("Unknown Office");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchStudents();
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    let filteredStudents = [...originalStudents];

    if (educationLevelFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.educationLevel === educationLevelFilter
      );
    }

    if (sectionFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.section === sectionFilter
      );
    }

    if (searchQuery) {
      filteredStudents = filteredStudents.filter((student) =>
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [
    educationLevelFilter,
    sectionFilter,
    searchQuery,
    originalStudents,
  ]);

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const handleClearStudent = async (studentId) => {
    try {
      const studentDocRef = doc(db, "students", studentId);
      await updateDoc(studentDocRef, {
        [`clearance.${officeName}`]: true, 
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.uid === studentId
            ? {
                ...student,
                clearance: { ...student.clearance, [officeName]: true },
                completionPercentage: calculateCompletionPercentage(student),
              }
            : student
        )
      );

      alert(`${officeName} clearance marked for the student.`);
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      alert("Error updating clearance. Please try again later.");
    }
  };

  const calculateCompletionPercentage = (student) => {
    const totalRequirements = Object.keys(student.clearance).length;
    const completedRequirements = Object.values(student.clearance).filter(
      (cleared) => cleared
    ).length;
    return Math.round((completedRequirements / totalRequirements) * 100);
  };

  return (
    <SidebarOffice>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Office Clearance Management ({officeName})
        </h2>

        {/* Filtering and Search */}
        <div className="mb-4 flex space-x-4">
          <div>
            <label
              htmlFor="educationLevelFilter"
              className="block text-gray-700 mb-1"
            >
              Filter by Education Level:
            </label>
            <select
              id="educationLevelFilter"
              value={educationLevelFilter}
              onChange={(e) => setEducationLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">All Education Levels</option>
              {availableEducationLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sectionFilter" className="block text-gray-700 mb-1">
              Filter by Section:
            </label>
            <select
              id="sectionFilter"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">All Sections</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-gray-700 mb-1">
              Search by Name:
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        </div>

        {/* Students Table */}
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Student ID</th>
              <th className="py-2 border-b border-gray-200">Name</th>
              <th className="py-2 border-b border-gray-200">Email</th>
              <th className="py-2 border-b border-gray-200">Section</th>
              <th className="py-2 border-b border-gray-200">
                Grade Level
              </th>
              <th className="py-2 border-b border-gray-200">
                Education Level
              </th>
              <th className="py-2 border-b border-gray-200 text-center">
                Completion (%)
              </th>
              <th className="py-2 border-b border-gray-200">Actions</th>
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
                  <td className="border px-4 py-2">{student.studentId}</td>
                  <td className="border px-4 py-2">{student.fullName}</td>
                  <td className="border px-4 py-2">{student.email}</td>
                  <td className="border px-4 py-2">{student.section}</td>
                  <td className="border px-4 py-2">{student.gradeLevel}</td>
                  <td className="border px-4 py-2">
                    {student.educationLevel}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {student.completionPercentage}%
                  </td>
                  {/* "Clear" Button for Office Clearance */}
                  <td className="border px-4 py-2">
                    {!student.clearance[officeName] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearStudent(student.uid);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                  {/* Expand/Collapse Icon */}
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

                {/* Expandable Row */}
                {expandedStudent === student.uid && (
                  <tr className="bg-gray-100">
                    <td colSpan={9} className="border px-4 py-2">
                      {/* Disciplinary Records Table (Nested) */}
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
      </div>
    </SidebarOffice>
  );
}

export default OfficeClearanceManual;
