import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';

function CreateClass() {
  const [educationLevel, setEducationLevel] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [adviser, setAdviser] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersData = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersData);
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    if (gradeLevel) {
      const fetchSubjects = async () => {
        const subjectsQuery = query(collection(db, 'subjects'), where('gradeLevel', '==', gradeLevel));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(subjectsData);
      };

      fetchSubjects();
    }
  }, [gradeLevel]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'classes'), {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser,
        subjects: subjects.map(subject => ({
          ...subject,
          teacher: assignedTeachers[subject.id] || ''
        }))
      });

      navigate('/');
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const handleTeacherChange = (subjectId, teacher) => {
    setAssignedTeachers({
      ...assignedTeachers,
      [subjectId]: teacher
    });
  };

  const handleRemoveSubject = (subjectId) => {
    setSubjects(subjects.filter(subject => subject.id !== subjectId));
  };

  const getGradeLevels = () => {
    switch (educationLevel) {
      case 'elementary':
        return ['1', '2', '3', '4', '5', '6'];
      case 'junior high school':
        return ['7', '8', '9', '10'];
      case 'senior high school':
        return ['11', '12'];
      case 'college':
        return ['Freshman', 'Sophomore', 'Junior', 'Senior'];
      default:
        return [];
    }
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
                setSubjects([]);
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
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          {subjects.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mt-4">Subjects</h3>
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-4">
                  <span className="flex-1">{subject.name}</span>
                  <select
                    value={assignedTeachers[subject.id] || ''}
                    onChange={(e) => handleTeacherChange(subject.id, e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  >
                    <option value="" disabled>
                      Select a teacher
                    </option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(subject.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
