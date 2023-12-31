import { AccessToken } from "livekit-server-sdk";
import { NextApiHandler } from "next";

const getToken: NextApiHandler = (req, res) => {
  const { room, username } = req.query;

  if (!room || typeof room !== "string") {
    return res.status(400).json({ error: 'Missing "room" query parameter' });
  }

  if (!username || typeof room !== "string") {
    return res
      .status(400)
      .json({ error: 'Missing "username" query parameter' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username as string,
  });

  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

  return res.json({ token: at.toJwt() });
};

export default getToken;
