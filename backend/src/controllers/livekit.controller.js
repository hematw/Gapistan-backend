import { AccessToken } from 'livekit-server-sdk';

export const getLivekitToken = async (req, res) => {
  const { userId, roomName } = req.query;

  if (!userId || !roomName) {
    return res.status(400).json({ message: 'userId and roomName are required' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    ttl: 60 * 60, // 1 hour
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  res.json({ token });
}