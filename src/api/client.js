const runtimeApiBase =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_BASE || import.meta.env.VUE_APP_API_BASE)) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.VITE_API_BASE || process.env.VUE_APP_API_BASE)) ||
  'http://127.0.0.1:3000'

function buildHttpError(status, data) {
  const message = data?.error || (typeof data === 'string' && data) || `HTTP ${status}`
  const error = new Error(message)
  error.status = status
  error.data = data
  return error
}

function getPreferredLanguage() {
  if (typeof localStorage !== 'undefined') {
    const savedLocale = localStorage.getItem('locale') || localStorage.getItem('language')
    if (savedLocale) return savedLocale
  }

  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }

  return 'en'
}

export default {
  API_BASE: String(runtimeApiBase).replace(/\/$/, ''),

  async request(endpoint, options = {}) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.API_BASE}${normalizedEndpoint}`

    const headers = {
      Accept: 'application/json',
      'Accept-Language': getPreferredLanguage(),
      ...(options.headers || {})
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const config = {
      method: 'GET',
      credentials: 'include',
      ...options,
      headers
    }

    console.log(`🚀 [API Request] ${config.method} ${url}`, options.body || '')

    try {
      const response = await fetch(url, config)
      const contentType = response.headers.get('content-type') || ''

      let data = null
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = text || null
      }

      console.log(`📬 [API Response] ${response.status} ${url}`, data)

      if (!response.ok) {
        throw buildHttpError(response.status, data)
      }

      return data
    } catch (error) {
      console.error(`❌ [API Error] ${normalizedEndpoint}:`, error)
      if (error.status === 401) {
        this.clearLocalSession()
      }
      throw error
    }
  },

  setLocalSession(profile) {
    localStorage.setItem('customer_session', JSON.stringify(profile))
  },

  getLocalSession() {
    const raw = localStorage.getItem('customer_session')
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  clearLocalSession() {
    localStorage.removeItem('customer_session')
  }
}