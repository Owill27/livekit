import { Call, User } from "@/lib/types";
import { FC } from "react";
import VideoUI from "./VideoCallUI";
import DialView from "./calls/DialView";

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
      <DialView
        me={me}
        displayedUser={displayedUser}
        acceptCall={acceptCall}
        declineCall={declineCall}
        endCall={endCall}
        isIncoming={isIncoming}
      />
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
    return (
      <VideoUI
        callId={call.id}
        me={me}
        remoteLocation={displayedUser.location}
        onEnded={endCall}
      />
    );
  }

  return null;
};

export default CallView;
