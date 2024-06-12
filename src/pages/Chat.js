import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";
import moment from "moment";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

function Chat() {
  const { recipientId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
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

          const unreadMessages = messagesData.filter(
            (msg) =>
              msg.recipientId === currentUser.uid && !msg.read
          );
          if (unreadMessages.length > 0) {
            const batch = db.batch();
            unreadMessages.forEach((msg) => {
              batch.update(doc(db, "chats", msg.id), { read: true });
            });
            batch.commit();
          }
        });

        return () => unsubscribe(); 
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser, recipientId]);


  useEffect(() => {
    const isNearBottom =
      messagesEndRef.current?.scrollHeight -
        messagesEndRef.current?.scrollTop -
        messagesEndRef.current?.clientHeight <=
      100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" && !file) return; 

    setIsUploading(true); 

    try {
      let fileURL = null;
      if (file) {
        const storageRef = ref(
          storage,
          `chat_files/${currentUser.uid}/${Date.now()}-${file.name}`
        );
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      const messagesRef = collection(db, "chats");
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        recipientId: recipientId,
        text: newMessage,
        fileURL: fileURL, 
        timestamp: serverTimestamp(),
        participants: [currentUser.uid, recipientId],
        read: false,
      });
      setNewMessage("");
      setFile(null);
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setIsUploading(false); 
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const messageRef = doc(db, "chats", messageId);
      await updateDoc(messageRef, {
        reactions: {
          ...messageReactions[messageId], 
          [emoji]: (messageReactions[messageId]?.[emoji] || 0) + 1,
        },
      });
    } catch (error) {
      console.error("Error adding reaction: ", error);
    }
  };

  const getAvatarUrl = (userId) => {
    return `https://avatars.dicebear.com/api/initials/${userId}.svg`; 
  };

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Chat</h2>

        <div className="bg-white shadow p-4 rounded-lg h-96 overflow-y-auto">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const showDateSeparator =
              !previousMessage ||
              !moment(message.timestamp.toDate()).isSame(
                moment(previousMessage.timestamp.toDate()),
                "day"
              );

            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="text-center text-gray-500 text-sm mb-2">
                    {moment(message.timestamp.toDate()).format("MMMM DD, YYYY")}
                  </div>
                )}

                <div
                  className={`flex items-start mb-4 ${
                    message.senderId === currentUser.uid ? "justify-end" : ""
                  }`}
                >
                  {message.senderId !== currentUser.uid && (
                    <img
                      src={getAvatarUrl(message.senderId)} 
                      alt="Avatar"
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  )}

                  <div
                    className={`relative p-3 rounded-lg ${
                      message.senderId === currentUser.uid
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300"
                    }`}
                  >
                    {message.text}

                    {message.fileURL && (
                      <a
                        href={message.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-blue-500 underline"
                      >
                        View Attachment
                      </a>
                    )}

                    <span className="block text-xs text-gray-500 mt-1">
                      {moment(message.timestamp.toDate()).format("hh:mm A")}
                    </span>

                    {message.senderId === currentUser.uid &&
                      message.read && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="absolute bottom-1 right-2 text-blue-300"
                        />
                      )}

                    {showEmojiPicker && (
                      <div className="absolute bottom-8 right-0">
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji) =>
                            addReaction(message.id, emoji.native)
                          }
                          showPreview={false}
                        />
                      </div>
                    )}

                    {message.reactions &&
                      Object.entries(message.reactions).map(
                        ([emoji, count]) => (
                          <span key={emoji} className="ml-2">
                            {emoji} {count}
                          </span>
                        )
                      )}

                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute bottom-1 left-2"
                    >
                      ➕
                    </button>
                  </div>

                  {message.senderId === currentUser.uid && (
                    <img
                      src={getAvatarUrl(message.senderId)} 
                      alt="Avatar"
                      className="w-8 h-8 rounded-full ml-2"
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex items-center">
          <input
            type="file" 
            onChange={handleFileChange} 
            className="mr-2" 
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </SidebarStudent>
  );
}

export default Chat;
