import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Receipt,
  PauseCircle,
  Printer,
  ShoppingCart,
  CheckCircle,
  X,
  LogOut,
  ClipboardList,
  User,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Tag,
  Clock,
  Store,
  Phone,
  Calendar,
  FileText,
  AlertCircle,
  Bell,
  ShoppingBag,
  ChevronRight,   // ✅ ADD THIS
  Filter,
  AppWindowMacIcon,
  PersonStanding,
  PersonStandingIcon, Mail

} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BillingRightPanel } from "./BillingRightPanel";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REPORT_API = `${BASE_URL}/report-setting/`;
const MENU_API = `${BASE_URL}/food-menu/`;
const BILL_API = `${BASE_URL}/cashier-orders/`;
const SETTING_API = `${BASE_URL}/restaurant-setting/`;

const Modal = ({ children, title, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-1">
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Bell size={22} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-2xl text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage and process orders</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-2 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  </div>
);

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  // const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [savedBills, setSavedBills] = useState([]);
  const [preOrderAlerts, setPreOrderAlerts] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [customPrice, setCustomPrice] = useState(0);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [orderType, setOrderType] = useState("normal");
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [credit, setCredit] = useState(0);
  const [bulkNote, setBulkNote] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [source, setSource] = useState("offline");
  const [externalOrderId, setExternalOrderId] = useState("");
  const [customerCredits, setCustomerCredits] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [customerFound, setCustomerFound] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [restaurantName, setRestaurantName] = useState(
    localStorage.getItem("restaurant_name") || "My Restaurant"
  );
  const [taxPercentage, setTaxPercentage] = useState(
    Number(localStorage.getItem("tax_percentage")) || 5
  );
  const [showTaxEditor, setShowTaxEditor] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search and Filter states for notification modal
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Store read notification IDs in localStorage
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem("read_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMenuItems();
    fetchBills();
    fetchReportEmail();
    fetchRestaurantSettings();
  }, []);

  // Save read notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("read_notifications", JSON.stringify(readNotifications));
  }, [readNotifications]);

  const fetchPreOrderAlerts = async () => {
    try {
      const res = await axios.get(BILL_API);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alerts = data.filter((order) => {
        // Skip paid or cancelled orders
        if (order.status === 'paid' || order.status === 'cancelled') return false;

        // For PRE-ORDERS (is_advance = true)
        if (order.is_advance === true) {
          if (!order.scheduled_time) return false;
          const orderDate = new Date(order.scheduled_time);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        }

        // For BULK orders
        if (order.is_bulk === true) {
          if (order.scheduled_time) {
            const orderDate = new Date(order.scheduled_time);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
          }
          if (order.created_at) {
            const createdDate = new Date(order.created_at);
            createdDate.setHours(0, 0, 0, 0);
            return createdDate.getTime() === today.getTime();
          }
          return false;
        }

        // For REGULAR orders
        if (order.created_at) {
          const createdDate = new Date(order.created_at);
          createdDate.setHours(0, 0, 0, 0);
          return createdDate.getTime() === today.getTime();
        }

        return false;
      });

      // Sort alerts by date (newest first)
      const sortedAlerts = alerts.sort((a, b) => {
        const dateA = a.scheduled_time || a.created_at;
        const dateB = b.scheduled_time || b.created_at;
        return new Date(dateB) - new Date(dateA);
      });

      setPreOrderAlerts(sortedAlerts);
    } catch (err) {
      console.error("Alert fetch error", err);
    }
  };

  useEffect(() => {
    fetchPreOrderAlerts();
    const interval = setInterval(() => {
      fetchPreOrderAlerts();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = preOrderAlerts;

    // Apply tab filter
    filtered = filtered.filter((order) => {
      if (activeAlertTab === "all") return true;
      if (activeAlertTab === "preorder") return order.is_advance === true;
      if (activeAlertTab === "bulk") return order.is_bulk === true;
      if (activeAlertTab === "normal") return !order.is_advance && !order.is_bulk;
      return true;
    });

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        return (
          order.order_id.toString().includes(searchLower) ||
          (order.customer?.name || "").toLowerCase().includes(searchLower) ||
          (order.customer?.phone || "").includes(searchTerm)
        );
      });
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter((order) => {
        const displayTime = order.scheduled_time || order.created_at;
        const orderDate = new Date(displayTime).toISOString().split("T")[0];
        return orderDate === dateFilter;
      });
    }

    return filtered;
  }, [preOrderAlerts, activeAlertTab, searchTerm, dateFilter]);

  const filteredPendingOrders = useMemo(() => {
    const pendingOrders = savedBills.filter((b) => b.status !== "paid");

    if (!pendingSearch) return pendingOrders;

    const searchLower = pendingSearch.toLowerCase();
    return pendingOrders.filter((order) => {
      return (
        order.order_id.toString().includes(searchLower) ||
        (order.customer?.name || "").toLowerCase().includes(searchLower) ||
        (order.customer?.phone || "").includes(pendingSearch)
      );
    });
  }, [savedBills, pendingSearch]);

  // Function to mark a notification as read
  const markAsRead = (orderId) => {
    if (!readNotifications.includes(orderId)) {
      setReadNotifications([...readNotifications, orderId]);
    }
  };

  // Function to mark all notifications in current filtered view as read
  const markAllAsRead = () => {
    const newReadIds = [...readNotifications];
    filteredOrders.forEach((order) => {
      if (!newReadIds.includes(order.order_id)) {
        newReadIds.push(order.order_id);
      }
    });
    setReadNotifications(newReadIds);
  };

  // Get unread count for a specific tab
  const getUnreadCountForTab = (tabKey) => {
    let filtered = preOrderAlerts;

    if (tabKey === "preorder") filtered = filtered.filter(order => order.is_advance === true);
    else if (tabKey === "bulk") filtered = filtered.filter(order => order.is_bulk === true);
    else if (tabKey === "normal") filtered = filtered.filter(order => !order.is_advance && !order.is_bulk);

    return filtered.filter((order) => !readNotifications.includes(order.order_id)).length;
  };

  // Total unread count (for the bell icon)
  const totalUnreadCount = useMemo(() => {
    return preOrderAlerts.filter((order) => !readNotifications.includes(order.order_id)).length;
  }, [preOrderAlerts, readNotifications]);

  const fetchReportEmail = async () => {
    try {
      const response = await axios.get(REPORT_API);
      setAdminEmail(response.data.email || "");
    } catch (error) {
      console.error(error);
    }
  };

  const searchCustomer = async (phone) => {
    if (!phone || phone.length !== 10) return;

    try {
      console.log("Searching:", phone);

      const res = await axios.get(
        `${BASE_URL}/cashier-orders/search_customer/?phone=${phone}`
      );

      console.log("✅ API RESPONSE:", res);        // full response
      console.log("✅ DATA:", res.data);           // actual data

      setCustomerName(res.data?.name || "");
      setCustomerCredits(res.data?.credits || 0);
      setCustomerId(res.data?.id || null);
      setCustomerFound(true);

    } catch (err) {
      console.error("❌ API ERROR:", err.response || err);

      setCustomerFound(false);
      setCustomerCredits(0);
      setCustomerName("");
    }
  };

  const handleSaveRestaurantName = async () => {
    try {
      await axios.post(SETTING_API, { restaurant_name: restaurantName });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveAdminEmail = async () => {
    try {
      await axios.post(SETTING_API, { admin_email: adminEmail });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveTaxPercentage = () => {
    localStorage.setItem("tax_percentage", taxPercentage);
    setShowTaxEditor(false);
  };

  const fetchDiscount = async (amount) => {
    try {
      const res = await axios.post(`${BILL_API}preview_discount/`, {
        total_amount: amount,
      });
      setDiscount(res.data.discount || 0);
    } catch {
      console.error("Discount fetch failed");
    }
  };

  const fetchRestaurantSettings = async () => {
    try {
      const response = await axios.get(SETTING_API);
      setRestaurantName(response.data.restaurant_name || "My Restaurant");
      setAdminEmail(response.data.admin_email || "");
      setTaxPercentage(Number(response.data.tax_percentage) || 5);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        axios.get(MENU_API),
        axios.get(`${MENU_API}categories/`),
      ]);
      const itemsData = Array.isArray(itemsRes.data)
        ? itemsRes.data
        : itemsRes.data.results || [];
      const categoriesData = Array.isArray(catsRes.data)
        ? catsRes.data
        : catsRes.data.results || [];

      setMenuItems(itemsData.map((item, index) => ({
        food_id: item.id || index + 1,
        name: item.food_name,
        price: Number(item.price),
        category: item.category?.toLowerCase() || "uncategorized",
        variants: item.variants || []   // ✅ ADD THIS
      })));

      setCategories([
        "all",
        ...categoriesData.map((cat) =>
          typeof cat === "string" ? cat.toLowerCase() : cat.name?.toLowerCase()
        ),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get(BILL_API);
      setSavedBills(
        Array.isArray(response.data) ? response.data : response.data.results || []
      );
    } catch (error) {
      setSavedBills([]);
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, selectedCategory, menuItems]);

  const addToCart = (item) => {
    const existing = cart.find(
      c =>
        c.food_id === item.food_id &&
        c.variant_info === item.variant_info
    );

    if (existing) {
      setCart(cart.map(c =>
        c.food_id === item.food_id &&
          c.variant_info === item.variant_info
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQty = (foodId, variant, type) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.food_id !== foodId || item.variant_info !== variant) return item;

          return {
            ...item,
            quantity: type === "inc"
              ? item.quantity + 1
              : item.quantity - 1
          };
        })
        .filter(item => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (subtotal > 0) {
      fetchDiscount(subtotal);
    } else {
      setDiscount(0);
    }
  }, [subtotal]);

 const tax = subtotal * (taxPercentage / 100);
const subtotalAfterDiscount = subtotal - discount;           // ← Important
const computedTotal = subtotalAfterDiscount + tax - credit;  // ← Fixed order
const finalTotal = Number(
  orderType !== "normal" && customPrice > 0
    ? customPrice
    : Math.max(computedTotal, 0)
);
  const dueAmount = (selectedBill?.custom_price || selectedBill?.final_amount || finalTotal) - (selectedBill?.advance_paid || selectedBill?.received_amount || 0);
  const balance = cashReceived - dueAmount;

  const handleGenerateBill = async () => {
    if (cart.length === 0) return;

    try {
      let formattedScheduledTime = null;
      if (orderType === "preorder" && scheduledTime) {
        const date = new Date(scheduledTime);
        formattedScheduledTime = date.toISOString().slice(0, 19).replace('T', ' ');
      }

      const payload = {
        total_amount: subtotal,
        final_amount: finalTotal,
        discount_amount: discount,
        credit_used: credit,
        discount: discount,
        name: customerName,
        phone: customerPhone,
        is_bulk: orderType === "bulk",
        is_advance: orderType === "preorder",
        bulk_note: bulkNote,
        custom_price: customPrice > 0 ? customPrice : null,
        scheduled_time: formattedScheduledTime,
        advance_paid: advanceAmount || 0,
        payment_mode: advanceAmount > 0 ? "cash" : null,
        status: "pending",
        cart: cart.map((item) => {
          let qty = item.quantity;

          if (orderType === "bulk" && bulkNote) {
            let qty = item.quantity;

            if (orderType === "bulk" && bulkNote) {
              const parsed = parseBulkQty(bulkNote);
              qty = parsed.qty;
            }
          }

          return {
            food_id: item.food_id,
            name: item.name,
            quantity: qty,
            price: item.price,
          };
        }),
      };

      const res = await axios.post(`${BILL_API}create_order/`, payload);
      setSelectedBill(null);
      setShowPendingModal(true);
      setCart([]);
      setAdvanceAmount(0);
      await fetchPreOrderAlerts();
      setTimeout(() => printAdvanceBill(res.data), 500);
      await fetchBills();
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };
  const parseBulkQty = (note) => {
    if (!note) return { qty: 1, unit: "pcs" };

    const match = note.toLowerCase().match(/(\d+(\.\d+)?)\s*(kg|g|pcs)?/);

    if (!match) return { qty: 1, unit: "pcs" };

    let qty = Number(match[1]);
    let unit = match[3] || "pcs";

    // convert grams to kg
    if (unit === "g") {
      qty = qty / 1000;
      unit = "kg";
    }

    return { qty, unit };
  };
const printAdvanceBill = (bill) => {
  const printWindow = window.open("", "_blank");
  const subtotal = Number(bill.total_amount || bill.custom_price || 0);
  const tax = subtotal * (taxPercentage / 100);
  const discount = Number(bill.discount_amount || 0);
  const total = subtotal - discount + tax;

  const advance = Number(bill.advance_paid || bill.received_amount || 0);
  const balance = total - advance;

  printWindow.document.write(`
    <html>
    <head>
      <title>Order #${bill.order_id}</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          width: 300px; 
          margin: auto; 
          padding: 20px; 
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px dashed #000; 
          padding-bottom: 10px; 
          margin-bottom: 15px; 
        }
        .item { 
          display: flex; 
          justify-content: space-between; 
          margin: 6px 0; 
        }
        .total-line { 
          border-top: 2px dashed #000; 
          margin: 12px 0 8px 0; 
          padding-top: 8px; 
        }
        .discount { color: #22c55e; font-weight: bold; }
        .warning { 
          color: #ef4444; 
          font-weight: bold; 
          text-align: center; 
          margin-top: 15px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h3>${restaurantName}</h3>
        <p>Order #${bill.order_id}</p>
        <p>${new Date().toLocaleString()}</p>
      </div>

      <div>
        ${(bill.items || []).map((i) => `
          <div class="item">
            <span>${i.name}</span>
            <span>₹${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join("")}
      </div>

      <div class="total-line"></div>

      <div class="item"><strong>Total</strong><strong>₹${subtotal.toFixed(2)}</strong></div>
      ${discount > 0 ? `<div class="item discount"><span>Discount</span><span>- ₹${discount.toFixed(2)}</span></div>` : ""}
      <div class="item"><span>Tax</span><span>₹${tax.toFixed(2)}</span></div>
      <div class="item"><span>Grand Total</span><span>₹${total.toFixed(2)}</span></div>
      <div class="item"><span>Advance Paid</span><span>₹${advance.toFixed(2)}</span></div>
      <div class="item"><strong>Balance</strong><strong>₹${balance.toFixed(2)}</strong></div>

      <div class="warning">
        ⚠ Pending Order - Please Pay Balance
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
};

  const handleSelectBill = (bill) => {
    setSelectedBill(bill);
    setCart((bill.items || []).map((item) => ({
      food_id: item.food_id,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      isCustom: !!bill.custom_price,
    })));
    setShowPendingModal(false);
    setShowAlertModal(false);
  };

  const handlePayNow = async () => {
    if (!selectedBill) return;

    try {
      const total = Number(selectedBill?.custom_price || selectedBill?.final_amount || 0);
      const advance = Number(selectedBill?.advance_paid || 0);
      let remaining = total - advance;

      if (remaining <= 0 || !cashReceived || cashReceived < remaining) return;

      const response = await axios.post(`${BILL_API}${selectedBill.order_id}/mark_paid/`, {
        received_amount: cashReceived,
        payment_mode: paymentMode,
      });

      // mark paid response
      const paidBill = response.data;

      // OPTIONAL: print before clearing
      setTimeout(() => printBill(paidBill), 300);

      // 🔥 RESET EVERYTHING
      setSelectedBill(null);
      setCart([]);
      setShowPaymentModal(false);
      setCashReceived(0);

      // reset customer
      setCustomerName("");
      setCustomerPhone("");
      setCustomerFound(false);
      setCustomerCredits(0);

      // reset financials
      setAdvanceAmount(0);
      setDiscount(0);
      setCredit(0);

      // reset order type
      setOrderType("normal");
      setCustomPrice(0);
      setScheduledTime("");
      setBulkNote("");

      // refresh bills
      await fetchBills();
      await fetchBills();
    } catch (error) {
      console.error(error);
    }
  };
 const printBill = (billData) => {
  const bill = billData || selectedBill;
  if (!bill) return;

  const subtotal = Number(bill.total_amount || bill.customer_price || 0);
  const discount = Number(bill.discount_amount || 0);
  const tax = subtotal * (taxPercentage / 100);
  const credit = Number(bill.credit_used || 0);
  const final = subtotal - discount + tax;
  const advance = Number(bill.advance_paid || 0);
  const paidNow = Number(bill.received_amount || 0);
  const totalPaid = advance + paidNow;
  const change = totalPaid - final;

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
    <head>
      <title>Invoice #${bill.order_id}</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          width: 300px; 
          margin: auto; 
          padding: 15px; 
        }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 10px 0; }
        .discount { color: #22c55e; }
      </style>
    </head>
    <body>
      <div class="center">
        <h2>${restaurantName}</h2>
        <p>Order #${bill.order_id}</p>
        <p class="small">${new Date(bill.created_at).toLocaleString()}</p>
      </div>

      <div class="line"></div>

      ${(bill.items || []).map(item => `
        <div class="row">
          <span>${item.name} ${item.variant_info ? ` (${item.variant_info.replace("_", " ")})` : ""} </span>
          <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join("")}

      <div class="line"></div>

      <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Tax</span><span>₹${tax.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="row discount"><span>Discount</span><span>- ₹${discount.toFixed(2)}</span></div>` : ""}
      ${credit > 0 ? `<div class="row"><span>Credit Used</span><span>- ₹${credit.toFixed(2)}</span></div>` : ""}
      
      <div class="line"></div>
      
      <div class="row bold"><span>Total</span><span>₹${final.toFixed(2)}</span></div>

      ${advance > 0 ? `<div class="row"><span>Advance Paid</span><span>₹${advance.toFixed(2)}</span></div>` : ""}
      <div class="row"><span>Paid Now</span><span>₹${paidNow.toFixed(2)}</span></div>
      <div class="row bold"><span>Total Paid</span><span>₹${totalPaid.toFixed(2)}</span></div>
      ${change > 0 ? `<div class="row"><span>Change</span><span>₹${change.toFixed(2)}</span></div>` : ""}

      <div class="line"></div>
      <p class="center">🙏 Thank You! Visit Again</p>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
};
  const printKOT = () => {
    const kotWindow = window.open("", "_blank");
    kotWindow.document.write(`
      <html>
      <head>
        <title>Kitchen Order Ticket</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 280px; margin: auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 15px; }
          .item { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KITCHEN ORDER TICKET</h2>
          <p>Order #${selectedBill?.order_id || "New"}</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        ${cart.map((i) => `<div class="item"><strong>${i.quantity}x</strong> ${i.name}</div>`).join("")}
        <div class="header" style="margin-top: 20px;">
          <p><strong>PRIORITY: IMMEDIATE</strong></p>
        </div>
      </body>
      </html>
    `);
    kotWindow.document.close();
    kotWindow.print();
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="h-15 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-800 uppercase">POS</h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Clock size={10} /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2" />

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Store size={16} className="text-indigo-500" />
            <input
              className="bg-transparent font-bold text-sm outline-none w-32"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />

            {/* ✅ ADD THIS BUTTON */}
            <button
              onClick={handleSaveRestaurantName}
              className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg font-bold"
            >
              SAVE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <Store size={16} className="text-indigo-600" />
                <input
                  className="bg-transparent border-none text-sm font-medium focus:outline-none w-36 text-gray-700"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  onBlur={handleSaveRestaurantName}
                />
              </div> */}

          {/* Bell Button with Unread Count */}
          <button
            onClick={() => {
              setActiveAlertTab("all");
              setSearchTerm("");
              setDateFilter("");
              setShowAlertModal(true);
            }}
            className="relative p-2 hover:bg-yellow-50 rounded-full transition-colors"
          >
            <Bell size={20} className="text-yellow-600" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ClipboardList size={20} />
          </button>

          <div
            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
          >
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-1.5">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Mail size={14} className="text-indigo-500" />
                </div>
                <input
                  className="bg-transparent text-xs font-semibold outline-none w-44 px-2"
                  placeholder="Report Sync Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)} />
                <button
                  onClick={handleSaveAdminEmail}
                  className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-600 transition-colors"
                >
                  SYNC
                </button>
              </div>


              <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex overflow-hidden p-2 gap-2">

        {/* Sidebar: Categories */}
        <aside className="w-40 flex flex-col gap-4">
          <div className="bg-gray-100 h-full rounded p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Groups</h2>
              
            </div>
            <nav className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                >
                  <span className="capitalize">{cat}</span>
                  {selectedCategory === cat && <ChevronRight size={14} />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center: Menu Grid */}
        <section className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Search Header */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search dishes, drinks or snacks..."
              className="w-full h-10 bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
  {filteredItems.map((item) => {
    const variantIndex = selectedVariants[item.food_id] ?? 0;
    const variant = item.variants?.[variantIndex];
    const displayPrice = variant?.price ?? item.price;

    return (
      <div
        key={item.food_id}
        className="bg-white border rounded-xl p-3 h-full flex flex-col justify-between"
      >
        {/* TOP CONTENT */}
        <div className="gap-1">
          <h3 className="font-bold">
            {item.name}
        
            {item.variants.length > 0 && (
              <select
                className="w-100 border rounded px-2 py-1 text-sm"
                value={selectedVariants[item.food_id] ?? 0}
                onChange={(e) => {
                  setSelectedVariants((prev) => ({
                    ...prev,
                    [item.food_id]: Number(e.target.value),
                  }));
                }}
              >
                {item.variants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.value} {v.unit}
                  </option>
                ))}
              </select>
            )}
          
          </h3>

          {/* FIXED HEIGHT VARIANT */}
          
        </div>

        {/* BOTTOM (ALWAYS SAME POSITION) */}
        <div className="flex justify-between items-center mt-3">
          <span className="font-bold text-indigo-600">
            ₹{displayPrice}
          </span>

          <button
            onClick={() =>
              addToCart({
                ...item,
                price: displayPrice,
                variant_info: variant
                  ? `${variant.value}_${variant.unit}`
                  : "default",
              })
            }
            className="bg-indigo-600 text-white px-2 py-1 rounded text-sm" 
          >
            Add
          </button>
        </div>
      </div>
    );
  })}
</motion.div>
            )}
          </div>
        </section>

        {/* Right: Order Panel */}
        <div className="w-96 flex flex-col">
          <BillingRightPanel
  cart={cart}
  updateQty={updateQty}
  setCart={setCart}
  setSelectedBill={setSelectedBill}
  menuItems={menuItems}
  subtotal={subtotal}
  tax={tax}
  taxPercentage={taxPercentage}
  discount={discount}
  setDiscount={setDiscount}
  credit={credit}
  setCredit={setCredit}
  finalTotal={finalTotal}
  advanceAmount={advanceAmount}

  selectedBill={selectedBill}

  showTaxEditor={showTaxEditor}
  setShowTaxEditor={setShowTaxEditor}
  taxPercentageValue={taxPercentage}
  setTaxPercentage={setTaxPercentage}
  handleSaveTaxPercentage={() => {
    localStorage.setItem("tax_percentage", taxPercentage);
    setShowTaxEditor(false);
  }}

  handleGenerateBill={handleGenerateBill}
  setShowPaymentModal={setShowPaymentModal}

  setShowPendingModal={setShowPendingModal}
  printKOT={printKOT}
  printBill={printBill}

  showCustomerDetails={showCustomerDetails}
  setShowCustomerDetails={setShowCustomerDetails}

  customerPhone={customerPhone}
  setCustomerPhone={setCustomerPhone}
  customerName={customerName}
  setCustomerName={setCustomerName}

  customerFound={customerFound}
  customerCredits={customerCredits}
  customerCreditsValue={customerCredits}

  orderType={orderType}
  setOrderType={setOrderType}
  scheduledTime={scheduledTime}
  setScheduledTime={setScheduledTime}
  bulkNote={bulkNote}
  setBulkNote={setBulkNote}

  customPrice={customPrice}
  setCustomPrice={setCustomPrice}
  setAdvanceAmount={setAdvanceAmount}

  source={source}
  setSource={setSource}
  externalOrderId={externalOrderId}
  setExternalOrderId={setExternalOrderId}

 searchCustomer={searchCustomer}
/>
        </div>
      </main>

      {/* ==================== ALERT MODAL WITH SEARCH & DATE FILTER ==================== */}
      <AnimatePresence>
{showAlertModal && (
  <Modal
    title="Today's Orders & Notifications"
    onClose={() => {
      setShowAlertModal(false);
      setSearchTerm("");
      setDateFilter("");
    }}
  >
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {[
          { key: "all", label: "All Orders" },
          { key: "normal", label: "Regular" },
          { key: "preorder", label: "Pre Orders" },
          { key: "bulk", label: "Bulk Orders" },
        ].map((tab) => {
          const unreadCount = getUnreadCountForTab(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveAlertTab(tab.key);
                setSearchTerm("");
                setDateFilter("");
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative border-b-2 ${
                activeAlertTab === tab.key
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top Controls: Search + Date + Mark All Read */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Search and Date Filter in same line */}
        <div className="flex flex-1 gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Order ID, Name or Phone..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <div className="relative w-56">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Mark All as Read Button - Top Right */}
        {filteredOrders.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 rounded-2xl font-medium transition-all flex-shrink-0"
          >
            <CheckCircle size={18} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Clear Filters Button (shown only when filters are active) */}
      {(searchTerm || dateFilter) && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
            }}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Summary */}
      {(searchTerm || dateFilter) && (
        <div className="bg-blue-50 border border-blue-100 px-5 py-3 rounded-2xl text-blue-700 text-sm">
          Showing {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}
          {searchTerm && ` for "${searchTerm}"`}
          {dateFilter && ` on ${new Date(dateFilter).toLocaleDateString()}`}
        </div>
      )}

      {/* Orders Table */}
      <div className="max-h-[460px] overflow-auto border border-gray-200 rounded-2xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <Bell size={60} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || dateFilter ? "Try different filters" : "No orders for today"}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full table-auto">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600">ORDER ID</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600">CUSTOMER</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600">TYPE</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600">TIME</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600">TOTAL</th>
                {/* <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600">DUE</th> */}
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600">STATUS</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => {
                const isPreOrder = o.is_advance === true;
                const isBulk = o.is_bulk === true;
                const total = Number(o.final_amount || o.total_amount || 0);
                const advance = Number(o.advance_paid || 0);
                const received = Number(o.received_amount || 0);
                const balance = total - (advance + received);
                const isRead = readNotifications.includes(o.order_id);
                const displayTime = o.scheduled_time || o.created_at;

                return (
                  <tr
                    key={o.order_id}
                    className={`hover:bg-gray-50 transition-all ${!isRead ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">#{o.order_id}</span>
                        {!isRead && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">NEW</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium">{o.customer?.name || "Guest"}</div>
                        <div className="text-xs text-gray-500">{o.customer?.phone || "—"}</div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {isPreOrder && <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Pre-Order</span>}
                        {isBulk && <span className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Bulk</span>}
                        {!isPreOrder && !isBulk && <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Normal</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-4 px-6 text-right font-semibold">₹{total}</td>

                    {/* <td className="py-4 px-6 text-right">
                      <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{Math.max(balance, 0)}
                      </span>
                    </td> */}

                    <td className="py-4 px-3 text-center">
                      {o.status === 'paid' ? (
                        <span className="px-4 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">Paid</span>
                      ) : o.status === 'advance_paid' ? (
                        <span className="px-4 py-1 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">Advance</span>
                      ) : (
                        <span className="px-4 py-1 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">Pending</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => {
                          handleSelectBill(o);
                          if (!isRead) markAsRead(o.order_id);
                          setShowAlertModal(false);
                        }}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-between text-sm text-gray-600 pt-2">
          <div>Total: <span className="font-semibold text-gray-900">{filteredOrders.length}</span> orders</div>
          <div>Unread: <span className="font-semibold text-red-600">
            {filteredOrders.filter(o => !readNotifications.includes(o.order_id)).length}
          </span></div>
        </div>
      )}
    </div>
  </Modal>
)}
      </AnimatePresence>

{showPendingModal && (
  <Modal title="Pending Bills" onClose={() => setShowPendingModal(false)}>
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name or Phone..."
          className="w-full pl-12 py-3.5 h-10 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-base"
          value={pendingSearch}
          onChange={(e) => setPendingSearch(e.target.value)}
        />
      </div>

      {/* Orders Grid - 3 cards per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-2">
        {filteredPendingOrders.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Clock size={48} className="mx-auto mb-4" />
            <p className="text-lg">No pending orders found</p>
          </div>
        ) : (
          filteredPendingOrders.map((b) => {
            const total = Number(b.custom_price || b.final_amount || b.total_amount || 0);
            const paid = Number(b.received_amount || b.advance_paid || 0);
            const due = total - paid;

            return (
              <div
                key={b.order_id}
                onClick={() => handleSelectBill(b)}
                className="bg-white border border-gray-200 hover:border-blue-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group h-full flex flex-col"
              >
                {/* Order ID & Date */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono text-xl font-bold text-blue-600">#{b.order_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(b.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                   {/* Customer Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-base">
                        {b.customer?.name || "Guest"}
                      </p>
                      {b.customer?.phone && (
                        <p className="text-xs text-gray-500">{b.customer.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                </div>

               

                {/* Due Amount */}
                <div className="mt-1 pt-2 border-t border-gray-100 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500">Due Amount</p>
                    <p className="text-2xl font-bold text-blue-600">₹{due.toFixed(2)}</p>
                  </div>
                  <span className="text-blue-600 text-sm group-hover:underline">
                    Process →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {filteredPendingOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex justify-between text-sm">
          <div>
            Total Pending: <span className="font-bold text-gray-900">{filteredPendingOrders.length}</span>
          </div>
          <div className="text-blue-600 font-medium">
            Total Due: ₹{filteredPendingOrders.reduce((sum, b) => {
              const total = Number(b.custom_price || b.final_amount || b.total_amount || 0);
              const paid = Number(b.received_amount || b.advance_paid || 0);
              return sum + (total - paid);
            }, 0).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  </Modal>
)}

      {/* Payment Modal */}
      <AnimatePresence>
       {showPaymentModal && selectedBill && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    
    {/* Payment Card */}
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500">Order #{selectedBill.order_id}</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{Number(selectedBill.custom_price || selectedBill.final_amount || 0).toFixed(2)}
          </p>
        </div>

        <button
          onClick={() => setShowPaymentModal(false)}
          className="text-gray-400 hover:text-red-500 text-lg"
        >
          ✕
        </button>
      </div>

      {/* Due */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex justify-between">
        <span className="text-sm text-gray-600">Due Amount</span>
        <span className="font-bold text-red-600">
          ₹{dueAmount.toFixed(2)}
        </span>
      </div>

      {/* Payment Mode */}
      <div>
        <label className="text-xs font-semibold text-gray-600">Payment Mode</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {['cash', 'upi', 'card'].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`py-2 rounded-xl text-xs font-semibold uppercase border transition ${
                paymentMode === mode
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="text-xs font-semibold text-gray-600">
          Amount Received
        </label>

        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            ₹
          </span>

          <input
            type="number"
            value={cashReceived || ""}
            onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
            className="w-full pl-8 pr-3 py-3 text-lg font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border rounded-2xl p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span>Received</span>
          <span className="font-semibold">
            ₹{Number(cashReceived || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Due</span>
          <span className="font-semibold">
            ₹{dueAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Change</span>
          <span className={balance > 0 ? "text-green-600 font-bold" : "text-gray-400"}>
            ₹{balance > 0 ? balance.toFixed(2) : "0.00"}
          </span>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handlePayNow}
        disabled={cashReceived < dueAmount || cashReceived <= 0}
        className="w-full py-3 rounded-xl text-white font-semibold bg-indigo-600 disabled:bg-gray-300"
      >
        Confirm Payment
      </button>
    </div>
  </div>
)}
      </AnimatePresence>
    </div>
  );

}