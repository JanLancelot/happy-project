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

const VIOLATIONS = {
  "Sec. 1 Academic Integrity": [
    {
      label: "a. Cheating (Class D)",
      value: "Cheating (Class D)",
    },
    {
      label: "b. Plagiarism (Class D)",
      value: "Plagiarism (Class D)",
    },
    {
      label:
        "c. Falsification of academic records by altering, forging, or misrepresenting official scores, grade, or result of any graded assessment (Class D)",
      value: "Falsification of academic records (Class D)",
    },
    {
      label:
        "d. Academic dishonesty in research projects involves the intentional misrepresentation or falsification of research data, findings, results or methodologies in order to deceive or manipulate the academic community (Class D/E)",
      value: "Academic dishonesty in research projects (Class D/E)",
    },
  ],
  "Sec. 2 Attendance and Punctuality": [
    {
      label:
        "a. Frequent tardiness by consistently arriving late to classes without a valid reason (Class A)",
      value: "Frequent tardiness (Class A)",
    },
    {
      label:
        "b. Unexcused absences that may exceed 20% of the total class hours required (Class A)",
      value: "Unexcused absences (Class A)",
    },
    {
      label:
        "c. Leaving classes without permission by exiting the classroom during instructional time without authorization from the teacher (Class A)",
      value: "Leaving classes without permission (Class A)",
    },
  ],
  "Sec. 3 Dress Code": [
    {
      label:
        "a. Non-conformity to the prescribed uniform of the respective college including any violation of I.D. and proper hair cut requirements (Class A)",
      value: "Non-conformity to prescribed uniform (Class A)",
    },
    {
      label:
        "b. Misuse of school uniform by going to indecent places or engaging in unbecoming conduct while in uniform. (Class C)",
      value: "Misuse of school uniform (Class C)",
    },
  ],
  "Sec. 4 Conduct": [
    {
      label:
        "a. Any form of disorderly conduct such as shouting, unruly behavior, frequent insolence towards teachers and disseminating unauthorized publications within school premises (Class B)",
      value: "Disorderly conduct (Class B)",
    },
    {
      label:
        "b. Creation and/or distribution of unauthorized ID or school publications, illustrations/caricatures etc., distorting or injuring the image of the school, its faculty, and personnel (Class D)",
      value:
        "Creation/distribution of unauthorized ID or publications (Class D)",
    },
    {
      label:
        "c. Using indecent or obscene language within the school premises or engaging in immoral conduct and/or sexual advances. (Class C/D)",
      value: "Indecent language/immoral conduct (Class C/D)",
    },
    {
      label:
        "d. Willful disobedience, general misbehavior, rowdiness, reckless behavior or horseplay within school premises (Class B/C)",
      value: "Willful disobedience/misbehavior (Class B/C)",
    },
  ],
  "Sec. 5 Cyber Offenses": [
    {
      label:
        "a. Unauthorized access to the school computer systems or internet facilities (Class D/E)",
      value: "Unauthorized access to school computer systems (Class D/E)",
    },
    {
      label:
        "b. Introduction of viruses or malicious programs into the school systems (Class D/E)",
      value: "Introduction of viruses or malicious programs (Class D/E)",
    },
    {
      label:
        "c. Damaging or any attempt to damage computer systems, peripherals or networks belonging to the school (Class D/E)",
      value: "Damaging school computer systems (Class D/E)",
    },
    {
      label:
        "d. Misuse of school computer systems such as browsing unauthorized sites, downloading unauthorized files or using the system for personal gains. (Class D)",
      value: "Misuse of school computer systems (Class D)",
    },
    {
      label:
        "e. Hacking into an email, social networking or any electronic account to that will cause harm to any member of the academic community or damage the name and reputation of the school (Class D)",
      value: "Hacking into accounts (Class D)",
    },
    {
      label:
        "f. Cyber voyeurism and Cyber bullying including but not limited to text messages and messages posted on social networking sites such as Facebook, Twitter and the likes (Class D/E)",
      value: "Cyber voyeurism/bullying (Class D/E)",
    },
  ],
  "Sec. 6 Substance Abuse": [
    {
      label: "a. Smoking within the school premises. (Class A)",
      value: "Smoking (Class A)",
    },
    {
      label:
        "b. Possession of alcoholic beverage and/or drunkenness within the school premises. (Class B/C)",
      value: "Possession of alcohol/drunkenness (Class B/C)",
    },
    {
      label: "c. Gambling in any form even without money involved. (Class B)",
      value: "Gambling (Class B)",
    },
    {
      label:
        "d. Possession and/or distribution of prohibited drugs and narcotics within school premises. (Class F)",
      value: "Possession/distribution of drugs (Class F)",
    },
  ],
  "Sec. 7 Property Damage/Theft": [
    {
      label: "a. Improper use of school facilities (Class A)",
      value: "Improper use of school facilities (Class A)",
    },
    {
      label:
        "b. Spitting, littering, or scattering trash within school premises. (Class A)",
      value: "Spitting/littering (Class A)",
    },
    {
      label:
        "c. Unauthorized picking of fruits or flowers, cutting of trees or plants and raising of animals within school premises. (Class A)",
      value: "Unauthorized picking/cutting/raising animals (Class A)",
    },
    {
      label:
        "d. Identity theft by using the school ID, library card, or any personal ID of a fellow student (Class B)",
      value: "Identity theft (Class B)",
    },
    {
      label: "e. Violation of legally posted signs (Class B)",
      value: "Violation of legally posted signs (Class B)",
    },
    {
      label:
        "f. Connecting or disconnecting electrical wires and plumbing devices (Class B/C)",
      value: "Connecting/disconnecting electrical wires/plumbing (Class B/C)",
    },
    {
      label:
        "g. Any form of vandalism such as removing or damaging legally posted signs and notices (Class B), destroying another person or school property, either willfully or through negligence. (Class C/D)",
      value: "Vandalism (Class B/C/D)",
    },
    {
      label:
        "h. Stealing or attempting to steal any property of the school or of any person in school. (Class D/E)",
      value: "Stealing (Class D/E)",
    },
  ],
  "Sec. 8 Safety and Security": [
    {
      label:
        "a. Causing undue noise or disturbance in classrooms, library, corridors, quarters, public places or gatherings. (Class A)",
      value: "Causing undue noise or disturbance (Class A)",
    },
    {
      label:
        "b. Scandalous disturbance of peace and order within the school premises by tampering the fire alarm and smoke detectors (Class C)",
      value: "Scandalous disturbance of peace and order (Class C)",
    },
    {
      label:
        "c. Deliberately giving fictitious names to misrepresent facts. (Class D)",
      value: "Deliberately giving fictitious names (Class D)",
    },
    {
      label:
        "d. Possession of deadly weapons such as but not limited to knives, guns, ice picks and the like. (Class D/E)",
      value: "Possession of deadly weapons (Class D/E)",
    },
    {
      label:
        "e. Organizing and recruiting members for and joining any fraternity, sorority and other organization/s not approved by the school. (Class E)",
      value: "Organizing/joining unapproved organizations (Class E)",
    },
    {
      label:
        "f. Participating in whatever capacity, in the hazing activities of any fraternity, sorority and other organization/s not approved by the school. (Class E)",
      value: "Participating in hazing activities (Class E)",
    },
    {
      label:
        "g. Inciting or joining any form of group action (i.e. rallies, demonstrations, etc.) which create disorder or which impede or prevent the other students from attending their classes. (Class E)",
      value: "Inciting/joining disruptive group action (Class E)",
    },
    {
      label:
        "h. Any act of subversion or affiliation/participation in any subversive movement. (Class F)",
      value: "Subversion (Class F)",
    },
  ],
};

