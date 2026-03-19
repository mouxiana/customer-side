<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">Home</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ pageTitle }}</span>
      </nav>
    </div>

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-600 mt-2">{{ pageSubtitle }}</p>
    </div>

    <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <label class="text-gray-700 font-medium">{{ filterLabel }}</label>
      <select
        v-model="selectedStatus"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white"
        @change="handleStatusChange"
      >
        <option value="">{{ allOrdersLabel }}</option>
        <option v-for="status in filterableStatuses" :key="status" :value="status">
          {{ getStatusLabel(status) }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-16">
      <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
      <p class="mt-3 text-gray-500">{{ loadingLabel }}</p>
    </div>

    <div
      v-else-if="pagedOrders.length === 0"
      class="bg-white rounded-2xl shadow-lg p-10 text-center"
    >
      <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
      <p class="text-lg text-gray-500">{{ emptyOrdersLabel }}</p>
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="order in pagedOrders"
        :key="order.order_id"
        class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div>
              <div class="text-sm text-gray-500">{{ orderLabel }}</div>
              <div class="text-2xl font-bold text-gray-900">#{{ order.order_id }}</div>
            </div>

            <div>
              <div class="text-sm text-gray-500">{{ purchaseDateLabel }}</div>
              <div class="font-medium text-gray-900">{{ formatDate(order.purchase_date) }}</div>
            </div>

            <div>
              <div class="text-sm text-gray-500">{{ lastUpdatedLabel }}</div>
              <div class="font-medium text-gray-900">{{ formatDateTime(order.updated_at || order.purchase_date) }}</div>
            </div>

            <div>
              <div class="text-sm text-gray-500">{{ totalLabel }}</div>
              <div class="text-2xl font-bold text-primary">{{ formatPrice(order.total_amount) }}</div>
            </div>

            <div class="flex md:justify-end">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                :class="getStatusBadgeClass(order.status)"
              >
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              @click="toggleOrderDetail(order)"
            >
              <i class="fas fa-clipboard-list mr-2"></i>
              {{ expandedOrderId === order.order_id ? hideDetailsLabel : viewDetailsLabel }}
            </button>

            <button
              type="button"
              class="px-5 py-2.5 rounded-lg text-white"
              :class="isOrderCancellable(order.status) ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'"
              :disabled="!isOrderCancellable(order.status) || cancellingOrderId === order.order_id"
              @click="cancelOrder(order)"
            >
              <i v-if="cancellingOrderId === order.order_id" class="fas fa-spinner fa-spin mr-2"></i>
              {{ cancelOrderLabel }}
            </button>
          </div>
        </div>

        <div v-if="expandedOrderId === order.order_id" class="border-t border-gray-100 bg-gray-50 p-6">
          <div v-if="detailLoading" class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-xl text-primary"></i>
            <p class="mt-3 text-gray-500">{{ loadingDetailsLabel }}</p>
          </div>

          <div v-else-if="expandedOrderDetail" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="bg-white rounded-xl p-4 border border-gray-100">
                <div class="text-sm text-gray-500">{{ orderLabel }}</div>
                <div class="text-xl font-bold text-gray-900">#{{ expandedOrderDetail.order_id }}</div>
              </div>

              <div class="bg-white rounded-xl p-4 border border-gray-100">
                <div class="text-sm text-gray-500">{{ purchaseDateLabel }}</div>
                <div class="font-semibold text-gray-900">{{ formatDateTime(expandedOrderDetail.purchase_date) }}</div>
              </div>

              <div class="bg-white rounded-xl p-4 border border-gray-100">
                <div class="text-sm text-gray-500">{{ statusLabel }}</div>
                <div class="font-semibold text-gray-900">{{ getStatusLabel(expandedOrderDetail.status) }}</div>
              </div>

              <div class="bg-white rounded-xl p-4 border border-gray-100">
                <div class="text-sm text-gray-500">{{ totalLabel }}</div>
                <div class="font-semibold text-primary text-xl">{{ formatPrice(expandedOrderDetail.total_amount) }}</div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-3">{{ shippingAddressLabel }}</h3>
              <p class="text-gray-700">{{ expandedOrderDetail.shipping_address || noAddressLabel }}</p>
            </div>

            <div class="bg-white rounded-xl p-5 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">{{ statusHistoryLabel }}</h3>

              <div v-if="normalizedStatusHistory.length === 0" class="text-gray-500">
                {{ noHistoryLabel }}
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(entry, index) in normalizedStatusHistory"
                  :key="`${entry.status}-${entry.timestamp || index}`"
                  class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                      :class="getStatusBadgeClass(entry.status)"
                    >
                      {{ getStatusLabel(entry.status) }}
                    </span>
                    <span class="text-sm text-gray-500">{{ entry.note }}</span>
                  </div>
                  <div class="text-sm font-medium text-gray-700">
                    {{ formatDateTime(entry.timestamp) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">{{ orderedItemsLabel }}</h3>

              <div class="space-y-4">
                <button
                  v-for="item in expandedOrderDetail.items || []"
                  :key="`${expandedOrderDetail.order_id}-${item.product_id}`"
                  type="button"
                  class="w-full text-left border border-gray-200 rounded-xl p-4 bg-white hover:bg-orange-50 transition"
                  @click="goToProduct(item.product_id)"
                >
                  <div class="flex flex-col md:flex-row md:items-center gap-4">
                    <div class="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        v-if="resolveThumbnail(item)"
                        :src="resolveThumbnail(item)"
                        :alt="item.name"
                        class="w-full h-full object-cover"
                      >
                      <i v-else class="fas fa-image text-gray-400"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-gray-900 text-lg truncate">{{ item.name }}</div>
                      <div class="text-sm text-gray-500 mt-1">{{ productIdLabel }}: {{ item.product_id }}</div>
                    </div>

                    <div class="grid grid-cols-3 gap-4 md:gap-8 text-sm min-w-[280px]">
                      <div>
                        <div class="text-gray-500">{{ quantityLabel }}</div>
                        <div class="font-semibold text-gray-900">{{ item.quantity }}</div>
                      </div>
                      <div>
                        <div class="text-gray-500">{{ unitPriceLabel }}</div>
                        <div class="font-semibold text-gray-900">{{ formatPrice(item.unit_price) }}</div>
                      </div>
                      <div>
                        <div class="text-gray-500">{{ subtotalLabel }}</div>
                        <div class="font-semibold text-primary">{{ formatPrice(item.subtotal) }}</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            {{ loadDetailFailedLabel }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        class="px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
        :disabled="currentPage === 1"
        @click="currentPage -= 1"
      >
        {{ previousLabel }}
      </button>

      <span class="text-gray-700 font-medium">{{ pageLabel }} {{ currentPage }} / {{ totalPages }}</span>

      <button
        type="button"
        class="px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
        :disabled="currentPage === totalPages"
        @click="currentPage += 1"
      >
        {{ nextLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ordersAPI, productsAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const loading = ref(false)
const detailLoading = ref(false)
const orders = ref([])
const selectedStatus = ref('')
const expandedOrderId = ref(null)
const expandedOrderDetail = ref(null)
const cancellingOrderId = ref(null)
const currentPage = ref(1)
const pageSize = 5

const filterableStatuses = ['created', 'processing', 'shipped', 'delivered', 'completed', 'hold', 'cancelled']

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))

const pageTitle = computed(() => isZh.value ? '我的订单' : 'My Orders')
const pageSubtitle = computed(() => isZh.value ? '查看你的订单记录' : 'View your order history')
const filterLabel = computed(() => isZh.value ? '按状态筛选：' : 'Filter by status:')
const allOrdersLabel = computed(() => isZh.value ? '全部订单' : 'All Orders')
const loadingLabel = computed(() => isZh.value ? '正在加载订单...' : 'Loading orders...')
const emptyOrdersLabel = computed(() => isZh.value ? '暂无订单' : 'No orders yet')
const orderLabel = computed(() => isZh.value ? '订单' : 'Order')
const purchaseDateLabel = computed(() => isZh.value ? '下单时间' : 'Purchase Date')
const lastUpdatedLabel = computed(() => isZh.value ? '最后更新' : 'Last Updated')
const totalLabel = computed(() => isZh.value ? '总计' : 'Total')
const statusLabel = computed(() => isZh.value ? '状态' : 'Status')
const viewDetailsLabel = computed(() => isZh.value ? '查看详情' : 'View Details')
const hideDetailsLabel = computed(() => isZh.value ? '收起详情' : 'Hide Details')
const cancelOrderLabel = computed(() => isZh.value ? '取消订单' : 'Cancel Order')
const loadingDetailsLabel = computed(() => isZh.value ? '正在加载订单详情...' : 'Loading order details...')
const shippingAddressLabel = computed(() => isZh.value ? '收货地址' : 'Shipping Address')
const orderedItemsLabel = computed(() => isZh.value ? '订单商品' : 'Ordered Items')
const statusHistoryLabel = computed(() => isZh.value ? '状态历史记录' : 'Status History')
const noHistoryLabel = computed(() => isZh.value ? '暂无状态历史记录' : 'No status history available')
const noAddressLabel = computed(() => isZh.value ? '暂无地址信息' : 'No address available')
const productIdLabel = computed(() => isZh.value ? '商品编号' : 'Product ID')
const quantityLabel = computed(() => isZh.value ? '数量' : 'Quantity')
const unitPriceLabel = computed(() => isZh.value ? '单价' : 'Unit Price')
const subtotalLabel = computed(() => isZh.value ? '小计' : 'Subtotal')
const loadDetailFailedLabel = computed(() => isZh.value ? '订单详情加载失败' : 'Failed to load order detail')
const previousLabel = computed(() => isZh.value ? '上一页' : 'Previous')
const nextLabel = computed(() => isZh.value ? '下一页' : 'Next')
const pageLabel = computed(() => isZh.value ? '第' : 'Page')

const totalPages = computed(() => {
  const pages = Math.ceil(orders.value.length / pageSize)
  return pages > 0 ? pages : 1
})

const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return orders.value.slice(start, start + pageSize)
})

const normalizedStatusHistory = computed(() => {
  if (!expandedOrderDetail.value) return []

  const detail = expandedOrderDetail.value
  const raw = Array.isArray(detail.status_history) ? detail.status_history : []

  if (raw.length > 0) {
    return raw.map((item) => ({
      status: normalizeStatus(item?.status),
      timestamp: item?.timestamp || item?.date || item?.updated_at || '',
      note: historyNoteByStatus(normalizeStatus(item?.status))
    }))
  }

  const fallback = []
  if (detail.purchase_date) {
    fallback.push({
      status: 'created',
      timestamp: detail.purchase_date,
      note: historyNoteByStatus('created')
    })
  }

  if (detail.updated_at && normalizeStatus(detail.status) !== 'created') {
    fallback.push({
      status: normalizeStatus(detail.status),
      timestamp: detail.updated_at,
      note: historyNoteByStatus(normalizeStatus(detail.status))
    })
  }

  return fallback
})

watch(selectedStatus, () => {
  currentPage.value = 1
})

function normalizeStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'on hold') return 'hold'
  return value
}

