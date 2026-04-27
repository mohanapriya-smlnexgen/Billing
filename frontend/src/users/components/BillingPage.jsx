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
  Home,
  LogOut,
  Mail,
  ClipboardList,
  User,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Tag,
  Clock,
  Store
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REPORT_API = `${BASE_URL}/report-setting/`;
const MENU_API = `${BASE_URL}/food-menu/`;
const BILL_API = `${BASE_URL}/cashier-orders/`;
const SETTING_API = `${BASE_URL}/restaurant-setting/`;

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [savedBills, setSavedBills] = useState([]);
  const [preOrderAlerts, setPreOrderAlerts] = useState([]);
const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
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
  const [isBulk, setIsBulk] = useState(false);
  const [bulkNote, setBulkNote] = useState("");
  const [isAdvance, setIsAdvance] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [source, setSource] = useState("offline");
  const [externalOrderId, setExternalOrderId] = useState("");
  const [customerCredits, setCustomerCredits] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [customerFound, setCustomerFound] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [restaurantName, setRestaurantName] = useState(localStorage.getItem("restaurant_name") || "My Restaurant");
  const [taxPercentage, setTaxPercentage] = useState(Number(localStorage.getItem("tax_percentage")) || 5);
  const [showTaxEditor, setShowTaxEditor] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchBills();
    fetchReportEmail();
    fetchRestaurantSettings();
  }, []);
  // trigger when cart updates
 

  const handleSaveTaxPercentage = () => {
    localStorage.setItem("tax_percentage", taxPercentage);
    setShowTaxEditor(false);
    alert("Tax percentage updated successfully");
  };
const fetchPreOrderAlerts = async () => {
  try {
    const res = await axios.get(BILL_API);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];

    const today = new Date().toISOString().split("T")[0];

    const alerts = data.filter((o) => {
      if (!o.scheduled_time) return false;

      const orderDate = new Date(o.scheduled_time)
        .toISOString()
        .split("T")[0];

      return (
        orderDate === today &&
        o.status !== "paid" &&
        (o.is_advance || o.advance_paid > 0 || o.remaining_amount > 0)
      );
    });

    setPreOrderAlerts(alerts);

  } catch (err) {
    console.error("Alert fetch error", err);
  }
};
useEffect(() => {
  fetchPreOrderAlerts();

  const interval = setInterval(() => {
    fetchPreOrderAlerts();
  }, 30000); // every 30 sec

  return () => clearInterval(interval);
}, []);
  const fetchReportEmail = async () => {
    try {
      const response = await axios.get(REPORT_API);
      setAdminEmail(response.data.email || "");
    } catch (error) { console.error(error); }
  };

const searchCustomer = async (phone) => {
  if (!phone) return;

  try {
    const res = await axios.get(
      `${BILL_API}search_customer/?phone=${phone}`
    );

    setCustomerName(res.data.name || "");
    setCustomerCredits(res.data.credits || 0);
    setCustomerId(res.data.id);
    setCustomerFound(true);

  } catch (err) {
    console.log("Customer not found");

    setCustomerFound(false);
    setCustomerCredits(0);
    setCustomerName("");
  }
};

  const handleSaveRestaurantName = async () => {
    try {
      await axios.post(SETTING_API, { restaurant_name: restaurantName });
      alert("Saved!");
    } catch (error) { alert("Failed"); }
  };

  const handleSaveAdminEmail = async () => {
    try {
      await axios.post(SETTING_API, { admin_email: adminEmail });
      alert("Saved!");
    } catch (error) { alert("Failed"); }
  };
