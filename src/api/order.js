import client from './client.js'

function wrapError(prefix, error, fallbackMessage) {
  const wrapped = new Error(`${prefix}: ${error.data?.error || error.message || fallbackMessage}`)
  wrapped.status = error.status
  wrapped.data = error.data
  throw wrapped
}

export const ordersAPI = {
  async checkout() {
    try {
      return await client.request('/orders', {
        method: 'POST'
      })
    } catch (error) {
      wrapError('创建订单失败', error, 'Failed to create order')
    }
  },

  async getOrders(status = '') {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const query = params.toString() ? `?${params.toString()}` : ''

    try {
      return await client.request(`/orders${query}`)
    } catch (error) {
      wrapError('获取订单列表失败', error, 'Failed to get orders')
    }
  },

  async getOrderDetail(orderId) {
    try {
      return await client.request(`/orders/${orderId}`)
    } catch (error) {
      wrapError('获取订单详情失败', error, 'Failed to get order detail')
    }
  },

  async cancelOrder(orderId) {
    try {
      return await client.request(`/orders/${orderId}/cancel`, {
        method: 'PATCH'
      })
    } catch (error) {
      wrapError('取消订单失败', error, 'Failed to cancel order')
    }
  }
}
