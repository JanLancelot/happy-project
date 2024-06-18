import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";

function CreateStudent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "students"), {
        uid: user.uid,
        fullName,
        email,
        educationLevel,
        gradeLevel,
      });

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        role: "student",
      });

      navigate("/students");
    } catch (error) {
      setError("Error creating student: " + error.message);
    }
  };

  const handleEducationLevelChange = (e) => {
    setEducationLevel(e.target.value);
    setGradeLevel("");
  };

  const getGradeLevels = () => {
    switch (educationLevel) {
      case "elementary":
        return ["1", "2", "3", "4", "5", "6"];
      case "juniorHighschool":
        return ["7", "8", "9", "10"];
      case "seniorHighschool":
        return ["11", "12"];
      case "college":
        return ["Freshman", "Sophomore", "Junior", "Senior"];
      default:
        return [];
    }
  };

  const handleCsvFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setError("");
    setUploading(true);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const students = result.data;
        for (const student of students) {
          const { fullName, email, password, educationLevel, gradeLevel } = student;

          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );
            const user = userCredential.user;

            await addDoc(collection(db, "students"), {
              uid: user.uid,
              fullName,
              email,
              educationLevel,
              gradeLevel,
            });

            await addDoc(collection(db, "users"), {
              uid: user.uid,
              email: user.email,
              role: "student",
            });
          } catch (error) {
            console.error("Error creating student: ", error);
            setError("Error creating student: " + error.message);
          }
        }

        setUploading(false);
        navigate("/students");
      },
    });
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-3xl font-semibold mb-6 text-center">Create Student</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700">Education Level</label>
              <select
                value={educationLevel}
                onChange={handleEducationLevelChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="" disabled>
                  Select education level
                </option>
                <option value="elementary">Elementary</option>
                <option value="juniorHighschool">Junior High School</option>
                <option value="seniorHighschool">Senior High School</option>
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
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full"
            >
              Create Student
            </button>
          </form>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-center">Upload CSV</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="w-full mb-4"
            />
            <button
              onClick={handleCsvUpload}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-700 w-full"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload CSV"}
            </button>
            {uploading && <div className="mt-2 text-center text-blue-500">Uploading students...</div>}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default CreateStudent;
