import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

function DisciplinaryRecords() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [witnessOptions, setWitnessOptions] = useState([]);
  const [selectedWitnesses, setSelectedWitnesses] = useState([]);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const [newRecord, setNewRecord] = useState({
    studentId: "",
    studentSection: "",
    studentFullName: "",
    studentGradeLevel: "",
    date: "",
    offense: "",
    description: "",
    location: "",
    witnesses: [],
    evidence: null,
  });

  const [filterOffense, setFilterOffense] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableOffenses, setAvailableOffenses] = useState([]);

  useEffect(() => {
    const fetchStudentsAndTeachers = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: `${doc.data().fullName} - ${doc.data().gradeLevel} - ${
            doc.data().section
          }`,
          fullName: doc.data().fullName,
          section: doc.data().section,
          gradeLevel: doc.data().gradeLevel
        }));
        setStudentOptions(studentsData);

        const teachersSnapshot = await getDocs(collection(db, "teachers"));
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
          fullName: doc.data().name,
          type: "teacher",
        }));

        setWitnessOptions([...teachersData, ...studentsData]);
      } catch (error) {
        console.error("Error fetching students/teachers: ", error);
      }
    };

    fetchStudentsAndTeachers();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const recordsRef = collection(db, "disciplinaryRecords");
        let q = query(recordsRef, orderBy("date", "desc"));

        if (filterOffense !== "all") {
          q = query(q, where("offense", "==", filterOffense));
        }

        const recordsSnapshot = await getDocs(q);
        const recordsData = await Promise.all(
          recordsSnapshot.docs.map(async (doc) => {
            const recordData = doc.data();
            const studentId = recordData.studentId;

            const studentsRef = collection(db, "students");
            const studentQuery = query(
              studentsRef,
              where("uid", "==", studentId)
            );
            const studentSnapshot = await getDocs(studentQuery);
            let fullName = "";
            if (!studentSnapshot.empty) {
              fullName = studentSnapshot.docs[0].data().fullName;
            }

            let evidenceURL = null;
            if (recordData.evidence) {
              const evidenceRef = ref(storage, recordData.evidence);
              evidenceURL = await getDownloadURL(evidenceRef);
            }

            return {
              id: doc.id,
              ...recordData,
              fullName,
              evidenceURL,
            };
          })
        );

        const recordsWithWitnessNames = await Promise.all(
          recordsData.map(async (record) => {
            const witnessNames = await Promise.all(
              record.witnesses.map(async (witness) => {
                const collectionName =
                  witness.type === "teacher" ? "teachers" : "students";
                const witnessDoc = await getDoc(
                  doc(db, collectionName, witness.id)
                );
                return witnessDoc.data().fullName;
              })
            );

            return {
              ...record,
              witnessNames: witnessNames.join(", "),
            };
          })
        );

        setRecords(recordsWithWitnessNames);
        setOriginalRecords(recordsWithWitnessNames);

        const uniqueOffenses = [
          ...new Set(recordsData.map((record) => record.offense)),
        ];
        setAvailableOffenses(uniqueOffenses);
      } catch (error) {
        console.error("Error fetching disciplinary records:", error);
      }
    };

    fetchRecords();
  }, [filterOffense]);

  const handleAddRecord = async (event) => {
    event.preventDefault();
    try {
      let evidenceFileURL = null;
      if (newRecord.evidence) {
        const storageRef = ref(
          storage,
          `disciplinary/${newRecord.studentId}/${newRecord.evidence.name}`
        );
        await uploadBytes(storageRef, newRecord.evidence);
        evidenceFileURL = await getDownloadURL(storageRef);
      }

      const witnesses = selectedWitnesses.map((witness) => ({
        id: witness.value,
        type: witness.type || "student",
        fullName: witness.fullName,
      }));

      await addDoc(collection(db, "disciplinaryRecords"), {
        ...newRecord,
        witnesses: witnesses,
        evidence: evidenceFileURL,
        timestamp: serverTimestamp(),
        createdBy: currentUser.uid,
      });

      setIsAddRecordModalOpen(false);
      setNewRecord({
        studentId: "",
        studentSection: "",
        studentFullName: "",
        date: "",
        offense: "",
        description: "",
        location: "",
        witnesses: [],
        evidence: null,
      });

      alert("Disciplinary record added successfully!");
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
      alert("Error adding record. Please try again later.");
    }
  };

  const handleOffenseFilterChange = (e) => {
    setFilterOffense(e.target.value);
  };

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRecords = originalRecords.filter((record) => {
    const offenseMatch =
      filterOffense === "all" || record.offense === filterOffense;
    const searchMatch =
      record.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    return offenseMatch && searchMatch;
  });

  const handleStudentChange = (selectedOption) => {
    setSelectedStudent(selectedOption);
    setNewRecord({
      ...newRecord,
      studentId: selectedOption ? selectedOption.value : "",
      studentFullName: selectedOption ? selectedOption.fullName : "",
      studentSection: selectedOption ? selectedOption.section : "",
      studentGradeLevel: selectedOption ? selectedOption.gradeLevel : ""
    });
  };

  const handleWitnessChange = (selectedOptions) => {
    setSelectedWitnesses(selectedOptions);

    const witnessFullNames = selectedOptions.map((option) => ({
      id: option.value,
      type: option.type || "student",
      fullName: option.fullName,
    }));

    setNewRecord({
      ...newRecord,
      witnesses: witnessFullNames,
    });
  };

  const handleExpandRow = (recordId) => {
    setExpandedRecordId((prevId) => (prevId === recordId ? null : recordId));
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Disciplinary Records</h2>

        <button
          onClick={() => setIsAddRecordModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Add Record
        </button>

        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="filterOffense" className="block text-gray-700 mb-1">
              Filter by Offense:
            </label>
            <select
              id="filterOffense"
              value={filterOffense}
              onChange={handleOffenseFilterChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">All Offenses</option>
              {availableOffenses.map((offense) => (
                <option key={offense} value={offense}>
                  {offense}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="searchQuery" className="block text-gray-700 mb-1">
              Search by Name or ID:
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        </div>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Student ID</th>
              <th className="py-2 border-b border-gray-200">Name</th>
              <th className="py-2 border-b border-gray-200">Section</th>
              <th className="py-2 border-b border-gray-200">Grade Level</th>
              <th className="py-2 border-b border-gray-200">Date</th>
              <th className="py-2 border-b border-gray-200">Offense</th>
              <th className="py-2 border-b border-gray-200"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <React.Fragment key={record.id}>
                <tr
                  key={record.id}
                  onClick={() => handleExpandRow(record.id)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td className="border px-4 py-2">{record.studentId}</td>
                  <td className="border px-4 py-2">{record.studentFullName}</td>
                  <td className="border px-4 py-2">{record.studentSection}</td>
                  <td className="border px-4 py-2">{record.studentGradeLevel}</td>
                  <td className="border px-4 py-2">
                    {record.date instanceof Date
                      ? moment(record.date).format("YYYY-MM-DD")
                      : moment(new Date(record.date)).format("YYYY-MM-DD")}
                  </td>
                  <td className="border px-4 py-2">{record.offense}</td>
                  <td className="border px-4 py-2 text-center">
                    <FontAwesomeIcon
                      icon={
                        expandedRecordId === record.id ? faAngleUp : faAngleDown
                      }
                    />
                  </td>
                </tr>

                {expandedRecordId === record.id && (
                  <tr className="bg-gray-100">
                    <td colSpan={7} className="border px-4 py-2">
                      <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-bold">
                          Description:
                        </label>
                        <p>{record.description}</p>
                      </div>
                      <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-bold">
                          Location:
                        </label>
                        <p>{record.location || "N/A"}</p>
                      </div>
                      <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-bold">
                          Witnesses:
                        </label>
                        <p>{record.witnessNames}</p>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold">
                          Evidence:
                        </label>
                        {record.evidenceURL ? (
                          <a
                            href={record.evidenceURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View Evidence
                          </a>
                        ) : (
                          "No Evidence"
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <Modal
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Add Disciplinary Record
            </h3>
            <form className="space-y-4" onSubmit={handleAddRecord}>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Student Name:
                </label>
                <Select
                  value={selectedStudent}
                  onChange={handleStudentChange}
                  options={studentOptions}
                  className="basic-single"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Date of Incident:
                </label>
                <input
                  type="date"
                  id="date"
                  value={newRecord.date}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, date: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="offense"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Nature of Offense:
                </label>
                <select
                  id="offense"
                  value={newRecord.offense}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, offense: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Offense</option>
                  <option value="Tardiness">Tardiness</option>
                  <option value="Dress Code Violation">
                    {" "}
                    Dress Code Violation
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  value={newRecord.description}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      description: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Location:
                </label>
                <input
                  type="text"
                  id="location"
                  value={newRecord.location}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, location: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Witnesses:
                </label>
                <Select
                  isMulti
                  value={selectedWitnesses}
                  onChange={handleWitnessChange}
                  options={witnessOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Evidence:
                </label>
                <input
                  type="file"
                  id="evidence"
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, evidence: e.target.files[0] })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddRecordModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default DisciplinaryRecords;
