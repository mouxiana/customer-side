// 统一导出所有API模块
import { authAPI } from './auth.js';
import { productsAPI } from './products.js';
import { cartAPI } from './cart.js';
import { ordersAPI } from './order.js';
import client from './client.js';

export {
    authAPI,
    productsAPI,
    cartAPI,
    ordersAPI,
    client,
};

// 默认导出所有API
export default {
    auth: authAPI,
    products: productsAPI,
    cart: cartAPI,
    orders: ordersAPI,
    client,
};