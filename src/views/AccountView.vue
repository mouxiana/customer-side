<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ tHome }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ tMyAccount }}</span>
      </nav>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
      <p class="mt-2 text-gray-600">{{ tLoading }}</p>
    </div>

    <div v-else-if="!userProfile" class="text-center py-12 bg-white rounded-xl shadow-lg">
      <p class="text-gray-600 mb-4">{{ tPleaseLogin }}</p>
      <router-link to="/login" class="inline-block bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
        {{ tLoginNow }}
      </router-link>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-8">
      <div class="lg:w-1/4">
        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-6">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <i class="fas fa-user text-2xl text-gray-500"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ userProfile.full_name }}</h3>
              <p class="text-sm text-gray-600 break-all">{{ userProfile.email }}</p>
            </div>
          </div>

          <div class="mb-6 border border-gray-200 rounded-xl p-4">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-semibold text-gray-900">{{ tDisplaySettings }}</h4>
              <span class="text-primary text-sm font-semibold">{{ tFontSizeCurrent }}</span>
            </div>
            <p class="text-sm text-gray-500 mb-4">{{ tAdjustFontSize }}</p>
            <input
              v-model="fontSizeValue"
              type="range"
              min="0"
              max="2"
              step="1"
              class="w-full accent-primary"
              @input="applyFontSize(fontSizeValue)"
            >
            <div class="grid grid-cols-3 gap-2 mt-4">
              <button
                v-for="option in fontSizeOptions"
                :key="option.value"
                type="button"
                class="px-3 py-2 rounded-lg border"
                :class="fontSizeValue === option.value ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-700 hover:border-primary/40'"
                @click="applyFontSize(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <nav class="space-y-2">
            <div class="flex items-center p-3 text-primary bg-primary/10 rounded-lg">
              <i class="fas fa-user-circle mr-3"></i>
              {{ tProfileOverview }}
            </div>
            <router-link to="/orders" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
              <i class="fas fa-shopping-bag mr-3"></i>
              {{ tMyOrders }}
            </router-link>
            <router-link to="/cart" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
              <i class="fas fa-shopping-cart mr-3"></i>
              {{ tMyCart }}
            </router-link>
            <button
              @click="handleLogout"
              class="w-full flex items-center p-3 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-lg"
            >
              <i class="fas fa-sign-out-alt mr-3"></i>
              {{ tLogout }}
            </button>
          </nav>
        </div>
      </div>

      <div class="lg:w-3/4 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">{{ tAccountName }}</div>
            <div class="text-lg font-semibold text-gray-900">{{ userProfile.full_name || tCustomer }}</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">{{ tRecentOrders }}</div>
            <div class="text-lg font-semibold text-gray-900">{{ recentOrders.length }}</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">{{ tLoginStatus }}</div>
            <div class="text-lg font-semibold text-green-600">{{ tSignedIn }}</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ tProfileInformation }}</h2>
          <p class="text-gray-500 mb-6">{{ tFontNote }}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-sm text-gray-500 mb-1">{{ tFullName }}</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">{{ userProfile.full_name || tNotProvided }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">{{ tEmail }}</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 break-all">{{ userProfile.email || tNotProvided }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">{{ tShippingAddress }}</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-line">
                {{ userProfile.shipping_address || tNoShippingAddress }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900">{{ tRecentOrders }}</h2>
            <router-link to="/orders" class="text-primary hover:underline">
              {{ tViewAllOrders }}
            </router-link>
          </div>

          <div v-if="recentOrdersLoading" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-primary"></i>
          </div>

          <div v-else-if="ordersUnavailable" class="text-center py-8 text-gray-500">
            {{ tOrdersUnavailable }}
          </div>

          <div v-else-if="recentOrders.length === 0" class="text-center py-8 text-gray-500">
            {{ tNoOrdersYet }}
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 font-medium text-gray-700">{{ tOrderNumber }}</th>
                  <th class="text-left py-3 font-medium text-gray-700">{{ tDate }}</th>
                  <th class="text-left py-3 font-medium text-gray-700">{{ tTotal }}</th>
                  <th class="text-left py-3 font-medium text-gray-700">{{ tStatus }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.order_id" class="border-b border-gray-200">
                  <td class="py-4">#{{ order.order_id }}</td>
                  <td class="py-4">{{ formatDate(order.purchase_date) }}</td>
                  <td class="py-4">{{ formatPrice(order.total_amount) }}</td>
                  <td class="py-4">
                    <span :class="getStatusClass(order.status)" class="px-3 py-1 rounded-full text-sm">
                      {{ getStatusText(order.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authAPI, ordersAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const loading = ref(true)
const recentOrdersLoading = ref(false)
const userProfile = ref(null)
const recentOrders = ref([])
const ordersUnavailable = ref(false)
const fontSizeValue = ref('1')

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))

const tHome = computed(() => isZh.value ? '首页' : 'Home')
const tMyAccount = computed(() => isZh.value ? '我的账户' : 'My Account')
const tLoading = computed(() => isZh.value ? '加载中...' : 'Loading...')
const tPleaseLogin = computed(() => isZh.value ? '请先登录后查看账户信息' : 'Please login to view your account')
const tLoginNow = computed(() => isZh.value ? '立即登录' : 'Login Now')
const tDisplaySettings = computed(() => isZh.value ? '显示设置' : 'Display Settings')
const tAdjustFontSize = computed(() => isZh.value ? '调节页面字体大小' : 'Adjust page font size')
const tProfileOverview = computed(() => isZh.value ? '账户概览' : 'Profile Overview')
const tMyOrders = computed(() => isZh.value ? '我的订单' : 'My Orders')
const tMyCart = computed(() => isZh.value ? '我的购物车' : 'My Cart')
const tLogout = computed(() => isZh.value ? '退出登录' : 'Logout')
const tAccountName = computed(() => isZh.value ? '账户名称' : 'Account Name')
const tCustomer = computed(() => isZh.value ? '顾客' : 'Customer')
const tRecentOrders = computed(() => isZh.value ? '最近订单' : 'Recent Orders')
const tLoginStatus = computed(() => isZh.value ? '登录状态' : 'Login Status')
const tSignedIn = computed(() => isZh.value ? '已登录' : 'Signed in')
const tProfileInformation = computed(() => isZh.value ? '账户信息' : 'Profile Information')
const tFontNote = computed(() => isZh.value ? '你偏好的字体大小会自动保存，下次访问时继续生效。' : 'Your preferred font size is saved automatically for the next visit.')
const tFullName = computed(() => isZh.value ? '姓名' : 'Full Name')
const tEmail = computed(() => isZh.value ? '邮箱' : 'Email')
const tNotProvided = computed(() => isZh.value ? '未提供' : 'Not provided')
const tShippingAddress = computed(() => isZh.value ? '收货地址' : 'Shipping Address')
const tNoShippingAddress = computed(() => isZh.value ? '暂无收货地址' : 'No shipping address')
const tViewAllOrders = computed(() => isZh.value ? '查看全部订单' : 'View all orders')
const tOrdersUnavailable = computed(() => isZh.value ? '订单暂时不可用。' : 'Orders are temporarily unavailable.')
const tNoOrdersYet = computed(() => isZh.value ? '暂无订单' : 'No orders yet')
const tOrderNumber = computed(() => isZh.value ? '订单号' : 'Order #')
const tDate = computed(() => isZh.value ? '日期' : 'Date')
const tTotal = computed(() => isZh.value ? '总计' : 'Total')
const tStatus = computed(() => isZh.value ? '状态' : 'Status')
const tFontSizeCurrent = computed(() => {
  const map = {
    '0': isZh.value ? '小' : 'S',
    '1': isZh.value ? '中' : 'M',
    '2': isZh.value ? '大' : 'L'
  }
  return map[String(fontSizeValue.value)] || (isZh.value ? '中' : 'M')
})
const tConfirmLogout = computed(() => isZh.value ? '确定要退出登录吗？' : 'Are you sure you want to logout?')

const fontSizeOptions = computed(() => [
  { value: '0', label: isZh.value ? '小' : 'S' },
  { value: '1', label: isZh.value ? '中' : 'M' },
  { value: '2', label: isZh.value ? '大' : 'L' }
])

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    hold: 'bg-orange-100 text-orange-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const zh = {
    created: '已创建',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    hold: '挂起'
  }
  const en = {
    created: 'created',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'completed',
    cancelled: 'cancelled',
    hold: 'on hold'
  }
  return (isZh.value ? zh[status] : en[status]) || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: isZh.value ? 'numeric' : 'short',
    day: 'numeric'
  })
}

const formatPrice = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0))
}

