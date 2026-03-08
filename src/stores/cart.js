// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartAPI, authAPI } from '../api'

export const useCartStore = defineStore('cart', () => {
  // 购物车项
  const items = ref([])
  
  // 加载状态
  const isLoading = ref(false)
  const error = ref(null)
  
  // 计算属性
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const isCartEmpty = computed(() => {
    return items.value.length === 0
  })

  // 从后端获取购物车数据
  async function fetchCart() {
    isLoading.value = true
    error.value = null
    
    try {
      // 先检查用户是否登录
      const session = await authAPI.getSession()
      if (!session.logged_in) {
        items.value = []
        return
      }
      
      // 调用API获取购物车
      const cartData = await cartAPI.getCart()
      
      // 假设API返回格式为 { items: [...], total_amount: ... }
      if (cartData.items) {
        items.value = cartData.items.map(item => ({
          id: item.product_id,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          thumbnail_url: item.thumbnail_url
        }))
      } else {
        items.value = []
      }
      
    } catch (err) {
      console.error('Failed to fetch cart:', err)
      error.value = err.data?.error || 'Failed to load cart'
      // 如果未登录或其他错误，清空本地购物车
      if (err.status === 401) {
        items.value = []
      }
    } finally {
      isLoading.value = false
    }
  }

  // 添加到购物车（API调用）
  async function addToCart(product, quantity = 1) {
    isLoading.value = true
    error.value = null
    
    try {
      // 调用API添加到购物车
      await cartAPI.addToCart(product.id, quantity)
      
      // 更新本地状态
      const existingItem = items.value.find(item => item.product_id === product.id)
      
      if (existingItem) {
        existingItem.quantity += quantity
        existingItem.subtotal = existingItem.price * existingItem.quantity
      } else {
        items.value.push({
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          subtotal: product.price * quantity,
          thumbnail_url: product.thumbnail_url
        })
      }
      
      return { success: true }
      
    } catch (err) {
      console.error('Failed to add to cart:', err)
      error.value = err.data?.error || 'Failed to add item to cart'
      
      if (err.status === 401) {
        return { 
          success: false, 
          error: 'Please login to add items to cart',
          requiresLogin: true 
        }
      } else if (err.status === 404) {
        return { 
          success: false, 
          error: 'Product not found' 
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to add item to cart' 
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  // 更新购物车商品数量（API调用）
  async function updateQuantity(productId, quantity) {
    isLoading.value = true
    error.value = null
    
    try {
      // 调用API更新数量
      await cartAPI.updateCartItem(productId, quantity)
      
      // 更新本地状态
      const item = items.value.find(item => item.product_id === productId)
      if (item) {
        item.quantity = quantity
        item.subtotal = item.price * quantity
      }
      
      return { success: true }
      
    } catch (err) {
      console.error('Failed to update cart item:', err)
      error.value = err.data?.error || 'Failed to update item quantity'
      
      if (err.status === 401) {
        return { 
          success: false, 
          error: 'Please login to update cart',
          requiresLogin: true 
        }
      } else if (err.status === 404) {
        // 如果商品不存在于购物车，从本地状态中移除
        removeFromCartLocal(productId)
        return { 
          success: false, 
          error: 'Item not found in cart' 
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to update item quantity' 
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  // 从购物车移除商品（API调用）
  async function removeFromCart(productId) {
    isLoading.value = true
    error.value = null
    
    try {
      // 调用API移除商品
      await cartAPI.removeFromCart(productId)
      
      // 更新本地状态
      removeFromCartLocal(productId)
      
      return { success: true }
      
    } catch (err) {
      console.error('Failed to remove from cart:', err)
      error.value = err.data?.error || 'Failed to remove item from cart'
      
      if (err.status === 401) {
        return { 
          success: false, 
          error: 'Please login to modify cart',
          requiresLogin: true 
        }
      } else if (err.status === 404) {
        // 如果商品不存在于购物车，从本地状态中移除
        removeFromCartLocal(productId)
        return { 
          success: false, 
          error: 'Item not found in cart' 
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to remove item from cart' 
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  // 本地移除购物车商品（不调用API）
  function removeFromCartLocal(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  // 清空购物车（API调用）
  async function clearCart() {
    isLoading.value = true
    error.value = null
    
    try {
      // 逐个移除购物车中的所有商品
      const promises = items.value.map(item => 
        cartAPI.removeFromCart(item.product_id)
      )
      
      await Promise.all(promises)
      
      // 清空本地状态
      items.value = []
      
      return { success: true }
      
    } catch (err) {
      console.error('Failed to clear cart:', err)
      error.value = err.data?.error || 'Failed to clear cart'
      
      if (err.status === 401) {
        return { 
          success: false, 
          error: 'Please login to clear cart',
          requiresLogin: true 
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to clear cart' 
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  // 结账（创建订单）
  async function checkout() {
    isLoading.value = true
    error.value = null
    
    try {
      // 调用结账API
      const result = await cartAPI.checkout()
      
      // 清空本地购物车
      items.value = []
      
      return { 
        success: true, 
        orderId: result.order_id,
        message: result.message || 'Order created successfully'
      }
      
    } catch (err) {
      console.error('Failed to checkout:', err)
      error.value = err.data?.error || 'Failed to checkout'
      
      if (err.status === 401) {
        return { 
          success: false, 
          error: 'Please login to checkout',
          requiresLogin: true 
        }
      } else if (err.status === 400) {
        return { 
          success: false, 
          error: 'Cannot checkout empty cart or invalid data'
        }
      } else if (err.status === 409) {
        return { 
          success: false, 
          error: 'Some items cannot be purchased',
          details: err.data?.details 
        }
      } else {
        return { 
          success: false, 
          error: 'Failed to create order' 
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  // 添加商品到购物车（批量）
  async function addMultipleToCart(products) {
    isLoading.value = true
    error.value = null
    
    try {
      const results = []
      
      for (const product of products) {
        try {
          await cartAPI.addToCart(product.id, product.quantity || 1)
          results.push({ productId: product.id, success: true })
        } catch (err) {
          results.push({ 
            productId: product.id, 
            success: false, 
            error: err.data?.error || 'Failed to add product'
          })
        }
      }
      
      // 重新获取购物车数据以确保同步
      await fetchCart()
      
      return results
      
    } catch (err) {
      console.error('Failed to add multiple items to cart:', err)
      error.value = 'Failed to add items to cart'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 重置错误状态
  function clearError() {
    error.value = null
  }

  return {
    // 状态
    items,
    isLoading,
    error,
    
    // 计算属性
    itemCount,
    totalPrice,
    isCartEmpty,
    
    // 方法
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    addMultipleToCart,
    clearError,
    
    // 保持向后兼容的方法
    removeFromCartLocal
  }
})