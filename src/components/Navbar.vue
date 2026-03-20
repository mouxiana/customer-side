<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-10">
          <router-link to="/" class="text-2xl font-bold text-primary">
            BrandStore
          </router-link>

          <nav class="hidden md:flex space-x-8">
            <router-link to="/" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              {{ tHome }}
            </router-link>
            <router-link to="/products" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              {{ tProducts }}
            </router-link>
            <router-link to="/orders" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              {{ tMyOrders }}
            </router-link>
          </nav>
        </div>

        <div class="flex items-center space-x-4">
          <form class="relative hidden md:block" @submit.prevent="handleGlobalSearch">
            <input
              v-model.trim="globalSearch"
              type="text"
              :placeholder="tSearchPlaceholder"
              class="search-input w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10"
            >
            <button
              type="submit"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200"
              :aria-label="tSearchPlaceholder"
            >
              <i class="fas fa-search"></i>
            </button>
          </form>

          <select
            v-model="currentLocale"
            @change="changeLanguage"
            class="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="en">EN</option>
            <option value="zh-CN">中文</option>
          </select>

          <div class="relative group">
            <button class="p-2 text-gray-700 hover:text-primary transition-colors duration-200">
              <i class="fas fa-user text-xl"></i>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="py-2">
                <router-link
                  v-if="isLoggedIn"
                  to="/account"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-user-circle mr-3"></i>{{ tMyAccount }}
                </router-link>
                <router-link
                  v-if="isLoggedIn"
                  to="/orders"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-shopping-bag mr-3"></i>{{ tMyOrders }}
                </router-link>
                <router-link
                  v-if="!isLoggedIn"
                  to="/login"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-sign-in-alt mr-3"></i>{{ tSignIn }}
                </router-link>
                <router-link
                  v-if="!isLoggedIn"
                  to="/register"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-user-plus mr-3"></i>{{ tRegister }}
                </router-link>
                <div v-if="isLoggedIn" class="border-t border-gray-200 my-1"></div>
                <button
                  v-if="isLoggedIn"
                  @click="handleLogout"
                  class="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-500"
                >
                  <i class="fas fa-sign-out-alt mr-3"></i>{{ tLogout }}
                </button>
              </div>
            </div>
          </div>

          <router-link to="/cart" class="p-2 text-gray-700 hover:text-primary transition-colors duration-200 relative">
            <i class="fas fa-shopping-cart text-xl"></i>
            <span
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
            >
              {{ cartCount }}
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { authAPI } from '../api'
import { useCartStore } from '../stores/cart'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const currentLocale = ref(locale.value)
const globalSearch = ref('')
const isLoggedIn = ref(authAPI.isLocallyLoggedIn())

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const tHome = computed(() => isZh.value ? '首页' : 'Home')
const tProducts = computed(() => isZh.value ? '商品' : 'Products')
const tMyOrders = computed(() => isZh.value ? '我的订单' : 'My Orders')
const tSearchPlaceholder = computed(() => isZh.value ? '搜索商品...' : 'Search products...')
const tMyAccount = computed(() => isZh.value ? '我的账户' : 'My Account')
const tSignIn = computed(() => isZh.value ? '登录' : 'Sign In')
const tRegister = computed(() => isZh.value ? '注册' : 'Register')
const tLogout = computed(() => isZh.value ? '退出登录' : 'Logout')
const tConfirmLogout = computed(() => isZh.value ? '确定要退出登录吗？' : 'Are you sure you want to logout?')

const cartCount = computed(() => cartStore.itemCount)

watch(
  () => route.query.search,
  (value) => {
    globalSearch.value = String(value || '')
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    syncSession()
  }
)

const changeLanguage = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
  document.documentElement.lang = currentLocale.value
  window.dispatchEvent(new Event('auth-changed'))
}

const handleGlobalSearch = () => {
  const keyword = globalSearch.value.trim()

  router.push({
    path: '/products',
    query: keyword ? { search: keyword } : {}
  })
}

const syncSession = async () => {
  isLoggedIn.value = authAPI.isLocallyLoggedIn()

  try {
    const session = await authAPI.getSession()
    isLoggedIn.value = !!session?.profile
  } catch {
    isLoggedIn.value = authAPI.isLocallyLoggedIn()
  }
}

const handleLogout = async () => {
  if (!confirm(tConfirmLogout.value)) return

  await authAPI.logout()
  isLoggedIn.value = false
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/')
}

const handleAuthChanged = () => {
  syncSession()
}

onMounted(() => {
  currentLocale.value = locale.value
  syncSession()
  window.addEventListener('auth-changed', handleAuthChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', handleAuthChanged)
})
</script>
