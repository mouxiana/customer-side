<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ labels.title }}</span>
      </nav>
    </div>

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ labels.title }}</h1>
      <p class="text-gray-600 mt-2">{{ labels.subtitle }}</p>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ labels.loading }}</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {{ errorMessage }}
    </div>

    <div v-else>
      <div class="mb-6 flex items-center gap-4 flex-wrap">
        <span class="text-gray-700">{{ labels.filter }}</span>
        <select v-model="filterStatus" class="border border-gray-300 rounded-lg px-4 py-2">
          <option value="">{{ labels.all }}</option>
          <option value="created">{{ labels.status.created }}</option>
          <option value="processing">{{ labels.status.processing }}</option>
          <option value="shipped">{{ labels.status.shipped }}</option>
          <option value="delivered">{{ labels.status.delivered }}</option>
          <option value="completed">{{ labels.status.completed }}</option>
          <option value="hold">{{ labels.status.hold }}</option>
          <option value="cancelled">{{ labels.status.cancelled }}</option>
        </select>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
          <i class="fas fa-clipboard-list text-4xl mb-4"></i>
          <p class="text-lg">{{ labels.noOrders }}</p>
          <router-link to="/products" class="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
            {{ labels.startShopping }}
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div v-for="order in paginatedOrders" :key="order.order_id" class="border border-gray-200 rounded-lg p-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="text-sm text-gray-500">{{ labels.order }}</div>
                <div class="font-semibold text-gray-900">#{{ order.order_id }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ labels.purchaseDate }}</div>
                <div class="text-gray-900">{{ formatDateTime(order.purchase_date) }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ labels.lastUpdated }}</div>
                <div class="text-gray-900">{{ formatDateTime(order.updated_at || order.purchase_date) }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ labels.total }}</div>
                <div class="font-bold text-primary">{{ formatPrice(order.total_amount) }}</div>
              </div>

              <div class="flex items-center gap-3">
                <span :class="getStatusClass(order.status)" class="inline-block px-3 py-1 rounded-full text-sm">
                  {{ getStatusText(order.status) }}
                </span>
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                  @click="toggleOrderDetail(order)"
                >
                  {{ expandedOrderId === order.order_id ? labels.hideDetails : labels.viewDetails }}
                </button>
              </div>
            </div>

            <div v-if="expandedOrderId === order.order_id" class="mt-6 border-t pt-6">
              <div v-if="detailLoading" class="text-center py-6 text-gray-500">
                {{ labels.loadingDetails }}
              </div>

              <div v-else-if="expandedOrderDetail" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">{{ labels.statusLabel }}</div>
                    <div class="font-semibold text-gray-900">{{ getStatusText(expandedOrderDetail.status) }}</div>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">{{ labels.purchaseDate }}</div>
                    <div class="font-semibold text-gray-900">{{ formatDateTime(expandedOrderDetail.purchase_date) }}</div>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">{{ labels.lastUpdated }}</div>
                    <div class="font-semibold text-gray-900">{{ formatDateTime(expandedOrderDetail.updated_at || expandedOrderDetail.purchase_date) }}</div>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">{{ labels.total }}</div>
                    <div class="font-semibold text-primary">{{ formatPrice(expandedOrderDetail.total_amount) }}</div>
                  </div>
                </div>

                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="text-sm text-gray-500 mb-1">{{ labels.shippingAddress }}</div>
                  <div class="text-gray-900">{{ expandedOrderDetail.shipping_address || labels.noAddress }}</div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-gray-900">{{ labels.statusHistory }}</h3>
                    <button
                      v-if="isOrderCancellable(expandedOrderDetail.status)"
                      type="button"
                      class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm"
                      @click="cancelOrder(expandedOrderDetail.order_id)"
                    >
                      {{ labels.cancelOrder }}
                    </button>
                  </div>

                  <div v-if="normalizedStatusHistory.length === 0" class="text-sm text-gray-500">
                    {{ labels.noHistory }}
                  </div>

                  <div v-else class="space-y-3">
                    <div
                      v-for="(entry, index) in normalizedStatusHistory"
                      :key="`${entry.status}-${entry.timestamp}-${index}`"
                      class="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg border border-gray-200"
                    >
                      <div class="flex items-center gap-3">
                        <span :class="getStatusClass(entry.status)" class="inline-block px-3 py-1 rounded-full text-sm">
                          {{ getStatusText(entry.status) }}
                        </span>
                        <span class="text-sm text-gray-500">{{ entry.note }}</span>
                      </div>
                      <div class="text-sm text-gray-700">{{ formatDateTime(entry.timestamp) }}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ labels.orderItems }}</h3>
                  <div class="space-y-3">
                    <button
                      v-for="item in expandedOrderDetail.items || []"
                      :key="`${expandedOrderDetail.order_id}-${item.product_id}`"
                      type="button"
                      class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      @click="openProductFromOrder(item)"
                    >
                      <div class="flex gap-4">
                        <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            v-if="getOrderItemImage(item)"
                            :src="getOrderItemImage(item)"
                            :alt="item.name"
                            class="w-full h-full object-cover"
                          >
                          <i v-else class="fas fa-image text-gray-400"></i>
                        </div>

                        <div class="flex-1 min-w-0">
                          <div class="font-semibold text-gray-900 truncate">{{ item.name }}</div>
                          <div class="text-sm text-gray-500">{{ labels.productId }}: {{ item.product_id }}</div>
                          <div class="text-sm text-gray-500">{{ labels.quantity }}: {{ item.quantity }}</div>
                        </div>

                        <div class="text-right">
                          <div class="text-sm text-gray-500">{{ labels.unitPrice }}</div>
                          <div class="font-medium text-gray-900">{{ formatPrice(item.unit_price) }}</div>
                          <div class="text-sm text-gray-500 mt-2">{{ labels.subtotal }}</div>
                          <div class="font-semibold text-primary">{{ formatPrice(item.subtotal) }}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="text-sm text-gray-500">
                {{ labels.detailUnavailable }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="mt-8 flex justify-center items-center gap-3">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            <i class="fas fa-chevron-left mr-1"></i>{{ labels.previous }}
          </button>
          <span>{{ labels.page(currentPage, totalPages) }}</span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            {{ labels.next }} <i class="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ordersAPI, productsAPI } from '../api'

const { locale } = useI18n()
const router = useRouter()
const orders = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const isLoading = ref(false)
const detailLoading = ref(false)
const errorMessage = ref('')
const expandedOrderId = ref(null)
const expandedOrderDetail = ref(null)

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  title: '我的订单',
  subtitle: '查看你的订单记录',
  loading: '正在加载订单...',
  filter: '筛选状态',
  all: '全部订单',
  noOrders: '暂无订单',
  startShopping: '开始购物',
  order: '订单',
  purchaseDate: '下单时间',
  lastUpdated: '最后更新',
  total: '总计',
  viewDetails: '查看详情',
  hideDetails: '收起详情',
  loadingDetails: '正在加载订单详情...',
  statusLabel: '订单状态',
  shippingAddress: '收货地址',
  noAddress: '暂无地址信息',
  statusHistory: '状态历史记录',
  noHistory: '暂无状态历史记录',
  orderItems: '订单商品',
  cancelOrder: '取消订单',
  quantity: '数量',
  unitPrice: '单价',
  subtotal: '小计',
  productId: '商品编号',
  detailUnavailable: '订单详情暂时不可用。',
  previous: '上一页',
  next: '下一页',
  page: (p, t) => `第 ${p} / ${t} 页`,
  status: {
    created: 'Created',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    hold: 'On Hold',
    cancelled: 'Cancelled'
  }
} : {
  home: 'Home',
  title: 'My Orders',
  subtitle: 'View your order history',
  loading: 'Loading orders...',
  filter: 'Filter by status',
  all: 'All Orders',
  noOrders: 'No orders yet',
  startShopping: 'Start Shopping',
  order: 'Order',
  purchaseDate: 'Purchase Date',
  lastUpdated: 'Last Updated',
  total: 'Total',
  viewDetails: 'View Details',
  hideDetails: 'Hide Details',
  loadingDetails: 'Loading order details...',
  statusLabel: 'Status',
  shippingAddress: 'Shipping Address',
  noAddress: 'No address available',
  statusHistory: 'Status History',
  noHistory: 'No status history available',
  orderItems: 'Order Items',
  cancelOrder: 'Cancel Order',
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  subtotal: 'Subtotal',
  productId: 'Product ID',
  detailUnavailable: 'Order detail is temporarily unavailable.',
  previous: 'Previous',
  next: 'Next',
  page: (p, t) => `Page ${p} of ${t}`,
  status: {
    created: 'Created',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    hold: 'On Hold',
    cancelled: 'Cancelled'
  }
})

const totalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / itemsPerPage)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return orders.value.slice(start, start + itemsPerPage)
})

const normalizedStatusHistory = computed(() => {
  const detail = expandedOrderDetail.value
  if (!detail) return []

  const raw = Array.isArray(detail.status_history) ? detail.status_history : []
  if (raw.length > 0) {
    return raw.map((item) => ({
      status: normalizeStatus(item?.status),
      timestamp: item?.timestamp || item?.date || item?.updated_at || '',
      note: getHistoryNote(normalizeStatus(item?.status))
    }))
  }

  const fallback = []
  if (detail.purchase_date) {
    fallback.push({
      status: 'created',
      timestamp: detail.purchase_date,
      note: getHistoryNote('created')
    })
  }
  if (detail.updated_at && normalizeStatus(detail.status) !== 'created') {
    fallback.push({
      status: normalizeStatus(detail.status),
      timestamp: detail.updated_at,
      note: getHistoryNote(normalizeStatus(detail.status))
    })
  }
  return fallback
})

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'on hold') return 'hold'
  return value
}

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    hold: 'bg-orange-100 text-orange-800'
  }
  return classes[normalizeStatus(status)] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => labels.value.status[normalizeStatus(status)] || status
const isOrderCancellable = (status) => ['created', 'processing', 'hold'].includes(normalizeStatus(status))
const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getHistoryNote = (status) => {
  const map = isZh.value ? {
    created: '订单已创建',
    processing: '订单处理中',
    shipped: '订单已发货',
    delivered: '订单已送达',
    completed: '订单已完成',
    hold: '订单已挂起',
    cancelled: '订单已取消'
  } : {
    created: 'Order created',
    processing: 'Order processing',
    shipped: 'Order shipped',
    delivered: 'Order delivered',
    completed: 'Order completed',
    hold: 'Order put on hold',
    cancelled: 'Order cancelled'
  }
  return map[normalizeStatus(status)] || (isZh.value ? '状态已更新' : 'Status updated')
}

