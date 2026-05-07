import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, User, CreditCard, Tag } from "lucide-react";

export default function CustomerModal({
  onClose,
  customerPhone,
  setCustomerPhone,
  customerName,
  setCustomerName,
  searchCustomer,
  customerFound,
  customerCredits,
  scheduledTime,
  setScheduledTime,
  discount,
  setDiscount,
  orderType,
  setOrderType,
  menuItems = [],
  customPrice,
  setCustomPrice,
  advanceAmount,
  setAdvanceAmount,
  source,
  discountType,
  setDiscountType,
  setSource,
  externalOrderId,
  setExternalOrderId,
  cart = [],
  setCart,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [unit, setUnit] = useState("qty");
  const [qty, setQty] = useState("");
const [searchItem, setSearchItem] = useState("");
const [showDropdown, setShowDropdown] = useState(false);
  // ✅ SAFE setCart
  const safeSetCart = typeof setCart === "function" ? setCart : () => {};
const filteredMenuItems = useMemo(() => {
  return menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchItem.toLowerCase())
  );
}, [menuItems, searchItem]);
  /* ---------------- PRICE HELPER ---------------- */
const getPricePerKg = (item) => {
  if (!item?.variants || item.variants.length === 0) {
    return Number(item.price || 0);
  }

  // 🔥 Find correct variant (prefer kg)
  const kgVariant = item.variants.find(
    (v) => v.unit === "kg"
  );

  if (kgVariant) {
    return Number(kgVariant.price) / Number(kgVariant.value || 1);
  }

  const first = item.variants[0];

  if (first.unit === "g") {
    return (Number(first.price) / Number(first.value)) * 1000;
  }

  return Number(first.price || item.price || 0);
};

  /* ---------------- RESET QTY ON ITEM CHANGE ---------------- */
  useEffect(() => {
    setQty("");
  }, [selectedItem]);

  /* ---------------- MERGED CALCULATION & AUTO-CART ---------------- */
  useEffect(() => {
    if (orderType !== "bulk" || !selectedItem || qty === "" || isNaN(qty)) return;

    let calculatedTotalPrice = 0;
    if (unit === "kg") {
      const pricePerKg = getPricePerKg(selectedItem);
      calculatedTotalPrice = pricePerKg * Number(qty);
    } else {
      const basePrice =
  selectedItem.variants?.length > 0
    ? Number(selectedItem.variants[0].price)
    : Number(selectedItem.price || 0);

calculatedTotalPrice = basePrice * Number(qty);
    }

    setCustomPrice(calculatedTotalPrice);

    const newItem = {
      food_id: selectedItem.food_id,
      name: selectedItem.name,
      price: calculatedTotalPrice, 
      quantity: 1,
      unit,
      isBulk: true,
    };

    safeSetCart([newItem]); 
  }, [qty, selectedItem, unit, orderType]);

  /* ---------------- DISCOUNT & BALANCE LOGIC ---------------- */
  
  // Calculate the actual rupee value of the discount
  const discountValue = useMemo(() => {
    const d = Number(discount) || 0;
    if (discountType === "percentage") {
      return (Number(customPrice) * d) / 100;
    }
    return d;
  }, [discount, discountType, customPrice]);

const cartSubtotal = useMemo(() => {
  return cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}, [cart]);

const finalCustomPrice =
  orderType === "bulk"
    ? Number(customPrice) || 0
    : cartSubtotal;
  const finalAdvance = Number(advanceAmount) || 0;

  // ✅ Balance = (Total - Discount) - Advance
  const balance = Math.max(0, finalCustomPrice - discountValue - finalAdvance);

  /* ---------------- UI ---------------- */
return (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[200]">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <User size={18} /> Customer Details
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
          <X />
        </button>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

        {/* PHONE + NAME */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Phone"
            maxLength={10}
            value={customerPhone}
            onChange={(e) => {
              const phone = e.target.value.replace(/\D/g, "");
              setCustomerPhone(phone);
              if (phone.length === 10) searchCustomer(phone);
            }}
            className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* DISCOUNT */}
        <div className="flex gap-2">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="border p-2.5 rounded-lg bg-gray-50"
          >
            <option value="fixed">₹</option>
            <option value="percentage">%</option>
          </select>

          <input
            type="number"
            placeholder="Discount"
            value={discount === 0 ? "" : discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="border p-2.5 rounded-lg w-full"
          />
        </div>
        {/* SCHEDULED TIME */}
{(orderType === "bulk" || orderType === "preorder") && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Scheduled Time
    </label>

    <input
      type="datetime-local"
      value={scheduledTime || ""}
      onChange={(e) => setScheduledTime(e.target.value)}
      className="border p-2.5 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
    />
  </div>
)}
        {/* ORDER TYPE */}
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="border p-2.5 w-full rounded-lg"
        >
          <option value="normal">Normal</option>
          <option value="bulk">Bulk</option>
          <option value="preorder">Pre Order</option>
        </select>

        {/* BULK */}
        {orderType === "bulk" && (
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

            {/* SEARCH */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search item..."
                value={searchItem}
                onChange={(e) => {
                  setSearchItem(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="border p-2.5 rounded-lg w-full"
              />

              {showDropdown && (
                <div className="absolute z-10 bg-white border w-full mt-1 rounded-lg max-h-40 overflow-y-auto shadow">
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((item) => (
                      <div
                        key={item.food_id}
                        onClick={() => {
                          setSelectedItem(item);
                          setSearchItem(item.name);
                          setShowDropdown(false);
                        }}
                        className="p-2 hover:bg-indigo-100 cursor-pointer text-sm"
                      >
                        {item.name} - ₹{item.price}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-400">No items found</div>
                  )}
                </div>
              )}
            </div>

            {/* UNIT */}
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border p-2.5 rounded-lg w-full"
            >
              <option value="qty">Quantity</option>
              <option value="kg">KG</option>
            </select>

            {/* QTY */}
            <input
              type="number"
              placeholder={`Enter ${unit}`}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="border p-2.5 rounded-lg w-full"
            />

            {/* PRICE */}
            <div className="flex items-center justify-between border p-2.5 rounded-lg bg-blue-50 text-indigo-700 font-semibold">
              <span>Total</span>
              <span>₹{Number(customPrice).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ADVANCE */}
        <div className="flex items-center gap-2 border p-2.5 rounded-lg bg-yellow-50">
          <CreditCard size={16} />
          <input
            type="number"
            placeholder="Advance"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
            className="bg-transparent w-full outline-none"
          />
        </div>

        {/* SUMMARY */}
        {finalCustomPrice > 0 && (
          <div className="text-sm space-y-2 border-t pt-3">

            <div className="flex justify-between">
              <span>Total</span>
              <span>₹{finalCustomPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{discountValue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-blue-600">
              <span>Advance</span>
              <span>-₹{finalAdvance.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-lg text-indigo-700">
              <span>Balance</span>
              <span>₹{balance.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* SOURCE */}
        <div className="flex gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border p-2.5 w-1/2 rounded-lg"
          >
            <option value="offline">Offline</option>
            <option value="zomato">Zomato</option>
            <option value="swiggy">Swiggy</option>
          </select>

          <input
            placeholder="Order ID"
            value={externalOrderId}
            onChange={(e) => setExternalOrderId(e.target.value)}
            className="border p-2.5 w-1/2 rounded-lg"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold"
        >
          Done
        </button>
      </div>
    </motion.div>
  </div>
);
}