const SANCTIONS = {
  "Class A": [
    { label: "1st Offense: Oral Warning", value: "Oral Warning" },
    { label: "2nd Offense: Written Reprimand", value: "Written Reprimand" },
    { label: "3rd Offense: Suspension (2 days)", value: "Suspension (2 days)" },
    { label: "4th Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "5th Offense: Exclusion", value: "Exclusion" },
  ],
  "Class B": [
    { label: "1st Offense: Written Reprimand", value: "Written Reprimand" },
    { label: "2nd Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "3rd Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "4th Offense: Exclusion", value: "Exclusion" },
  ],
  "Class C": [
    { label: "1st Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "2nd Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "3rd Offense: Exclusion", value: "Exclusion" },
  ],
  "Class D": [
    { label: "1st Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "2nd Offense: Exclusion", value: "Exclusion" },
  ],
  "Class E": [{ label: "1st Offense: Exclusion", value: "Exclusion" }],
  "Class F": [{ label: "1st Offense: Expulsion", value: "Expulsion" }],
};

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

  const [selectedViolation, setSelectedViolation] = useState(null);
  const [selectedSanction, setSelectedSanction] = useState(null);

  useEffect(() => {
    const fetchStudentsAndTeachers = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: `${doc.data().fullName} - ${doc.data().gradeLevel} - ${doc.data().section}`,
          fullName: doc.data().fullName,
          section: doc.data().section,
          gradeLevel: doc.data().gradeLevel,
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

  const handleViolationChange = (selectedOption) => {
    setSelectedViolation(selectedOption);
  };

  const handleSanctionChange = (selectedOption) => {
    setSelectedSanction(selectedOption);
  };

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
        violations: selectedViolation ? [selectedViolation.value] : [],
        sanctions: selectedSanction ? [selectedSanction.value] : [],
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

      setSelectedViolation(null);
      setSelectedSanction(null);

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
      studentGradeLevel: selectedOption ? selectedOption.gradeLevel : "",
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
        <div className="mb-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => setIsAddRecordModalOpen(true)}
          >
            Add Disciplinary Record
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="filterOffense" className="mr-2">
            Filter by Offense:
          </label>
          <select
            id="filterOffense"
            value={filterOffense}
            onChange={handleOffenseFilterChange}
            className="border border-gray-300 rounded p-2"
          >
            <option value="all">All</option>
            {availableOffenses.map((offense, index) => (
              <option key={index} value={offense}>
                {offense}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="searchQuery" className="mr-2">
            Search by Student Name or ID:
          </label>
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            className="border border-gray-300 rounded p-2"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Student Name</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Offense</th>
                <th className="py-2 px-4 border-b">Violation</th>
                <th className="py-2 px-4 border-b">Sanction</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr>
                    <td className="py-2 px-4 border-b">{record.fullName}</td>
                    <td className="py-2 px-4 border-b">{moment(record.date.toDate()).format("YYYY-MM-DD")}</td>
                    <td className="py-2 px-4 border-b">{record.offense}</td>
                    <td className="py-2 px-4 border-b">{record.violations.join(", ")}</td>
                    <td className="py-2 px-4 border-b">{record.sanctions.join(", ")}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="text-blue-500 hover:underline"
                        onClick={() => handleExpandRow(record.id)}
                      >
                        {expandedRecordId === record.id ? (
                          <FontAwesomeIcon icon={faAngleUp} />
                        ) : (
                          <FontAwesomeIcon icon={faAngleDown} />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedRecordId === record.id && (
                    <tr>
                      <td colSpan="6" className="py-2 px-4 border-b bg-gray-100">
                        <div>
                          <p><strong>Full Description:</strong> {record.description}</p>
                          <p><strong>Location:</strong> {record.location}</p>
                          <p><strong>Witnesses:</strong> {record.witnessNames}</p>
                          {record.evidenceURL && (
                            <p>
                              <strong>Evidence:</strong> <a href={record.evidenceURL} target="_blank" rel="noopener noreferrer">View</a>
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Modal isOpen={isAddRecordModalOpen} onClose={() => setIsAddRecordModalOpen(false)}>
          <h2 className="text-2xl font-semibold mb-4">Add Disciplinary Record</h2>
          <form onSubmit={handleAddRecord}>
            <div className="mb-4">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Student
              </label>
              <Select
                id="student"
                options={studentOptions}
                value={selectedStudent}
                onChange={handleStudentChange}
                placeholder="Select a student"
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="offense" className="block text-sm font-medium text-gray-700">
                Offense
              </label>
              <input
                type="text"
                id="offense"
                value={newRecord.offense}
                onChange={(e) => setNewRecord({ ...newRecord, offense: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={newRecord.location}
                onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="violations" className="block text-sm font-medium text-gray-700">
                Violation
              </label>
              <Select
                id="violations"
                options={Object.keys(VIOLATIONS).map((key) => ({ value: key, label: VIOLATIONS[key] }))}
                value={selectedViolation}
                onChange={handleViolationChange}
                placeholder="Select a violation"
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="sanctions" className="block text-sm font-medium text-gray-700">
                Sanction
              </label>
              <Select
                id="sanctions"
                options={Object.keys(SANCTIONS).map((key) => ({ value: key, label: SANCTIONS[key] }))}
                value={selectedSanction}
                onChange={handleSanctionChange}
                placeholder="Select a sanction"
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="witnesses" className="block text-sm font-medium text-gray-700">
                Witnesses
              </label>
              <Select
                id="witnesses"
                options={witnessOptions}
                value={selectedWitnesses}
                onChange={handleWitnessChange}
                isMulti
                placeholder="Select witnesses"
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="evidence" className="block text-sm font-medium text-gray-700">
                Evidence
              </label>
              <input
                type="file"
                id="evidence"
                onChange={(e) => setNewRecord({ ...newRecord, evidence: e.target.files[0] })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                onClick={() => setIsAddRecordModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default DisciplinaryRecords;