function getStatusLabel(status) {
  const value = normalizeStatus(status)
  const zhMap = {
    created: '已创建',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    hold: '已挂起',
    cancelled: '已取消'
  }
  const enMap = {
    created: 'Created',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    hold: 'On Hold',
    cancelled: 'Cancelled'
  }

  return (isZh.value ? zhMap[value] : enMap[value]) || status || '-'
}

function historyNoteByStatus(status) {
  const value = normalizeStatus(status)
  if (isZh.value) {
    const map = {
      created: '订单已创建',
      processing: '订单进入处理流程',
      shipped: '订单已发货',
      delivered: '订单已送达',
      completed: '订单已完成',
      hold: '订单已挂起',
      cancelled: '订单已取消'
    }
    return map[value] || '状态已更新'
  }

  const map = {
    created: 'Order created',
    processing: 'Order entered processing',
    shipped: 'Order shipped',
    delivered: 'Order delivered',
    completed: 'Order completed',
    hold: 'Order put on hold',
    cancelled: 'Order cancelled'
  }
  return map[value] || 'Status updated'
}

function getStatusBadgeClass(status) {
  const value = normalizeStatus(status)
  const map = {
    created: 'bg-blue-100 text-blue-700',
    processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    hold: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700'
  }
  return map[value] || 'bg-gray-100 text-gray-700'
}

