import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useDisconnectButton,
} from "@livekit/components-react";
import { FC, useEffect, useState, ReactElement } from "react";
import { Track } from "livekit-client";
import { getApiLink } from "@/lib/routing";
import { User } from "@/lib/types";
import { VideoRenderer } from "./calls/VideoRenderer";
import styles from "./video-call-ui.module.css";

type Props = {
  me: User;
  callId: string;
  remoteLocation: string;
  onEnded: VoidFunction;
};

const VideoUI: FC<Props> = ({ callId, me, remoteLocation, onEnded }) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          getApiLink(`/token?room=${callId}&id=${me.id}`)
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [callId, me.id]);

  if (token === "") {
    return <div>Connecting call...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      // Use the default LiveKit theme for nice styles.
      data-lk-theme="default"
      style={{ height: "100vh", width: "100vw" }}
      onEnded={onEnded}
    >
      <MyVideoConference remoteLocation={remoteLocation} endCall={onEnded} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

function MyVideoConference({
  remoteLocation,
  endCall,
}: {
  remoteLocation: string;
  endCall: VoidFunction;
}) {
  const localParticipant = useLocalParticipant();
  const localVideoTrack = localParticipant.cameraTrack?.track;

  const remoteParticipant = useRemoteParticipants()[0];
  const remoteVideoTrack = remoteParticipant?.getTrack(
    Track.Source.Camera
  )?.track;

  let localVideoElement: ReactElement = (
    <div className={styles.localPlaceholder} />
  );
  let remoteVideoElement: ReactElement = (
    <div className={styles.remotePlaceholder} />
  );

  // end call
  const { buttonProps } = useDisconnectButton({});
  function onEnd() {
    buttonProps.onClick();
    endCall();
  }

  if (localVideoTrack) {
    localVideoElement = (
      <VideoRenderer
        className={styles.localVideo}
        track={localVideoTrack}
        isLocal={true}
      />
    );
  }

  if (remoteVideoTrack) {
    remoteVideoElement = (
      <VideoRenderer
        className={styles.remoteVideo}
        track={remoteVideoTrack}
        isLocal={true}
      />
    );
  }

  return (
    <div className={styles.container}>
      {remoteVideoElement}
      {localVideoElement}
      <div className={styles.controls}>
        <p>{remoteLocation}</p>
        <button onClick={onEnd} className={styles.redButton}>
          End
        </button>
      </div>
    </div>
  );
}

export default VideoUI;
