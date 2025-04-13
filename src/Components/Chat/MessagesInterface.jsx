import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatList from './ChatList';
import ChatComponent from './ChatComponent';
import NewChat from './NewChat';

function MessagesInterface({ userRole }) {
  const [view, setView] = useState('list'); // 'list', 'chat', 'new'
  const [selectedChat, setSelectedChat] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setView('chat');
  };

  const handleNewChatClick = () => {
    setView('new');
  };

  const handleBack = () => {
    setView('list');
  };

  const handleChatStart = (newChat) => {
    setSelectedChat(newChat);
    
    // Show appropriate message based on whether this is a new or existing chat
    if (newChat.isNew) {
      setStatusMessage('Started new conversation');
    } else if (newChat.isExisting) {
      setStatusMessage('Opened existing conversation');
    }
    
    // Clear status message after a few seconds
    setTimeout(() => setStatusMessage(''), 3000);
    
    setView('chat');
  };

  const getRecipientName = (chat) => {
    if (!chat) return '';
    return userRole === 'doctor' 
      ? chat.patient?.name 
      : chat.doctor?.name;
  };

  const getRecipientId = (chat) => {
    if (!chat) return '';
    return userRole === 'doctor' 
      ? chat.patientId 
      : chat.doctorId;
  };

  // Clean up status message when view changes
  useEffect(() => {
    setStatusMessage('');
  }, [view]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 rounded-t-xl shadow-sm border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-800">Messages</h1>
          </div>
          
          {statusMessage && (
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              {statusMessage}
            </div>
          )}
        </div>
        <p className="text-gray-600 mt-1">
          {view === 'list' && "Chat with your healthcare providers"}
          {view === 'chat' && `Chatting with ${getRecipientName(selectedChat)}`}
          {view === 'new' && "Start a new conversation"}
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden bg-white rounded-b-xl shadow-sm">
        {view === 'list' && (
          <ChatList 
            userRole={userRole} 
            onChatSelect={handleChatSelect} 
            onNewChat={handleNewChatClick} 
          />
        )}
        
        {view === 'chat' && selectedChat && (
          <ChatComponent 
            chatId={selectedChat.id}
            onBack={handleBack}
            userRole={userRole}
            recipientName={getRecipientName(selectedChat)}
            recipientId={getRecipientId(selectedChat)}
          />
        )}
        
        {view === 'new' && (
          <NewChat 
            userRole={userRole} 
            onBack={handleBack} 
            onChatStart={handleChatStart} 
          />
        )}
      </div>
    </div>
  );
}

export default MessagesInterface; 