require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// store users
const usersMap = new Map();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.get("/token", (req, res) => {
  const url = new URL(`http://www.example.com${req.url}`);
  const room = url.searchParams.get("room");
  const userId = url.searchParams.get("id");

  if (!room) {
    return res.status(400).json({ error: 'Missing "room" query parameter' });
  }

  if (!userId) {
    return res
      .status(400)
      .json({ error: 'Missing "username" query parameter' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
  });

  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

  return res.json({ token: at.toJwt() });
});

app.get("/users", (req, res) => {
  const allUsers = Array.from(usersMap.values());

  const connectedUsers = [];
  Array.from(wss.clients.entries()).forEach(([sock]) => {
    const user = allUsers.filter((u) => u.socket === sock)[0];
    if (user) {
      connectedUsers.push(user);
    }
  });
  res.json(connectedUsers);
});

const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (clientSocket, req) => {
  // Event for handling messages

  const url = new URL(`http://example.com${req.url}`);
  const id = url.searchParams.get("id");
  const name = url.searchParams.get("name");
  const location = url.searchParams.get("location");

  if (!id || !name || !location) {
    clientSocket.close(
      undefined,
      JSON.stringify({ message: "Missing required params" })
    );
    return;
  }

  usersMap.set(id, {
    name,
    id,
    location,
    socket: clientSocket,
    status: "FREE",
  });

  clientSocket.on("message", async (data) => {
    const { type } = JSON.parse(data);

    switch (type) {
      case "CALL":
        const callReceiver = usersMap.get(data.receiver.id);
        if (!callReceiver) {
          clientSocket.emit(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Recepient not found",
            })
          );
          return;
        }

        callReceiver.socket.emit(
          JSON.stringify({
            type: "CALL",
            caller: data.caller,
          })
        );

        break;

      case "ACCEPT_CALL":
        const caller = usersMap.get(data.caller.id);
        const receiver = usersMap.get(data.receiver.id);
        if (!caller) {
          clientSocket.emit(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Caller not found",
            })
          );
          return;
        }

        caller.socket.emit(
          JSON.stringify({
            type: "ACCEPT_CALL",
            receiver,
          })
        );
        break;

      case "DECLINE_CALL":
        const clr = usersMap.get(data.caller.id);
        const rcvr = usersMap.get(data.receiver.id);

        if (!clr) {
          clientSocket.emit(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Call declined",
            })
          );
          return;
        }

        caller.socket.emit(
          JSON.stringify({
            type: "DECLINE_CALL",
            receiver: rcvr,
          })
        );
        break;

      default:
        break;
    }
  });

  clientSocket.on("error", (err) => {
    console.log("Socket error");
    console.error({ err });
  });

  // Event for user disconnect
  clientSocket.on("close", () => {
    usersMap.delete(id);
  });
});

const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
  console.log("Server is running at port:", PORT);
});
