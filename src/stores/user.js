import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/auth'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUser() || {})

  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password })
    if (res.code === 200) {
      token.value = res.data.token
      userInfo.value = res.data.user
      setToken(res.data.token)
      setUser(res.data.user)
    }
    return res
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    removeToken()
    removeUser()
  }

  async function fetchUserInfo() {
    const res = await request.get('/user/info')
    if (res.code === 200) {
      userInfo.value = res.data
      setUser(res.data)
    }
    return res
  }

  return { token, userInfo, login, logout, fetchUserInfo }
})
