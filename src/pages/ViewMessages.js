import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import Modal from "../components/Modal";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ViewMessages() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState(null);

  // Reply Modal states
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyFiles, setReplyFiles] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;

      try {
        const messagesRef = collection(db, "inquiries");
        let q = query(
          messagesRef,
          where("recipientId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        if (filterStatus !== "all") {
          q = query(q, where("read", "==", filterStatus === "read"));
        }

        const messagesSnapshot = await getDocs(q);

        const messagesData = await Promise.all(
          messagesSnapshot.docs.map(async (doc) => {
            const messageData = doc.data();
            const studentId = messageData.studentId;

            const studentsRef = collection(db, "students");
            const studentQuery = query(
              studentsRef,
              where("uid", "==", studentId)
            );
            const studentSnapshot = await getDocs(studentQuery);

            let fullName = "";
            let educationLevel = "";
            let gradeLevel = "";
            let section = "";

            if (!studentSnapshot.empty) {
              const studentData = studentSnapshot.docs[0].data();
              fullName = studentData.fullName;
              educationLevel = studentData.educationLevel;
              gradeLevel = studentData.gradeLevel;
              section = studentData.section;
            }

            return {
              id: doc.id,
              ...messageData,
              fullName,
              educationLevel,
              gradeLevel,
              section,
            };
          })
        );

        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser, filterStatus]);

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, "inquiries", messageId), {
        read: true,
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const openDeleteModal = (messageId) => {
    setMessageIdToDelete(messageId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setMessageIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteMessage = async () => {
    if (!messageIdToDelete) return;

    try {
      await deleteDoc(doc(db, "inquiries", messageIdToDelete));

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageIdToDelete)
      );

      closeDeleteModal();
      alert("Message deleted successfully!");
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Error deleting message. Please try again later.");
    }
  };

  const openReplyModal = (message) => {
    setReplyTo(message);
    setReplyMessage("");
    setReplyFiles([]);
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setReplyTo(null);
    setReplyMessage("");
    setReplyFiles([]);
  };

  const handleReplyFileChange = (e) => {
    setReplyFiles(Array.from(e.target.files));
  };

  const handleSendReply = async () => {
    if (!replyTo || !replyMessage) return;

    try {
      const replyFileURLs = [];
      if (replyFiles.length > 0) {
        for (const file of replyFiles) {
          const storageRef = ref(
            storage,
            `replies/${currentUser.uid}/${replyTo.id}/${file.name}`
          );
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          replyFileURLs.push(downloadURL);
        }
      }

      const inquiriesRef = collection(db, "inquiries");
      await addDoc(inquiriesRef, {
        studentId: currentUser.uid,
        recipientId: replyTo.studentId,
        subject: `Re: ${replyTo.subject}`,
        message: replyMessage,
        fileURLs: replyFileURLs,
        timestamp: serverTimestamp(),
        read: false,
      });

      closeReplyModal();
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Error sending reply. Please try again.");
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Your Messages</h2>

        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="filterStatus" className="block text-gray-700 mb-1">
              Filter by Status:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-gray-700 mb-1">
              Search:
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

        {messages.length === 0 ? (
          <p>You have no messages.</p>
        ) : (
          <ul className="space-y-4">
            {messages
              .filter((message) => {
                const fullName = message.fullName
                  ? message.fullName.toLowerCase()
                  : "";
                const messageContent = message.message
                  ? message.message.toLowerCase()
                  : "";

                return (
                  fullName.includes(searchQuery.toLowerCase()) ||
                  messageContent.includes(searchQuery.toLowerCase())
                );
              })
              .map((message) => (
                <li
                  key={message.id}
                  className={`bg-white p-4 rounded-md shadow ${
                    !message.read ? "border border-blue-500" : ""
                  }`}
                  onClick={() => handleMarkAsRead(message.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{message.fullName}</span>
                      <p className="text-gray-600 text-sm">
                        {message.educationLevel}, {message.gradeLevel} -{" "}
                        {message.section}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {moment(message.timestamp.toDate()).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}
                    </span>
                  </div>

                  <p className="mb-4">{message.message}</p>

                  {message.fileURLs && message.fileURLs.length > 0 && (
                    <div>
                      <p className="font-medium">Attached Files:</p>
                      <ul className="list-disc list-inside">
                        {message.fileURLs.map((url, index) => (
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
                    </div>
                  )}

                  <div className="mt-4 flex">
                    <button
                      onClick={() => handleMarkAsRead(message.id)}
                      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                    >
                      Mark as Read
                    </button>
                    <button
                      onClick={() => openDeleteModal(message.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => openReplyModal(message)}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Reply
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this message?</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDeleteModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isReplyModalOpen} onClose={closeReplyModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reply to Message</h3>
            <p className="mb-2">
              To:{" "}
              <strong>
                {replyTo?.fullName} ({replyTo?.studentId})
              </strong>
            </p>
            <p className="mb-2">
              Subject: <strong>Re: {replyTo?.subject}</strong>
            </p>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Optional: Attach Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleReplyFileChange}
                className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeReplyModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Reply
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default ViewMessages;