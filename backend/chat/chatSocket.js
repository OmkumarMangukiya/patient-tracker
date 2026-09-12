/**
 * Socket.IO handlers for chat rooms and real-time messaging
 */
export function setupChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on("leave-chat", (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.id} left chat ${chatId}`);
    });

    // Handle new message broadcast
    socket.on("send-message", (messageData) => {
      try {
        io.to(messageData.chatId).emit("receive-message", messageData);
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("error", { message: "Failed to process message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

export default setupChatSocket;
