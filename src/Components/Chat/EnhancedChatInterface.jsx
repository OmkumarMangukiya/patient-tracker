import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ChevronLeft, Plus, Search } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "../../components/ui/card";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

function EnhancedChatInterface({ userRole }) {
  const [view, setView] = useState('list'); // 'list', 'chat', 'new'
  const [selectedChat, setSelectedChat] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Connect to the socket
  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8000/${userRole}/chats`, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        setChats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats');
        setLoading(false);
      }
    };

    fetchChats();
  }, [userRole]);

  // Join the chat room when socket and chatId are available
  useEffect(() => {
    if (socket && selectedChat?.id) {
      socket.emit('join-chat', selectedChat.id);
      
      // Set up event listener for new messages
      socket.on('receive-message', (messageData) => {
        setMessages(prevMessages => [...prevMessages, messageData]);
      });
      
      // Clean up when leaving the component
      return () => {
        socket.emit('leave-chat', selectedChat.id);
        socket.off('receive-message');
      };
    }
  }, [socket, selectedChat]);

  // Load existing messages
  useEffect(() => {
    if (!selectedChat?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/chats/${selectedChat.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up status message when view changes
  useEffect(() => {
    setStatusMessage('');
  }, [view]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setView('chat');
  };

  const handleNewChatClick = () => {
    setView('new');
  };

  const handleBack = () => {
    setView('list');
    setMessages([]);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Get user ID from token
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = String(tokenData.id); // Convert ID to string
      
      const messageData = {
        content: newMessage,
        chatId: selectedChat.id,
        senderId: userId,
        senderType: userRole,
        createdAt: new Date().toISOString()
      };
      
      // Send to the server
      await axios.post(`http://localhost:8000/chats/${selectedChat.id}/messages`, 
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Emit through socket
      if (socket) {
        socket.emit('send-message', messageData);
      }
      
      // Clear the input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    // For older messages, show the date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  // Check if a message is from the current user
  const isCurrentUser = (message) => {
    // First try to match by senderType (newer messages)
    if (message.senderType) {
      return message.senderType === userRole;
    }
    
    // For older messages without senderType, try to determine from token
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = String(tokenData.id);
      
      return String(message.senderId) === userId;
    } catch (error) {
      console.error('Error determining message sender:', error);
      return false;
    }
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

  const getLastMessage = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[0].content;
    }
    return 'No messages yet';
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    const otherPartyName = userRole === 'doctor' 
      ? chat.patient?.name 
      : chat.doctor?.name;
      
    return otherPartyName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Render chat list view
  const renderChatList = () => (
    <Card className="w-full h-full max-h-[100%] flex flex-col">
      <CardHeader className="bg-medical-green-light pb-3 flex-shrink-0">
        <CardTitle className="flex justify-between items-center text-gray-800">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-medical-green-dark" />
            <span>Messages</span>
          </div>
          <Button 
            onClick={handleNewChatClick}
            variant="ghost" 
            size="icon"
            className="rounded-full bg-medical-green text-white hover:bg-medical-green-dark"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </CardTitle>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-grow">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-medical-green"></div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">{error}</div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-gray-500 h-64">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2 text-gray-400" />
                  <p>No chats found matching "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">
                    Click the + button to start a new conversation
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {filteredChats.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => handleChatSelect(chat)}
                  className="border-b last:border-b-0 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      {userRole === 'doctor' ? '' : 'Dr. '}
                      {getRecipientName(chat)}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {chat.messages?.length > 0 && formatRelativeTime(chat.messages[0].createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {getLastMessage(chat)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );

  // Render chat view
  const renderChatView = () => (
    <Card className="w-full h-full max-h-[100%] flex flex-col">
      <CardHeader className="bg-medical-green-light p-4 pb-3 flex-shrink-0">
        <div className="flex items-center">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            size="icon"
            className="mr-2 hover:bg-medical-green-light rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div>
            <CardTitle className="text-xl text-gray-800">
              {userRole === 'doctor' ? '' : 'Dr. '}{getRecipientName(selectedChat)}
            </CardTitle>
            <CardDescription>
              {userRole === 'doctor' ? 'Patient' : 'Doctor'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-grow px-4 py-2 bg-gray-50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-medical-green"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-2">
              {groupMessagesByDate().map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                      {formatDate(new Date(group.date))}
                    </div>
                  </div>
                  {group.messages.map((message, messageIndex) => (
                    <div 
                      key={message.id || messageIndex} 
                      className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 mb-1",
                          isCurrentUser(message) 
                            ? "bg-medical-green text-black rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                        )}
                      >
                        <div className="mb-1">{message.content}</div>
                        <div 
                          className={cn(
                            "text-xs",
                            isCurrentUser(message) ? "text-gray-700" : "text-gray-500"
                          )}
                        >
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </ScrollArea>
      
      <CardFooter className="p-4 border-t bg-white flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-medical-green hover:bg-medical-green-dark"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );

  // Render new chat view
  const renderNewChatView = () => (
    <Card className="w-full h-full max-h-[100%] flex flex-col">
      <CardHeader className="bg-medical-green-light flex-shrink-0">
        <div className="flex items-center">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            size="icon"
            className="mr-2 hover:bg-medical-green-light rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <CardTitle className="text-gray-800">Start a new conversation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow overflow-auto">
        {/* New chat content would go here - using existing NewChat component */}
        <p className="text-gray-500 text-center mt-8">
          Select a recipient to start a new conversation
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {statusMessage && (
        <div className="bg-medical-green-light text-medical-green-dark px-3 py-1 rounded-full text-sm mb-4 text-center flex-shrink-0">
          {statusMessage}
        </div>
      )}
      
      <div className="flex-grow overflow-hidden">
        {view === 'list' && renderChatList()}
        {view === 'chat' && selectedChat && renderChatView()}
        {view === 'new' && renderNewChatView()}
      </div>
    </div>
  );
}

export default EnhancedChatInterface; 