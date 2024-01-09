# Sample WebRTC call signalling server

This API allows you to link your client and make calls using livekit

## Flow

Connect to the Websocket endpoint. The connection params should include user details `name`, `id`, and `location`. A sample web socket link looks like this `wss://livekit-app-ttycw.ondigitalocean.app/?name=nnn&id=Cg7V3h-NoYMbM9f2szLNj&location=Nairobi%20-%20Kenya`

Once connected, you should listen for events on your websocket client. Each event comes with a `type` and `call` properties. The type describes the event, while the call hold the call data

| Event Type    | Description                                    |
| ------------- | ---------------------------------------------- |
| INCOMING_CALL | A new call has come in                         |
| ACCEPT_CALL   | On the caller side. The call has been accepted |
| DECLINE_CALL  | On the caller side. The call has been declined |
| END_CALL      | Both caller and receiver. Call ended           |

A call object has this structure

```json
{
  id: 'call-id';
  caller: User;
  receiver: User;
  status: CallStatuses;
  errMsg?: 'example-error-message (optional)';
}
```

While a user object

```json
{
  id: string;
  name: string;
  location: string;
}
```

Call statuses

```
> DIALLING
> ONGOING
> ENDED
> DECLINED
> MISSED
> ERROR"
```

2. Once connected, you can query for online users at the endpoint `/users`, e.g `https://livekit-app-ttycw.ondigitalocean.app/users`. This returns an array of all users that are online, e.g:

```json
  [
    {
      name: 'William',
      id: '123',
      location: 'Nairobi Kenya'
    }
    {
      name: 'Wise',
      id: '223',
      location: 'Nairobi Kenya'
    }
  ]
```

# Call someone

Send request to `/calls/start`

Params:

```json
{
  "callerId": "who-is-calling",
  "receiverId": "receiver-id"
}
```

Response: A new `call` object

# Answer a call

Send request to `/calls/answer`

Params:

```json
{
  "callId": "call-id",
  "answer": "ACCEPT | DECLINE"
}
```

Response: An updated `call` object

# End a call

Send request to `/calls/end`

Params:

```json
{
  "callId": "call-id",
  "userId": "user-id"
}
```

Response: An updated `call` object

---

Once a call is in the `ONGOING` status, you can display the livekit components to start the video. Use the `call.id` as the room and `user.id` as the user's id.

To get the token, send a request to `/token`, adding in the `room` (callId) and `id` (user's id). E.g: `https://livekit-app-ttycw.ondigitalocean.app/token?room=call-id&id=me.id`