const getOrderItemImage = (item) => {
  if (item?.thumbnail_url) return productsAPI.resolveAssetUrl(item.thumbnail_url)
  return ''
}

const fetchOrders = async () => {
  isLoading.value = true
  errorMessage.value = ''
  currentPage.value = 1

  try {
    const result = await ordersAPI.getOrders(filterStatus.value || '')
    orders.value = result?.orders || []
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    if (error.status === 401) {
      errorMessage.value = isZh.value ? '请先登录后查看订单。' : 'Please login to view your orders.'
      setTimeout(() => router.push('/login'), 800)
    } else {
      errorMessage.value = error.message || (isZh.value ? '加载订单失败。' : 'Failed to load orders.')
    }
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const toggleOrderDetail = async (order) => {
  if (expandedOrderId.value === order.order_id) {
    expandedOrderId.value = null
    expandedOrderDetail.value = null
    return
  }

  expandedOrderId.value = order.order_id
  expandedOrderDetail.value = null
  detailLoading.value = true

  try {
    const detail = await ordersAPI.getOrderDetail(order.order_id)
    expandedOrderDetail.value = {
      ...detail,
      updated_at: detail?.updated_at || order?.updated_at || '',
      purchase_date: detail?.purchase_date || order?.purchase_date || ''
    }
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    expandedOrderDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

const openProductFromOrder = (item) => {
  const productId = item?.product_id ?? item?.id
  if (!productId) return
  router.push(`/product/${productId}`)
}

const cancelOrder = async (orderId) => {
  const order = expandedOrderDetail.value || orders.value.find((item) => item.order_id === orderId)
  if (!order || !isOrderCancellable(order.status)) return

  const confirmed = window.confirm(isZh.value ? '确定要取消这个订单吗？' : 'Are you sure you want to cancel this order?')
  if (!confirmed) return

  try {
    await ordersAPI.cancelOrder(orderId)
    await fetchOrders()

    const refreshed = orders.value.find((item) => item.order_id === orderId)
    if (refreshed) {
      await toggleOrderDetail(refreshed)
    }
  } catch (error) {
    alert(error.message || (isZh.value ? '取消订单失败。' : 'Failed to cancel order.'))
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(filterStatus, fetchOrders)
watch(locale, async () => {
  await fetchOrders()
  if (expandedOrderId.value) {
    const order = orders.value.find((item) => item.order_id === expandedOrderId.value)
    if (order) {
      await toggleOrderDetail(order)
    }
  }
})

fetchOrders()
</script>
