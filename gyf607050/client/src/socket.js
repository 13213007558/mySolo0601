import { io } from 'socket.io-client';

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

export default socket;
