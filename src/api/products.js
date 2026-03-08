import client from './client.js'

function wrapError(prefix, error, fallbackMessage) {
  const wrapped = new Error(`${prefix}: ${error.data?.error || error.message || fallbackMessage}`)
  wrapped.status = error.status
  wrapped.data = error.data
  throw wrapped
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value)
}

function isServerPath(value) {
  return typeof value === 'string' && value.startsWith('/')
}

export const productsAPI = {
  async getProducts({
    page = 1,
    pageSize = 20,
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    sortBy = '',
    sortDir = ''
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(pageSize))

    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (minPrice !== '' && minPrice !== null && minPrice !== undefined) params.set('min_price', String(minPrice))
    if (maxPrice !== '' && maxPrice !== null && maxPrice !== undefined) params.set('max_price', String(maxPrice))
    if (sortBy) params.set('sort_by', sortBy)
    if (sortDir) params.set('sort_dir', sortDir)

    try {
      return await client.request(`/products?${params.toString()}`)
    } catch (error) {
      wrapError('获取商品列表失败', error, 'Failed to get products')
    }
  },

  async getProductDetail(productId) {
    try {
      return await client.request(`/products/${productId}`)
    } catch (error) {
      wrapError('获取商品详情失败', error, 'Failed to get product detail')
    }
  },

  resolveAssetUrl(value = '') {
    if (!value) return ''
    if (isAbsoluteUrl(value)) return value
    if (isServerPath(value)) return `${client.API_BASE}${value}`
    return `${client.API_BASE}/${String(value).replace(/^\//, '')}`
  },

  getProductImageUrl(productId, filenameOrPath) {
    if (!filenameOrPath) return ''
    if (isAbsoluteUrl(filenameOrPath) || isServerPath(filenameOrPath)) {
      return this.resolveAssetUrl(filenameOrPath)
    }
    return `${client.API_BASE}/images/products/${productId}/${String(filenameOrPath).replace(/^\//, '')}`
  },

  getProductThumbnailUrl(filenameOrPath) {
    if (!filenameOrPath) return ''
    if (isAbsoluteUrl(filenameOrPath) || isServerPath(filenameOrPath)) {
      return this.resolveAssetUrl(filenameOrPath)
    }
    return `${client.API_BASE}/images/products/thumbnails/${String(filenameOrPath).replace(/^\//, '')}`
  }
}
