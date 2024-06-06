import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

function ApproveClearanceTeachers() {
  const { currentUser } = useAuth();
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);

  useEffect(() => {
    const fetchClearanceRequests = async () => {
      if (!currentUser) return;

      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("teacherUid", "==", currentUser.uid));

        const requestsSnapshot = await getDocs(q);
        const requestsData = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClearanceRequests(requestsData);
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };

    fetchClearanceRequests();
  }, [currentUser]);

  const handleApprove = async (requestId, studentId, subject) => {
    try {
      await updateDoc(doc(db, "clearanceRequests", requestId), {
        status: "approved",
      });

      // await updateDoc(doc(db, "students", studentId), {
      //   [`clearance.${subject}`]: true,
      // });

      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);
    
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
    
        await updateDoc(studentDoc.ref, {
          [`clearance.${subject}`]: true,
        });
        console.log(`Student clearance for ${subject} updated successfully.`);
      } else {
        console.log(`No student found with uid ${studentId}.`);
      }

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      alert("Clearance approved!");
    } catch (error) {
      console.error("Error approving clearance:", error);
      alert("Error approving clearance. Please try again later.");
    }
  };

  const openRejectModal = (request) => {
    setRequestToReject(request);
    setIsModalOpen(true);
  };

  const closeRejectModal = () => {
    setRequestToReject(null);
    setIsModalOpen(false);
  };

  const handleReject = async () => {
    if (!requestToReject) return;

    try {
      await updateDoc(doc(db, "clearanceRequests", requestToReject.id), {
        status: "rejected",
      });

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestToReject.id
            ? { ...req, status: "rejected" }
            : req
        )
      );

      closeRejectModal();
      alert("Clearance request rejected.");
    } catch (error) {
      console.error("Error rejecting clearance:", error);
      alert("Error rejecting clearance. Please try again later.");
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Approve Clearance Requests
        </h2>

        {clearanceRequests.length === 0 ? (
          <p>No clearance requests found.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 border-b border-gray-200">
                  Student Name
                </th>
                <th className="py-2 border-b border-gray-200">
                  Subject
                </th>
                <th className="py-2 border-b border-gray-200">
                  Status
                </th>
                <th className="py-2 border-b border-gray-200">
                  Files
                </th>
                <th className="py-2 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {clearanceRequests.map((request) => (
                <tr key={request.id}>
                  <td className="border px-4 py-2">
                    {request.studentName}
                  </td>
                  <td className="border px-4 py-2">
                    {request.subject}
                  </td>
                  <td className="border px-4 py-2">
                    {request.status}
                  </td>
                  <td className="border px-4 py-2">
                    {request.fileURLs && request.fileURLs.length > 0 ? (
                      <ul>
                        {request.fileURLs.map((url, index) => (
                          <li key={index}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              File {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No files submitted"
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleApprove(
                              request.id,
                              request.studentId,
                              request.subject
                            )
                          }
                          className="mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => openRejectModal(request)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeRejectModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Reject Clearance Request
          </h3>
          <p>
            Are you sure you want to reject this clearance request from{" "}
            <strong>{requestToReject?.studentName}</strong> for{" "}
            <strong>{requestToReject?.subject}</strong>?
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeRejectModal}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default ApproveClearanceTeachers;