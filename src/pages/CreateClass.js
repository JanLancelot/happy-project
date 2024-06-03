import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

import Sidebar from "../components/Sidebar";

function CreateClass() {
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [adviser, setAdviser] = useState("");
  const [subjects, setSubjects] = useState([
    { subject: "", teacher: "", teacherUid: "" },
  ]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudentOptions, setSelectedStudentOptions] = useState([]);
  const [allStudentOptions, setAllStudentOptions] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      const teachersSnapshot = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        uid: doc.data().uid,
        ...doc.data(),
      }));
      setTeachers(teachersData);
    };

    const fetchStudents = async () => {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().fullName,
      }));
      setAllStudentOptions(studentsData);
    };

    fetchTeachers();
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const classDocRef = await addDoc(collection(db, "classes"), {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser,
        subjects,
      });

      const selectedStudentIds = selectedStudentOptions.map(
        (option) => option.value
      );

      const updatePromises = selectedStudentIds.map(async (studentId) => {
        const studentDocRef = doc(db, "students", studentId);

        await updateDoc(studentDocRef, {
          section: sectionName,
        });

        const clearance = subjects.reduce((acc, subject) => {
          acc[subject.subject] = false;
          return acc;
        }, {});

        const additionalClearances = [
          "Librarian",
          "Character Renewal Office",
          "Finance",
          "Basic Education Registrar",
          "Class Adviser",
          "Director/Principal",
        ];

        additionalClearances.forEach((role) => {
          clearance[role] = false;
        });

        await updateDoc(studentDocRef, {
          clearance,
        });
      });

      await Promise.all(updatePromises);

      navigate("/classes");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const getGradeLevels = () => {
    switch (educationLevel) {
      case "elementary":
        return ["1", "2", "3", "4", "5", "6"];
      case "junior high school":
        return ["7", "8", "9", "10"];
      case "senior high school":
        return ["11", "12"];
      case "college":
        return ["Freshman", "Sophomore", "Junior", "Senior"];
      default:
        return [];
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", teacher: "", teacherUid: "" }]);
  };

  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const handleTeacherChange = (index, value) => {
    const selectedTeacher = teachers.find((teacher) => teacher.uid === value);
    const newSubjects = [...subjects];
    newSubjects[index].teacher = selectedTeacher.name;
    newSubjects[index].teacherUid = selectedTeacher.uid;
    setSubjects(newSubjects);
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Create Class</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Education Level</label>
            <select
              value={educationLevel}
              onChange={(e) => {
                setEducationLevel(e.target.value);
                setGradeLevel("");
              }}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="" disabled>
                Select education level
              </option>
              <option value="elementary">Elementary</option>
              <option value="junior high school">Junior High School</option>
              <option value="senior high school">Senior High School</option>
              <option value="college">College</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Grade Level</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              disabled={!educationLevel}
            >
              <option value="" disabled>
                Select grade level
              </option>
              {getGradeLevels().map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Section Name</label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Adviser</label>
            <select
              value={adviser}
              onChange={(e) => setAdviser(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="" disabled>
                Select an adviser
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.uid} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700">Subjects</label>
            {subjects.map((subject, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={subject.subject}
                  onChange={(e) =>
                    handleSubjectChange(index, "subject", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
                <select
                  value={subject.teacherUid}
                  onChange={(e) => handleTeacherChange(index, e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="" disabled>
                    Select a teacher
                  </option>
                  {teachers.map((teacher) => (
                    <option key={teacher.uid} value={teacher.uid}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSubject(index)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSubject}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-700"
            >
              Add Subject
            </button>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Students</label>
            <Select
              isMulti
              value={selectedStudentOptions}
              onChange={setSelectedStudentOptions}
              options={allStudentOptions}
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Class
          </button>
        </form>
      </div>
    </Sidebar>
  );
}

export default CreateClass;
