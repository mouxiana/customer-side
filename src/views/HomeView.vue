<template>
  <div class="min-h-screen bg-gray-50">
    <section class="relative h-96 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-300 z-10"></div>
      <div class="w-full h-full bg-gray-200"></div>
      <div class="absolute inset-0 z-20 flex items-center">
        <div class="container mx-auto px-4 text-white">
          <h1 class="text-5xl font-bold mb-4">{{ $t('home.welcome') }}</h1>
          <p class="text-xl mb-8 max-w-2xl">{{ $t('home.subtitle') }}</p>
          <button
            @click="startShopping"
            class="bg-primary hover:bg-orange-600 text-white px-8 py-3 !rounded-button whitespace-nowrap transition-colors duration-200"
          >
            {{ $t('home.shopNow') }}
          </button>
        </div>
      </div>
    </section>

    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">{{ $t('home.categories') }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
            @click="goToProducts"
          >
            <div class="w-16 h-16 mb-3 overflow-hidden rounded-lg bg-gray-200"></div>
            <span class="text-gray-700 group-hover:text-primary">{{ category.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('home.featured') }}</h2>
          <p class="text-gray-600">{{ $t('home.featuredDesc') }}</p>
        </div>

        <div v-if="productsLoading" class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
          <p class="mt-2 text-gray-600">{{ labels.loading }}</p>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-12 text-gray-500">
          {{ labels.noProducts }}
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <article
            v-for="product in products"
            :key="getProductId(product)"
            class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            @click="goToProduct(getProductId(product))"
          >
            <div class="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="getProductImage(product)"
                :src="getProductImage(product)"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
              <i v-else class="fas fa-image text-4xl text-gray-400"></i>
            </div>

            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 truncate">{{ product.name }}</h3>
              <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ product.description || labels.noDescription }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
                <span class="text-sm text-gray-500">{{ labels.productId }}: {{ getProductId(product) }}</span>
              </div>
              <button
                class="w-full mt-4 bg-primary hover:bg-orange-600 text-white py-2 rounded-button text-sm"
                @click.stop="addToCart(product)"
              >
                {{ labels.addToCart }}
              </button>
            </div>
          </article>
        </div>

        <div v-if="products.length > 0" class="mt-8 flex justify-center items-center space-x-4">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-4 py-2 border rounded-button disabled:opacity-50"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="text-gray-700">{{ labels.page(currentPage, totalPages) }}</span>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 border rounded-button disabled:opacity-50"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { cartAPI, productsAPI } from '../api'

const { locale } = useI18n()
const router = useRouter()
const productsLoading = ref(false)
const products = ref([])
const currentPage = ref(1)
const pageSize = ref(8)
const totalProducts = ref(0)

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  loading: '正在加载商品...',
  noProducts: '暂无商品。',
  noDescription: '暂无详细介绍。',
  addToCart: '加入购物车',
  productId: '商品编号',
  page: (p, t) => `第 ${p} / ${t} 页`
} : {
  loading: 'Loading products...',
  noProducts: 'No products available.',
  noDescription: 'No description available.',
  addToCart: 'Add to Cart',
  productId: 'Product ID',
  page: (p, t) => `Page ${p} of ${t}`
})

const categories = computed(() => isZh.value ? [
  { id: 1, name: '手机' },
  { id: 2, name: '笔记本' },
  { id: 3, name: '平板' },
  { id: 4, name: '音频' },
  { id: 5, name: '穿戴设备' },
  { id: 6, name: '配件' }
] : [
  { id: 1, name: 'Phones' },
  { id: 2, name: 'Laptops' },
  { id: 3, name: 'Tablets' },
  { id: 4, name: 'Audio' },
  { id: 5, name: 'Wearables' },
  { id: 6, name: 'Accessories' }
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / pageSize.value)))

const getProductId = (product) => product?.id ?? product?.product_id ?? product?._id
const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const getProductImage = (product) => {
  if (product?.thumbnail_url) return productsAPI.resolveAssetUrl(product.thumbnail_url)
  if (product?.thumbnail) return productsAPI.resolveAssetUrl(product.thumbnail)
  if (product?.thumbnail_filename) return productsAPI.getProductThumbnailUrl(product.thumbnail_filename)

  const firstImage = Array.isArray(product?.images) ? product.images[0] : null
  if (!firstImage) return ''

  if (typeof firstImage === 'string') {
    return productsAPI.getProductImageUrl(getProductId(product), firstImage)
  }

  return productsAPI.resolveAssetUrl(firstImage.url || firstImage.image_url || firstImage.src || '')
}

const startShopping = () => router.push('/products')
const goToProducts = () => router.push('/products')

const goToProduct = (productId) => {
  if (!productId) return
  router.push(`/product/${productId}`)
}

const addToCart = async (product) => {
  try {
    await cartAPI.addToCart(getProductId(product), 1)
    alert(isZh.value ? `已将 ${product.name} 加入购物车。` : `Added ${product.name} to cart.`)
  } catch (error) {
    if (error.status === 401) {
      router.push('/login')
      return
    }
    alert(error.message || (isZh.value ? '加入购物车失败。' : 'Failed to add to cart.'))
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchProducts()
}

const fetchProducts = async () => {
  try {
    productsLoading.value = true
    const data = await productsAPI.getProducts({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    products.value = data?.products || []
    totalProducts.value = data?.pagination?.total_items || products.value.length
  } catch (error) {
    console.error('Failed to fetch products:', error)
    products.value = []
    totalProducts.value = 0
  } finally {
    productsLoading.value = false
  }
}

watch(locale, () => {
  fetchProducts()
})

onMounted(fetchProducts)
</script>
