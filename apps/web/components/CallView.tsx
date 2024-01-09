import { Call, User } from "@/lib/types";
import { FC } from "react";
import VideoUI from "./VideoCallUI";
import { PreJoin } from "@livekit/components-react";

interface Props {
  call: Call;
  me: User;
  acceptCall: VoidFunction;
  declineCall: VoidFunction;
  endCall: VoidFunction;
  closeUI: VoidFunction;
}

const CallView: FC<Props> = ({
  call,
  me,
  acceptCall,
  declineCall,
  endCall,
  closeUI,
}) => {
  const isIncoming = call.receiver.id === me.id;
  const displayedUser = isIncoming ? call.caller : call.receiver;

  if (call.status === "DIALLING") {
    return (
      <div>
        <div>{displayedUser.name}</div>
        <div>{displayedUser.location}</div>
        <div>{isIncoming ? "Incoming call" : "Outgoing call"}</div>

        <PreJoin
          defaults={{ username: me.name }}
          joinLabel={
            isIncoming
              ? `Incoming call from ${displayedUser.name}`
              : `Calling ${displayedUser.name}`
          }
        />

        {isIncoming && <button onClick={acceptCall}>Accept call</button>}

        <button onClick={isIncoming ? declineCall : endCall}>
          {isIncoming ? "Decline" : "End"}
        </button>
      </div>
    );
  }

  if (call.status === "DECLINED") {
    return (
      <div>
        <div>{displayedUser.name}</div>
        <div>{displayedUser.location}</div>
        <div>Call declined</div>
        <button onClick={closeUI}>Back</button>
      </div>
    );
  }

  if (call.status === "ENDED") {
    return (
      <div>
        <div>{displayedUser.name}</div>
        <div>{displayedUser.location}</div>
        <div>Call ended</div>
        <button onClick={closeUI}>Back</button>
      </div>
    );
  }

  if (call.status === "MISSED") {
    return (
      <div>
        <div>{displayedUser.name}</div>
        <div>{displayedUser.location}</div>
        <div>No response</div>
        <button onClick={closeUI}>Back</button>
      </div>
    );
  }

  if (call.status === "ERROR") {
    return (
      <div>
        <div>{displayedUser.name}</div>
        <div>{displayedUser.location}</div>
        <div>An error occurred</div>
        {call.errMsg && <div>{call.errMsg}</div>}
        <button onClick={closeUI}>Back</button>
      </div>
    );
  }

  if (call.status === "ONGOING") {
    return <VideoUI call={call} me={me} onEnded={endCall} />;
  }

  return null;
};

export default CallView;
