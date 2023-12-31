import { useState, useCallback, FC, useEffect } from "react";
import { User } from "@/lib/types";
import { nanoid } from "nanoid";
import BaseLayout from "@/components/BaseLayout";
import useSWR from "swr";
import { getApiLink } from "@/lib/routing";

type CallStatus = {
  type: "incoming" | "outgoing";
  status: "ringing" | "ongoing" | "error";
  caller: User;
  receiver: User;
  errMsg?: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // registration
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const register = useCallback((usr: User) => {
    try {
      setIsRegistering(true);
      const wsLink = `${process.env.NEXT_PUBLIC_WS_URL}?name=${usr.name}&id=${usr.id}&location=${usr.location}`;
      const sock = new WebSocket(wsLink);
      sock.addEventListener("error", (evt) => {
        setRegisterError("An error occurred");
      });
      sock.addEventListener("close", () => {
        setSocket(null);
      });
      sock.addEventListener("open", () => {
        setSocket(sock);
        setUser(usr);
      });
      sock.addEventListener("message", (evt) => {
        console.log({ msgEvtData: evt.data });
      });
    } catch (error) {}
  }, []);

  // call status
  const [callStatus, setCallStatus] = useState<CallStatus>();
  const call = useCallback((receiver: User) => {
    if (!user || !socket) {
      setCallStatus(undefined);
      return;
    }

    setCallStatus({
      type: "outgoing",
      caller: user,
      receiver,
      status: "ringing",
    });

    socket.send(
      JSON.stringify({
        type: "CALL",
        receiver,
      })
    );
  }, []);

  if (!user) {
    return (
      <RegisterView
        onRegister={register}
        isRegistering={isRegistering}
        registerError={registerError}
      />
    );
  }

  if (!socket) {
    return (
      <BaseLayout>
        <div>Disconnected</div>
        <button onClick={() => register(user)}>Reconnect</button>
      </BaseLayout>
    );
  }

  if (callStatus?.status === "ringing") {
    const { receiver, caller } = callStatus;
    const isIncoming = receiver.id === user.id;
    const displayed = isIncoming ? caller : receiver;

    return (
      <div>
        <div>{displayed.name}</div>
        <div>{displayed.location}</div>
        <div>{isIncoming ? "Incoming call" : "Outgoing call"}</div>
        <button>End</button>
      </div>
    );
  }

  return <UsersList me={user} call={call} />;
}

type GetcodeResponse = {
  latitude: number;
  lookupSource: "coordinates";
  longitude: number;
  localityLanguageRequested: "en";
  continent: string;
  continentCode: string;
  countryName: string;
  countryCode: string;
  city: string;
  locality: string;
  postcode: "94043";
  plusCode: "849VCWC8+JG";
};

type RegisterProps = {
  onRegister: (user: User) => void;
  isRegistering: boolean;
  registerError?: string;
};

const RegisterView: FC<RegisterProps> = ({
  onRegister,
  isRegistering,
  registerError,
}) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  // location
  const [position, setPosition] = useState<GeolocationPosition>();
  const [isGettingPos, setIsGettingPos] = useState(false);
  const [postionError, setPostionError] = useState("");

  void isGettingPos;
  void postionError;

  // query postion
  const getPostion = useCallback(() => {
    if (!navigator.geolocation) {
      setPostionError("Unable to access location");
      setLocation("Unknown");
      return;
    }

    setIsGettingPos(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setIsGettingPos(false);
      },
      (error) => {
        setPostionError(error.message);
        setIsGettingPos(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!position) return;
    (async () => {
      try {
        const link = `https://api.bigdatacloud.net/data/reverse-geocode-client?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}`;
        const response = await fetch(link);
        if (response.ok) {
          const body = (await response.json()) as GetcodeResponse;
          if (body) {
            setLocation(`${body.city} - ${body.countryName}`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [position]);

  const [submitError, setSubmitError] = useState("");
  const onSubmit = () => {
    if (!name) {
      setSubmitError("Please enter your name");
      return;
    }

    if (!location) {
      setSubmitError("Please choose your location");
      return;
    }

    const id = nanoid();
    onRegister({
      name,
      id,
      location,
    });
  };

  return (
    <BaseLayout>
      <div>
        <div>Enter your name</div>
        <input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <div>Location</div>
        {!!location && <div>{location}</div>}
        <button onClick={() => getPostion()}>Choose location</button>
      </div>

      {(!!submitError || !!registerError) && (
        <div style={{ color: "red" }}>{submitError || registerError}</div>
      )}

      <button onClick={() => onSubmit()}>
        {isRegistering ? "Registering" : "Register"}
      </button>
    </BaseLayout>
  );
};

type UserListProps = {
  me: User;
  call: (user: User) => void;
};

const UsersList: FC<UserListProps> = ({ me, call }) => {
  const {
    data: users,
    isLoading,
    error,
  } = useSWR<User[]>(getApiLink("/users"), { refreshInterval: 3000 });

  if (isLoading) {
    return <div>Loading users</div>;
  }

  if (error && !users?.length) {
    return (
      <div>
        <div>An error occurred</div>
        <div>{JSON.stringify(error)}</div>
      </div>
    );
  }

  const filteredUsers = users?.filter((u) => u.id !== me.id);

  if (!filteredUsers?.length) {
    return <div>No online users</div>;
  }

  return (
    <div>
      <div>
        <div>{me.name} (Me)</div>
        <div>{me.location}</div>
      </div>

      <hr style={{ margin: "20px 0px" }} />

      {filteredUsers.map((u) => (
        <div key={u.id} style={{ marginTop: "20px" }}>
          <div>{u.name}</div>
          <div>{u.location}</div>
          <button onClick={() => call(u)}>Call</button>
        </div>
      ))}
    </div>
  );
};
