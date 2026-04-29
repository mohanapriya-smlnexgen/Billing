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
  Mail,
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
  ShoppingBag,
  ChevronRight,   // ✅ ADD THIS
  Filter,  
  AppWindowMacIcon,
  PersonStanding,
  PersonStandingIcon,
  
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
  const [restaurantName, setRestaurantName] = useState(localStorage.getItem("restaurant_name") || "My Restaurant");
  const [taxPercentage, setTaxPercentage] = useState(Number(localStorage.getItem("tax_percentage")) || 5);
  const [showTaxEditor, setShowTaxEditor] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
const [pendingFilter, setPendingFilter] = useState("all");
  
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

  const handleSaveTaxPercentage = () => {
    localStorage.setItem("tax_percentage", taxPercentage);
    setShowTaxEditor(false);
  };

  const fetchPreOrderAlerts = async () => {
    try {
      const res = await axios.get(BILL_API);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      const today = new Date().toISOString().split("T")[0];
      const alerts = data.filter((o) => {
        if (!o.scheduled_time) return false;
        const orderDate = new Date(o.scheduled_time).toISOString().split("T")[0];
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
    const interval = setInterval(() => fetchPreOrderAlerts(), 30000);
    return () => clearInterval(interval);
  }, []);
const filteredPendingBills = savedBills
  .filter(b => b.status !== "paid")
  .filter(b => {
    const search = pendingSearch.toLowerCase();

    const matchSearch =
      b.order_id?.toString().includes(search) ||
      b.customer_name?.toLowerCase().includes(search) ||
      b.phone?.includes(search);

    const matchFilter =
      pendingFilter === "all" ||
      (pendingFilter === "preorder" && b.is_advance) ||
      (pendingFilter === "bulk" && b.is_bulk) ||
      (pendingFilter === "normal" && !b.is_bulk && !b.is_advance);

    return matchSearch && matchFilter;
  });
  const fetchReportEmail = async () => {
    try {
      const response = await axios.get(REPORT_API);
      setAdminEmail(response.data.email || "");
    } catch (error) { console.error(error); }
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
    } catch (error) { console.error(error); }
  };

  const handleSaveAdminEmail = async () => {
    try {
      await axios.post(SETTING_API, { admin_email: adminEmail });
    } catch (error) { console.error(error); }
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
  variants: item.variants || []   // ✅ ADD THIS
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
      fetchDiscount();
    } else {
      setDiscount(0);
    }
  }, [subtotal]);
  
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;
  const computedTotal = total - discount - credit;
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
        scheduled_time: orderType !== "normal" && scheduledTime ? scheduledTime.replace("T", " ") + ":00" : null,
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
      setTimeout(() => printAdvanceBill(res.data), 500);
      await fetchBills();
    } catch (err) {
      console.error(err);
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
    const total = bill.custom_price || bill.final_amount || bill.total_amount || 0;
    const advance = bill.advance_paid || bill.received_amount || 0;
    const balance = bill.remaining_amount !== undefined ? bill.remaining_amount : total - advance;
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Order #${bill.order_id}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 280px; margin: auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .items { margin: 15px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
          .text-center { text-align: center; }
          .warning { color: #ff6b6b; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>${restaurantName}</h3>
          <p>Order #${bill.order_id}</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="items">
          ${(bill.items || []).map(i => `<div class="item"><span>${i.name}</span><span>${bill.is_bulk ? "Qty: " + i.quantity : "₹" + (i.price * i.quantity)}</span></div>`).join("")}
        </div>
        <div class="total">
          <div class="item"><strong>Total:</strong><strong>₹${total}</strong></div>
          <div class="item"><span>Advance Paid:</span><span>₹${advance}</span></div>
          <div class="item"><span>Balance:</span><span>₹${balance}</span></div>
        </div>
        <div class="text-center warning">⚠ Pending Order - Please Pay Balance</div>
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

      if (remaining <= 0) return;
      if (!cashReceived || cashReceived <= 0) return;
      if (cashReceived < remaining) return;

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

  const subtotal = Number(bill.total_amount || 0);
  const discount = Number(bill.discount_amount || 0);
  const credit = Number(bill.credit_used || 0);

  const final = Number(bill.custom_price || bill.final_amount || 0);

  const advance = Number(bill.advance_paid || 0);   // ✅ IMPORTANT
  const paidNow = Number(bill.received_amount || 0);

  const totalPaid = advance + paidNow;              // ✅ TOTAL PAID
  const change = totalPaid - final;

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
        <span>
  ${item.name} ${
    bill.is_bulk ? `(${item.quantity} kg)` : `x ${item.quantity}`
  }
</span>
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

    ${advance > 0 ? `
      <div class="row"><span>Advance Paid</span><span>₹${advance.toFixed(2)}</span></div>
    ` : ""}

    <div class="row"><span>Paid Now</span><span>₹${paidNow.toFixed(2)}</span></div>

    <div class="row bold">
      <span>Total Paid</span>
      <span>₹${totalPaid.toFixed(2)}</span>
    </div>

    <div class="row">
      <span>Change</span>
      <span>₹${change > 0 ? change.toFixed(2) : "0.00"}</span>
    </div>

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
        ${cart.map(i => `<div class="item"><strong>${i.quantity}x</strong> ${i.name}</div>`).join("")}
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
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
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

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-1.5">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Mail size={14} className="text-indigo-500" />
            </div>
            <input 
              className="bg-transparent text-xs font-semibold outline-none w-44 px-2"
              placeholder="Report Sync Email"
              value={adminEmail}
onChange={(e) => setAdminEmail(e.target.value)}/>
            <button 
              onClick={handleSaveAdminEmail}
              className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-600 transition-colors"
            >
              SYNC
            </button>
          </div>
         <button onClick={()=>navigate('/dashboard')}><PersonStandingIcon/></button>
          <button onClick={() => setShowAlertModal(true)} className="p-3 hover:bg-slate-50 rounded-xl relative transition-colors">
            <AlertCircle size={20} className="text-slate-400" />
            {preOrderAlerts.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
          </button>
          
          <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Sidebar: Categories */}
        <aside className="w-60 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Groups</h2>
              <Filter size={14} className="text-slate-300" />
            </div>
            <nav className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    selectedCategory === cat 
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
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Search Header */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search dishes, drinks or snacks..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700 shadow-sm"
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
    <div key={item.food_id} className="bg-white border rounded-2xl p-4">
      <h3 className="font-bold">
  {item.name}
  {variant && (
    <span className="text-xs text-gray-500 ml-2">
      ({variant.value} {variant.unit})
    </span>
  )}
</h3>

      {item.description && (
        <p className="text-xs text-gray-500">{item.description}</p>
      )}

      {item.variants.length > 0 && (
       <select
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

      <div className="flex justify-between mt-3">
        <span className="font-bold text-indigo-600">
          ₹{displayPrice}
        </span>

        <button
          onClick={() =>
            addToCart({
              ...item,
              price: displayPrice,
              variant_info: variant?.name || null,
            })
          }
          className="bg-indigo-600 text-white px-3 py-1 rounded"
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

      {/* Modals */}
      <AnimatePresence>
        {showAlertModal && (
          <Modal title="System Alerts" onClose={() => setShowAlertModal(false)}>
            <div className="space-y-3">
              {preOrderAlerts.length > 0 ? preOrderAlerts.map(alert => (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm font-bold text-amber-800">{alert.customer_name}</p>
                  <p className="text-xs text-amber-600">Pending Advance: ₹{alert.remaining_amount}</p>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400 font-medium">No alerts today</div>
              )}
            </div>
          </Modal>
        )}
     {showPendingModal && (
  <Modal title="Pending Bills" onClose={() => setShowPendingModal(false)}>
    
    {/* 🔍 Search + Filter */}
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Search order / name / phone..."
        value={pendingSearch}
        onChange={(e) => setPendingSearch(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-2 text-sm"
      />

      <select
        value={pendingFilter}
        onChange={(e) => setPendingFilter(e.target.value)}
        className="border rounded-lg px-2 py-2 text-sm"
      >
        <option value="all">All</option>
        <option value="normal">Normal</option>
        <option value="preorder">Preorder</option>
        <option value="bulk">Bulk</option>
      </select>
    </div>

    {/* 📋 Bills List */}
    <div className="space-y-3">
      {filteredPendingBills.length > 0 ? (
        filteredPendingBills.map((bill) => (
          <div
            key={bill.order_id}
            onClick={() => handleSelectBill(bill)}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl cursor-pointer hover:bg-yellow-100 transition"
          >
            <div className="flex justify-between items-center">
              <p className="font-bold">Order #{bill.order_id}</p>

              {/* Tag */}
              <span className="text-xs px-2 py-1 rounded bg-yellow-200">
                {bill.is_bulk
                  ? "Bulk"
                  : bill.is_advance
                  ? "Preorder"
                  : "Normal"}
              </span>
            </div>

            <p className="text-sm font-semibold text-indigo-600">
              ₹{bill.final_amount || bill.total_amount}
            </p>

            <p className="text-xs text-gray-500">
              {bill.customer_name || "Guest"}
            </p>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 py-6">
          No matching bills
        </div>
      )}
    </div>
  </Modal>
)}
         {showPaymentModal && selectedBill && (
          <Modal title="Payment Settlement" onClose={() => setShowPaymentModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2.5 rounded-xl border-2 font-bold text-sm uppercase transition-all ${
                      paymentMode === mode 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount Received</label>
                <input
                  autoFocus
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(Number(e.target.value))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-2xl font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Bill Amount:</span>
                  <span className="font-bold">₹{dueAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-indigo-600 border-t pt-2">
                  <span>Change:</span>
                  <span>₹{balance > 0 ? balance.toFixed(2) : "0.00"}</span>
                </div>
              </div>
              
              <button
                onClick={handlePayNow}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Confirm Payment
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const Modal = ({ children, title, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </motion.div>
  </motion.div>
);