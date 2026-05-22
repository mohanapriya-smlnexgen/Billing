import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus,Minus,Receipt,PauseCircle,Printer,ShoppingCart,CheckCircle,X,Truck,LogOut,ClipboardList,User,ChevronDown,ChevronUp,CreditCard,Tag,Clock,Store,Phone,Calendar,FileText,AlertCircle,Bell,ShoppingBag,ChevronRight,AppWindowMacIcon,PersonStanding,PersonStandingIcon, Mail
} from "lucide-react";

import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BillingRightPanel } from "./BillingRightPanel";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REPORT_API = `${BASE_URL}/report-setting/`;
const MENU_API = `${BASE_URL}/food-menu/`;
const BILL_API = `${BASE_URL}/cashier-orders/`;
const SETTING_API = `${BASE_URL}/setting/`;
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
  const [tempPhone, setTempPhone] = useState("");
const [tempGstin, setTempGstin] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [savedBills, setSavedBills] = useState([]);
  const [preOrderAlerts, setPreOrderAlerts] = useState([]);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [customPrice, setCustomPrice] = useState(0);
  const [customQuantities, setCustomQuantities] = useState({});
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [orderType, setOrderType] = useState("normal");
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveringOrders, setDeliveringOrders] = useState(new Set());
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantGstin, setRestaurantGstin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [credit, setCredit] = useState(0);
  const [bulkNote, setBulkNote] = useState("");
  const [splitPayments, setSplitPayments] = useState([
  { id: Date.now(), mode: "cash", amount: 0 }
]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [source, setSource] = useState("offline");
  const [externalOrderId, setExternalOrderId] = useState("");
  const [customerCredits, setCustomerCredits] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [customerFound, setCustomerFound] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [discountType, setDiscountType] = useState("fixed");
  const [isViewingBill, setIsViewingBill] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
const [creditDueDate, setCreditDueDate] = useState("");
const [creditNote, setCreditNote] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [address, setAddress] = useState(""); // ✅ ADD THIS
  const [restaurantName, setRestaurantName] = useState(
    localStorage.getItem("restaurant_name") || "My Restaurant"
  );
  const [taxConfig, setTaxConfig] = useState({
  enabled: false,
  percentage: 0
});
const [dueNotifications, setDueNotifications] = React.useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreditDueModal, setShowCreditDueModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
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
  useEffect(() => {
    localStorage.setItem("read_notifications", JSON.stringify(readNotifications));
  }, [readNotifications]);
  useEffect(() => {
  checkDueNotifications();
}, [cart, selectedBill]);
useEffect(() => {
  checkDueNotifications();

  const interval = setInterval(() => {
    checkDueNotifications();
  }, 60000);

  return () => clearInterval(interval);
}, []);
const checkDueNotifications = async () => {
  try {
    const res = await axios.get(BILL_API);
    const orders = Array.isArray(res.data) ? res.data : res.data.results || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueAlerts = orders
      .filter((order) => {
        // FIXED: Check both is_credit_order AND payment_mode === "credit"
        const isCreditOrder = order.is_credit_order === true || 
                             order.payment_mode === "credit";

        if (!isCreditOrder || order.status === "paid") return false;
        if (!order.credit_due_date) return false;

        // Normalize due date (handle both date string and datetime)
        let dueDateStr = order.credit_due_date;
        if (typeof dueDateStr === "string") {
          dueDateStr = dueDateStr.split("T")[0]; // Remove time part
        }

        const dueDate = new Date(dueDateStr);
        dueDate.setHours(0, 0, 0, 0);

        const isOverdue = today >= dueDate;
        const hasBalance = Number(order.remaining_amount || 0) > 0;

        return isOverdue && hasBalance;
      })
      .map((order) => ({
        order_id: order.order_id,
        customer: order.customer?.name || "Unknown",
        phone: order.customer?.phone,
        amount: Number(order.remaining_amount || 0),
        due_date: order.credit_due_date,
      }))
      .sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

    console.log("Credit Due Alerts Found:", dueAlerts.length); // For debugging
    setDueNotifications(dueAlerts);
  } catch (err) {
    console.error("Due check failed", err);
  }
};
const openEditModal = () => {
  setTempName(restaurantName);
  setTempAddress(address || "");
  setTempPhone(""); 
  setTempGstin(""); 
  setIsEditOpen(true);
};
useEffect(() => {
  const fetchSettings = async () => {
    try {
      const res = await axios.get(SETTING_API);
      setRestaurantName(res.data.restaurant_name);
      setAddress(res.data.address || ""); 
      setTempPhone(res.data.phone_number || "");
      setTempGstin(res.data.gstin || "");
      setRestaurantPhone(res.data.phone_number);
      setRestaurantGstin(res.data.gstin);
      console.log("test",res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchSettings();
}, []);
useEffect(() => {
  const fetchTax = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/settings/get_tax/`);
      setTaxConfig(res.data);
    } catch (err) {
      console.error("Failed to fetch tax", err);
    }
  };

  fetchTax();
}, []);

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
    }, 30000);
    return () => clearInterval(interval);
  }, []);
const deliveryOrders = useMemo(() => {
  const today = new Date().toLocaleDateString("en-CA");

  return savedBills.filter((bill) => {
    // Must have scheduled delivery time
    if (!bill.scheduled_time) return false;

    // Hide only delivered orders
    if (bill.is_delivered === true) return false;

    // Ignore cancelled
    if (bill.status === "cancelled") return false;

    const scheduledDate = new Date(
      bill.scheduled_time
    ).toLocaleDateString("en-CA");

    const matchToday = scheduledDate === today;

    const matchSearch =
      !deliverySearch ||
      bill.order_id?.toString().includes(deliverySearch) ||
      (bill.customer?.name || "")
        .toLowerCase()
        .includes(deliverySearch.toLowerCase()) ||
      (bill.customer?.phone || "").includes(deliverySearch);

    return matchToday && matchSearch;
  });
}, [savedBills, deliverySearch]);
const subCategories = useMemo(() => {
  if (selectedCategory === "all") return ["all"];

  const subs = menuItems
    .filter(item => item.category === selectedCategory)
    .map(item => item.subcategory);

  return ["all", ...new Set(subs)];
}, [menuItems, selectedCategory]);
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

    console.log("✅ API RESPONSE:", res.data);

    // ✅ STORE FULL CUSTOMER OBJECT
    setSelectedCustomer(res.data);

    // Optional separate states
    setCustomerName(res.data?.name || "");
    setCustomerCredits(res.data?.credits || 0);
    setCustomerId(res.data?.id || null);

    setCustomerFound(true);

  } catch (err) {
    console.error("❌ API ERROR:", err.response || err);

    setSelectedCustomer(null);

    setCustomerFound(false);
    setCustomerCredits(0);
    setCustomerName("");
    setCustomerId(null);
  }
};

const handleSaveSettings = async () => {
  try {
    const res = await axios.post(SETTING_API, {
      restaurant_name: tempName,
      address: tempAddress,
      phone_number: tempPhone,
      gstin: tempGstin,
    });

    setRestaurantName(res.data.restaurant_name);
    setAddress(res.data.address);
    setRestaurantPhone(res.data.phone_number);
    setRestaurantGstin(res.data.gstin);

    setIsEditOpen(false);
  } catch (err) {
    console.error(err);
  }
};

 const handleSaveAdminEmail = async () => {
  try {
    await axios.post(REPORT_API, {
      email: adminEmail,
    });

    fetchReportEmail();

  } catch (error) {
    console.error(error.response?.data);
  }
};
  // const handleSaveTaxPercentage = () => {
  //   localStorage.setItem("tax_percentage", taxPercentage);
  //   setShowTaxEditor(false);
  // };

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
      // setTaxPercentage(Number(response.data.tax_percentage) || 5);
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
        description: item.description || "", 
        category: item.category?.toLowerCase() || "uncategorized",
        subcategory: item.subcategory?.toLowerCase() || "general", 
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
const normalizeText = (text = "") => {
  const map = {
    ғ: "f",
    ʀ: "r",
    ᴇ: "e",
    ɴ: "n",
    ᴄ: "c",
    ʜ: "h",
    ɪ: "i",
    s: "s",
    ᴛ: "t",
    ʏ: "y",
    ᴜ: "u",
    ᴅ: "d",
    ʙ: "b",
    ᴍ: "m",
    ᴘ: "p",
    ʟ: "l",
    ᴋ: "k",
    ᴡ: "w",
    ɢ: "g",
    ᴏ: "o",
    ᴀ: "a",
    ᴠ: "v",
    ᴊ: "j",
    ǫ: "q",
    x: "x",
    z: "z",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .normalize("NFKD")
    .replace(/[^\w\s]/g, "");
};

const filteredItems = useMemo(() => {
  return menuItems.filter((item) => {
    const matchCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchSubCategory =
      selectedSubCategory === "all" || item.subcategory === selectedSubCategory;

    const matchSearch = normalizeText(item.name).includes(
      normalizeText(search)
    );

    return matchCategory && matchSubCategory && matchSearch;
  });
}, [search, selectedCategory, selectedSubCategory, menuItems]);

const addToCart = (newItem) => {
  const existing = cart.find(
    c => c.food_id === newItem.food_id && c.variant_info === newItem.variant_info
  );

  if (existing) {
    setCart(cart.map(c =>
      c.food_id === newItem.food_id && c.variant_info === newItem.variant_info
        ? { ...c, quantity: c.quantity + newItem.quantity }
        : c
    ));
  } else {
    setCart([...cart, { ...newItem }]);
  }

  // Clear quantity field after adding
  setCustomQuantities(prev => ({ ...prev, [newItem.food_id]: 1 }));
};

 const updateQty = (foodId, variant, type) => {
  setCart(prev =>
    prev
      .map(item => {
        if (item.food_id !== foodId || item.variant_info !== variant) return item;

        let newQty = Number(item.quantity);

        if (type === "inc") {
          newQty = newQty + 0.5;     // Increment by 0.5 (good for kg)
        } else {
          newQty = newQty - 0.5;     // Decrement by 0.5
        }

        return {
          ...item,
          quantity: Math.max(0.5, newQty)   // Minimum 0.5
        };
      })
      .filter(item => item.quantity > 0)
  );
};

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (isViewingBill) return; 
    if (subtotal > 0) {
      fetchDiscount(subtotal);
    } else {
      setDiscount(0);
    }
  }, [subtotal]);

//  const tax = subtotal * (taxPercentage / 100);
const baseAmount = customPrice > 0 ? customPrice : subtotal;

const discountValue =
  discountType === "percentage"
    ? (baseAmount * discount) / 100
    : discount;

const subtotalAfterDiscount = subtotal - discountValue;

const tax = taxConfig.enabled
  ? (subtotalAfterDiscount * taxConfig.percentage) / 100
  : 0;
const safeNumber = (val) => Number(val) || 0;

const finalTotal = Math.max(
  safeNumber(subtotalAfterDiscount) +
  safeNumber(tax) -
  safeNumber(credit),
  0
);


const paid =
  safeNumber(selectedBill?.advance_paid) +
  safeNumber(selectedBill?.received_amount);

// Add this near other calculations (after finalTotal)
// Replace your current dueAmount useMemo with this clean version
const dueAmount = useMemo(() => {
  if (!selectedBill) return 0;

  const subtotal = Number(selectedBill.total_amount || 0);
  const discount = Number(selectedBill.discount_amount || 0);
  const tax = Number(selectedBill.tax_amount || 0);
  const credit = Number(selectedBill.credit_used || 0);

  let total = Number(selectedBill.final_amount || 0);

  // Force correct calculation if backend failed
  if (total === 0 || total >= subtotal) {
    total = subtotal - discount + tax - credit;
  }

  const alreadyPaid = Number(selectedBill.advance_paid || 0) + 
                     Number(selectedBill.received_amount || 0);

  return Math.max(total - alreadyPaid, 0);
}, [selectedBill]);
  const balance = cashReceived - dueAmount;

const handleGenerateBill = async (autoPayment = false) => {
  if (cart.length === 0) return;

  setIsGenerating(true);

  try {
    let formattedScheduledTime = null;

    if ((orderType === "preorder" || orderType === "bulk") && scheduledTime) {
      const date = new Date(scheduledTime);
      formattedScheduledTime = date.toISOString().slice(0, 19).replace("T", " ");
    }

    const cleanedCart = cart.map((item) => ({
      food_id: Number(item.food_id),
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      variant_info: item.variant_info === "default" ? null : (item.variant_info || null)
    }));

    // 🔥 FIX: Ensure bulk_note is never null
    let bulkNoteValue = "";
    if (orderType === "bulk" && bulkNote) {
      bulkNoteValue = bulkNote;
    }

    const payload = {
      total_amount: Number(subtotal),
      final_amount: Number(finalTotal),
      discount_amount: Number(discountValue),
      credit_used: Number(credit),
      discount: Number(discount),
      discount_type: discountType,
      name: customerName || "Guest",
      phone: customerPhone || "",
      is_bulk: orderType === "bulk",
      is_advance: orderType === "preorder",
      bulk_note: bulkNoteValue, // 🔥 Always send string, never null
      custom_price: customPrice > 0 ? Number(customPrice) : null,
      scheduled_time: formattedScheduledTime,
      advance_paid: Number(advanceAmount) || 0,
      payment_mode: paymentMode || "cash",
      status: "pending",
      source: source || "offline",
      external_order_id: externalOrderId || "",
      cart: cleanedCart,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const res = await axios.post(`${BILL_API}create_order/`, payload);

    setSavedBills((prev) => [res.data, ...prev]);
    fetchBills();
    setSelectedBill(res.data);

    if (!autoPayment) {
      setShowPendingModal(true);
      setCart([]);
    }

    if (autoPayment) {
      setShowPaymentModal(true);
    }

    setAdvanceAmount(0);
    setIsViewingBill(false);

  } catch (err) {
    console.error("Error creating order:", err);
    
    if (err.response?.data) {
      console.error("Backend error details:", err.response.data);
      if (err.response.data.detail) {
        alert(`Order creation failed: ${err.response.data.detail}`);
      }
    }
  } finally {
    setIsGenerating(false);
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
  
  const discount =
  bill.discount_type === "percentage" || bill.discount > 0 && !bill.discount_amount
    ? (subtotal * Number(bill.discount || 0)) / 100
    : Number(bill.discount_amount || 0);
   const tax = taxConfig.enabled
  ? (subtotalAfterDiscount * taxConfig.percentage) / 100
  : 0;
  const total = subtotal - discount + tax;

  const advance = Number(bill.advance_paid || bill.received_amount || 0);
  const balance = total - advance;

 printWindow.document.write(`
<html>
<head>
<title>Bill</title>
<style>
  body {
    font-family: monospace;
    width: 300px;
    margin: auto;
    padding: 10px;
    font-size: 12px;
  }
  .center { text-align:center; }
  .row { display:flex; justify-content:space-between; }
  .line { border-top:1px dashed #000; margin:8px 0; }
  table { width:100%; border-collapse:collapse; }
  th, td { font-size:12px; padding:4px 0; }
  th { border-bottom:1px solid #000; }
</style>
</head>

<body>

<div class="center">
  <h3>${restaurantName}</h3>
  <div>${address || ""}</div>
  <div>Mob: ${restaurantPhone || ""}</div>
  <div>GSTIN: ${restaurantGstin || ""}</div>
</div>

<div class="line"></div>

<div class="row">
  <span>Date: ${new Date().toLocaleDateString()}</span>
  <span>Time: ${new Date().toLocaleTimeString()}</span>
</div>

<div class="row">
  <span>Bill No: ${bill.order_id}</span>
  <span>${bill.order_type || "Pick Up"}</span>
</div>

<div class="line"></div>

<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Price</th>
      <th>Amt</th>
    </tr>
  </thead>

  <tbody>
    ${(bill.items || []).map(i => `
      <tr>
        <td>${i.name}</td>
        <td>${i.quantity}</td>
        <td>${i.price}</td>
        <td>${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join("")}
  </tbody>
</table>

<div class="line"></div>

<div class="row">
  <span>Total Qty</span>
  <span>${(bill.items || []).reduce((a,b)=>a+b.quantity,0)}</span>
</div>

<div class="row">
  <span>Sub Total</span>
  <span>₹${subtotal.toFixed(2)}</span>
</div>

${discount > 0 ? `
<div class="row">
  <span>Discount</span>
  <span>-₹${discount.toFixed(2)}</span>
</div>` : ""}

${taxConfig.enabled ? `
<div class="row">
  <span>Tax (${taxConfig.percentage}%)</span>
  <span>₹${tax.toFixed(2)}</span>
</div>
` : ""}
<div class="line"></div>
<div class="row" style="font-weight:bold">
  <span>Grand Total</span>
  <span>₹${total.toFixed(2)}</span>
</div>
${advance > 0 ? `
<div class="row">
  <span>Advance</span>
  <span>₹${advance.toFixed(2)}</span>
</div>` : ""}

<div class="line"></div>

<div class="center">
  <p>🙏 THANK YOU</p>
</div>

</body>
</html>
`);

  printWindow.document.close();
  printWindow.print();
};

const handleCreditPayment = async () => {
  if (!selectedBill) return;
  if (!creditDueDate) {
    alert("Please select a due date for this credit");
    return;
  }

  try {
    setIsPaying(true);

    await axios.post(
      `${BILL_API}${selectedBill.order_id}/mark_paid/`,
      {
        received_amount: 0,
        payment_mode: "credit",
        credit_due_date: creditDueDate,   // ← Added
        credit_note: creditNote || "",    // ← Optional
      }
    );

    // Update local state
    const updatedBill = {
      ...selectedBill,
      payment_mode: "credit",
      status: "pending",
      credit_due_date: creditDueDate,
    };

    setShowCreditModal(false);
    setShowPaymentModal(false);

    // Clear form
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerFound(false);
    setCustomerCredits(0);
    setCustomerId(null);
    setDiscount(0);
    setCredit(0);
    setAdvanceAmount(0);
    setCustomPrice(0);
    setBulkNote("");
    setScheduledTime("");
    setOrderType("normal");
    setPaymentMode("cash");
    setCashReceived(0);
    setCreditDueDate("");   // Reset
    setCreditNote("");

    fetchBills();

    setTimeout(() => {
      printBill(updatedBill);
    }, 300);

    alert("Credit payment recorded successfully with due date");

  } catch (err) {
    console.error("Credit payment error:", err);
    alert(err.response?.data?.detail || "Credit payment failed");
  } finally {
    setIsPaying(false);
  }
};
const handleSelectBill = (bill) => {
  setIsViewingBill(true);
  setSelectedBill(bill);

  const mappedItems = (bill.items || []).map((item) => ({
    food_id: item.food_id,
    name: item.name,
    quantity: Number(item.quantity),
    price: Number(item.price),
    variant_info: item.variant_info || "default",
  }));

  setCart(mappedItems);

  setCustomerName(bill.customer?.name || "");
  setCustomerPhone(bill.customer?.phone || "");

  setDiscount(Number(bill.discount_amount || 0));
  setCredit(Number(bill.credit_used || 0));
  setAdvanceAmount(Number(bill.advance_paid || 0));
  setCustomPrice(Number(bill.custom_price || 0));
  setPaymentMode(bill.payment_mode || "cash");

  setShowPendingModal(false);
  setShowAlertModal(false);
  setShowDeliveryModal(false);
};
const updateOrderPrice = async (orderId, newPrice) => {
  try {
    await axios.post(`${BILL_API}${orderId}/update_price/`, {
      final_amount: newPrice,
    });

    await fetchBills(); // 🔥 VERY IMPORTANT
  } catch (err) {
    console.error("Price update failed", err);
  }
};
const addSplitPayment = () => {
  setSplitPayments([...splitPayments, {
    id: Date.now(),
    mode: "upi",
    amount: 0
  }]);
};
const resetSplitPayments = () => {
  setSplitPayments([{ id: Date.now(), mode: "cash", amount: 0 }]);
  setIsSplitPayment(false);
};
const getTotalSplitAmount = () => {
  return splitPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
};
const getRemaining = () => {
  return dueAmount - getTotalSplitAmount();
};
const updateSplitPayment = (id, field, value) => {
  setSplitPayments(prev =>
    prev.map(p => p.id === id ? { ...p, [field]: value } : p)
  );
};
const removeSplitPayment = (id) => {
  if (splitPayments.length <= 1) return; // Keep at least one row
  setSplitPayments(prev => prev.filter(p => p.id !== id));
};
const handleSplitPaymentConfirm = async () => {
  if (!selectedBill) return;

  const totalPaid = getTotalSplitAmount();

  if (totalPaid < dueAmount - 0.01) {
    alert("Total payment must be equal to or greater than due amount");
    return;
  }

  setIsPaying(true);

  try {
    await axios.post(
      `${BILL_API}${selectedBill.order_id}/update_price/`,
      {
        final_amount: Number(dueAmount) + Number(selectedBill?.advance_paid || 0)
      }
    );
    
    const isSinglePayment = splitPayments.length === 1;
    const finalPaymentMode = isSinglePayment 
      ? splitPayments[0].mode 
      : "split";

    const payload = {
      received_amount: totalPaid,
      payment_mode: finalPaymentMode,
    };
    
    if (!isSinglePayment && splitPayments.length > 1) {
      payload.split_payments = splitPayments.map(p => ({
        mode: p.mode,
        amount: Number(p.amount)
      }));
    }
    
    const paymentRes = await axios.post(
      `${BILL_API}${selectedBill.order_id}/mark_paid/`,
      payload
    );
    
    const paidBill = paymentRes.data;
    
    setShowPaymentModal(false);
    resetSplitPayments();
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerFound(false);
    setCustomerCredits(0);
    setCustomerId(null);
    setDiscount(0);
    setCredit(0);
    setAdvanceAmount(0);
    setCustomPrice(0);
    setBulkNote("");
    setScheduledTime("");
    setOrderType("normal");
    setPaymentMode("cash");
    setCashReceived(0);
    
    // 🔥 FIX: Pass the total paid amount to print function
    setTimeout(() => printBill(paidBill, totalPaid), 300);
    
    fetchBills();
  } catch (error) {
    console.error("Payment error:", error);
    if (error.response?.status === 400) {
      alert("Backend doesn't support split payment yet.\n\nPlease update your backend or use single payment mode.");
    } else {
      alert("Payment failed. Please try again.");
    }
  } finally {
    setIsPaying(false);
  }
};
const silentPrint = (htmlContent) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };
};
const printBill = (billData, actualPaidAmount = null) => {
  const bill = billData || selectedBill;
  if (!bill) return;
  
  const safe = (v) => Number(v) || 0;
  const items = cart.length > 0 ? cart : bill.items || [];

  const subtotal = items.reduce(
    (sum, item) => sum + safe(item.price) * safe(item.quantity),
    0
  );

  // Calculate discount properly
  let discount = 0;
  if (bill.discount_type === "percentage" || (safe(bill.discount) > 0 && !bill.discount_amount)) {
    discount = (subtotal * safe(bill.discount)) / 100;
  } else {
    discount = safe(bill.discount_amount);
  }

  const subtotalAfterDiscount = subtotal - discount;
  
  // Calculate tax
  const tax = taxConfig?.enabled
    ? (subtotalAfterDiscount * safe(taxConfig?.percentage)) / 100
    : 0;

  const advance = safe(bill.advance_paid);
  
  // 🔥 USE THE ACTUAL PAID AMOUNT IF PROVIDED, OTHERWISE USE BILL DATA
  const received = actualPaidAmount !== null ? actualPaidAmount : safe(bill.received_amount);

  const total = subtotalAfterDiscount + tax;
  const paid = advance + received;
  const balance = total - paid;
  
  // Determine if change is needed
  const isChangeDue = balance < 0;
  const absoluteBalance = Math.abs(balance);

  silentPrint(`
    <html>
    <head>
      <style>
        @page { size: 60mm auto; margin: 0; }

        body {
          width: 50mm;
          margin: 0 auto;
          padding: 5px;
          font-family: monospace;
          font-size: 11px;
        }

        .center { text-align: center; }

        .row {
          display: flex;
          justify-content: space-between;
        }

        .line {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          font-size: 11px;
          padding: 2px 0;
        }

        th {
          border-bottom: 1px solid #000;
        }

        .item { width: 35%; }
        .qty { width: 10%; text-align: center; }
        .amt { width: 35%; text-align: right; }
        
        .balance-row {
          font-weight: bold;
          border-top: 1px dashed #000;
          margin-top: 5px;
          padding-top: 5px;
        }
        
        .paid-amount {
          background-color: #e6f7e6;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 5px 0;
        }
        
        .change-amount {
          color: #38a169;
          font-weight: bold;
        }
        
        .due-amount {
          color: #e53e3e;
          font-weight: bold;
        }
      </style>
    </head>

    <body>

    <div class="center">
      <b>${restaurantName || ""}</b><br/>
      ${address || ""}<br/>
      Mob: ${restaurantPhone || ""}<br/>
      GSTIN: ${restaurantGstin || ""}
    </div>

    <div class="line"></div>

    <div class="row">
      <span>${new Date().toLocaleDateString()}</span>
      <span>${new Date().toLocaleTimeString()}</span>
    </div>

    <div class="row">
      <span>Bill No: ${bill.order_id}</span>
      <span>${bill.order_type || "Normal"}</span>
    </div>

    <div class="row">
      <span>Customer:</span>
      <span>${bill.customer?.name || "Guest"}</span>
    </div>

    <div class="row">
      <span>Mobile:</span>
      <span>${bill.customer?.phone || "-"}</span>
    </div>

    <div class="line"></div>

    <table>
      <thead>
        <tr>
          <th class="item">Item</th>
          <th class="qty">Qty</th>
          <th class="amt">Amt</th>
        </tr>
      </thead>

      <tbody>
        ${items.map(i => `
          <tr>
            <td class="item">${i.name}</td>
            <td class="qty">${i.quantity}</td>
            <td class="amt">${(i.price * i.quantity).toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="line"></div>

    <div class="row">
      <span>Sub Total</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>

    ${discount > 0 ? `
    <div class="row">
      <span>Discount</span>
      <span>-₹${discount.toFixed(2)}</span>
    </div>` : ""}

    ${taxConfig.enabled ? `
    <div class="row">
      <span>Tax (${taxConfig.percentage}%)</span>
      <span>₹${tax.toFixed(2)}</span>
    </div>` : ""}

    <div class="line"></div>

    <div class="row" style="font-weight:bold">
      <span>Grand Total</span>
      <span>₹${total.toFixed(2)}</span>
    </div>

    ${advance > 0 ? `
    <div class="row">
      <span>Advance Paid</span>
      <span>₹${advance.toFixed(2)}</span>
    </div>` : ""}

    <div class="row" style="font-weight:bold; margin-top: 5px;">
      <span>Amount Received</span>
      <span style="font-size: 14px;">₹${received.toFixed(2)}</span>
    </div>

    <div class="line"></div>

    <div class="row balance-row" style="font-weight:bold; font-size: 13px;">
      <span>${isChangeDue ? "BALANCE AMOUNT" : "BALANCE AMOUNT"}</span>
      <span class="${isChangeDue ? 'change-amount' : 'due-amount'}">
        ₹${absoluteBalance.toFixed(2)}
      </span>
    </div>
    
   

    <div class="line"></div>

    <div class="center">
      🙏 THANK YOU<br/>
      <span style="font-size: 9px;">Visit Again!</span>
    </div>

    </body>
    </html>
  `);
};
const printKOT = () => {
  if (!selectedBill && cart.length === 0) return;

  const items = selectedBill?.items || cart;

  const orderId =
    selectedBill?.order_id ||
    Math.floor(1000 + Math.random() * 9000);

  const customerNameVal =
    selectedBill?.customer?.name || customerName || "Guest";

  const customerPhoneVal =
    selectedBill?.customer?.phone || customerPhone || "-";

  const orderTime = selectedBill?.created_at
    ? new Date(selectedBill.created_at)
    : new Date();

  silentPrint(`
  <html>
  <head>
    <style>
      @page { size: 60mm auto; margin: 0; }

      body {
        width: 50mm;
        margin: 0 auto;
        padding: 6px;
        font-family: monospace;
        font-size: 11px;
      }

      .center { text-align: center; }

      .row {
        display: flex;
        justify-content: space-between;
      }

      .line {
        border-top: 1px dashed #000;
        margin: 6px 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 3px 0;
        font-size: 11px;
      }

      th {
        border-bottom: 1px solid #000;
      }
        .item {
  width: 75%;
  text-align: left;
  word-break: break-word;
}

.qty {
  width: 25%;
  text-align: right;
}

      .bold { font-weight: bold; }
      .big { font-size: 14px; font-weight: bold; }
    </style>
  </head>

  <body>

  <div class="center">
    <div class="big">${restaurantName || ""}</div>
    <div>${address || ""}</div>
    <div>Mob: ${restaurantPhone || ""}</div>
    <div>GSTIN: ${restaurantGstin || ""}</div>
  </div>

  <div class="line"></div>

  <div class="center bold">
    KITCHEN ORDER TICKET
  </div>

  <div class="line"></div>

  <div class="row">
    <span>KOT No:</span>
    <span>#${orderId}</span>
  </div>

  <div class="row">
    <span>Date:</span>
    <span>${orderTime.toLocaleDateString()}</span>
  </div>

  <div class="row">
    <span>Time:</span>
    <span>${orderTime.toLocaleTimeString()}</span>
  </div>

  <div class="line"></div>

  <div class="row">
    <span>Customer:</span>
    <span>${customerNameVal}</span>
  </div>

  <div class="row">
    <span>Mobile:</span>
    <span>${customerPhoneVal}</span>
  </div>

  <div class="line"></div>

  <table>
    <thead>
      <tr>
        <th class="item">Item</th>
<th class="qty">Qty</th>
      </tr>
    </thead>

    <tbody>
      ${items.map(i => `
        <tr>
        <td class="item">${i.name}</td>
<td class="qty bold">${i.quantity}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="line"></div>

  <div class="row bold">
    <span>Total Qty</span>
    <span>${items.reduce((a,b)=>a + Number(b.quantity || 0), 0)}</span>
  </div>

  <div class="line"></div>

  <div class="center bold">
    *** PREPARE IMMEDIATELY ***
  </div>

  </body>
  </html>
  `);
};

const pendingPreOrders = useMemo(() => {
  return savedBills.filter((o) => {
    const total = Number(
      o.custom_price ||
      o.final_amount ||
      o.total_amount ||
      0
    );

    const paid =
      Number(o.received_amount || 0) +
      Number(o.advance_paid || 0);

    const balance = total - paid;

    return (
      o.is_advance === true &&
      balance > 0 &&
      o.status !== "paid"
    );
  });
}, [savedBills]);

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

 <div className="flex items-center gap-3">
          <Store className="text-indigo-600" />
          <span className="font-bold text-lg">{restaurantName}</span>
        </div>

        <button
          onClick={openEditModal}
          className="px-2 py-1 text-sm bg-indigo-600 text-white rounded-lg"
        >
          EDIT
        </button>
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
          {/* Credit Due Alert Button */}
<button
  onClick={() => setShowCreditDueModal(true)}
  className="relative p-2 hover:bg-red-50 rounded-full transition-colors"
>
  <AlertCircle size={20} className="text-red-600" />
  
  {dueNotifications.length > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
      {dueNotifications.length}
    </span>
  )}
</button>
          {/* Delivery Button */}
<button
  onClick={() => setShowDeliveryModal(true)}
  className="relative p-2 hover:bg-blue-50 rounded-full transition-colors"
>
  <Truck size={20} className="text-blue-600" />

  {deliveryOrders.length > 0 && (
    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
      {deliveryOrders.length}
    </span>
  )}
</button>

          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 flex gap-1 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ClipboardList size={20} />Admin
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
           <nav className="flex flex-col gap-2">

  {/* CATEGORY LIST */}
  <div>
    <p className="text-xs font-bold text-gray-400 px-2 mb-2">CATEGORY</p>

    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => {
          setSelectedCategory(cat);
          setSelectedSubCategory("all"); // reset subcategory
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
          selectedCategory === cat
            ? "bg-indigo-100 text-indigo-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {cat}
      </button>
    ))}
  </div>

  {/* SUB CATEGORY */}
  {selectedCategory !== "all" && (
    <div className="mt-4">
      <p className="text-xs font-bold text-gray-400 px-2 mb-2">
        SUB CATEGORY
      </p>

      {subCategories.map((sub) => (
        <button
          key={sub}
          onClick={() => setSelectedSubCategory(sub)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            selectedSubCategory === sub
              ? "bg-green-100 text-green-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {sub}
        </button>
      ))}
    </div>
  )}

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
  const unitPrice = variant?.price ?? item.price;
  const unitText = variant ? `${variant.value} ${variant.unit}` : "qty";

  const enteredQty =
  customQuantities[item.food_id] !== undefined
    ? customQuantities[item.food_id]
    : "1";
  const totalItemPrice = enteredQty ? (unitPrice * parseFloat(enteredQty)).toFixed(2) : unitPrice;

  return (
    <div
      key={item.food_id}
      className="bg-white border rounded-xl p-3 h-full flex flex-col justify-between"
    >
      {/* TOP CONTENT */}
      <div className="gap-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold">{item.name}</h3>
          
          {item.variants?.length > 0 && (
            <select
              className="border rounded px-2 py-1 text-sm text-right"
              value={variantIndex}
              onChange={(e) => {
                setSelectedVariants((prev) => ({
                  ...prev,
                  [item.food_id]: Number(e.target.value),
                }));
                setCustomQuantities((prev) => ({ ...prev, [item.food_id]: "" }));
              }}
            >
              {item.variants.map((v, i) => (
                <option key={i} value={i}>
                  {v.value} {v.unit}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="text-sm text-gray-600 ">{item.description}</p>
      </div>

      {/* Price & Quantity Section */}
      <div>
        <div className="font-bold text-indigo-600 text-lg">
          ₹{totalItemPrice}
          {enteredQty && <span className="text-sm text-gray-500 font-normal"> ({unitPrice} × {enteredQty})</span>}
        </div>

        <div className="flex gap-2 ">
          <input
  type="number"
  step="0.01"
  min="0.01"
  placeholder="Qty"
  className="flex-1 border w-1 h-8 border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
  value={enteredQty}
  onChange={(e) => {
    setCustomQuantities((prev) => ({
      ...prev,
      [item.food_id]: e.target.value,
    }));
  }}
/>
          <button
  onClick={() => {
    const qty = parseFloat(customQuantities[item.food_id] || 1);

    if (!qty || qty <= 0) {
      alert("Please enter valid quantity");
      return;
    }

    addToCart({
      ...item,
      price: unitPrice,
      quantity: qty,
      variant_info: variant
        ? `${variant.value} ${variant.unit}`
        : "default",
    });
  }}
  className="bg-indigo-600 text-white px-5 py-1 h-8 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
>
  Add
</button>
        </div>
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
  isGenerating={isGenerating}
  isPaying={isPaying}
  updateQty={updateQty}
  setCart={setCart}
  setSelectedBill={setSelectedBill}
  setPaymentMode={setPaymentMode}
  paymentMode={paymentMode}
  menuItems={menuItems}
  subtotal={subtotal}
  setDiscountType={setDiscountType}
  tax={tax}
  discount={discount}
  setDiscount={setDiscount}
  credit={credit}
  setCredit={setCredit}
  finalTotal={finalTotal}
  advanceAmount={advanceAmount}
  discountType={discountType}
  selectedBill={selectedBill}
  handleGenerateBill={handleGenerateBill}
  setShowPaymentModal={setShowPaymentModal}
taxEnabled={taxConfig.enabled}
taxPercentage={taxConfig.percentage}
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

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-2">
        {filteredPendingOrders.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Clock size={48} className="mx-auto mb-4" />
            <p className="text-lg">No pending orders found</p>
          </div>
        ) : (
          filteredPendingOrders.map((b) => {
            // === SAME ROBUST CALCULATION AS DELIVERY & PAYMENT ===
            const subtotal = Number(b.total_amount || 0);
            const discount = Number(b.discount_amount || 0);
            const tax = Number(b.tax_amount || 0);
            const credit = Number(b.credit_used || 0);

            let total = Number(b.final_amount || 0);
            if (total === 0 || total === subtotal) {
              total = subtotal - discount + tax - credit;
            }

            const paid = Number(b.received_amount || 0) + Number(b.advance_paid || 0);
            const due = Math.max(total - paid, 0);

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
                  <div className="text-right">
                    <p className="font-medium text-gray-900 text-base">
                      {b.customer?.name || "Guest"}
                    </p>
                    {b.customer?.phone && (
                      <p className="text-xs text-gray-500">{b.customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Due Amount */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-end">
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
              const subtotal = Number(b.total_amount || 0);
              const discount = Number(b.discount_amount || 0);
              const tax = Number(b.tax_amount || 0);
              const credit = Number(b.credit_used || 0);
              let total = Number(b.final_amount || 0);
              if (total === 0 || total === subtotal) {
                total = subtotal - discount + tax - credit;
              }
              const paid = Number(b.received_amount || 0) + Number(b.advance_paid || 0);
              return sum + Math.max(total - paid, 0);
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
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-5">

        {/* Header */}
        <div className="flex justify-between items-start bg-blue-100 rounded-2xl p-5">
          <div>
            <p className="text-s text-gray-800">Order #{selectedBill.order_id}</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{dueAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Due Amount</p>
          </div>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              resetSplitPayments();
            }}
            className="text-gray-400 hover:text-red-500 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Split Payments List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Split Payments</h3>
            <button
              onClick={addSplitPayment}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Add Method
            </button>
            <button
  onClick={() => setShowCreditModal(true)}
  className=" py-1 rounded-2x font-semibold"
>
  Pay on Credit
</button>
          </div>

          {splitPayments.map((payment, index) => (
            <div key={payment.id} className="flex gap-3 items-center bg-gray-50 p-4 rounded-2xl">
              {/* Payment Mode */}
              <select
                value={payment.mode}
                onChange={(e) => updateSplitPayment(payment.id, 'mode', e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>

              {/* Amount Input */}
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={payment.amount || ""}
                  onChange={(e) => updateSplitPayment(payment.id, 'amount', Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Remove Button */}
              {splitPayments.length > 1 && (
                <button
                  onClick={() => removeSplitPayment(payment.id)}
                  className="text-red-500 hover:bg-red-50 p-3 rounded-xl"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Paid</span>
            <span className="font-semibold">₹{getTotalSplitAmount().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Due Amount</span>
            <span className="font-semibold">₹{dueAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Balance</span>
            <span className={getRemaining() >= 0 ? "text-green-600" : "text-red-600"}>
              ₹{getRemaining().toFixed(2)}
            </span>
          </div>
        </div>
        <button
  onClick={handleSplitPaymentConfirm}
  disabled={isPaying || getTotalSplitAmount() < dueAmount - 0.01 || getTotalSplitAmount() === 0}
  className="w-full py-4 rounded-2xl text-white font-semibold bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
>
  {isPaying ? "Processing..." : `Confirm Payment (₹${getTotalSplitAmount().toFixed(2)})`}
</button>

        <p className="text-center text-xs text-gray-500">
          Total must be equal to or greater than due amount
        </p>
      </div>
    </div>
  )}
</AnimatePresence>
<AnimatePresence>
  {showCreditModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {(() => {
        const availableCredit =
          Number(selectedCustomer?.credit_limit || 0) -
          Number(selectedCustomer?.credits || 0);

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-orange-500 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Pay on Credit</h2>
                <p className="text-orange-100 text-sm mt-1">Set due date for this credit</p>
              </div>
              <button onClick={() => setShowCreditModal(false)} className="text-white hover:bg-white/20 rounded-full p-2">
                <X size={22} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              {/* Customer & Bill Info */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-semibold">{selectedCustomer?.name || customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bill Amount</span>
                  <span className="font-bold text-orange-600">₹{Number(dueAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={creditDueDate}
                  onChange={(e) => setCreditDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
                  min={new Date().toISOString().split("T")[0]} // Can't set past date
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Note (Optional)</label>
                <textarea
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Add note for this credit..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 h-20 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Warning */}
              {availableCredit < Number(dueAmount || 0) && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">
                  Insufficient available credit
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-gray-300 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  disabled={!creditDueDate || isPaying || availableCredit < Number(dueAmount || 0)}
                  onClick={handleCreditPayment}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition"
                >
                  {isPaying ? "Processing..." : "Confirm Credit & Set Due Date"}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  )}
</AnimatePresence>
{/* ==================== CREDIT DUE ALERTS MODAL ==================== */}
<AnimatePresence>
  {showCreditDueModal && (
    <Modal
      title="Credit Due Alerts"
      onClose={() => setShowCreditDueModal(false)}
    >
      <div className="space-y-5">
        {dueNotifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle size={52} className="mx-auto mb-4 text-green-300" />
            <p className="text-lg font-medium">No due credit alerts</p>
            <p className="text-sm text-gray-500 mt-1">All credit payments are up to date</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-2">
            {dueNotifications.map((n, i) => (
              <div
                key={i}
                className="bg-white border border-red-200 hover:border-red-400 rounded-3xl p-5 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-2xl font-bold text-red-600">#{n.order_id}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.customer}</p>
                    {n.phone && (
                      <p className="text-xs text-gray-500">{n.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Due Amount</p>
                    <p className="text-2xl font-bold text-red-600">₹{n.amount}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-sm">
                  <p className="text-red-700 font-medium">Due Date: {new Date(n.due_date).toLocaleDateString('en-IN')}</p>
                </div>

                <button
                  onClick={() => {
                    // Find the full bill and open it
                    const fullBill = savedBills.find(b => b.order_id === n.order_id);
                    if (fullBill) {
                      handleSelectBill(fullBill);
                      setShowCreditDueModal(false);
                      setShowPaymentModal(true);
                    }
                  }}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-semibold transition"
                >
                  Process Payment Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {dueNotifications.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm">
            <div className="flex justify-between font-medium">
              <span>Total Overdue Orders: <strong>{dueNotifications.length}</strong></span>
              <span className="text-red-600">
                Total Due: ₹{dueNotifications.reduce((sum, n) => sum + n.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )}
</AnimatePresence>
    <AnimatePresence>
{showDeliveryModal && (
  <Modal
    title="Today's Deliveries"
    onClose={() => {
      setShowDeliveryModal(false);
      setDeliverySearch("");
    }}
  >
    <div className="space-y-5">

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name or Phone..."
          className="w-full pl-12 pr-4 py-3 h-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={deliverySearch}
          onChange={(e) => setDeliverySearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto pr-1">
        {deliveryOrders.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-gray-400">
            <Truck size={52} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No deliveries for today</p>
            <p className="text-sm text-gray-500 mt-1">All scheduled deliveries will appear here</p>
          </div>
        ) : (
          deliveryOrders.map((b) => {
            const subtotal = Number(b.total_amount || 0);
            const discount = Number(b.discount_amount || 0);
            const tax = Number(b.tax_amount || 0);
            const credit = Number(b.credit_used || 0);

            let total = Number(b.final_amount || 0);
            if (total === 0 || total === subtotal) {
              total = subtotal - discount + tax - credit;
            }

            const paid = Number(b.received_amount || 0) + Number(b.advance_paid || 0);
            const due = Math.max(total - paid, 0);
            const isPaid = due <= 0 || b.status === 'paid';

            const isDelivering = deliveringOrders.has(b.order_id);

            return (
              <div
                key={b.order_id}
                className="bg-white border border-gray-200 rounded-3xl p-5 hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-2xl font-bold text-blue-600">#{b.order_id}</p>
                      {isPaid ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">PAID</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold">PENDING</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(b.scheduled_time || b.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{b.customer?.name || "Guest"}</p>
                    <p className="text-xs text-gray-500">{b.customer?.phone || "-"}</p>
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Delivery Time</p>
                    <p className="font-bold text-blue-700 text-lg mt-1">
                      {new Date(b.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Clock size={28} className="text-blue-400" />
                </div>

                {/* Amounts */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-gray-900 mt-1">₹{total.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-3">
                    <p className="text-xs text-green-600">Paid</p>
                    <p className="font-bold text-green-700 mt-1">₹{paid.toFixed(2)}</p>
                  </div>
                </div>

                {/* Due */}
                <div className={`mt-3 rounded-2xl p-3 ${isPaid ? "bg-blue-50" : "bg-red-50"}`}>
                  <p className={`text-xs ${isPaid ? "text-blue-600" : "text-red-600"}`}>Due</p>
                  <p className={`font-bold mt-1 ${isPaid ? "text-blue-700" : "text-red-700"}`}>
                    ₹{due.toFixed(2)}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  {isPaid ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setDeliveringOrders(prev => new Set(prev).add(b.order_id));

                        try {
                          await axios.patch(`${BILL_API}${b.order_id}/mark_delivered/`);
                          
                          // Optimistic Update
                          setSavedBills(prev => 
                            prev.map(order => 
                              order.order_id === b.order_id 
                                ? { ...order, is_delivered: true } 
                                : order
                            )
                          );
                        } catch (err) {
                          console.error(err);
                          alert("Failed to mark delivered");
                        } finally {
                          setDeliveringOrders(prev => {
                            const ns = new Set(prev);
                            ns.delete(b.order_id);
                            return ns;
                          });
                        }
                      }}
                      disabled={isDelivering}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {isDelivering ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Marking Delivered...
                        </>
                      ) : (
                        "Mark Delivered"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBill(b);
                        setCashReceived(due);
                        setShowPaymentModal(true);
                        setShowDeliveryModal(false);
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold transition-all"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      {deliveryOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm">
          <div className="flex justify-between">
            <span>Total Deliveries: <strong>{deliveryOrders.length}</strong></span>
            <span>Pending: ₹{deliveryOrders.reduce((sum, b) => {
              const subtotal = Number(b.total_amount || 0);
              const discount = Number(b.discount_amount || 0);
              const tax = Number(b.tax_amount || 0);
              const credit = Number(b.credit_used || 0);
              let total = Number(b.final_amount || 0) || (subtotal - discount + tax - credit);
              const paid = Number(b.received_amount || 0) + Number(b.advance_paid || 0);
              return sum + Math.max(total - paid, 0);
            }, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  </Modal>
)}
</AnimatePresence>

    </div>
  );

}