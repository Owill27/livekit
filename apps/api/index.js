require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

// mock stores
const usersMap = new Map();
let callLogs = [];

const diallingStatus = "DIALLING";
const ongoingStatus = "ONGOING";
const endedStatus = "ENDED";
const declinedStatus = "DECLINED";
const missedStatus = "MISSED";

const inactiveStatuses = [endedStatus, declinedStatus, missedStatus];

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.get("/token", (req, res) => {
  console.log("Request for token");

  const url = new URL(`http://www.example.com${req.url}`);
  const room = url.searchParams.get("room");
  const userId = url.searchParams.get("id");

  console.log({ room, userId });

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

const getConnectedUsers = () => {
  console.log("Fetching connected users");
  const allUsers = Array.from(usersMap.values());

  const connectedUsers = [];
  Array.from(wss.clients.entries()).forEach(([sock]) => {
    const user = allUsers.filter((u) => u.socket === sock)[0];
    if (user) {
      connectedUsers.push(user);
    }
  });
  return connectedUsers;
};

app.get("/users", (req, res) => {
  const connectedUsers = getConnectedUsers();
  res.json(connectedUsers);
});

app.post("/calls/start", (req, res) => {
  console.log("Request to start a call");
  const { receiverId, callerId } = req.body;

  console.log({ callerId, receiverId });

  const caller = usersMap.get(callerId);
  const receiver = usersMap.get(receiverId);

  if (!caller) {
    return res.status(404).json({
      message: "Caller is offline",
    });
  }

  if (!receiver) {
    return res.status(404).json({
      message: "Receiver is offline",
    });
  }

  const hasOngoingCall = callLogs.some(
    (c) => c.receiver.id === receiverId && !inactiveStatuses.includes(c.status)
  );

  if (hasOngoingCall) {
    return res.status(400).json({
      message: "Receiver busy",
    });
  }

  const newCall = {
    id: new Date().toISOString(),
    caller,
    receiver,
    status: diallingStatus,
  };

  receiver.socket.send(
    JSON.stringify({
      type: "INCOMING_CALL",
      call: newCall,
    })
  );

  callLogs.push(newCall);
  res.json(newCall);
});

app.post("/calls/answer", (req, res) => {
  const { callId, answer } = req.body;

  let call = callLogs.filter((c) => c.id === callId)[0];

  if (!call) {
    return res.status(400).json({
      message: "Call not found",
    });
  }

  const caller = usersMap.get(call.caller.id);
  const receiver = usersMap.get(call.receiver.id);

  if (!caller) {
    res.status(404).json({ message: "Caller offline" });
  }

  if (!receiver) {
    res.status(404).json({ message: "Receiver offline" });
  }

  switch (answer) {
    case "ACCEPT":
      call.status = ongoingStatus;
      caller.socket.send(
        JSON.stringify({
          type: "ACCEPT_CALL",
          call,
        })
      );
      break;

    case "DECLINE":
      call.status = declinedStatus;
      caller.socket.send(
        JSON.stringify({
          type: "DECLINE_CALL",
          call,
        })
      );

    default:
      break;
  }

  callLogs = callLogs.map((c) => {
    if (c.id === callId) {
      return call;
    } else {
      return c;
    }
  });

  res.json(call);
});

app.post("/calls/end", (req, res) => {
  const { callId, userId } = req.body;

  let call = callLogs.filter((c) => c.id === callId)[0];

  if (!call) {
    return res.status(400).json({
      message: "Call not found",
    });
  }

  const caller = usersMap.get(call.caller.id);
  const receiver = usersMap.get(call.receiver.id);

  if (!caller) {
    res.status(404).json({ message: "Caller offline" });
  }

  if (!receiver) {
    res.status(404).json({ message: "Receiver offline" });
  }

  call.status = endedStatus;

  const notifiedParty = caller.id === userId ? receiver : caller;

  notifiedParty.socket.send(
    JSON.stringify({
      type: "END_CALL",
      call,
    })
  );

  callLogs = callLogs.map((c) => {
    if (c.id === callId) {
      return call;
    } else {
      return c;
    }
  });

  res.json(call);
});

const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (clientSocket, req) => {
  console.log("Got a websocket connection");
  // Event for handling messages

  const url = new URL(`http://example.com${req.url}`);
  const id = url.searchParams.get("id");
  const name = url.searchParams.get("name");
  const location = url.searchParams.get("location");

  console.log({ id, name, location });

  if (!id || !name || !location) {
    console.log("Missing required params, closing connection");
    clientSocket.close(
      undefined,
      JSON.stringify({ message: "Missing required params" })
    );
    return;
  }

  console.log("Adding to users map");
  usersMap.set(id, {
    name,
    id,
    location,
    socket: clientSocket,
  });

  clientSocket.isAlive = true;
  clientSocket.on("message", async (data) => {
    console.log(
      "Received a websocket message, setting status to alive and handling"
    );
    clientSocket.isAlive = true;
    const { type } = JSON.parse(data);
    console.log({ messageType: type });

    switch (type) {
      case "PONG":
        clientSocket.isAlive = true;
        return;

      case "CALL":
        const callReceiver = usersMap.get(data.receiver.id);
        if (!callReceiver) {
          clientsocket.send(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Recepient not found",
            })
          );
          return;
        }

        callReceiver.socket.send(
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
          clientsocket.send(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Caller not found",
            })
          );
          return;
        }

        caller.socket.send(
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
          clientsocket.send(
            JSON.stringify({
              type: "CALL_ERROR",
              message: "Call declined",
            })
          );
          return;
        }

        caller.socket.send(
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
  clientSocket.on("close", (evt) => {
    console.log("Client socket closed");
    console.log(evt);
    usersMap.delete(id);
  });
});

setInterval(function ping() {
  console.log("Runnint ping function");
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log("Terminating dead connection");
      return ws.terminate();
    }

    ws.isAlive = false;
    console.log("Sending ping event");
    ws.send(JSON.stringify({ type: "PING" }));
  });
}, 29000);

const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
  console.log("Server is running at port:", PORT);
});
