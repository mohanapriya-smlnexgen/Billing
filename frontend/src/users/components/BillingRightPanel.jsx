import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, ChevronDown, ChevronUp, Tag, CreditCard, 
  Minus, Plus, ShoppingCart, Printer, PauseCircle, CheckCircle,
  Phone, Calendar, FileText, Truck
} from "lucide-react";

export const BillingRightPanel = ({
  cart,
  updateQty,
  setCart,
  setSelectedBill,
  subtotal,
  taxPercentage,
  tax,
  discount,
  advanceAmount,
  finalTotal,
  selectedBill,
  showTaxEditor,
  setShowTaxEditor,
  taxPercentageValue,
  setTaxPercentage,
  handleSaveTaxPercentage,
  handleGenerateBill,
  setShowPaymentModal,
  printBill,
  setShowPendingModal,
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
  scheduledTime,
  setScheduledTime,
  bulkNote,
  setBulkNote,
  customPrice,
  setCustomPrice,
  setAdvanceAmount,
  source,
  setSource,
  externalOrderId,
  setExternalOrderId,
  searchCustomer
}) => {
  const balanceToPay = finalTotal - advanceAmount;
  
  return (
    <aside className="w-[460px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      {/* Customer Section - Collapsible */}
      <div className="border-b border-gray-100">
        <button 
          onClick={() => setShowCustomerDetails(!showCustomerDetails)}
          className="w-full flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User size={16} className="text-indigo-600" />
            </div>
            <span className="font-bold text-gray-700">Customer Details</span>
          </div>
          {showCustomerDetails ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
        </button>
        
        <AnimatePresence>
          {showCustomerDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white"
            >
              <div className="px-5 pb-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      placeholder="Phone Number" 
                      type="tel"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      value={customerPhone}
                      onChange={(e) => {
                        const phone = e.target.value;
                        setCustomerPhone(phone);
                        if (phone.length === 10) searchCustomer(phone);
                      }}
                    />
                  </div>
                  <input 
                    placeholder="Customer Name" 
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                
                {customerFound && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-50 border border-green-200 p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-700">✓ Verified Customer</span>
                      <span className="text-sm font-bold text-green-700">Credits: ₹{customerCredits}</span>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <Tag size={14} className="text-indigo-600" />
                    <input 
                      type="number"
                      placeholder="Discount ₹"
                      className="bg-transparent w-full text-sm outline-none"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <CreditCard size={14} className="text-indigo-600" />
                    <input 
                      type="number" 
                      placeholder="Use Credits" 
                      className="bg-transparent w-full text-sm outline-none" 
                      value={credit}
                      onChange={(e) => {
                        if(Number(e.target.value) > customerCreditsValue) return;
                        setCredit(Number(e.target.value));
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                    >
                      <option value="normal">🏪 Normal Order</option>
                      <option value="bulk">📦 Bulk Order</option>
                      <option value="preorder">📅 Pre Order</option>
                    </select>
                  </div>
                </div>
                
                {orderType !== "normal" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        type="datetime-local"
                        className="w-full pl-9 pr-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        placeholder="Bulk Note / Details"
                        className="w-full pl-9 pr-3 py-2 border border-blue-200 rounded-lg text-sm outline-none bg-white"
                        value={bulkNote}
                        onChange={(e) => setBulkNote(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Custom Price"
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none bg-white"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                      />
                      <input
                        type="number"
                        placeholder="Advance Amount"
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none bg-white"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <select 
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="offline">🏪 Offline</option>
                    <option value="zomato">🍽️ Zomato</option>
                    <option value="swiggy">🛵 Swiggy</option>
                  </select>
                  <input 
                    placeholder="External Order ID" 
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    value={externalOrderId} 
                    onChange={(e) => setExternalOrderId(e.target.value)} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Section - Scrollable area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-indigo-600" />
              <h2 className="font-bold text-gray-700">Current Order</h2>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => { setCart([]); setSelectedBill(null); }}
                className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-300 py-12">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm mt-3">Cart is empty</p>
              <p className="text-xs">Add items from the menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={item.food_id}
                className="bg-white p-3 rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button onClick={() => updateQty(item.food_id, "dec")} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors">
                        <Minus size={12}/>
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.food_id, "inc")} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors">
                        <Plus size={12}/>
                      </button>
                    </div>
                    <span className="text-base font-bold text-indigo-600 w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Totals Section - Fixed at bottom with proper spacing */}
      <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tax ({taxPercentage}%)</span>
                <button onClick={() => setShowTaxEditor(!showTaxEditor)} className="text-indigo-600 text-xs font-semibold hover:underline">
                  Edit
                </button>
              </div>
              <span className="font-semibold">₹{tax.toFixed(2)}</span>
            </div>
            
            {showTaxEditor && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <input 
                  type="number" 
                  className="border border-gray-200 rounded-lg px-3 py-1 text-sm w-24 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={taxPercentageValue} 
                  onChange={e => setTaxPercentage(Number(e.target.value))} 
                />
                <button onClick={handleSaveTaxPercentage} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">
                  Save
                </button>
              </motion.div>
            )}
            
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
            )}
            
            {advanceAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Advance Paid</span>
                <span>- ₹{advanceAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-black text-indigo-600">₹{finalTotal.toFixed(2)}</span>
              </div>
              {advanceAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 mt-2">
                  <span>Balance to Pay</span>
                  <span className="font-bold">₹{balanceToPay.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {(!selectedBill || selectedBill.status !== "paid") ? (
              <button 
                disabled={cart.length === 0}
                onClick={!selectedBill ? handleGenerateBill : () => setShowPaymentModal(true)}
                className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md ${
                  !selectedBill 
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white" 
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {!selectedBill ? "💰 Generate Bill" : "💳 Proceed to Payment"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-green-200">
                  <CheckCircle size={18} /> Order Paid
                </div>
                <button onClick={printBill} className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors">
                  <Printer size={18}/> Print Invoice
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pb-1">
              <button 
                onClick={() => setShowPendingModal(true)} 
                className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 rounded-xl font-semibold border-2 border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <PauseCircle size={18}/> Pending
              </button>
              <button 
                onClick={printKOT} 
                className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Printer size={18}/> Print KOT
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};