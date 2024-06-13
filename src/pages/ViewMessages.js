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
  const [messages, setMessages] = useState({});
  const [originalMessages, setOriginalMessages] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState(null);
  const [sortField, setSortField] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterEducationLevel, setFilterEducationLevel] = useState("all");
  const [filterGradeLevel, setFilterGradeLevel] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [availableGradeLevels, setAvailableGradeLevels] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyFiles, setReplyFiles] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;

      try {
        const messagesRef = collection(db, "inquiries");
        const q = query(
          messagesRef,
          where("recipientId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

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

        const groupedMessages = messagesData.reduce((acc, message) => {
          const sender = message.fullName || "Unknown Sender";
          if (!acc[sender]) acc[sender] = [];
          acc[sender].push(message);
          return acc;
        }, {});

        setMessages(groupedMessages);
        setOriginalMessages(groupedMessages);

        const uniqueEducationLevels = [
          ...new Set(messagesData.map((msg) => msg.educationLevel)),
        ];
        const uniqueGradeLevels = [
          ...new Set(messagesData.map((msg) => msg.gradeLevel)),
        ];
        const uniqueSections = [
          ...new Set(messagesData.map((msg) => msg.section)),
        ];

        setAvailableEducationLevels(uniqueEducationLevels);
        setAvailableGradeLevels(uniqueGradeLevels);
        setAvailableSections(uniqueSections);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser]);

  useEffect(() => {
    let filteredMessages = { ...originalMessages };

    if (filterStatus !== "all") {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.filter((msg) => msg.read === (filterStatus === "read")),
        ])
      );
    }
    if (filterEducationLevel !== "all") {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.filter((msg) => msg.educationLevel === filterEducationLevel),
        ])
      );
    }
    if (filterGradeLevel !== "all") {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.filter((msg) => msg.gradeLevel === filterGradeLevel),
        ])
      );
    }
    if (filterSection !== "all") {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.filter((msg) => msg.section === filterSection),
        ])
      );
    }

    if (sortField) {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];

            if (typeof valueA === "string") {
              return sortOrder === "asc"
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
            } else {
              return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
            }
          }),
        ])
      );
    }

    if (searchQuery) {
      filteredMessages = Object.fromEntries(
        Object.entries(filteredMessages).map(([sender, msgs]) => [
          sender,
          msgs.filter((message) => {
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
          }),
        ])
      );
    }

    setMessages(filteredMessages);
  }, [
    filterStatus,
    searchQuery,
    sortField,
    sortOrder,
    filterEducationLevel,
    filterGradeLevel,
    filterSection,
    originalMessages,
  ]);

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, "inquiries", messageId), {
        read: true,
      });

      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        for (const sender in updatedMessages) {
          updatedMessages[sender] = updatedMessages[sender].map((msg) =>
            msg.id === messageId ? { ...msg, read: true } : msg
          );
        }
        return updatedMessages;
      });
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

      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        for (const sender in updatedMessages) {
          updatedMessages[sender] = updatedMessages[sender].filter(
            (msg) => msg.id !== messageIdToDelete
          );
        }
        return updatedMessages;
      });

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

      await addDoc(collection(db, "replies"), {
        inquiryId: replyTo.id,
        senderId: currentUser.uid,
        message: replyMessage,
        files: replyFileURLs,
        timestamp: serverTimestamp(),
      });

      closeReplyModal();
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Error sending reply. Please try again later.");
    }
  };

  const handleSortChange = (field) => {
    setSortField(field);
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="view-messages-container">
      <Sidebar />
      <div className="content">
        <h1>Messages</h1>
        <div className="filters">
          <input
            type="text"
            placeholder="Search by sender or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
          <select
            value={filterEducationLevel}
            onChange={(e) => setFilterEducationLevel(e.target.value)}
          >
            <option value="all">All Education Levels</option>
            {availableEducationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={filterGradeLevel}
            onChange={(e) => setFilterGradeLevel(e.target.value)}
          >
            <option value="all">All Grade Levels</option>
            {availableGradeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="all">All Sections</option>
            {availableSections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSortChange("fullName")}>Sender</th>
              <th onClick={() => handleSortChange("timestamp")}>Date</th>
              <th onClick={() => handleSortChange("message")}>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(messages).map(([sender, msgs]) => (
              <React.Fragment key={sender}>
                <tr>
                  <td colSpan="4">
                    <strong>{sender}</strong>
                  </td>
                </tr>
                {msgs.map((message) => (
                  <tr key={message.id}>
                    <td>{message.fullName}</td>
                    <td>
                      {moment(message.timestamp.toDate()).format(
                        "MMMM Do YYYY, h:mm:ss a"
                      )}
                    </td>
                    <td>{message.message}</td>
                    <td>
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        disabled={message.read}
                      >
                        Mark as Read
                      </button>
                      <button onClick={() => openDeleteModal(message.id)}>
                        Delete
                      </button>
                      <button onClick={() => openReplyModal(message)}>
                        Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete this message?</p>
          <button onClick={handleDeleteMessage}>Yes, Delete</button>
          <button onClick={closeDeleteModal}>Cancel</button>
        </Modal>
        <Modal isOpen={isReplyModalOpen} onClose={closeReplyModal}>
          <h2>Reply to Message</h2>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
          />
          <input type="file" multiple onChange={handleReplyFileChange} />
          <button onClick={handleSendReply}>Send Reply</button>
          <button onClick={closeReplyModal}>Cancel</button>
        </Modal>
      </div>
    </div>
  );
}

export default ViewMessages;
