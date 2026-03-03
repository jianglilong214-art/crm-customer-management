import { io } from 'socket.io-client'
import { ref } from 'vue'

export const connected = ref(false)

// 云端部署时不使用 Socket.IO（Cloudflare Workers 不支持）
const isCloudMode = !!import.meta.env.VITE_API_URL

let socket = null

if (!isCloudMode) {
  socket = io(window.location.origin, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })

  socket.on('connect', () => {
    connected.value = true
  })

  socket.on('disconnect', () => {
    connected.value = false
  })
}

export function connectSocket() {
  if (socket && !socket.connected) {
    socket.connect()
  }
}

export function disconnectSocket() {
  if (socket) socket.disconnect()
}

export function onEvent(event, callback) {
  if (socket) socket.on(event, callback)
}

export function offEvent(event, callback) {
  if (socket) socket.off(event, callback)
}

export default socket
