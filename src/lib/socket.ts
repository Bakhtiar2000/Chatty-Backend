import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model";
import Conversation from "../models/conversation.model";

const app = express();
const server = http.createServer(app);

// Created a socket server on top of the main express server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// used to store all the online users in real-time
export const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string; // In frontend, we used this => ***query: { userId: authUser._id }*** in this line, we are recieving this query by socket.handshake.query.userId
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected users, not only one individual
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId]; // Deletes user from socket if disconnected
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("markMessagesAsSeen", async ({ conversationId }) => {
    try {
      await Message.updateMany(
        { conversationId: conversationId, seen: false },
        { $set: { seen: true } }
      );
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { "lastMessage.seen": true } }
      );

      io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
    } catch (error) {
      console.log(error);
    }
  });
});

export { io, app, server };

/*
1. io.emit -> sends messages to all clients.
2. socket.emit -> sends messages only to the client that made the request.
3. io.to(socketId).emit -> sends messages to a specific client.
4. socket.broadcast.emit -> sends messages to everyone except the sender.
5. io.to(roomName).emit -> sends messages to all clients in a specific room.
6. socket.join(roomName) and socket.leave(roomName) -> are used for adding and removing clients from rooms.
7. socket.off(listener): Removes a specific listener for the specified event.
*/
