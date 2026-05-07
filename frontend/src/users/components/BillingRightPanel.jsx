import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  User,
  ChevronDown,
  ChevronUp,
  Tag,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Printer,
  PauseCircle,
  CheckCircle,
  Phone,
  Calendar,
  FileText,
  Truck,
    X,
  } from "lucide-react";
import CustomerModal from "./CustomerModal";


export const BillingRightPanel = (props) => {
  const {
    cart,
    updateQty,
    setCart,
    setSelectedBill,
    subtotal,
    handleGenerateBill,
    setShowPaymentModal,
    printBill,
    printKOT,
    menuItems,
    setShowPendingModal,
    isGenerating,
    isPaying,
    showCustomerDetails,
    setShowCustomerDetails,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
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
    discountType,
    setDiscountType,
    taxEnabled,
    taxPercentage,
    searchCustomer,
    paymentMode,
    setPaymentMode,
    selectedBill,
  } = props;

  const [showCustomerModal, setShowCustomerModal] = React.useState(false);

  const baseAmount =
    orderType === "bulk" && customPrice > 0 ? customPrice : subtotal;

  const discountAmount =
    discountType === "percentage"
      ? (baseAmount * discount) / 100
      : discount;

  const subtotalAfterDiscount = baseAmount - discountAmount;

  const calculatedTax =
    taxEnabled ? (subtotalAfterDiscount * taxPercentage) / 100 : 0;

  const finalTotal = subtotalAfterDiscount + calculatedTax;

  const balanceToPay = Math.max(
    0,
    Number(finalTotal || 0) - Number(advanceAmount || 0)
  );

  return (
    <aside className="w-[390px] bg-white rounded-xl border flex flex-col overflow-hidden">
      {/* ================= CUSTOMER ================= */}
      <div className="border-b p-4 bg-gray-50 flex justify-between items-center">
        <div>
          <p className="font-semibold">{customerName || "Walk-in Customer"}</p>
          {customerPhone && (
            <p className="text-xs text-gray-500">{customerPhone}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCart([]);
              setSelectedBill(null);
              setCustomerName("");
              setCustomerPhone("");
              setDiscount(0);
              setCredit(0);
              setAdvanceAmount(0);
              setOrderType("normal");
              setCustomPrice(0);
              setScheduledTime("");
              setBulkNote("");
            }}
            className="p-2 hover:bg-gray-200 rounded-full transition"
            title="Reset Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582M20 20v-5h-.581M5.07 19A9 9 0 105 5.07"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowCustomerModal(true)}
            className="text-indigo-600 text-sm font-semibold hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* ================= CART ITEMS ================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-gray-400 text-center py-10">
            Cart Empty
          </div>
        ) : (
          cart.map((item, index) => {
  let unitDisplay = "";
  if (item.variant_info && item.variant_info !== "default") {
    unitDisplay = item.variant_info.replaceAll("_", " ");
  }

  return (
    <div
      key={`${item.food_id}-${item.variant_info}-${index}`}
      className="border p-3 mb-2 rounded"
    >
      <div className="flex justify-between">
        <div>
          <p className="font-bold">{item.name}</p>

          {/* {unitDisplay && (
            <p className="text-xs text-gray-500 mt-0.5">
              {unitDisplay}
            </p>
          )} */}

          {/* ✅ price per item
          <p className="text-sm">
            ₹{Number(item.price || 0).toFixed(2)}
          </p> */}

          {/* ✅ total price (NEW FEATURE KEPT) */}
          <p className="text-sm text-indigo-600 font-semibold">
            ₹{(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        {/* ✅ OLD SIMPLE CONTROLS */}
        <div className="flex items-center gap-2">
  <button
    onClick={() =>
      updateQty(item.food_id, item.variant_info, "dec")
    }
    className="p-1 rounded hover:bg-gray-100"
  >
    <Minus size={14} />
  </button>

  <span>{item.quantity}</span>

  <button
    onClick={() =>
      updateQty(item.food_id, item.variant_info, "inc")
    }
    className="p-1 rounded hover:bg-gray-100"
  >
    <Plus size={14} />
  </button>

  {/* ✅ REMOVE ITEM BUTTON */}
  <button
    onClick={() => {
      setCart((prev) =>
        prev.filter(
          (_, i) =>
            !(
              i === index &&
              item.food_id === prev[i].food_id &&
              item.variant_info === prev[i].variant_info
            )
        )
      );
    }}
    className="p-1 rounded hover:bg-red-100 text-red-500"
  >
    <X size={14} />
  </button>
</div>
      </div>
    </div>
  );
})
        )}
      </div>

      {/* ================= TOTALS & BUTTONS ================= */}
      <div className="p-4 border-t space-y-2 bg-gray-50">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{Number(subtotal || 0).toFixed(2)}</span>
        </div>

        {calculatedTax > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tax ({taxPercentage}%)</span>
            <span>₹{calculatedTax.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-green-600 text-sm">
            <span>
              Discount{" "}
              {discountType === "percentage"
                ? `(${discount}%)`
                : `(₹${discount})`}
            </span>
            <span>-₹{Number(discountAmount).toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>₹{Number(finalTotal || 0).toFixed(2)}</span>
        </div>

        {advanceAmount > 0 && (
          <>
            <div className="flex justify-between text-blue-600 text-sm">
              <span>Advance Paid</span>
              <span>₹{Number(advanceAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-medium">
              <span>Balance to Pay</span>
              <span>₹{balanceToPay.toFixed(2)}</span>
            </div>
          </>
        )}

        <button
  onClick={
    !selectedBill
      ? handleGenerateBill
      : () => setShowPaymentModal(true)
  }
  disabled={isGenerating || isPaying}
  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mt-3 disabled:bg-gray-300 flex items-center justify-center gap-2"
>
  {(isGenerating || isPaying) && (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
  )}

  {selectedBill
    ? isPaying
      ? "Processing..."
      : "Proceed Payment"
    : isGenerating
    ? "Generating..."
    : "Generate Bill"}
</button>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPendingModal(true)}
            className="flex-1 bg-yellow-100 hover:bg-yellow-200 py-2.5 rounded-xl text-sm font-medium"
          >
            Pending
          </button>

          <button
            onClick={printKOT}
            className="flex-1 bg-gray-200 hover:bg-gray-300 py-2.5 rounded-xl text-sm font-medium"
          >
            Print KOT
          </button>
        </div>
      </div>  {/* ✅ CLOSE ONLY HERE */}
      {showCustomerModal && (
        <CustomerModal
          open={showCustomerModal}
          
          onClose={() => setShowCustomerModal(false)}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          menuItems={menuItems} 
          discountType={discountType}
          setDiscountType={setDiscountType}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerFound={customerFound}
          customerCredits={customerCredits}
          discount={discount}
          setDiscount={setDiscount}
          credit={credit}
          setCredit={setCredit}
          orderType={orderType}
          setCart={setCart}
          cart={cart}
          setOrderType={setOrderType}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
          bulkNote={bulkNote}
          setBulkNote={setBulkNote}
          customPrice={customPrice}
          setCustomPrice={setCustomPrice}
          advanceAmount={advanceAmount}
          setAdvanceAmount={setAdvanceAmount}
          source={source}
          setSource={setSource}
          externalOrderId={externalOrderId}
          setExternalOrderId={setExternalOrderId}
          searchCustomer={searchCustomer}
        />
      )}
    </aside>
  );
};