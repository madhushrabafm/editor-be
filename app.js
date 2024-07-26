import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server);

const userSocketMap = {};

// Utility function to get all users in a room
const getAllUsers = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log("socket connection", socket.id);

  // Handle joinRoom event
  socket.on("joinRoom", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const allUsers = getAllUsers(roomId);
    console.log(allUsers);

    // Notify other users that a new user has joined
    allUsers.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        allUsers,
        username,
        socketId: socket.id,
      });
    });

    // Request code sync for the new user
    socket.emit("requestCodeSync");
  });

  // Handle code change event
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-change", { code });
  });

  // Sync code to new user
  socket.on("syncCode", ({ socketId, code }) => {
    io.to(socketId).emit("code-change", { code });
  });

  // Handle user disconnection
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

server.listen(3333, () => {
  console.log("Server running on port 3333");
});
