<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">Home</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">My Account</span>
      </nav>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
      <p class="mt-2 text-gray-600">Loading...</p>
    </div>

    <div v-else-if="!userProfile" class="text-center py-12 bg-white rounded-xl shadow-lg">
      <p class="text-gray-600 mb-4">Please login to view your account</p>
      <router-link to="/login" class="inline-block bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
        Login Now
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

          <nav class="space-y-2">
            <div class="flex items-center p-3 text-primary bg-primary/10 rounded-lg">
              <i class="fas fa-user-circle mr-3"></i>
              Profile Overview
            </div>
            <router-link to="/orders" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
              <i class="fas fa-shopping-bag mr-3"></i>
              My Orders
            </router-link>
            <router-link to="/cart" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
              <i class="fas fa-shopping-cart mr-3"></i>
              My Cart
            </router-link>
            <button
              @click="handleLogout"
              class="w-full flex items-center p-3 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-lg"
            >
              <i class="fas fa-sign-out-alt mr-3"></i>
              Logout
            </button>
          </nav>
        </div>
      </div>

      <div class="lg:w-3/4 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">Account Name</div>
            <div class="text-lg font-semibold text-gray-900">{{ userProfile.full_name || 'Customer' }}</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">Recent Orders</div>
            <div class="text-lg font-semibold text-gray-900">{{ recentOrders.length }}</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="text-sm text-gray-500 mb-2">Login Status</div>
            <div class="text-lg font-semibold text-green-600">Signed in</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-sm text-gray-500 mb-1">Full Name</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">{{ userProfile.full_name || 'Not provided' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Email</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 break-all">{{ userProfile.email || 'Not provided' }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Shipping Address</div>
              <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-line">
                {{ userProfile.shipping_address || 'No shipping address' }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900">Recent Orders</h2>
            <router-link to="/orders" class="text-primary hover:underline">
              View all orders
            </router-link>
          </div>

          <div v-if="recentOrdersLoading" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-primary"></i>
          </div>

          <div v-else-if="ordersUnavailable" class="text-center py-8 text-gray-500">
            Orders are temporarily unavailable.
          </div>

          <div v-else-if="recentOrders.length === 0" class="text-center py-8 text-gray-500">
            No orders yet
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 font-medium text-gray-700">Order #</th>
                  <th class="text-left py-3 font-medium text-gray-700">Date</th>
                  <th class="text-left py-3 font-medium text-gray-700">Total</th>
                  <th class="text-left py-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.order_id" class="border-b border-gray-200">
                  <td class="py-4">#{{ order.order_id }}</td>
                  <td class="py-4">{{ formatDate(order.purchase_date) }}</td>
                  <td class="py-4">{{ formatPrice(order.total_amount) }}</td>
                  <td class="py-4">
                    <span :class="getStatusClass(order.status)" class="px-3 py-1 rounded-full text-sm">
                      {{ order.status }}
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI, ordersAPI } from '../api'

const router = useRouter()
const loading = ref(true)
const recentOrdersLoading = ref(false)
const userProfile = ref(null)
const recentOrders = ref([])
const ordersUnavailable = ref(false)

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatPrice = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0))
}

const handleLogout = async () => {
  if (!confirm('Are you sure you want to logout?')) return

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

onMounted(fetchUserData)
</script>
