import React from 'react';
import { ChatEngine } from 'react-chat-engine';
import { useAuth } from '../components/AuthContext';
import SidebarStudent from '../components/SidebarStudent';

function Chat() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarStudent>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Chat</h2>

        <ChatEngine
          projectID={process.env.REACT_APP_CHAT_ENGINE_PROJECT_ID}
          userName={currentUser.email}
          userSecret={currentUser.uid}
          height="100vh"
          renderChatFeed={(chatAppProps) => (
            <ChatFeed {...chatAppProps} />
          )}
        />
      </div>
    </SidebarStudent>
  );
}

const ChatFeed = (props) => {
  const { chats, activeChat, userName, messages } = props;

  if (!chats || !chats[activeChat]) return <div>Loading...</div>;

  const chat = chats[activeChat];

  return (
    <div>
      <h2>{chat?.title}</h2>
      {messages && Object.keys(messages).map((key, index) => {
        const message = messages[key];
        const lastMessageKey = index === 0 ? null : Object.keys(messages)[index - 1];
        const isMyMessage = userName === message.sender.username;

        return (
          <div key={`msg_${index}`} className="message-block">
            <div className={`message ${isMyMessage ? 'my-message' : 'their-message'}`}>
              {isMyMessage ? (
                <MyMessage message={message} />
              ) : (
                <TheirMessage message={message} lastMessage={messages[lastMessageKey]} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MyMessage = ({ message }) => {
  if (message.attachments && message.attachments.length > 0) {
    return (
      <img
        src={message.attachments[0].file}
        alt="message-attachment"
        className="message-image"
        style={{ float: 'right' }}
      />
    );
  }

  return (
    <div className="message" style={{ float: 'right', marginRight: '18px', color: 'white', backgroundColor: '#3B2A50' }}>
      {message.text}
    </div>
  );
};

const TheirMessage = ({ lastMessage, message }) => {
  const isFirstMessageByUser = !lastMessage || lastMessage.sender.username !== message.sender.username;

  return (
    <div className="message-row">
      {isFirstMessageByUser && (
        <div className="message-avatar" style={{ backgroundImage: `url(${message.sender.avatar})` }} />
      )}
      {message.attachments && message.attachments.length > 0 ? (
        <img
          src={message.attachments[0].file}
          alt="message-attachment"
          className="message-image"
          style={{ float: 'left' }}
        />
      ) : (
        <div className="message" style={{ float: 'left', backgroundColor: '#CABCDC' }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default Chat;
