import { onMounted, onUnmounted } from 'vue'
import { onEvent, offEvent } from '../utils/socket'
import { ElNotification } from 'element-plus'

export function useSync(eventName, refreshFn, options = {}) {
  const { notify = true, message = '数据已更新' } = options

  function handler(data) {
    refreshFn(data)
    if (notify) {
      ElNotification({
        title: '同步更新',
        message,
        type: 'info',
        duration: 2000,
        position: 'bottom-right'
      })
    }
  }

  onMounted(() => {
    onEvent(eventName, handler)
  })

  onUnmounted(() => {
    offEvent(eventName, handler)
  })
}
