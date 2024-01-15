import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useDisconnectButton,
  VideoTrack,
  useTracks,
  TrackReference,
} from "@livekit/components-react";
import { FC, useEffect, useState } from "react";
import { Track } from "livekit-client";
import { getApiLink } from "@/lib/routing";
import { User } from "@/lib/types";
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
  const tracks = useTracks([Track.Source.Camera]);
  const localTrack: TrackReference | undefined = tracks.filter(
    (t) => t.participant.isLocal
  )[0];
  const remoteTrack: TrackReference | undefined = tracks.filter(
    (t) => !t.participant.isLocal
  )[0];

  // end call
  const { buttonProps } = useDisconnectButton({});
  function onEnd() {
    buttonProps.onClick();
    endCall();
  }

  return (
    <div className={styles.container}>
      {!!remoteTrack && (
        <VideoTrack trackRef={remoteTrack} className={styles.remoteVideo} />
      )}
      {!!localTrack && (
        <VideoTrack trackRef={localTrack} className={styles.localVideo} />
      )}
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
