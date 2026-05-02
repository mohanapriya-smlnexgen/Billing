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
} from "lucide-react";
import CustomerModal from "./CustomerModal";

export const BillingRightPanel = (props) => {
  const {
    cart,
    updateQty,
    setCart,
    setSelectedBill,
    subtotal,
    showPendingModal,
    setShowPendingModal,
    savedBills,
    handleSelectBill,
    menuItems,
    tax,
    discount,
    advanceAmount,
    selectedBill,
    handleGenerateBill,
    setShowPaymentModal,
    printBill,
    printKOT,
    showCustomerDetails,
    setShowCustomerDetails,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    customerFound,
    customerCredits,
    setDiscount,
    credit,
    setCredit,
    customerCreditsValue,
    orderType,
    setOrderType,
    setScheduledTime,
    scheduledTime,
    bulkNote,
    setBulkNote,
    customPrice,
    setCustomPrice,
    setAdvanceAmount,
    source,
    setSource,
    externalOrderId,
    discountType,
    setDiscountType,
    taxEnabled,
    taxPercentage,
    setExternalOrderId,
    searchCustomer,
    paymentMode,
    setPaymentMode,
  } = props;

  const [showCustomerModal, setShowCustomerModal] = React.useState(false);
const discountAmount =
  discountType === "percentage"
    ? (subtotal * discount) / 100
    : discount;
const calculatedTax = taxEnabled
  ? (subtotal * taxPercentage) / 100
  : 0;

const finalTotal = subtotal + calculatedTax - discountAmount;

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

    {/* 🔄 Refresh Button */}
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
      title="Reset Cart & Bill"
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

    {/* Edit Button */}
    <button
      onClick={() => setShowCustomerModal(true)}
      className="text-indigo-600 text-sm font-semibold"
    >
      Edit
    </button>

  </div>
</div>

      {/* ================= CART ================= */}
      <div className="flex-1 overflow-y-auto p-4 ">

        {cart.length === 0 ? (
          <p className="text-gray-400 text-center">Cart Empty</p>
        ) : (
          
          cart.map((item, index) =>{
              let unitDisplay = "";
      if (item.variant_info && item.variant_info !== "default") {
        unitDisplay = item.variant_info.replaceAll('_', ' ');// e.g., "1.00_kg" → "1.00 kg"
      }
            return(
            
            <div
              key={`${item.food_id}-${item.variant_info}-${index}`}
              className="border p-3 mb-2 rounded"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">{item.name}</p>
                   {unitDisplay && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {unitDisplay}
                </p>
              )}
                  <p className="text-sm">
                    ₹{Number(item.price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQty(item.food_id, item.variant_info, "dec")
                    }
                  >
                    <Minus size={14} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQty(item.food_id, item.variant_info, "inc")
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        )
        
        )}
      </div>

      {/* ================= TOTAL ================= */}
    <div className="p-2 border-t space-y-1 ">
  
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span>₹{Number(subtotal || 0).toFixed(2)}</span>
  </div>
{tax > 0 && (
  <div className="flex justify-between">
    <span>Tax ({taxPercentage}%)</span>
    <span>₹{calculatedTax.toFixed(2)}</span>
  </div>
)}
  {discount > 0 && (
    <div className="flex justify-between text-green-600">
      <span>
        Discount (
        {discountType === "percentage"
          ? `${discount}%`
          : `₹${discount}`}
        )
      </span>
      <span>-₹{Number(discountAmount).toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between font-bold text-lg">
    <span>Total</span>
    <span>₹{Number(finalTotal || 0).toFixed(2)}</span>
  </div>

  {orderType !== "normal" && customPrice > 0 && (
    <span className="text-xs text-blue-500 ml-2">(Custom Price)</span>
  )}

  {advanceAmount > 0 && (
    <>
      <div className="flex justify-between text-sm text-blue-600">
        <span>Advance Paid</span>
        <span>₹{Number(advanceAmount).toFixed(2)}</span>
      </div>

      <div className="flex justify-between text-sm text-red-600">
        <span>Balance</span>
        <span>₹{Number(balanceToPay).toFixed(2)}</span>
      </div>
    </>
  )}

  <button
    onClick={
      !selectedBill
        ? handleGenerateBill
        : () => setShowPaymentModal(true)
    }
    className="w-full bg-indigo-600 text-white py-2 rounded"
  >
    {selectedBill ? "Proceed Payment" : "Generate Bill"}
  </button>

  {selectedBill?.status === "paid" && (
    <button
      onClick={() => printBill(selectedBill)}
      className="w-full bg-green-600 text-white py-2 rounded"
    >
      Print Invoice
    </button>
  )}

  <div className="flex gap-2">
    <button
      onClick={() => setShowPendingModal(true)}
      className="flex-1 bg-yellow-100 py-2 rounded"
    >
      Pending
    </button>

    <button
      onClick={printKOT}
      className="flex-1 bg-gray-200 py-2 rounded"
    >
      Print KOT
    </button>
  </div>

</div>   {/* ✅ CLOSE ONLY HERE */}
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