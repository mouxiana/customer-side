<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
        <span class="mx-2">/</span>
        <router-link to="/products" class="hover:text-primary">{{ labels.products }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ product.name || labels.product }}</span>
      </nav>
    </div>

    <div v-if="isLoading" class="text-center py-16">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ labels.loading }}</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
      {{ errorMessage }}
    </div>

    <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        <section>
          <div class="w-full h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-4">
            <img
              v-if="selectedImage && !mainImageFailed"
              :src="selectedImage"
              :alt="product.name"
              class="w-full h-full object-cover"
              @error="mainImageFailed = true"
            >
            <div v-else class="text-gray-500 flex flex-col items-center gap-2">
              <i class="fas fa-image text-4xl"></i>
              <span>{{ labels.noImage }}</span>
            </div>
          </div>

          <div v-if="imageList.length > 1" class="grid grid-cols-4 gap-3">
            <button
              v-for="(image, index) in imageList"
              :key="`${image}-${index}`"
              type="button"
              class="h-24 rounded-lg overflow-hidden border-2 bg-gray-100"
              :class="selectedImageIndex === index ? 'border-primary' : 'border-transparent'"
              @click="selectImage(index)"
            >
              <img :src="image" :alt="labels.productImage" class="w-full h-full object-cover">
            </button>
          </div>
        </section>

        <section>
          <h1 class="text-3xl font-bold text-gray-900 mb-3">{{ product.name }}</h1>

          <div class="mb-4">
            <span class="text-4xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
          </div>

          <div class="mb-4">
            <span
              :class="[
                'inline-block px-3 py-1 rounded-full text-sm font-medium',
                isProductAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              ]"
            >
              {{ isProductAvailable ? labels.available : labels.unavailable }}
            </span>
          </div>

          <div class="mb-6 text-gray-700 leading-7">
            {{ product.description || labels.noDescription }}
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ labels.quantity }}</label>
            <div class="flex items-center gap-3">
              <button type="button" class="px-3 py-2 border rounded-lg" @click="decreaseQuantity">-</button>
              <span class="w-12 text-center">{{ quantity }}</span>
              <button type="button" class="px-3 py-2 border rounded-lg" @click="increaseQuantity">+</button>
            </div>
          </div>

          <div class="flex gap-4 mb-8">
            <button
              type="button"
              class="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-button disabled:opacity-50"
              :disabled="!isProductAvailable || isAddingToCart"
              @click="addToCart"
            >
              {{ isAddingToCart ? labels.adding : labels.addToCart }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-gray-500 mb-1">{{ labels.productId }}</div>
              <div class="font-medium text-gray-900">{{ displayProductId }}</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-gray-500 mb-1">{{ labels.category }}</div>
              <div class="font-medium text-gray-900">{{ product.category || '-' }}</div>
            </div>
            <div v-if="product.created_at" class="p-4 bg-gray-50 rounded-lg">
              <div class="text-gray-500 mb-1">{{ labels.createdAt }}</div>
              <div class="font-medium text-gray-900">{{ formatDate(product.created_at) }}</div>
            </div>
            <div v-if="product.updated_at" class="p-4 bg-gray-50 rounded-lg">
              <div class="text-gray-500 mb-1">{{ labels.updatedAt }}</div>
              <div class="font-medium text-gray-900">{{ formatDate(product.updated_at) }}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { cartAPI, productsAPI } from '../api'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()

const product = ref({})
const quantity = ref(1)
const selectedImageIndex = ref(0)
const mainImageFailed = ref(false)
const isLoading = ref(false)
const isAddingToCart = ref(false)
const errorMessage = ref('')

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  products: '商品',
  product: '商品',
  loading: '正在加载商品详情...',
  noImage: '暂无图片',
  productImage: '商品图片',
  available: '可购买',
  unavailable: '暂不可购买',
  noDescription: '暂无详细介绍。',
  quantity: '数量',
  addToCart: '加入购物车',
  adding: '加入中...',
  productId: '商品编号',
  category: '分类',
  createdAt: '创建时间',
  updatedAt: '更新时间'
} : {
  home: 'Home',
  products: 'Products',
  product: 'Product',
  loading: 'Loading product details...',
  noImage: 'No image',
  productImage: 'Product image',
  available: 'Available',
  unavailable: 'Unavailable',
  noDescription: 'No description available.',
  quantity: 'Quantity',
  addToCart: 'Add to Cart',
  adding: 'Adding...',
  productId: 'Product ID',
  category: 'Category',
  createdAt: 'Created At',
  updatedAt: 'Updated At'
})

const getProductId = (item) => item?.id ?? item?.product_id ?? item?._id ?? route.params.id

const imageList = computed(() => {
  const productId = getProductId(product.value)
  const urls = []

  if (product.value?.thumbnail_url) urls.push(productsAPI.resolveAssetUrl(product.value.thumbnail_url))

  if (Array.isArray(product.value?.images)) {
    for (const image of product.value.images) {
      if (!image) continue
      if (typeof image === 'string') {
        urls.push(productsAPI.getProductImageUrl(productId, image))
      } else {
        const url = image.url || image.image_url || image.src
        const filename = image.filename || image.name
        if (url) urls.push(productsAPI.resolveAssetUrl(url))
        else if (filename) urls.push(productsAPI.getProductImageUrl(productId, filename))
      }
    }
  }

  if (Array.isArray(product.value?.image_filenames)) {
    for (const filename of product.value.image_filenames) {
      urls.push(productsAPI.getProductImageUrl(productId, filename))
    }
  }

  return [...new Set(urls.filter(Boolean))]
})

const selectedImage = computed(() => imageList.value[selectedImageIndex.value] || '')
const displayProductId = computed(() => getProductId(product.value))
const isProductAvailable = computed(() => product.value?.status !== 'inactive')
const maxQuantity = computed(() => {
  const stock = Number(product.value?.stock_quantity)
  return Number.isFinite(stock) && stock > 0 ? stock : 10
})

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`
const formatDate = (value) => new Date(value).toLocaleString(isZh.value ? 'zh-CN' : 'en-US')

const selectImage = (index) => {
  selectedImageIndex.value = index
  mainImageFailed.value = false
}

const fetchProductDetail = async () => {
  isLoading.value = true
  errorMessage.value = ''
  quantity.value = 1
  selectedImageIndex.value = 0
  mainImageFailed.value = false

  try {
    const result = await productsAPI.getProductDetail(route.params.id)
    product.value = result || {}
  } catch (error) {
    console.error('Failed to fetch product detail:', error)
    errorMessage.value = error.status === 404 ? (isZh.value ? '商品不存在。' : 'Product not found.') : (error.message || (isZh.value ? '加载商品详情失败。' : 'Failed to load product details.'))
  } finally {
    isLoading.value = false
  }
}

const increaseQuantity = () => {
  if (quantity.value < maxQuantity.value) quantity.value += 1
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value -= 1
}

const addToCart = async () => {
  if (!isProductAvailable.value) return

  try {
    isAddingToCart.value = true
    await cartAPI.addToCart(displayProductId.value, quantity.value)
    alert(isZh.value ? `已将 ${quantity.value} × ${product.value.name} 加入购物车。` : `Added ${quantity.value} × ${product.value.name} to cart.`)
  } catch (error) {
    if (error.status === 401) {
      router.push('/login')
      return
    }
    alert(error.message || (isZh.value ? '加入购物车失败。' : 'Failed to add to cart.'))
  } finally {
    isAddingToCart.value = false
  }
}

watch(() => route.params.id, fetchProductDetail)
watch(locale, fetchProductDetail)
onMounted(fetchProductDetail)
</script>
