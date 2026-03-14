import client from './client.js'

export const authAPI = {
  async register(userData) {
    try {
      return await client.request('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    } catch (error) {
      const message =
        error.data?.details
          ? Object.values(error.data.details).flat().join('; ')
          : error.data?.error || error.message

      const wrapped = new Error(`注册失败: ${message}`)
      wrapped.status = error.status
      wrapped.data = error.data
      throw wrapped
    }
  },

  async login(credentials) {
    try {
      const result = await client.request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (result?.profile) {
        client.setLocalSession(result.profile)
      }

      return result
    } catch (error) {
      const wrapped = new Error(`登录失败: ${error.data?.error || error.message}`)
      wrapped.status = error.status
      wrapped.data = error.data
      throw wrapped
    }
  },

  async logout() {
    try {
      await client.request('/logout', { method: 'POST' })
    } catch (error) {
      if (error.status !== 401) {
        console.error('登出请求异常:', error)
      }
    } finally {
      client.clearLocalSession()
    }
  },

  async getSession() {
    try {
      const result = await client.request('/session')

      if (result?.profile) {
        client.setLocalSession(result.profile)
      }

      return result
    } catch (error) {
      if (error.status === 401) {
        client.clearLocalSession()
        return { profile: null }
      }

      const wrapped = new Error(`会话检查失败: ${error.data?.error || error.message}`)
      wrapped.status = error.status
      wrapped.data = error.data
      throw wrapped
    }
  },

  getLocalSession() {
    return client.getLocalSession()
  },

  isLocallyLoggedIn() {
    return client.getLocalSession() !== null
  },
}
