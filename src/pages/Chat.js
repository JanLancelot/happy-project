import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";

function Chat() {
  const { recipientId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser || !recipientId) return;

      try {
        const messagesRef = collection(db, "chats");
        const q = query(
          messagesRef,
          where("participants", "in", [
            [currentUser.uid, recipientId],
            [recipientId, currentUser.uid],
          ]),
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(messagesData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    try {
      const messagesRef = collection(db, "chats");
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        recipientId: recipientId,
        text: newMessage,
        timestamp: serverTimestamp(),
        participants: [currentUser.uid, recipientId],
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Chat</h2>

        <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-2 p-3 rounded ${
                message.senderId === currentUser.uid
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-300 self-start"
              }`}
            >
              {message.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </SidebarStudent>
  );
}

export default Chat;
