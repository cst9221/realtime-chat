const express = require("express");
const app = express();
const path = require("path");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const PORT = 3000 || process.env.PORT;

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "챗봇";

// Run wher client connect
io.on("connection", (socket) => {
  //qs정보로 emit요청을 받는다
  socket.on("joinRoom", ({ username, room }) => {
    //userJoin으로 유저정보를 user에 저장하여 사용
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current a user connects
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord~!"));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has join the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //Listen for chatMessage, 클라이언트에서 보낸 emit을 받는다
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    //io에 연결된 모두에게 보냄
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`${PORT} is open`);
});

// Realtime Chat With Users & Rooms - Socket.io, Node & Express
// https://www.youtube.com/watch?v=jD7FnbI76Hg&t=2258s