function isOrderCancellable(status) {
  const value = normalizeStatus(status)
  return ['created', 'processing', 'hold'].includes(value)
}

function formatPrice(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function resolveThumbnail(item) {
  return productsAPI.resolveAssetUrl(item?.thumbnail_url || '')
}

async function fetchOrders() {
  try {
    loading.value = true
    const result = await ordersAPI.getOrders(selectedStatus.value)
    orders.value = Array.isArray(result?.orders) ? result.orders : []
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    orders.value = []
  } finally {
    loading.value = false
  }
}

async function handleStatusChange() {
  expandedOrderId.value = null
  expandedOrderDetail.value = null
  await fetchOrders()
}

async function toggleOrderDetail(order) {
  if (expandedOrderId.value === order.order_id) {
    expandedOrderId.value = null
    expandedOrderDetail.value = null
    return
  }

  expandedOrderId.value = order.order_id
  expandedOrderDetail.value = null

  try {
    detailLoading.value = true
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

async function cancelOrder(order) {
  if (!isOrderCancellable(order.status)) return

  const confirmed = window.confirm(
    isZh.value ? '确定要取消这个订单吗？' : 'Are you sure you want to cancel this order?'
  )
  if (!confirmed) return

  try {
    cancellingOrderId.value = order.order_id
    await ordersAPI.cancelOrder(order.order_id)
    await fetchOrders()

    if (expandedOrderId.value === order.order_id) {
      const refreshed = orders.value.find((item) => item.order_id === order.order_id)
      if (refreshed) {
        await toggleOrderDetail(refreshed)
      }
    }
  } catch (error) {
    console.error('Failed to cancel order:', error)
    alert(error.message || 'Failed to cancel order')
  } finally {
    cancellingOrderId.value = null
  }
}

function goToProduct(productId) {
  router.push(`/products/${productId}`)
}

fetchOrders()
</script>