const fetchDiscount = async (amount) => {
  try {
    const res = await axios.post(`${BILL_API}preview_discount/`, {
      total_amount: amount
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
    } catch (error) { console.error(error); }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        axios.get(MENU_API),
        axios.get(`${MENU_API}categories/`),
      ]);
      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.results || [];
      const categoriesData = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data.results || [];

      setMenuItems(itemsData.map((item, index) => ({
        food_id: item.id || index + 1,
        name: item.food_name,
        price: Number(item.price),
        category: item.category?.toLowerCase() || "uncategorized",
      })));

      setCategories(["all", ...categoriesData.map((cat) => typeof cat === "string" ? cat.toLowerCase() : cat.name?.toLowerCase())]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get(BILL_API);
      setSavedBills(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) { setSavedBills([]); }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, selectedCategory, menuItems]);

  const addToCart = (item) => {
    const existing = cart.find((c) => c.food_id === item.food_id);
    if (existing) {
      setCart(cart.map((c) => c.food_id === item.food_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQty = (foodId, type) => {
    setCart((prev) => prev.map((item) => {
      if (item.food_id !== foodId) return item;
      return { ...item, quantity: type === "inc" ? item.quantity + 1 : item.quantity - 1 };
    }).filter((item) => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  useEffect(() => {
  if (subtotal > 0) {
    fetchDiscount();
  } else {
    setDiscount(0);
  }
}, [subtotal]);
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;
  const computedTotal = total - discount - credit;

const finalTotal = orderType !== "normal" && customPrice > 0
  ? customPrice
  : Math.max(computedTotal, 0);

// ✅ NEW: Advance handling
const balanceToPay = finalTotal - advanceAmount;

// For payment modal (cash settlement)
const dueAmount =
  (selectedBill?.custom_price ||
    selectedBill?.final_amount ||
    finalTotal) -
  (selectedBill?.advance_paid ||
    selectedBill?.received_amount ||
    0);

const balance = cashReceived - dueAmount;
const handleGenerateBill = async () => {
  if (cart.length === 0) return alert("Add items");

  try {
const payload = {
  total_amount: subtotal,
  final_amount: finalTotal,
  discount,
  credit,
  name: customerName,
  phone: customerPhone,

  is_bulk: orderType === "bulk",
  is_advance: orderType === "preorder",
  bulk_note: bulkNote,

  custom_price: customPrice > 0 ? customPrice : null,

  scheduled_time:
    orderType !== "normal" && scheduledTime
      ? scheduledTime.replace("T", " ") + ":00"
      : null,

  advance_paid: advanceAmount || 0,

  // ✅ FIX
  payment_mode: advanceAmount > 0 ? "cash" : null,
  status: "pending",

  cart: cart.map((item) => ({
    food_id: item.food_id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  })),
};
    const res = await axios.post(`${BILL_API}create_order/`, payload);

    setSelectedBill(res.data);
    setCart([]);
    setAdvanceAmount(0);

    // Auto print
    setTimeout(() => {
      printAdvanceBill(res.data);
    }, 500);

    await fetchBills();

  } catch (err) {
    console.error(err);
    alert("Error creating order");
  }
};
const printAdvanceBill = (bill) => {
  const printWindow = window.open("", "_blank");

  const total =
    bill.custom_price ||
    bill.final_amount ||
    bill.total_amount ||
    0;

  const advance =
    bill.advance_paid ||   // ✅ FIXED
    bill.received_amount ||
    0;

  const balance =
    bill.remaining_amount !== undefined
      ? bill.remaining_amount   // ✅ FIXED
      : total - advance;

  printWindow.document.write(`
    <html>
    <body style="font-family: monospace; width:280px;">

      <h3 style="text-align:center;">${restaurantName}</h3>
      <p style="text-align:center;">Order #${bill.order_id}</p>

      <p>Status: <b>${bill.status?.toUpperCase()}</b></p>

      ${bill.is_advance ? `<p>Pre-Order</p>` : ""}
      ${bill.is_bulk ? `<p>Bulk Order</p>` : ""}

      <p>Date: ${bill.scheduled_time || "Immediate"}</p>

      <hr/>

      ${bill.is_bulk ? `
        <div style="margin-bottom:8px;">
          <b>Bulk Details:</b>
          <p>${bill.bulk_note || "-"}</p>
        </div>
      ` : ""}

      ${(bill.items || []).map(i => `
        <div style="display:flex;justify-content:space-between;">
          <span>${i.name}</span>
          <span>${bill.is_bulk ? "" : `x ${i.quantity}`}</span>
        </div>
      `).join("")}

      <hr/>

      <p>Total: ₹${total}</p>
      <p>Advance Paid: ₹${advance}</p>
      <p>Balance to Pay: ₹${balance}</p>

      <hr/>

      <p style="text-align:center;">⚠ Pending Order</p>

    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
  const handleSelectBill = (bill) => {
    setSelectedBill(bill);
    setCart((bill.items || []).map((item) => ({
      food_id: item.food_id,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
    })));
    setShowPendingModal(false);
  };

const handlePayNow = async () => {
  if (!selectedBill) {
    return alert("No bill selected");
  }

  try {
    // ✅ Step 1: Get total safely
    const total = Number(
      selectedBill?.custom_price !== null &&
      selectedBill?.custom_price !== undefined
        ? selectedBill.custom_price
        : selectedBill?.final_amount || 0
    );

    // ✅ Step 2: Advance already paid
    const advance = Number(selectedBill?.advance_paid || 0);

    // ✅ Step 3: Remaining amount
    let remaining = total - advance;

    // Prevent negative case
    if (remaining <= 0) {
      return alert("This bill is already fully paid");
    }

    // ✅ Step 4: Validate input
    if (!cashReceived || cashReceived <= 0) {
      return alert("Enter valid payment amount");
    }

    if (cashReceived < remaining) {
      return alert(`Insufficient Cash. Need ₹${remaining.toFixed(2)}`);
    }

    // ✅ Step 5: API call
    const response = await axios.post(
      `${BILL_API}${selectedBill.order_id}/mark_paid/`,
      {
        received_amount: cashReceived, // only what user pays now
        payment_mode: paymentMode,
      }
    );

    // ✅ Step 6: UI reset
    setSelectedBill(response.data);
    setCart([]);
    setShowPaymentModal(false);
    setCashReceived(0);

    await fetchBills();

    // ✅ Optional: Auto print after payment
    setTimeout(() => {
      printBill();
    }, 300);

  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.detail || "Payment failed");
  }
};

const printBill = () => {
  if (!selectedBill) return;

  const bill = selectedBill;

  const subtotal = Number(bill.total_amount || 0);
  const discount = Number(bill.discount_amount || 0);
  const credit = Number(bill.credit_used || 0);
  const final = Number(bill.custom_price || bill.final_amount || 0);
  const paid = Number(bill.received_amount || 0);
  const balance = paid - final;

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
  <html>
  <head>
    <title>Invoice</title>
    <style>
      body {
        font-family: monospace;
        width: 280px;
        margin: auto;
        padding: 10px;
      }
      h2, h3, p {
        text-align: center;
        margin: 4px 0;
      }
      .line {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      .bold {
        font-weight: bold;
      }
      .small {
        font-size: 11px;
      }
    </style>
  </head>
  <body>

    <h2>${restaurantName}</h2>
    <p>Order #${bill.order_id}</p>
    <p class="small">${new Date(bill.created_at).toLocaleString()}</p>

    ${bill.customer ? `
      <div class="line"></div>
      <p><b>${bill.customer.name || "Guest"}</b></p>
      <p class="small">${bill.customer.phone || ""}</p>
    ` : ""}

    <div class="line"></div>

    ${(bill.items || []).map(item => `
      <div class="row">
        <span>${item.name} x ${item.quantity}</span>
        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join("")}

    <div class="line"></div>

    <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>

    ${discount > 0 ? `
      <div class="row"><span>Discount</span><span>- ₹${discount.toFixed(2)}</span></div>
    ` : ""}

    ${credit > 0 ? `
      <div class="row"><span>Credit Used</span><span>- ₹${credit.toFixed(2)}</span></div>
    ` : ""}

    <div class="line"></div>

    <div class="row bold">
      <span>Total</span>
      <span>₹${final.toFixed(2)}</span>
    </div>

    <div class="line"></div>

    <div class="row"><span>Paid</span><span>₹${paid.toFixed(2)}</span></div>
    <div class="row"><span>Change</span><span>₹${balance > 0 ? balance.toFixed(2) : "0.00"}</span></div>

    <div class="line"></div>

    <p>🙏 Thank You! Visit Again</p>

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
      <title>KOT</title>
      <style>
        body {
          font-family: monospace;
          width: 280px;
          margin: auto;
          padding: 10px;
        }
        h2, p {
          text-align: center;
          margin: 4px 0;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin: 4px 0;
        }
        .qty {
          font-weight: bold;
        }
      </style>
    </head>
    <body>

      <h2>KITCHEN ORDER</h2>
      <p>Order #${selectedBill?.order_id || "New"}</p>
      <p>${new Date().toLocaleTimeString()}</p>

      <div class="divider"></div>

      ${cart.map(i => `
        <div class="item">
          <span>${i.name}</span>
          <span class="qty">x ${i.quantity}</span>
        </div>
      `).join("")}

      <div class="divider"></div>

      <p><b>Prepare Immediately</b></p>

    </body>
    </html>
  `);

  kotWindow.document.close();
  kotWindow.print();
};

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
      {/* --- HEADER --- */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center z-40 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Receipt size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight">POS Terminal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border">
                <Store size={14} className="text-slate-500" />
                <input 
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none w-32"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  onBlur={handleSaveRestaurantName}
                />
             </div>
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border">
                <Mail size={14} className="text-slate-500" />
                <input 
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none w-40"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onBlur={handleSaveAdminEmail}
                />
             </div>
             <div className="relative">
  <button
    onClick={() => setShowAlertModal(true)}
    className="p-2 hover:bg-yellow-50 rounded-full text-yellow-600 relative"
  >
    🔔
    
    {preOrderAlerts.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
        {preOrderAlerts.length}
      </span>
    )}
  </button>
</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ClipboardList size={20} /></button>
          <button onClick={() => navigate("/login")} className="p-2 hover:bg-red-50 rounded-full text-red-500"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* --- LEFT: CATEGORIES --- */}
        <aside className="w-20 lg:w-64 bg-white border-r flex flex-col">
           <div className="p-4 border-b">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Categories</span>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all capitalize ${
                    selectedCategory === cat ? "bg-indigo-600 text-white shadow-blue-200 shadow-lg" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </aside>

        {/* --- CENTER: MENU --- */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading Menu...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    key={item.food_id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Plus size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{item.category}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900">₹{item.price}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* --- RIGHT: BILLING PANEL --- */}
        <aside className="w-[420px] bg-white border-l shadow-xl flex flex-col z-10">
          {/* Section: Customer Details (Collapsible) */}
          <div className="border-b">
             <button 
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
             >
                <div className="flex items-center gap-2 font-bold text-slate-700">
                   <User size={18} className="text-indigo-600" />
                   Customer Information
                </div>
                {showCustomerDetails ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
             </button>
             
             <AnimatePresence>
               {showCustomerDetails && (
                 <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white px-4 pb-4 space-y-3"
                 >
                    <div className="grid grid-cols-2 gap-2 pt-2">
                       <input 
                         placeholder="Phone Number" 
                         type="tel"
                          maxLength={10}
                          pattern="[0-9]*"
                         className="border p-2 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                         value={customerPhone}
                        onChange={(e) => {
  const phone = e.target.value;
  setCustomerPhone(phone);

  if (phone.length === 10) {
    searchCustomer(phone);   // ✅ PASS PHONE
  }
}}
                       />
                       <input 
                         placeholder="Customer Name" 
                         className="border p-2 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                         value={customerName}
                         onChange={(e) => setCustomerName(e.target.value)}
                       />
                    </div>
                    {customerFound && (
                       <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs font-bold flex justify-between">
                          <span>Verified Customer</span>
                          <span>Credits: ₹{customerCredits}</span>
                       </div>
                    )}
                    
                    {/* Extra Settings Grid */}
                    <div className="grid grid-cols-2 gap-2">
                       <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
                          <Tag size={14} className="text-slate-400" />
                          <input 
  type="number"
  placeholder="Discount"
  className="bg-transparent w-full text-xs outline-none"
  value={discount}
  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
/>
                       </div>
                       <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
                          <CreditCard size={14} className="text-slate-400" />
                          <input 
                             type="number" 
                             placeholder="Use Credit" 
                             className="bg-transparent w-full text-xs outline-none" 
                             value={credit}
                             onChange={(e) => {
                               if(Number(e.target.value) > customerCredits) return alert("Low credits");
                               setCredit(Number(e.target.value));
                             }}
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 py-1">
                       <select
  className="border p-2 rounded-lg text-xs w-full"
  value={orderType}
  onChange={(e) => setOrderType(e.target.value)}
>
  <option value="normal">Normal Order</option>
  <option value="bulk">Bulk Order</option>
  <option value="preorder">Pre Order</option>
</select>
                    </div>
                    {orderType !== "normal" && (
  <div className="space-y-2">
    <input
      type="datetime-local"
      className="border p-2 rounded-lg w-full text-xs"
      onChange={(e) => setScheduledTime(e.target.value)}
    />

   <input
  placeholder="Bulk Note / Kg / Qty details"
  className="border p-2 rounded-lg w-full text-xs"
  value={bulkNote}
  onChange={(e) => setBulkNote(e.target.value)}
/>

{/* ✅ NEW PRICE FIELD */}
<div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border">
  <input
    type="number"
    placeholder="Custom Price (₹)"
    className="bg-transparent w-full text-xs outline-none"
    value={customPrice}
    onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
  />
</div>
  </div>
)}
{orderType !== "normal" && (
  <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border">
   <div className="bg-yellow-50 p-2 rounded-lg border">
  <label className="text-[10px] font-bold text-yellow-700">
    Advance Payment
  </label>
  <input
    type="number"
    placeholder="Enter advance amount"
    className="bg-transparent w-full text-xs outline-none mt-1"
    value={advanceAmount}
    onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
  />
</div>
  </div>
)}

                    {isAdvance && (
                      <div className="flex items-center gap-2 border p-2 rounded-lg bg-orange-50">
                        <Clock size={14} className="text-orange-600"/>
                        <input type="datetime-local" className="text-xs bg-transparent outline-none w-full" onChange={(e) => setScheduledTime(e.target.value)} />
                      </div>
                    )}

                    <div className="flex gap-2">
                       <select className="border p-2 rounded-lg text-xs w-1/2 outline-none" value={source} onChange={(e) => setSource(e.target.value)}>
                          <option value="offline">Offline</option>
                          <option value="zomato">Zomato</option>
                          <option value="swiggy">Swiggy</option>
                       </select>
                       <input placeholder="Ext ID" className="border p-2 rounded-lg text-xs w-1/2 outline-none" value={externalOrderId} onChange={(e) => setExternalOrderId(e.target.value)} />
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Section: Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-black uppercase text-slate-400 tracking-tighter">Current Order</h2>
                <button 
                  onClick={() => { setCart([]); setSelectedBill(null); }}
                  className="text-[10px] bg-white border px-2 py-1 rounded text-red-500 font-bold hover:bg-red-50"
                >
                  CLEAR ALL
                </button>
             </div>
             
             {cart.length === 0 ? (
               <div className="h-40 flex flex-col items-center justify-center text-slate-300">
                  <ShoppingCart size={32} strokeWidth={1} />
                  <span className="text-xs mt-2">No items in cart</span>
               </div>
             ) : (
               cart.map((item) => (
                 <div key={item.food_id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-slate-700">{item.name}</h4>
                       <p className="text-xs text-slate-400">₹{item.price} per unit</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center bg-slate-100 rounded-lg p-1 border">
                          <button onClick={() => updateQty(item.food_id, "dec")} className="p-1 hover:text-red-500"><Minus size={14}/></button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQty(item.food_id, "inc")} className="p-1 hover:text-green-500"><Plus size={14}/></button>
                       </div>
                       <span className="text-sm font-black w-16 text-right">₹{item.price * item.quantity}</span>
                    </div>
                 </div>
               ))
             )}
          </div>

          {/* Section: Totals & Actions */}
          <div className="p-6 bg-white border-t shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
             <div className="space-y-2 mb-4">
                <div className="flex justify-between text-slate-500 text-sm">
                   <span>Subtotal</span>
                   <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm items-center">
                   <div className="flex items-center gap-2">
                      <span>Tax ({taxPercentage}%)</span>
                      <button onClick={() => setShowTaxEditor(!showTaxEditor)} className="text-indigo-600 text-[10px] font-bold">EDIT</button>
                   </div>
                   <span>₹{tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
  <div className="flex justify-between text-sm text-green-600">
    <span>Discount</span>
    <span>- ₹{discount.toFixed(2)}</span>
  </div>
)}
{advanceAmount > 0 && (
  <>
    <div className="flex justify-between text-sm text-blue-600">
      <span>Advance Paid</span>
      <span>- ₹{advanceAmount.toFixed(2)}</span>
    </div>

    <div className="flex justify-between text-lg font-bold text-green-700 border-t pt-2">
      <span>Balance to Pay</span>
      <span>₹{balanceToPay.toFixed(2)}</span>
    </div>
  </>
)}
                {showTaxEditor && (
                  <div className="flex gap-2 mb-2">
                    <input type="number" className="border rounded px-2 py-1 text-xs w-20" value={taxPercentage} onChange={e => setTaxPercentage(Number(e.target.value))} />
                    <button onClick={handleSaveTaxPercentage} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">Save</button>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t">
                   <span className="text-lg font-bold">Total Amount</span>
                   <span className="text-2xl font-black text-indigo-600">₹{finalTotal.toFixed(2)}</span>
                </div>
             </div>

             <div className="space-y-3">
                {(!selectedBill || selectedBill.status !== "paid") ? (
                  <button 
                    disabled={cart.length === 0}
                    onClick={!selectedBill ? handleGenerateBill : () => setShowPaymentModal(true)}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                      !selectedBill ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200" : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                    } disabled:bg-slate-200 disabled:shadow-none`}
                  >
                    {!selectedBill ? "GENERATE BILL" : "PROCEED TO PAYMENT"}
                  </button>
                ) : (
                   <div className="space-y-2">
                      <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-black flex items-center justify-center gap-2 border border-green-200">
                         <CheckCircle size={18} /> ORDER PAID
                      </div>
                      <button onClick={printBill} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                         <Printer size={18}/> PRINT INVOICE
                      </button>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setShowPendingModal(true)} className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100 hover:bg-amber-100">
                      <PauseCircle size={18}/> PENDING
                   </button>
                   <button onClick={printKOT} className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-200">
                      <Printer size={18}/> KOT
                   </button>
                </div>
             </div>
          </div>
        </aside>
      </main>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showPendingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
               <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <h3 className="font-black text-slate-700">Unpaid Orders</h3>
                  <button onClick={() => setShowPendingModal(false)} className="p-1 hover:bg-slate-200 rounded-full"><X size={20}/></button>
               </div>
               <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                <div className="p-3 border-b">
  <input
    type="text"
    placeholder="Search Order ID / Phone"
    className="w-full border p-2 rounded-lg text-sm"
    value={pendingSearch}
    onChange={(e) => setPendingSearch(e.target.value)}
  />
</div>
                  {savedBills
  .filter(b => b.status !== 'paid')
  .filter(b =>
    b.order_id.toString().includes(pendingSearch) ||
    (b.phone && b.phone.includes(pendingSearch))
  ).length === 0 ? (
  <p className="text-center py-8 text-slate-400">No pending bills</p>
) : (
  savedBills
    .filter(b => b.status !== 'paid')
    .map((bill) => {
      const total = Number(
        bill.custom_price ||
        bill.final_amount ||
        bill.total_amount ||
        0
      );

      const advance = Number(
        bill.advance_paid ||
        0
      );

      const balance = total - advance;

      return (
        <div
          key={bill.order_id}
          onClick={() => handleSelectBill(bill)}
          className="p-4 border rounded-xl flex justify-between items-center hover:border-indigo-600 cursor-pointer transition-colors bg-white"
        >
          <div>
            <p className="font-bold">Order #{bill.order_id}</p>
            <p className="text-[10px] text-slate-400">
              {new Date(bill.created_at).toLocaleString()}
            </p>
          </div>

          <p className="font-black text-indigo-600">
            ₹{balance > 0 ? balance.toFixed(2) : "0.00"}
          </p>
        </div>
      );
    })
)}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black">Settlement</h2>
                 <button onClick={() => setShowPaymentModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-2">
                    {['cash', 'upi', 'card'].map(mode => (
                      <button key={mode} onClick={() => setPaymentMode(mode)} className={`py-2 rounded-lg border text-xs font-bold uppercase ${paymentMode === mode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50'}`}>{mode}</button>
                    ))}
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cash Received</label>
                    <input autoFocus type="number" value={cashReceived} onChange={e => setCashReceived(Number(e.target.value))} className="w-full p-4 border rounded-2xl text-2xl font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
  <span>Final Bill</span>
  <span>
    ₹{
      Number(
        (selectedBill?.custom_price ||
          selectedBill?.final_amount ||
          finalTotal) -
        (selectedBill?.advance_paid ||
          selectedBill?.received_amount ||
          advanceAmount)
      ).toFixed(2)
    }
  </span>
</div>
                    <div className="flex justify-between text-lg font-black text-indigo-600 border-t pt-2"><span>Change</span><span>₹{balance > 0 ? balance.toFixed(2) : "0.00"}</span></div>
                 </div>
                 <button onClick={handlePayNow} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 transition-all">CONFIRM PAYMENT</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
  {showAlertModal && (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200]">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl"
      >
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-bold text-lg">Today's Pre Orders</h2>
          <button onClick={() => setShowAlertModal(false)}>✕</button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {preOrderAlerts.length === 0 ? (
            <p className="text-center text-gray-400">
              No alerts today
            </p>
          ) : (
            preOrderAlerts.map((o) => (
              <div
                key={o.id}
                className="border p-3 rounded-xl bg-yellow-50"
              >
                <p className="font-bold">
                  #{o.order_id}
                </p>

                <p className="text-sm">
                  👤 {o.customer?.name || "Guest"}
                </p>

                <p className="text-sm">
                  📞 {o.customer?.phone || "-"}
                </p>

                <p className="text-sm">
                  🕒 {new Date(o.scheduled_time).toLocaleString()}
                </p>

                <p className="text-red-600 font-semibold">
                  Balance: ₹{o.remaining_amount}
                </p>

                <button
                  onClick={() => {
                    handleSelectBill(o);
                    setShowAlertModal(false);
                  }}
                  className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                >
                  Open Order
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </div>
  );
}