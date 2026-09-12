import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ChevronLeft, Plus, Search } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { io } from 'socket.io-client';

import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "../../Components/ui/card";
import { ScrollArea } from "../../Components/ui/scroll-area";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { cn } from "../../lib/utils";

function EnhancedChatInterface({ userRole, initialSelectedPatient, onPatientSelect, onBack }) {
  const [view, setView] = useState(initialSelectedPatient ? 'new' : 'list'); // 'list', 'chat', 'new'
  const [fromInitialPatient, setFromInitialPatient] = useState(Boolean(initialSelectedPatient));
  const [selectedChat, setSelectedChat] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(initialSelectedPatient);
  const messagesEndRef = useRef(null);

  // Handle initialSelectedPatient prop
  useEffect(() => {
    if (initialSelectedPatient) {
      setSelectedPatient(initialSelectedPatient);
      setFromInitialPatient(true);
      setView('new');
    }
  }, [initialSelectedPatient]);

  // Connect to the socket
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000');
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
        const response = await apiClient.get(
          `/${userRole}/chats`,
          { headers: { Authorization: `Bearer ${token}` } }
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
        const response = await apiClient.get(`/chats/${selectedChat.id}/messages`, {
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
    if (fromInitialPatient && onBack) {
      setFromInitialPatient(false);
      if (onPatientSelect) onPatientSelect();
      onBack();
      return;
    }
    setView('list');
    setMessages([]);
    setSelectedChat(null);
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
      await apiClient.post(`/chats/${selectedChat.id}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <Card className="w-full h-full max-h-full flex flex-col bg-surface-lowest shadow-xs ring-1 ring-outline-variant/60 rounded-2xl overflow-hidden">
      <CardHeader className="bg-surface-lowest border-b border-outline-variant/60 pb-3 pt-4 px-4 sm:px-5 shrink-0">
        <CardTitle className="flex justify-between items-center text-primary-container">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2.5 text-primary" />
            <span className="font-bold text-lg tracking-tight">Messages</span>
          </div>
          <Button
            onClick={handleNewChatClick}
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        <div className="relative mt-2">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8.5 text-xs rounded-xl border-outline-variant/60 bg-surface-variant/30 text-primary-container"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant opacity-60" />
        </div>
      </CardHeader>

      <ScrollArea className="grow">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-xs text-[#D93838]">{error}</div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-on-surface-variant h-64">
              {searchQuery ? (
                <>
                  <Search className="h-6 w-6 mb-2 opacity-50" />
                  <p className="text-xs">No chats found matching "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-primary-container mb-1">No conversations yet</p>
                  <p className="text-[11px]">
                    Click the + button to start a new conversation
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/40">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className="p-3 sm:p-3.5 hover:bg-surface-variant/40 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs text-primary-container">
                      {userRole === 'doctor' ? '' : 'Dr. '}
                      {getRecipientName(chat)}
                    </h3>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {chat.messages?.length > 0 && formatRelativeTime(chat.messages[0].createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">
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
    <Card className="w-full h-full max-h-full flex flex-col bg-surface-lowest shadow-xs ring-1 ring-outline-variant/60 rounded-2xl overflow-hidden">
      <CardHeader className="bg-surface-lowest border-b border-outline-variant/60 p-3 sm:p-4 shrink-0">
        <div className="flex items-center">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="mr-2 h-7 w-7 hover:bg-surface-container-low rounded-full"
          >
            <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
          </Button>
          <div>
            <CardTitle className="text-base font-bold text-primary-container leading-none">
              {userRole === 'doctor' ? '' : 'Dr. '}{getRecipientName(selectedChat)}
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant font-medium mt-0.5">
              {userRole === 'doctor' ? 'Patient' : 'Doctor'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="grow px-3 sm:px-4 py-2 bg-surface">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-xs text-on-surface-variant">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-2">
              {groupMessagesByDate().map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center my-3">
                    <div className="bg-surface-variant/70 border border-outline-variant/60 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                      {formatDate(new Date(group.date))}
                    </div>
                  </div>
                  {group.messages.map((message, messageIndex) => (
                    <div
                      key={message.id || messageIndex}
                      className="mb-2.5"
                    >
                      {/* Message container with alignment */}
                      <div className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-xl p-2.5 sm:p-3 text-xs shadow-xs",
                            isCurrentUser(message)
                              ? "bg-primary-container text-on-primary rounded-br-xs"
                              : "bg-surface-lowest text-on-surface-variant rounded-bl-xs border border-outline-variant/60"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>

                      {/* Timestamp - completely separate row */}
                      <div className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'} mt-0.5`}>
                        <div
                          className={cn(
                            "text-[10px]",
                            isCurrentUser(message) ? "text-on-surface-variant/70 mr-1" : "text-on-surface-variant/70 ml-1"
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

      <CardFooter className="p-2.5 sm:p-3 border-t border-outline-variant/60 bg-surface-lowest shrink-0">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 text-xs rounded-xl border-outline-variant/60 bg-surface text-primary-container"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-on-primary hover:bg-primary-container rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all shrink-0 shadow-xs"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );

  // Render new chat view
  const renderNewChatView = () => (
    <Card className="w-full h-full max-h-full flex flex-col bg-surface-lowest ring-1 ring-outline-variant/60 rounded-2xl overflow-hidden shadow-xs">
      <CardHeader className="bg-surface-container-low/50 border-b border-outline-variant/60 p-3 sm:p-4 shrink-0">
        <div className="flex items-center">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="mr-2 h-7 w-7 hover:bg-surface-container-low rounded-full"
          >
            <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
          </Button>
          <CardTitle className="text-base font-bold text-primary-container">
            {selectedPatient ? `Chat with ${selectedPatient.name}` : 'Start a new conversation'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 grow overflow-auto">
        {selectedPatient ? (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-primary-container mb-1">{selectedPatient.name}</h3>
            <p className="text-xs text-on-surface-variant font-medium mb-5">
              {selectedPatient.age && `${selectedPatient.age} years old`}
              {selectedPatient.phone && ` • ${selectedPatient.phone}`}
            </p>
            <Button
              onClick={async () => {
                try {
                  setLoading(true);
                  setError('');
                  const token = localStorage.getItem('token');

                  // Find patient ID to use (try multiple properties)
                  const patientId = selectedPatient._id || selectedPatient.id || selectedPatient.uniqueId;

                  if (!patientId) {
                    console.error('Cannot determine patient ID');
                    setError('Patient ID not found');
                    setLoading(false);
                    return;
                  }

                  // Check if chat already exists
                  const existingChats = await apiClient.get(
                    `/${userRole}/chats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  // Check multiple ID properties to find a match
                  let existingChat = existingChats.data.find(chat => {
                    if (!chat.participants) return false;

                    return chat.participants.some(p =>
                      (p.id && (p.id === patientId)) ||
                      (p._id && (p._id === patientId)) ||
                      (p.uniqueId && (p.uniqueId === patientId))
                    );
                  });

                  if (existingChat) {
                    console.log('Found existing chat:', existingChat);
                    handleChatStart({ ...existingChat, isExisting: true });
                  } else {
                    try {
                      // Create new chat
                      const tokenData = JSON.parse(atob(token.split('.')[1]));
                      const currentUserId = tokenData.id;

                      // Prepare request based on user role
                      let chatData = {};
                      if (userRole === 'doctor') {
                        // Ensure patientId is a number
                        const numericPatientId = parseInt(patientId, 10);
                        if (isNaN(numericPatientId)) {
                          console.error('Patient ID is not a valid number:', patientId);
                          setError('Invalid patient ID format');
                          setLoading(false);
                          return;
                        }

                        chatData = {
                          doctorId: currentUserId,
                          patientId: numericPatientId
                        };
                      } else {
                        // Ensure doctorId is a number
                        const numericDoctorId = parseInt(patientId, 10);
                        if (isNaN(numericDoctorId)) {
                          console.error('Doctor ID is not a valid number:', patientId);
                          setError('Invalid doctor ID format');
                          setLoading(false);
                          return;
                        }

                        chatData = {
                          patientId: currentUserId,
                          doctorId: numericDoctorId
                        };
                      }

                      console.log('Creating chat with data:', chatData);

                      const response = await apiClient.post(
                        '/chats',
                        chatData,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      console.log('Created new chat:', response.data);
                      handleChatStart({ ...response.data, isNew: true });
                    } catch (chatCreateError) {
                      console.error('Error creating chat:', chatCreateError);

                      // If there's any error, display specific message and try find method
                      if (chatCreateError.response?.status === 400) {
                        setStatusMessage('Using existing conversation instead');

                        // Refresh chats list and filter again
                        const refreshedChats = await apiClient.get(
                          `/${userRole}/chats`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );

                        // Find by name - different approach depending on role
                        let chatByName;
                        if (userRole === 'doctor') {
                          // Doctor looking for patient chat
                          chatByName = refreshedChats.data.find(chat =>
                            chat.patient && (
                              (chat.patient.name && chat.patient.name.toLowerCase() === selectedPatient.name.toLowerCase()) ||
                              (chat.patient.email && chat.patient.email.toLowerCase() === selectedPatient.email?.toLowerCase())
                            )
                          );
                        } else {
                          // Patient looking for doctor chat
                          chatByName = refreshedChats.data.find(chat =>
                            chat.doctor && (
                              (chat.doctor.name && chat.doctor.name.toLowerCase() === selectedPatient.name.toLowerCase()) ||
                              (chat.doctor.email && chat.doctor.email.toLowerCase() === selectedPatient.email?.toLowerCase())
                            )
                          );
                        }

                        if (chatByName) {
                          console.log('Found chat by name match:', chatByName);
                          handleChatStart({ ...chatByName, isExisting: true });
                        } else {
                          setError('Could not find or create a conversation with this person');
                        }
                      } else {
                        setError('Failed to start conversation');
                      }
                    }
                  }
                  setLoading(false);
                } catch (error) {
                  console.error('Error in chat process:', error);
                  setError('Failed to open conversation');
                  setLoading(false);
                }
              }}
              className="bg-primary-container hover:bg-[#0d1322] text-on-primary font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
              disabled={loading}
            >
              {loading ? 'Processing...' : error ? 'Try Again' : 'Start conversation'}
            </Button>
            {error && (
              <div className="mt-3 text-[#D93838] text-xs font-medium">
                {error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-on-surface-variant text-xs text-center mt-8">
            Select a recipient to start a new conversation
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {statusMessage && (
        <div className="bg-medical-green-light text-medical-green-dark px-3 py-1 rounded-full text-sm mb-4 text-center shrink-0">
          {statusMessage}
        </div>
      )}

      <div className="grow overflow-hidden">
        {view === 'list' && renderChatList()}
        {view === 'chat' && selectedChat && renderChatView()}
        {view === 'new' && renderNewChatView()}
      </div>
    </div>
  );
}

export default EnhancedChatInterface; 