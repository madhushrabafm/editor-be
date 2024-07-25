import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server);

const userSocketMap = {};
// {
//   "random room id vmirvnrkvnrekjfre" : "username",
//   "randomid 2 KEY " : "username 2 VALUE",
// } in this format data will be stored in userSocketMap

const getAllUsers = (roid) => {
  return Array.from(io.sockets.adapter.rooms.get(roid) || []).map(
    (socket_id) => {
      return {
        socket_id,
        username: userSocketMap[socket_id],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log("socket connection", socket.id);

  // receivieng from frontend
  socket.on("joinRoom", ({ roomid, username }) => {
    // storing the username as KEY  in userSocketMap
    userSocketMap[socket.id] = username;
    socket.join(roomid); //entering the new user in the defined roomid
    const allUsers = getAllUsers(roomid); //getting all users from the room
    console.log(allUsers);
    // send notif to other users when new user joins
    allUsers.forEach(({ socket_id }) => {
      //when new user joins room
      io.to(socket_id).emit("joined", {
        allUsers,
        username,
        socketid: socket.id,
      });
    });
  });

  // when user disconnects

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomid) => {
      //emit- sending the specific user leavingg room msg to others
      socket.in(roomid).emit("disconnected", {
        socket_id: socket.id,
        username: userSocketMap[socket.id], // accessing thhe key (userSocketMap.socket_id) similar
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.get("/", (req, res) => {
  res.send("madhua");
});

server.listen(3333, () => {
  console.log("server onn d >>>>>>>>>>>>>>>");
});
