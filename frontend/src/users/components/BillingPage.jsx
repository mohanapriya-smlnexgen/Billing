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
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const REPORT_API = "http://127.0.0.1:8000/api/report-setting/";
const MENU_API = "http://127.0.0.1:8000/api/food-menu/";
const BILL_API = "http://127.0.0.1:8000/api/cashier-orders/";
const SETTING_API = "http://127.0.0.1:8000/api/restaurant-setting/";
export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [savedBills, setSavedBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [restaurantName, setRestaurantName] = useState(
    localStorage.getItem("restaurant_name") || "My Restaurant",
  );
  const [taxPercentage, setTaxPercentage] = useState(
    Number(localStorage.getItem("tax_percentage")) || 5,
  );

  const [showTaxEditor, setShowTaxEditor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchBills();
    fetchReportEmail();
    fetchRestaurantSettings();
  }, []);

  //   const handleSaveRestaurantName = () => {
  //   localStorage.setItem("restaurant_name", restaurantName);
  //   alert("Restaurant name saved successfully");
  // };
  const handleSaveTaxPercentage = () => {
    localStorage.setItem("tax_percentage", taxPercentage);
    setShowTaxEditor(false);
    alert("Tax percentage updated successfully");
  };
  const fetchReportEmail = async () => {
    try {
      const response = await axios.get(REPORT_API);
      setAdminEmail(response.data.email || "");
    } catch (error) {
      console.error("Report email fetch error:", error);
    }
  };

  // const handleSaveAdminEmail = async () => {
  //   if (!adminEmail) return alert("Please enter admin email");
  //   try {
  //     await axios.post(REPORT_API, { email: adminEmail });
  //     alert("Daily sales report email saved successfully");
  //   } catch (error) {
  //     alert("Failed to save email");
  //   }
  // };
  const handleSaveRestaurantName = async () => {
    try {
      await axios.post(SETTING_API, {
        restaurant_name: restaurantName,
      });

      alert("Restaurant name saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save restaurant name");
    }
  };
  const handleSaveAdminEmail = async () => {
    try {
      await axios.post(SETTING_API, {
        admin_email: adminEmail,
      });

      alert("Admin email saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save admin email");
    }
  };
  const fetchRestaurantSettings = async () => {
    try {
      const response = await axios.get(SETTING_API);

      setRestaurantName(response.data.restaurant_name || "My Restaurant");
      setAdminEmail(response.data.admin_email || "");
      setTaxPercentage(Number(response.data.tax_percentage) || 5);
    } catch (error) {
      console.error("Failed to fetch restaurant settings", error);
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

      setMenuItems(
        itemsData.map((item, index) => ({
          food_id: item.id || index + 1,
          name: item.food_name,
          price: Number(item.price),
          category: item.category?.toLowerCase() || "uncategorized",
        })),
      );

      setCategories([
        "all",
        ...categoriesData.map((cat) =>
          typeof cat === "string" ? cat.toLowerCase() : cat.name?.toLowerCase(),
        ),
      ]);
    } catch (error) {
      console.error("Menu fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get(BILL_API);
      setSavedBills(
        Array.isArray(response.data)
          ? response.data
          : response.data.results || [],
      );
    } catch (error) {
      setSavedBills([]);
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, selectedCategory, menuItems]);

  const addToCart = (item) => {
    const existing = cart.find((c) => c.food_id === item.food_id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.food_id === item.food_id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQty = (foodId, type) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.food_id !== foodId) return item;
          return {
            ...item,
            quantity: type === "inc" ? item.quantity + 1 : item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;
  const balance = cashReceived - total;

  const handleGenerateBill = async () => {
    if (cart.length === 0) return alert("Please add items first");

    try {
      const payload = {
        total_amount: total,
        payment_mode: paymentMode,
        received_amount: 0,
        cart: cart.map((item) => ({
          food_id: item.food_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await axios.post(`${BILL_API}create_order/`, payload);

      console.log("CREATE ORDER RESPONSE:", response.data); // 👈 ADD THIS

      if (!response.data?.order_id) {
        alert("Order not created properly");
        return;
      }

      setSelectedBill(response.data); // ✅ MUST use backend response
      setCart([]);

      alert(`Bill generated: #${response.data.order_id}`);

      await fetchBills();
    } catch (error) {
      console.error("CREATE ORDER ERROR:", error.response || error);
      alert(error.response?.data?.detail || "Failed to generate bill");
    }
  };

  const handleSelectBill = (bill) => {
    setSelectedBill(bill);

    setCart(
      (bill.items || []).map((item) => ({
        food_id: item.food_id,
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price), // ✅ FIX
      })),
    );

    setShowPendingModal(false);
  };

  const handlePayNow = async () => {
    if (!selectedBill) {
      return alert("No bill selected");
    }

    if (cashReceived < total) {
      return alert("Received cash is less than total amount");
    }

    try {
      const response = await axios.post(
        `${BILL_API}${selectedBill.order_id}/mark_paid/`,
        {
          received_amount: cashReceived,
          payment_mode: paymentMode,
        },
      );

      alert("Payment completed successfully");

      // ✅ USE BACKEND RESPONSE (VERY IMPORTANT)
      const updatedBill = response.data;

      setSelectedBill(updatedBill);

      // Optional: clear cart after payment
      setCart([]);

      setShowPaymentModal(false);
      setCashReceived(0);

      // Refresh all bills from server
      await fetchBills();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Payment failed");
    }
  };

  // FIXED: Now uses values from selectedBill to avoid showing 0 or wrong balance
  const printBill = () => {
    if (!selectedBill) return;

    const billTotal = Number(selectedBill.total_amount) || 0;
    const paidAmount = Number(selectedBill.received_amount) || 0;
    const returnBalance = paidAmount - billTotal;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <body style="font-family: Arial; width: 300px; margin: auto; padding: 10px;">
          <h2 style="text-align:center">${restaurantName}</h2>
          <p style="text-align:center">Bill No: ${selectedBill.order_id}</p>
          <p style="text-align:center; font-size:10px;">${new Date(selectedBill.created_at).toLocaleString()}</p>
          <hr />
          <table style="width:100%; font-size: 14px;">
  ${(selectedBill.items || []).map(item => `
    <tr>
      <td>${item.name} x ${item.quantity}</td>
      <td style="text-align:right">
        ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `).join("")}
</table>
          <hr />
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Total:</span><span>₹${billTotal.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Paid:</span><span>₹${paidAmount.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Balance:</span><span>₹${returnBalance.toFixed(2)}</span>
          </div>
          <hr />
          <p style="text-align:center; font-size:12px;">Thank You! Visit Again</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const printKOT = () => {
    const kotWindow = window.open("", "_blank");
    kotWindow.document.write(`
      <html><body style="font-family: Arial; width: 300px; margin:auto; padding:10px;">
        <h2 style="text-align:center;">KOT</h2>
        <p style="text-align:center;">Order: ${selectedBill?.order_id || "New Order"}</p><hr />
        ${(selectedBill.items || []).map((item) => `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>${item.name}</span><span>x${item.quantity}</span></div>`).join("")}
      </body></html>
    `);
    kotWindow.document.close();
    kotWindow.print();
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white shadow-md border-b px-6 py-3 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <Receipt size={22} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Billing Counter</h1>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-1">
            <Receipt size={16} className="text-blue-600" />
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant Name"
              className="bg-transparent border-none focus:outline-none text-sm w-48"
            />
            <button
              onClick={handleSaveRestaurantName}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              SAVE
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-1">
            <Mail size={16} className="text-blue-600" />
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin Report Email"
              className="bg-transparent border-none focus:outline-none text-sm w-48"
            />
            <button
              onClick={handleSaveAdminEmail}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              SAVE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium text-sm">
            <Home size={18} /> Home
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium text-sm"
          >
            <ClipboardList size={18} /> Admin
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Categories
          </h2>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all capitalize ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 relative max-w-2xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              Loading menu...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.food_id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 capitalize">
                    {item.category}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-gray-900">
                      ₹{item.price}
                    </span>
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BILLING SIDEBAR */}
        <div className="w-[400px] bg-white border-l shadow-2xl flex flex-col">
          <div className="p-5 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Current Bill</h2>
              <p className="text-xs text-gray-400 uppercase">
                {selectedBill ? `BILL #${selectedBill.order_id}` : "New Order"}
              </p>
            </div>
           <div className="flex justify-center"><ShoppingCart className="text-blue-600"  /><button
  onClick={() => {
    setSelectedBill(null);
    setCart([]);              // ✅ clear cart
    setCashReceived(0);       // ✅ reset payment
    setPaymentMode("cash");   // ✅ reset mode (optional)
  }}
  className="font-bold text-blue-800"
>
  New Bill
</button>
          </div></div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-gray-300 mt-20 italic">
                No items selected
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.food_id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="font-bold text-blue-700 text-sm">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(item.food_id, "dec")}
                      className="p-1 rounded bg-white border text-red-500 shadow-sm"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.food_id, "inc")}
                      className="p-1 rounded bg-white border text-green-500 shadow-sm"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t space-y-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Tax ({taxPercentage}%)</span>

                    <button
                      onClick={() => setShowTaxEditor(!showTaxEditor)}
                      className="text-blue-600 text-xs font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <span>₹{tax.toFixed(2)}</span>
                </div>

                {showTaxEditor && (
                  <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl mt-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(Number(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg text-sm font-medium"
                    />

                    <span className="text-sm text-gray-600">%</span>

                    <button
                      onClick={handleSaveTaxPercentage}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-2xl font-black text-gray-900 border-t pt-2 mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {!selectedBill && (
                <button
                  onClick={handleGenerateBill}
                  disabled={cart.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg disabled:bg-gray-300"
                >
                  Generate Bill
                </button>
              )}

              {selectedBill?.status !== "paid" && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={!selectedBill}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg disabled:bg-gray-300"
                >
                  Pay Now
                </button>
              )}

              {selectedBill?.status === "paid" && (
                <div className="space-y-2">
                  
                  <div className="w-full bg-green-100 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Paid
                    
                  </div>
                  
                  <button
                    onClick={printBill}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Printer size={18} /> Print Invoice
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowPendingModal(true)}
                  className="bg-orange-100 text-orange-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-200"
                >
                  <PauseCircle size={18} /> Pending
                </button>
                <button
                  onClick={printKOT}
                  className="bg-gray-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> KOT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PENDING BILLS MODAL */}
      <AnimatePresence>
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">Unpaid Bills</h3>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {savedBills.filter((b) => b.status !== "paid").length === 0 ? (
                  <div className="text-center py-10 text-gray-400 italic">
                    No unpaid bills
                  </div>
                ) : (
                  savedBills
                    .filter((b) => b.status !== "paid")
                    .map((bill) => (
                      <div
                        key={bill.order_id}
                        onClick={() => handleSelectBill(bill)}
                        className="p-4 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-bold text-sm">
                            Order #${bill.order_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(bill.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-black text-blue-600">
                          ₹{bill.total_amount}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Process Payment</h2>
                <button onClick={() => setShowPaymentModal(false)}>
                  <X />
                </button>
              </div>
              <div className="space-y-4">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-4 border rounded-2xl bg-gray-50 font-medium"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full p-4 border rounded-2xl text-lg font-bold"
                  placeholder="Cash Received"
                />
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <div className="flex justify-between text-sm">
                    <span>Total Bill</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-blue-900 border-t mt-1 pt-1">
                    <span>Return</span>
                    <span>₹{balance > 0 ? balance.toFixed(2) : 0}</span>
                  </div>
                </div>
                <button
                  onClick={handlePayNow}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg"
                >
                  Confirm Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
