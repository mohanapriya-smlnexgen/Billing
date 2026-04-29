// src/components/CustomerModal.jsx
import React from "react";
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
  credit,
  setCredit,

  orderType,
  setOrderType,

  scheduledTime,
  setScheduledTime,
  bulkNote,
  setBulkNote,

  customPrice,
  setCustomPrice,
  advanceAmount,
  setAdvanceAmount,

  source,
  setSource,
  externalOrderId,
  setExternalOrderId,
}) {

  // Convert safely when needed
  const finalCustomPrice = Number(customPrice) || 0;
  const finalAdvance = Number(advanceAmount) || 0;

  const balance =
    finalCustomPrice > 0
      ? finalCustomPrice - finalAdvance
      : 0;

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
                const phone = e.target.value;
                searchCustomer(phone);
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

          {/* CUSTOMER CREDIT */}
          {customerFound && (
            <div className="text-green-600 text-sm font-semibold">
              Credits Available: ₹{customerCredits}
            </div>
          )}

          {/* DISCOUNT + CREDIT */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Discount"
              value={discount === 0 ? "" : discount}
              onChange={(e) =>
                setDiscount(Number(e.target.value) || 0)
              }
              className="border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Use Credit"
              value={credit === 0 ? "" : credit}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                if (val > customerCredits) return;
                setCredit(val);
              }}
              className="border p-2 rounded"
            />
          </div>

          {/* ORDER TYPE */}
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="normal">Normal Order</option>
            <option value="bulk">Bulk Order</option>
            <option value="preorder">Pre Order</option>
          </select>

          {/* BULK / PREORDER SECTION */}
          {orderType !== "normal" && (
            <div className="space-y-3 bg-gray-50 p-3 rounded-xl border">

              {/* SCHEDULE */}
              <input
                type="datetime-local"
                value={scheduledTime || ""}
                onChange={(e) =>
                  setScheduledTime(e.target.value)
                }
                className="border p-2 rounded w-full"
              />

              {/* BULK NOTE */}
              <input
                placeholder="Enter Qty / Kg (e.g., 7kg)"
                value={bulkNote || ""}
                onChange={(e) =>
                  setBulkNote(e.target.value)
                }
                className="border p-2 rounded w-full"
              />

              {/* CUSTOM PRICE */}
              <div className="flex items-center gap-2 border p-2 rounded bg-blue-50">
                <Tag size={14} />
                <input
                  type="number"
                  placeholder="Custom Price (₹)"
                  value={customPrice}
                  onChange={(e) =>
                    setCustomPrice(e.target.value)
                  }
                  className="bg-transparent w-full outline-none"
                />
              </div>

              {/* ADVANCE */}
              <div className="flex items-center gap-2 border p-2 rounded bg-yellow-50">
                <CreditCard size={14} />
                <input
                  type="number"
                  placeholder="Advance Amount (₹)"
                  value={advanceAmount}
                  onChange={(e) =>
                    setAdvanceAmount(e.target.value)
                  }
                  className="bg-transparent w-full outline-none"
                />
              </div>

              {/* BALANCE PREVIEW */}
              {finalCustomPrice > 0 && (
                <div className="text-sm font-semibold text-green-600">
                  Balance: ₹
                  {balance > 0 ? balance.toFixed(2) : "0.00"}
                </div>
              )}
            </div>
          )}

          {/* ORDER SOURCE */}
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
              onChange={(e) =>
                setExternalOrderId(e.target.value)
              }
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