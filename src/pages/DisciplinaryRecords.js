import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
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
          label: `${doc.data().fullName} - ${doc.data().gradeLevel} - ${doc.data().section}`,
          fullName: doc.data().fullName,
          section: doc.data().section,
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
            const studentQuery = query(studentsRef, where("uid", "==", studentId));
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

            // Handle date conversion
            let date = recordData.date;
            if (date && date.toDate) {
              date = date.toDate();
            } else {
              date = new Date(date);
            }

            return {
              id: doc.id,
              ...recordData,
              fullName,
              evidenceURL,
              date,
            };
          })
        );

        const recordsWithWitnessNames = await Promise.all(
          recordsData.map(async (record) => {
            const witnessNames = await Promise.all(
              record.witnesses.map(async (witness) => {
                const collectionName = witness.type === "teacher" ? "teachers" : "students";
                const witnessDoc = await getDoc(doc(db, collectionName, witness.id));
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

        const uniqueOffenses = [...new Set(recordsData.map((record) => record.offense))];
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
        const storageRef = ref(storage, `disciplinary/${newRecord.studentId}/${newRecord.evidence.name}`);
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
    const offenseMatch = filterOffense === "all" || record.offense === filterOffense;
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
            <label htmlFor="filterOffense" className="block text-gray-700 mb-2">
              Filter by Offense:
            </label>
            <select
              id="filterOffense"
              value={filterOffense}
              onChange={handleOffenseFilterChange}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All</option>
              {availableOffenses.map((offense, index) => (
                <option key={index} value={offense}>
                  {offense}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-gray-700 mb-2">
              Search:
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              placeholder="Search by student name or ID"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b">Student Name</th>
              <th className="px-6 py-3 border-b">Date</th>
              <th className="px-6 py-3 border-b">Offense</th>
              <th className="px-6 py-3 border-b">Location</th>
              <th className="px-6 py-3 border-b">Description</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <React.Fragment key={record.id}>
                <tr className="hover:bg-gray-100">
                  <td className="px-6 py-4 border-b">{record.fullName}</td>
                  <td className="px-6 py-4 border-b">{moment(record.date).format("MMMM Do YYYY")}</td>
                  <td className="px-6 py-4 border-b">{record.offense}</td>
                  <td className="px-6 py-4 border-b">{record.location}</td>
                  <td className="px-6 py-4 border-b">{record.description}</td>
                  <td className="px-6 py-4 border-b">
                    <button
                      onClick={() => handleExpandRow(record.id)}
                      className="text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={expandedRecordId === record.id ? faAngleUp : faAngleDown} />
                    </button>
                  </td>
                </tr>
                {expandedRecordId === record.id && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 border-b">
                      <div>
                        <strong>Witnesses:</strong> {record.witnessNames}
                      </div>
                      {record.evidenceURL && (
                        <div className="mt-2">
                          <strong>Evidence:</strong>{" "}
                          <a
                            href={record.evidenceURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View Evidence
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {isAddRecordModalOpen && (
          <Modal onClose={() => setIsAddRecordModalOpen(false)}>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-4">Add Disciplinary Record</h3>
              <form onSubmit={handleAddRecord}>
                <div className="mb-4">
                  <label htmlFor="student" className="block text-gray-700 mb-2">
                    Student:
                  </label>
                  <Select
                    id="student"
                    options={studentOptions}
                    value={selectedStudent}
                    onChange={handleStudentChange}
                    className="w-full"
                    isClearable
                    placeholder="Select student..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="date" className="block text-gray-700 mb-2">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="offense" className="block text-gray-700 mb-2">
                    Offense:
                  </label>
                  <input
                    type="text"
                    id="offense"
                    value={newRecord.offense}
                    onChange={(e) => setNewRecord({ ...newRecord, offense: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-gray-700 mb-2">
                    Description:
                  </label>
                  <textarea
                    id="description"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label htmlFor="location" className="block text-gray-700 mb-2">
                    Location:
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={newRecord.location}
                    onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="witnesses" className="block text-gray-700 mb-2">
                    Witnesses:
                  </label>
                  <Select
                    id="witnesses"
                    options={witnessOptions}
                    value={selectedWitnesses}
                    onChange={handleWitnessChange}
                    className="w-full"
                    isMulti
                    placeholder="Select witnesses..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="evidence" className="block text-gray-700 mb-2">
                    Evidence (optional):
                  </label>
                  <input
                    type="file"
                    id="evidence"
                    onChange={(e) => setNewRecord({ ...newRecord, evidence: e.target.files[0] })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddRecordModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
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
        )}
      </div>
    </Sidebar>
  );
}

export default DisciplinaryRecords;
