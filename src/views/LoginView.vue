<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">{{ tSignIn }}</h1>
      <p class="text-center text-sm text-gray-600 mb-8" v-if="!isLoggedIn">
        {{ tNoAccount }}
        <router-link to="/register" class="text-primary hover:text-orange-500 font-medium">
          {{ tCreateOne }}
        </router-link>
      </p>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
        {{ errorMessage }}
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">{{ tEmail }}</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="errors.email ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">{{ tPassword }}</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="errors.password ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-60"
        >
          <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>{{ tSigningIn }}</span>
          <span v-else>{{ tSignIn }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()
const isLoggedIn = ref(authAPI.isLocallyLoggedIn())

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const errorMessage = ref('')
const loading = ref(false)

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const tSignIn = computed(() => isZh.value ? '登录' : 'Sign in')
const tNoAccount = computed(() => isZh.value ? '还没有账户？' : 'No account yet? ')
const tCreateOne = computed(() => isZh.value ? '去注册' : 'Create one')
const tEmail = computed(() => isZh.value ? '邮箱' : 'Email')
const tPassword = computed(() => isZh.value ? '密码' : 'Password')
const tSigningIn = computed(() => isZh.value ? '登录中...' : 'Signing in...')
const tEmailRequired = computed(() => isZh.value ? '请输入邮箱。' : 'Email is required.')
const tEmailInvalid = computed(() => isZh.value ? '请输入有效的邮箱地址。' : 'Please enter a valid email address.')
const tPasswordRequired = computed(() => isZh.value ? '请输入密码。' : 'Password is required.')
const tLoginFailed = computed(() => isZh.value ? '登录失败，请重试。' : 'Login failed. Please try again.')

const validateForm = () => {
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = tEmailRequired.value
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = tEmailInvalid.value
  }

  if (!form.password) {
    errors.password = tPasswordRequired.value
  }

  return !errors.email && !errors.password
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!validateForm()) return

  try {
    loading.value = true
    const result = await authAPI.login({
      email: form.email,
      password: form.password
    })

    if (result?.profile) {
      isLoggedIn.value = true
      window.dispatchEvent(new Event('auth-changed'))
      router.replace('/account')
      return
    }

    errorMessage.value = tLoginFailed.value
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || tLoginFailed.value
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const session = await authAPI.getSession()
    isLoggedIn.value = !!session?.profile
    if (session?.profile) {
      window.dispatchEvent(new Event('auth-changed'))
      router.replace('/account')
    }
  } catch (error) {
    console.error('Session check failed:', error)
    isLoggedIn.value = authAPI.isLocallyLoggedIn()
  }
})
</script>
