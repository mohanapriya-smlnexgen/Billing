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
  AlertCircle
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

  const fetchReportEmail = async () => {
    try {
      const response = await axios.get(REPORT_API);
      setAdminEmail(response.data.email || "");
    } catch (error) { console.error(error); }
  };

  const searchCustomer = async (phone) => {
    if (!phone) return;
    try {
      const res = await axios.get(`${BILL_API}search_customer/?phone=${phone}`);
      setCustomerName(res.data.name || "");
      setCustomerCredits(res.data.credits || 0);
      setCustomerId(res.data.id);
      setCustomerFound(true);
    } catch (err) {
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
  const finalTotal = orderType !== "normal" && customPrice > 0 ? customPrice : Math.max(computedTotal, 0);
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
      setTimeout(() => printAdvanceBill(res.data), 500);
      await fetchBills();
    } catch (err) {
      console.error(err);
    }
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

      setSelectedBill(response.data);
      setCart([]);
      setShowPaymentModal(false);
      setCashReceived(0);
      await fetchBills();
      setTimeout(() => printBill(), 300);
    } catch (error) {
      console.error(error);
    }
  };

  const printBill = () => {
    if (!selectedBill) return;
    const bill = selectedBill;
    const final = Number(bill.custom_price || bill.final_amount || 0);
    const paid = Number(bill.received_amount || 0);
    const change = paid - final;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice #${bill.order_id}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 280px; margin: auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .items { margin: 15px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${restaurantName}</h2>
          <p>Invoice #${bill.order_id}</p>
          <p>${new Date().toLocaleString()}</p>
          ${bill.customer ? `<p>Customer: ${bill.customer.name || "Guest"}</p>` : ""}
        </div>
        <div class="items">
          ${(bill.items || []).map(item => `<div class="item"><span>${item.name} x ${item.quantity}</span><span>₹${(item.price * item.quantity).toFixed(2)}</span></div>`).join("")}
        </div>
        <div class="total">
          <div class="item"><strong>Total:</strong><strong>₹${final.toFixed(2)}</strong></div>
          <div class="item"><span>Paid:</span><span>₹${paid.toFixed(2)}</span></div>
          ${change > 0 ? `<div class="item"><span>Change:</span><span>₹${change.toFixed(2)}</span></div>` : ""}
        </div>
        <div class="footer">🙏 Thank You! Visit Again</div>
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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg">
            <Receipt size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">POS System</h1>
            <p className="text-xs text-gray-500">{currentTime.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <Store size={16} className="text-indigo-600" />
            <input 
              className="bg-transparent border-none text-sm font-medium focus:outline-none w-36 text-gray-700"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              onBlur={handleSaveRestaurantName}
            />
          </div>
          
          <button 
            onClick={() => setShowAlertModal(true)} 
            className="relative p-2 hover:bg-yellow-50 rounded-full transition-colors"
          >
            <AlertCircle size={20} className="text-yellow-600" />
            {preOrderAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {preOrderAlerts.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => navigate("/dashboard")} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ClipboardList size={20} />
          </button>
          
          <button 
            onClick={() => navigate("/login")} 
            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content - Takes remaining space with proper flex */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4 min-h-0">
        {/* Categories Sidebar - Fixed Width */}
        <aside className="w-72 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Menu Categories</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all capitalize ${
                  selectedCategory === cat 
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{cat}</span>
                  {selectedCategory === cat && <ChevronRight size={16} />}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Menu Grid - Takes remaining space */}
        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-w-0">
          <div className="p-5 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading menu...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={item.food_id}
                    onClick={() => addToCart(item)}
                    className="group bg-white p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:from-indigo-600 group-hover:to-indigo-700 transition-all">
                      <Plus size={20} className="text-indigo-600 group-hover:text-white transition-all" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-400 mb-2 capitalize truncate">{item.category}</p>
                    <p className="text-xl font-black text-indigo-600">₹{item.price}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel - Fixed Width */}
        <BillingRightPanel
          cart={cart}
          updateQty={updateQty}
          setCart={setCart}
          setSelectedBill={setSelectedBill}
          subtotal={subtotal}
          taxPercentage={taxPercentage}
          tax={tax}
          discount={discount}
          advanceAmount={advanceAmount}
          finalTotal={finalTotal}
          selectedBill={selectedBill}
          showTaxEditor={showTaxEditor}
          setShowTaxEditor={setShowTaxEditor}
          taxPercentageValue={taxPercentage}
          setTaxPercentage={setTaxPercentage}
          handleSaveTaxPercentage={handleSaveTaxPercentage}
          handleGenerateBill={handleGenerateBill}
          setShowPaymentModal={setShowPaymentModal}
          printBill={printBill}
          setShowPendingModal={setShowPendingModal}
          printKOT={printKOT}
          showCustomerDetails={showCustomerDetails}
          setShowCustomerDetails={setShowCustomerDetails}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerFound={customerFound}
          customerCredits={customerCredits}
          setDiscount={setDiscount}
          credit={credit}
          setCredit={setCredit}
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
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showPendingModal && (
          <Modal title="Pending Orders" onClose={() => setShowPendingModal(false)}>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search by Order ID or Phone..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {savedBills.filter(b => b.status !== 'paid').filter(b => 
                  b.order_id.toString().includes(pendingSearch) || 
                  (b.phone && b.phone.includes(pendingSearch))
                ).length === 0 ? (
                  <p className="text-center py-8 text-gray-400">No pending orders found</p>
                ) : (
                  savedBills.filter(b => b.status !== 'paid').map((bill) => {
                    const total = Number(bill.custom_price || bill.final_amount || bill.total_amount || 0);
                    const advance = Number(bill.advance_paid || 0);
                    const balance = total - advance;
                    return (
                      <div
                        key={bill.order_id}
                        onClick={() => handleSelectBill(bill)}
                        className="p-4 border-2 border-gray-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">Order #{bill.order_id}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(bill.created_at).toLocaleString()}</p>
                            {bill.customer?.name && (
                              <p className="text-xs text-gray-600 mt-1">👤 {bill.customer.name}</p>
                            )}
                          </div>
                          <p className="text-xl font-black text-indigo-600">₹{balance.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
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

      <AnimatePresence>
        {showAlertModal && (
          <Modal title="Today's Pre-Orders" onClose={() => setShowAlertModal(false)}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {preOrderAlerts.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No pre-orders for today</p>
              ) : (
                preOrderAlerts.map((o) => (
                  <div key={o.id} className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="font-bold text-gray-800">Order #{o.order_id}</p>
                    <p className="text-sm text-gray-600 mt-1">👤 {o.customer?.name || "Guest"}</p>
                    <p className="text-sm text-gray-600">📞 {o.customer?.phone || "-"}</p>
                    <p className="text-sm text-gray-600">🕒 {new Date(o.scheduled_time).toLocaleString()}</p>
                    <p className="text-red-600 font-bold mt-2">Balance: ₹{o.remaining_amount}</p>
                    <button
                      onClick={() => {
                        handleSelectBill(o);
                        setShowAlertModal(false);
                      }}
                      className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Open Order
                    </button>
                  </div>
                ))
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component
const Modal = ({ children, title, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  </div>
);

const ChevronRight = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);