import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import SidebarStudent from "../components/SidebarStudent";
import moment from "moment";

function ViewMessagesStudent() {
  const { currentUser } = useAuth();
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const fetchReplies = async () => {
      if (!currentUser) return;

      try {
        const repliesRef = collection(db, "inquiries");
        const q = query(
          repliesRef,
          where("recipientId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const repliesSnapshot = await getDocs(q);

        const repliesData = repliesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReplies(repliesData);
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
    };

    fetchReplies();
  }, [currentUser]);

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Replies to Your Inquiries</h2>

        {replies.length === 0 ? (
          <p>You have no replies yet.</p>
        ) : (
          <ul className="space-y-4">
            {replies.map((reply) => (
              <li key={reply.id} className="bg-white p-4 rounded-md shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    Subject: {reply.subject}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {moment(reply.timestamp.toDate()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )}
                  </span>
                </div>
                <p className="mb-4">{reply.message}</p>

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
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidebarStudent>
  );
}

export default ViewMessagesStudent;