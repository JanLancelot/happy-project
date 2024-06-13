import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";
import moment from "moment";
import Modal from "../components/Modal";

function ViewMessagesStudent() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [replyIdToDelete, setReplyIdToDelete] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;

      try {
        const repliesRef = collection(db, "inquiries");
        const q = query(
          repliesRef,
          where("recipientId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        const repliesSnapshot = await getDocs(q);

        const repliesData = await Promise.all(
          repliesSnapshot.docs.map(async (doc) => {
            const replyData = doc.data();
            const senderId = replyData.studentId;

            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("uid", "==", senderId));
            const userSnapshot = await getDocs(userQuery);

            let senderEmail = "";
            if (!userSnapshot.empty) {
              senderEmail = userSnapshot.docs[0].data().email;
            }

            return {
              id: doc.id,
              ...replyData,
              senderEmail: senderEmail,
            };
          })
        );

        const groupedMessages = {};
        repliesData.forEach((message) => {
          if (!groupedMessages[message.senderEmail]) {
            groupedMessages[message.senderEmail] = [];
          }
          groupedMessages[message.senderEmail].push(message);
        });

        setMessages(groupedMessages);
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
    };

    fetchMessages();
  }, [currentUser]);

  const openReplyModal = (reply) => {
    setReplyTo(reply);
    setReplyMessage("");
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setReplyTo(null);
    setReplyMessage("");
  };

  const handleSendReply = async () => {
    if (!replyTo || !replyMessage) return;

    try {
      const inquiriesRef = collection(db, "inquiries");
      await addDoc(inquiriesRef, {
        studentId: currentUser.uid,
        recipientId: replyTo.recipientId,
        subject: `Re: ${replyTo.subject}`,
        message: replyMessage,
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

  const openDeleteModal = (replyId) => {
    setReplyIdToDelete(replyId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setReplyIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteReply = async () => {
    if (!replyIdToDelete) return;

    try {
      await deleteDoc(doc(db, "inquiries", replyIdToDelete));

      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        for (const sender in updatedMessages) {
          updatedMessages[sender] = updatedMessages[sender].filter(
            (reply) => reply.id !== replyIdToDelete
          );
          if (updatedMessages[sender].length === 0) {
            delete updatedMessages[sender];
          }
        }
        return updatedMessages;
      });

      closeDeleteModal();
      alert("Reply deleted successfully!");
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Error deleting reply. Please try again.");
    }
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-semibold mb-6">Replies to Your Inquiries</h2>

        {Object.keys(messages).length === 0 ? (
          <p className="text-gray-500">You have no replies yet.</p>
        ) : (
          Object.entries(messages).map(([senderEmail, messages]) => (
            <div key={senderEmail} className="mb-8">
              <h3 className="font-medium text-xl mb-4">{senderEmail}</h3>
              <ul className="space-y-4">
                {messages.map((reply) => (
                  <li key={reply.id} className="bg-white p-6 rounded-md shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium text-lg">
                        Subject: {reply.subject}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {moment(reply.timestamp.toDate()).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{reply.message}</p>

                    {reply.fileURLs && reply.fileURLs.length > 0 && (
                      <div>
                        <p className="font-medium">Attached Files:</p>
                        <ul className="list-disc list-inside">
                          {reply.fileURLs.map((url, index) => (
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

                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={() => openReplyModal(reply)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => openDeleteModal(reply.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        <Modal isOpen={isReplyModalOpen} onClose={closeReplyModal}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Reply to Message</h3>
            <p className="mb-2">
              To: <strong>{replyTo?.senderEmail}</strong>
            </p>
            <p className="mb-2">
              Subject: <strong>Re: {replyTo?.subject}</strong>
            </p>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closeReplyModal}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Send Reply
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this reply?</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReply}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarStudent>
  );
}

export default ViewMessagesStudent;
