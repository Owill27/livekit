import { User } from "@/lib/types";
import { LocalVideoTrack, createLocalVideoTrack } from "livekit-client";
import { FC, useState, useEffect, ReactElement } from "react";
import {} from "@livekit/components-react";
import { VideoRenderer } from "./VideoRenderer";
import styles from "./dial-view.module.css";

type DialViewProps = {
  displayedUser: User;
  isIncoming: boolean;
  me: User;
  acceptCall: VoidFunction;
  declineCall: VoidFunction;
  endCall: VoidFunction;
};
const DialView: FC<DialViewProps> = ({
  displayedUser,
  isIncoming,
  acceptCall,
  declineCall,
  endCall,
}) => {
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [tracksArr, setTracksArr] = useState<LocalVideoTrack[]>([]);

  useEffect(() => {
    if (!videoTrack) {
      createLocalVideoTrack().then((track) => {
        setVideoTrack(track);
        setTracksArr((curr) => [...curr, track]);
      });
    }
  }, [videoTrack]);

  const beforeEnd = () => {
    if (videoTrack) {
      videoTrack.detach();
      videoTrack.stop();
      videoTrack.mediaStream?.getTracks().forEach((trck) => {
        trck.stop();
      });
      setVideoTrack(undefined);

      tracksArr.forEach((t) => {
        t.stop();
        t.detach();
        t.mediaStream?.getTracks().forEach((mt) => mt.stop());
      });

      setTracksArr([]);
    } else {
      console.log("no video track");
    }

    if (isIncoming) {
      declineCall();
    } else {
      endCall();
    }
  };

  let videoElement: ReactElement;
  if (videoTrack) {
    videoElement = (
      <VideoRenderer
        className={styles.video}
        track={videoTrack}
        isLocal={true}
      />
    );
  } else {
    videoElement = <div className="placeholder" />;
  }

  return (
    <div className={styles.container}>
      {videoElement}

      <div className={styles.overlay}>
        <div className={styles.details}>
          <div className={styles.status}>
            {isIncoming ? "Incoming call" : "Outgoing call"}
          </div>
          <div className={styles.user}>{displayedUser.name}</div>
          <div className={styles.location}>{displayedUser.location}</div>
        </div>

        <div className={styles.buttons}>
          {isIncoming && <button onClick={acceptCall}>Accept call</button>}

          <button onClick={beforeEnd} className={styles.redButton}>
            {isIncoming ? "Decline" : "End"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialView;