const applyFontSize = (value) => {
  fontSizeValue.value = String(value)
  const scaleMap = { '0': '0.95', '1': '1', '2': '1.08' }
  const scale = scaleMap[String(value)] || '1'
  document.documentElement.style.setProperty('--user-font-scale', scale)
  localStorage.setItem('user-font-size-level', String(value))
}

const handleLogout = async () => {
  if (!confirm(tConfirmLogout.value)) return

  try {
    await authAPI.logout()
  } finally {
    userProfile.value = null
    recentOrders.value = []
    router.push('/login')
  }
}

const fetchUserData = async () => {
  try {
    const session = await authAPI.getSession()

    if (!session?.profile) {
      userProfile.value = null
      recentOrders.value = []
      return
    }

    userProfile.value = session.profile
    ordersUnavailable.value = false

    try {
      recentOrdersLoading.value = true
      const ordersData = await ordersAPI.getOrders()
      recentOrders.value = (ordersData?.orders || []).slice(0, 5)
    } catch (orderError) {
      console.error('Failed to fetch orders:', orderError)
      recentOrders.value = []
      ordersUnavailable.value = orderError.status === 404
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    userProfile.value = null
    recentOrders.value = []
  } finally {
    loading.value = false
    recentOrdersLoading.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('user-font-size-level')
  applyFontSize(saved ?? '1')
  fetchUserData()
})
</script>
