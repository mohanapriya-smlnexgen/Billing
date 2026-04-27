// src/api.js  (or src/api/index.js)

import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API = axios.create({
  baseURL: `${BASE_URL}/`,
  // your headers, interceptors, etc.
});

// ADD THIS LINE — THIS IS WHAT WAS MISSING
API.refundOrder = (orderId, amount, reason) =>
  API.post(`cashier-orders/${orderId}/refund/`, { amount, reason });

// your other custom methods (if any)
export default API;