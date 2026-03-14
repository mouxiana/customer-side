<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">Home</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">All Products</span>
      </nav>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <aside class="lg:w-1/4">
        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-6">
          <div class="mb-6">
            <h3 class="font-semibold text-gray-900 mb-3">Search</h3>
            <div class="relative">
              <input
                v-model.trim="searchQuery"
                type="text"
                placeholder="Search products..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              >
              <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div class="mb-6 opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">Categories</h3>
            <div class="space-y-2">
              <label v-for="category in mockCategories" :key="category.id" class="flex items-center cursor-not-allowed">
                <input type="checkbox" disabled class="h-4 w-4 border-gray-300 rounded">
                <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
                <span class="ml-auto text-xs text-gray-500">({{ category.count }})</span>
              </label>
            </div>
          </div>

          <div class="mb-6 opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">Price Range</h3>
            <div class="grid grid-cols-2 gap-3">
              <input disabled type="number" placeholder="Min" class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
              <input disabled type="number" placeholder="Max" class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
            </div>
          </div>

          <div class="opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">Sort</h3>
            <select disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
              <option>Default</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name</option>
            </select>
          </div>
        </div>
      </aside>

      <section class="lg:w-3/4">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Products</h1>
            <p class="text-gray-600 mt-1">{{ totalItems }} item(s)</p>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-16">
          <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p class="text-gray-600">Loading products...</p>
        </div>

        <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {{ errorMessage }}
        </div>

        <div v-else-if="sortedProducts.length === 0" class="bg-white rounded-xl shadow-lg p-10 text-center text-gray-500">
          No products found.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <article
            v-for="product in sortedProducts"
            :key="getProductId(product)"
            class="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-200"
            @click="openProduct(product)"
          >
            <div class="h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="getProductImage(product)"
                :src="getProductImage(product)"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
              <i v-else class="fas fa-image text-4xl text-gray-400"></i>
            </div>

            <div class="p-5">
              <h2 class="text-lg font-semibold text-gray-900 mb-2 truncate">{{ product.name }}</h2>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ product.description || 'No description available.' }}</p>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
                <span class="text-xs uppercase text-gray-500">{{ product.category || 'product' }}</span>
              </div>

              <button
                type="button"
                class="w-full mt-4 bg-primary hover:bg-orange-600 text-white py-2 rounded-button"
                @click.stop="addToCart(product)"
              >
                Add to Cart
              </button>
            </div>
          </article>
        </div>

        <div v-if="totalPages > 1" class="mt-8 flex justify-center items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 border rounded-lg disabled:opacity-50"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="text-gray-700">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="px-4 py-2 border rounded-lg disabled:opacity-50"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cartAPI, productsAPI } from '../api'

const router = useRouter()
const route = useRoute()
const products = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 9
const totalItems = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const isSyncingFromRoute = ref(false)

const mockCategories = ref([
  { id: 1, name: 'Phone', count: 12 },
  { id: 2, name: 'Tablet', count: 6 },
  { id: 3, name: 'Laptop', count: 9 },
  { id: 4, name: 'Accessory', count: 14 }
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
const sortedProducts = computed(() => [...products.value])

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

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await productsAPI.getProducts({
      page: currentPage.value,
      pageSize,
      search: searchQuery.value
    })

    products.value = result?.products || []
    totalItems.value = result?.pagination?.total_items || products.value.length
  } catch (error) {
    console.error('Failed to fetch products:', error)
    errorMessage.value = error.message || 'Failed to load products.'
    products.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

const openProduct = (product) => {
  const productId = getProductId(product)
  if (!productId) return
  router.push(`/product/${productId}`)
}

const addToCart = async (product) => {
  try {
    await cartAPI.addToCart(getProductId(product), 1)
    alert(`Added ${product.name} to cart.`)
  } catch (error) {
    if (error.status === 401) {
      router.push('/login')
      return
    }
    alert(error.message || 'Failed to add to cart.')
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

let searchTimer = null
watch(searchQuery, () => {
  if (isSyncingFromRoute.value) return

  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    fetchProducts()
  }, 350)
})

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchProducts()
})

watch(
  () => route.query.search,
  async (newValue) => {
    const nextValue = String(newValue || '')
    if (nextValue === searchQuery.value) return

    isSyncingFromRoute.value = true
    searchQuery.value = nextValue

    if (currentPage.value !== 1) {
      currentPage.value = 1
    } else {
      await fetchProducts()
    }

    isSyncingFromRoute.value = false
  }
)

onMounted(() => {
  searchQuery.value = String(route.query.search || '')
  fetchProducts()
})
</script>
