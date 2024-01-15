import { useState, useCallback } from "react";
import { Call, User } from "@/lib/types";
import { UsersList } from "@/components/UsersList";
import { RegisterView } from "@/components/RegisterView";
import { getApiLink } from "@/lib/routing";
import CallView from "@/components/CallView";

export default function Home() {
  // user details
  const [user, setUser] = useState<User | null>(null);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [connectedAt, setConnectedAt] = useState<Date>();

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnectingSock, setIsConnectingSock] = useState(false);
  const [socketError, setSocketError] = useState("");

  const connectSocket = useCallback(
    (usr: User) => {
      console.log("Connecting socket");
      try {
        setIsConnectingSock(true);
        const wsLink = `${process.env.NEXT_PUBLIC_WS_URL}?name=${usr.name}&id=${usr.id}&location=${usr.location}`;

        const sock = new WebSocket(wsLink);
        sock.addEventListener("error", (evt) => {
          console.error(evt);
          setSocketError("Unable to register websocket");
          setIsConnectingSock(false);
        });
        sock.addEventListener("close", () => {
          console.log("Socket closed");
          const now = new Date();
          setSocket(null);
          setIsConnectingSock(false);

          console.log(`Connected at ${connectedAt}`);
          console.log(`Disconnected at ${now}`);
          console.log(
            `Connection duration: ${
              ((connectedAt?.valueOf() || 0) - now.valueOf()) / 1000
            } seconds`
          );
        });
        sock.addEventListener("open", () => {
          const now = new Date();
          console.log(`Connected at ${now}`);
          setConnectedAt(now);
          console.log("Socket opened");
          setSocket(sock);
          setIsConnectingSock(false);
        });

        sock.addEventListener("message", (evt) => {
          console.log("message event");
          try {
            const message = JSON.parse(evt.data);
            console.log({ messageType: message.type });
            switch (message.type) {
              case "INCOMING_CALL":
                setCurrentCall(message.call);
                break;

              case "ACCEPT_CALL":
                console.log(message.call);
                setCurrentCall(message.call);
                break;

              case "DECLINE_CALL":
                setCurrentCall(message.call);
                break;

              case "END_CALL":
                setCurrentCall(message.call);
                window.location.reload();
                break;

              case "PING":
                console.log("Got a ping event, sending back a pong");
                sock.send(JSON.stringify({ type: "PONG" }));
                break;

              default:
                break;
            }
          } catch (error) {
            console.log("Unable to parse message");
            console.log(evt.data);
            console.error(error);
          }
        });
      } catch (error) {
        console.error(error);
        setIsConnectingSock(false);
      }
    },
    [connectedAt]
  );

  const call = useCallback(
    async (receiver: User) => {
      if (!user || !socket) {
        setCurrentCall(null);
        return;
      }

      try {
        setCurrentCall({
          caller: user,
          id: "random",
          receiver,
          status: "DIALLING",
        });

        const callResponse = await fetch(getApiLink("/calls/start"), {
          method: "POST",
          body: JSON.stringify({ callerId: user.id, receiverId: receiver.id }),
          headers: { "Content-Type": "application/json" },
        });

        const body = await callResponse.json();
        if (callResponse.ok) {
          setCurrentCall(body);
        } else {
          throw body.message;
        }
      } catch (error: any) {
        setCurrentCall(
          (call) =>
            call && {
              ...call,
              status: "ERROR",
              errMsg: error.message || "Unable to place call",
            }
        );
      }
    },
    [socket, user]
  );

  const answerCall = useCallback(
    async (answer: "ACCEPT" | "DECLINE") => {
      try {
        if (!currentCall) {
          throw new Error("No call found");
        }

        const answerResponse = await fetch(getApiLink("/calls/answer"), {
          method: "POST",
          body: JSON.stringify({ callId: currentCall.id, answer }),
          headers: { "Content-Type": "application/json" },
        });

        const call = await answerResponse.json();
        if (answerResponse.ok) {
          setCurrentCall(call);
        } else {
          throw call.message;
        }
      } catch (error: any) {
        setCurrentCall(
          (current) =>
            current && {
              ...current,
              status: "ERROR",
              errMsg: error.message || "Unable to answer call",
            }
        );
      }
    },
    [currentCall]
  );

  const endCall = useCallback(async () => {
    try {
      if (!currentCall) {
        throw new Error("No call found");
      }

      const endResponse = await fetch(getApiLink("/calls/end"), {
        method: "POST",
        body: JSON.stringify({ callId: currentCall.id, userId: user?.id }),
        headers: { "Content-Type": "application/json" },
      });

      const call = await endResponse.json();
      if (endResponse.ok) {
        setCurrentCall(call);
        window.location.reload();
      } else {
        throw call.message;
      }
    } catch (error: any) {
      setCurrentCall(
        (current) =>
          current && {
            ...current,
            status: "ERROR",
            errMsg: error.message || "Unable to answer call",
          }
      );
    }
  }, [currentCall, user?.id]);

  const onRegister = useCallback(
    (user: User) => {
      setUser(user);
      connectSocket(user);
    },
    [connectSocket]
  );

  if (!user) {
    return <RegisterView onRegister={onRegister} />;
  }

  if (!socket) {
    return (
      <div>
        <div>{isConnectingSock ? "Connecting socket" : "Disconnected"}</div>
        {!!socketError && <div>{socketError}</div>}
        {!isConnectingSock && (
          <button onClick={() => connectSocket(user)}>Reconnect</button>
        )}
      </div>
    );
  }

  if (currentCall) {
    return (
      <CallView
        acceptCall={() => answerCall("ACCEPT")}
        declineCall={() => answerCall("DECLINE")}
        endCall={endCall}
        closeUI={() => setCurrentCall(null)}
        call={currentCall}
        me={user}
      />
    );
  }

  return <UsersList me={user} call={call} />;
}
