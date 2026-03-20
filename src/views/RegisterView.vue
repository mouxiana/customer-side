<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">{{ tCreateAccount }}</h1>
      <p class="text-center text-sm text-gray-600 mb-8">
        {{ tAlreadyHaveAccount }}
        <router-link to="/login" class="text-primary hover:text-orange-500 font-medium">
          {{ tSignIn }}
        </router-link>
      </p>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
        {{ successMessage }}
      </div>

      <form class="space-y-5" @submit.prevent="handleRegister">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">{{ tFullName }}</label>
          <input
            id="fullName"
            v-model.trim="form.fullName"
            type="text"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.fullName ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.fullName" class="mt-1 text-sm text-red-600">{{ validationErrors.fullName }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">{{ tEmail }}</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.email ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.email" class="mt-1 text-sm text-red-600">{{ validationErrors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">{{ tPassword }}</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.password ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.password" class="mt-1 text-sm text-red-600">{{ validationErrors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">{{ tConfirmPassword }}</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.confirmPassword" class="mt-1 text-sm text-red-600">{{ validationErrors.confirmPassword }}</p>
        </div>

        <div>
          <label for="shippingAddress" class="block text-sm font-medium text-gray-700 mb-2">{{ tShippingAddress }}</label>
          <textarea
            id="shippingAddress"
            v-model.trim="form.shippingAddress"
            rows="3"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.shippingAddress ? 'border-red-300' : 'border-gray-300'"
          ></textarea>
          <p v-if="validationErrors.shippingAddress" class="mt-1 text-sm text-red-600">{{ validationErrors.shippingAddress }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-60"
        >
          <span v-if="isLoading"><i class="fas fa-spinner fa-spin mr-2"></i>{{ tCreatingAccount }}</span>
          <span v-else>{{ tCreateAccount }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationErrors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
})

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const tCreateAccount = computed(() => isZh.value ? '注册账户' : 'Create account')
const tAlreadyHaveAccount = computed(() => isZh.value ? '已经有账户？' : 'Already have an account? ')
const tSignIn = computed(() => isZh.value ? '去登录' : 'Sign in')
const tFullName = computed(() => isZh.value ? '姓名' : 'Full name')
const tEmail = computed(() => isZh.value ? '邮箱' : 'Email')
const tPassword = computed(() => isZh.value ? '密码' : 'Password')
const tConfirmPassword = computed(() => isZh.value ? '确认密码' : 'Confirm password')
const tShippingAddress = computed(() => isZh.value ? '收货地址' : 'Shipping address')
const tCreatingAccount = computed(() => isZh.value ? '注册中...' : 'Creating account...')
const tRegisterSuccess = computed(() => isZh.value ? '注册成功，正在跳转到登录页...' : 'Registration successful. Redirecting to login...')
const tRegisterFailed = computed(() => isZh.value ? '注册失败，请重试。' : 'Registration failed. Please try again.')
const tFullNameRequired = computed(() => isZh.value ? '请输入姓名。' : 'Full name is required.')
const tEmailRequired = computed(() => isZh.value ? '请输入邮箱。' : 'Email is required.')
const tEmailInvalid = computed(() => isZh.value ? '请输入有效的邮箱地址。' : 'Please enter a valid email address.')
const tPasswordRequired = computed(() => isZh.value ? '请输入密码。' : 'Password is required.')
const tPasswordLength = computed(() => isZh.value ? '密码长度至少为 6 位。' : 'Password must be at least 6 characters.')
const tConfirmRequired = computed(() => isZh.value ? '请再次输入密码。' : 'Please confirm your password.')
const tPasswordsNotMatch = computed(() => isZh.value ? '两次输入的密码不一致。' : 'Passwords do not match.')
const tAddressRequired = computed(() => isZh.value ? '请输入收货地址。' : 'Shipping address is required.')

const clearValidationErrors = () => {
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = ''
  })
}

const validateForm = () => {
  clearValidationErrors()

  if (!form.fullName) validationErrors.fullName = tFullNameRequired.value
  if (!form.email) {
    validationErrors.email = tEmailRequired.value
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    validationErrors.email = tEmailInvalid.value
  }

  if (!form.password) {
    validationErrors.password = tPasswordRequired.value
  } else if (form.password.length < 6) {
    validationErrors.password = tPasswordLength.value
  }

  if (!form.confirmPassword) {
    validationErrors.confirmPassword = tConfirmRequired.value
  } else if (form.password !== form.confirmPassword) {
    validationErrors.confirmPassword = tPasswordsNotMatch.value
  }

  if (!form.shippingAddress) validationErrors.shippingAddress = tAddressRequired.value

  return Object.values(validationErrors).every((value) => !value)
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  try {
    isLoading.value = true
    const result = await authAPI.register({
      full_name: form.fullName,
      email: form.email,
      password: form.password,
      shipping_address: form.shippingAddress
    })

    successMessage.value = result?.message || tRegisterSuccess.value

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error) {
    console.error('Registration failed:', error)
    errorMessage.value = error.message || tRegisterFailed.value
  } finally {
    isLoading.value = false
  }
}
</script>
