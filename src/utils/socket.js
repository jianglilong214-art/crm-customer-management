import { io } from 'socket.io-client'
import { ref } from 'vue'

const socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
})

export const connected = ref(false)

socket.on('connect', () => {
  connected.value = true
  console.log('Socket connected')
})

socket.on('disconnect', () => {
  connected.value = false
  console.log('Socket disconnected')
})

export function connectSocket() {
  if (!socket.connected) {
    socket.connect()
  }
}

export function disconnectSocket() {
  socket.disconnect()
}

export function onEvent(event, callback) {
  socket.on(event, callback)
}

export function offEvent(event, callback) {
  socket.off(event, callback)
}

export default socket
