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

  // ✅ SAFE setCart
  const safeSetCart = typeof setCart === "function" ? setCart : () => {};

  /* ---------------- PRICE HELPER ---------------- */
  const getPricePerKg = (item) => {
    if (!item?.variants || item.variants.length === 0) {
      return Number(item.price || 0);
    }
    const kgVariant = item.variants.find(
      (v) => v.unit === "kg" && Number(v.value) === 1
    );
    if (kgVariant) return Number(kgVariant.price);

    const first = item.variants[0];
    if (first.unit === "g") {
      return (Number(first.price) / Number(first.value)) * 1000;
    }
    if (first.unit === "kg") {
      return Number(first.price) / Number(first.value);
    }
    return Number(item.price || 0);
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
      calculatedTotalPrice = Number(selectedItem.price || 0) * Number(qty);
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

  const finalCustomPrice = Number(customPrice) || 0;
  const finalAdvance = Number(advanceAmount) || 0;

  // ✅ Balance = (Total - Discount) - Advance
  const balance = Math.max(0, finalCustomPrice - discountValue - finalAdvance);

  /* ---------------- UI ---------------- */
  return (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[200]">
  <motion.div
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    className="bg-white w-full max-w-lg rounded-2xl shadow-xl"
  >

    {/* HEADER */}
    <div className="flex justify-between items-center p-4 border-b">
      <h2 className="font-bold text-lg flex items-center gap-2">
        <User size={18} /> Customer Details
      </h2>
      <button onClick={onClose}>
        <X />
      </button>
    </div>

    {/* BODY */}
    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

      {/* PHONE + NAME */}
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Phone"
          maxLength={10}
          value={customerPhone}
          onChange={(e) => {
            const phone = e.target.value.replace(/\D/g, "");
            setCustomerPhone(phone);
            if (phone.length === 10) searchCustomer(phone);
          }}
          className="border p-2 rounded"
        />

        <input
          placeholder="Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* CREDIT */}
      {customerFound && (
        <div className="text-green-600 text-sm font-semibold">
          Credits Available: ₹{customerCredits}
        </div>
      )}

      {/* DISCOUNT */}
      <div className="flex gap-2">
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          className="border p-2 rounded bg-gray-50 text-sm"
        >
          <option value="fixed">₹</option>
          <option value="percentage">%</option>
        </select>

        <input
          type="number"
          placeholder="Discount"
          value={discount === 0 ? "" : discount}
          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* ORDER TYPE */}
      <select
        value={orderType}
        onChange={(e) => setOrderType(e.target.value)}
        className="border p-2 w-full rounded"
      >
        <option value="normal">Normal</option>
        <option value="bulk">Bulk</option>
        <option value="preorder">Pre Order</option>
      </select>

      {/* BULK */}
      {orderType === "bulk" && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-xl border">

          <select
            value={selectedItem?.food_id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const item = menuItems.find(
                (i) => Number(i.food_id) === id
              );
              setSelectedItem(item);
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Item</option>

            {menuItems.map((item, index) => (
              <option key={item.food_id || index} value={item.food_id}>
                {item.name} - ₹{item.price}
              </option>
            ))}
          </select>

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="qty">Quantity</option>
            <option value="kg">KG</option>
          </select>

          <input
            type="number"
            placeholder={`Enter ${unit}`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <div className="flex items-center gap-2 border p-2 rounded bg-blue-50">
            <Tag size={14} />
            <span>₹{customPrice}</span>
          </div>
        </div>
      )}

      {/* ADVANCE */}
      <div className="flex items-center gap-2 border p-2 rounded bg-yellow-50">
        <CreditCard size={14} />
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
        <div className="text-sm space-y-1 border-t pt-2">

          <div className="flex justify-between">
            <span>Total</span>
            <span>₹{finalCustomPrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>
              Discount ({discountType === "percentage" ? `${discount}%` : "₹"})
            </span>
            <span>-₹{discountValue.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-blue-600">
            <span>Advance</span>
            <span>-₹{finalAdvance.toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-bold text-green-700">
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
          className="border p-2 w-1/2 rounded"
        >
          <option value="offline">Offline</option>
          <option value="zomato">Zomato</option>
          <option value="swiggy">Swiggy</option>
        </select>

        <input
          placeholder="External Order ID"
          value={externalOrderId}
          onChange={(e) => setExternalOrderId(e.target.value)}
          className="border p-2 w-1/2 rounded"
        />
      </div>
    </div>

    {/* FOOTER */}
    <div className="p-4 border-t">
      <button
        onClick={onClose}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold"
      >
        Done
      </button>
    </div>
  </motion.div>
</div>
  );
}