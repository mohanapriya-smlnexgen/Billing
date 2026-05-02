// src/pages/modules/orders/OrderHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import API from "../../api";
import { Search, Download, Package, TrendingUp, Calendar, Users, ShoppingBag } from "lucide-react";
import * as XLSX from "xlsx";
import { Send } from "lucide-react";
const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("all");
const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
useEffect(() => {
  applyFilters();
}, [search, statusFilter, typeFilter, dateFilter, paymentFilter, orders]);
  useEffect(() => {
    fetchOrders();
  }, []);

const getStatusBadge = (status) => {
    switch (status) {
      case "advance_paid":
        return "bg-yellow-100 text-yellow-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-gray-100 text-gray-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const sendReport = async () => {
  try {
    const res = await API.post("send-report/");
    alert(res.data.message || "Report sent!");
  } catch (err) {
    console.error(err);
    alert("Failed to send report");
  }
};
  const fetchOrders = async () => {
    try {
      const res = await API.get("cashier-orders/");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

      const relevantOrders = data.filter((o) => {
        return (
          o.is_advance === true ||
          o.is_bulk === true ||
          o.advance_paid > 0 ||
          (o.remaining_amount && o.remaining_amount > 0)
        );
      });

      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...orders];

    if (search) {
      const term = search.toLowerCase();
      data = data.filter((o) =>
        o.customer?.name?.toLowerCase().includes(term) ||
        o.customer?.phone?.includes(term) ||
        o.order_id.toString().includes(term)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter((o) => o.status === statusFilter);
    }

    if (typeFilter !== "all") {
      if (typeFilter === "preorder") {
        data = data.filter((o) => o.is_advance === true);
      } else if (typeFilter === "bulk") {
        data = data.filter((o) => o.is_bulk === true);
      }
    }

    if (dateFilter) {
      data = data.filter((o) => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at).toISOString().split("T")[0];
        return orderDate === dateFilter;
      });
    }
    // ✅ PAYMENT FILTER
if (paymentFilter !== "all") {
  data = data.filter(
    (o) => (o.payment_mode || "").toLowerCase() === paymentFilter
  );
}
    setFiltered(data);

  };

  const getNumericValue = (value) => {
    if (!value) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const statistics = useMemo(() => {
    const stats = {
      preorder: { count: 0, totalValue: 0 },
      bulk: { count: 0, totalValue: 0 },
      normal: { count: 0, totalValue: 0 }
    };

    filtered.forEach(order => {
      const total = getNumericValue(order.custom_price || order.final_amount || order.total_amount || 0);
      
      if (order.is_bulk) {
        stats.bulk.count++;
        stats.bulk.totalValue += total;
      } else if (order.is_advance) {
        stats.preorder.count++;
        stats.preorder.totalValue += total;
      } else {
        stats.normal.count++;
        stats.normal.totalValue += total;
      }
    });

    return stats;
  }, [filtered]);

  const exportToExcel = () => {
    const excelData = filtered.map((o) => ({
      OrderID: `#${o.order_id}`,
      OrderNo: `#${o.daily_order_number || o.order_id}`, 
      Type: o.is_bulk ? "Bulk Order" : o.is_advance ? "Pre Order" : "Normal",
      Customer: o.customer?.name || "Guest",
      Phone: o.customer?.phone || "-",
      Total: getNumericValue(o.custom_price || o.final_amount || o.total_amount || 0),
      Advance: getNumericValue(o.advance_paid || 0),
      Remaining: getNumericValue(o.remaining_amount ?? 
        (getNumericValue(o.custom_price || o.final_amount || o.total_amount) - getNumericValue(o.advance_paid))
      ),
      PaymentMode: o.payment_mode || "N/A",   // ✅ NEW
      ScheduledTime: o.scheduled_time ? new Date(o.scheduled_time).toLocaleString() : "-",
      Status: o.status,
      CreatedAt: new Date(o.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "Order_History.xlsx");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Order History
          </h1>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
<button
  onClick={sendReport}
  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium transition shadow-sm"
>
  <Send size={18} />
  Send Report
</button>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition shadow-sm"
        >
          <Download size={18} />
          Export to Excel
        </button>
</div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        {/* <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold">PRE ORDERS</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{statistics.preorder.count}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
              <TrendingUp size={28} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ₹{statistics.preorder.totalValue.toLocaleString('en-IN')}
          </p>
        </div> */}

        <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold">BULK ORDERS</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{statistics.bulk.count}</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl">
              <Package size={28} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ₹{statistics.bulk.totalValue.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">NORMAL ORDERS</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{statistics.normal.count}</p>
            </div>
            <div className="bg-gray-100 text-gray-600 p-4 rounded-2xl">
              <ShoppingBag size={28} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ₹{statistics.normal.totalValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-3xl shadow border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            className="border border-gray-300 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="preorder">Pre Orders</option>
            <option value="bulk">Bulk Orders</option>
          </select>

          <select
            className="border border-gray-300 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="advance_paid">Advance Paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            className="border border-gray-300 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
     <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b text-center">
          <th className="px-4 py-4 text-xs font-semibold text-gray-500">ID</th>
          <th className="px-4 py-4 text-xs font-semibold text-gray-500">ORDER NO</th>
          <th className="px-4 py-4 text-xs font-semibold text-gray-500">TYPE</th>
          <th className="px-4 py-4 text-xs font-semibold text-gray-500 relative">
  <div className="flex items-center justify-center gap-1 cursor-pointer"
       onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
    PAYMENT
    <span className="text-xs">▼</span>
  </div>

  {showPaymentDropdown && (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white shadow-lg border rounded-xl z-10 w-32 text-left">
      <div
        onClick={() => { setPaymentFilter("all"); setShowPaymentDropdown(false); }}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        All
      </div>
      <div
        onClick={() => { setPaymentFilter("cash"); setShowPaymentDropdown(false); }}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        Cash
      </div>
      <div
        onClick={() => { setPaymentFilter("card"); setShowPaymentDropdown(false); }}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        Card
      </div>
      <div
        onClick={() => { setPaymentFilter("upi"); setShowPaymentDropdown(false); }}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        UPI
      </div>
    </div>
  )}
</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">CUSTOMER</th>
          <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500">TOTAL</th>
          <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500">ADVANCE</th>
          <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500">REMAINING</th>
          <th className="px-4 py-4 text-xs font-semibold text-gray-500">STATUS</th>
          <th className=" py-4 text-xs font-semibold text-gray-500">DATE</th>
        </tr>
      </thead>

      <tbody className="divide-y text-center">
        {filtered.length === 0 ? (
          <tr>
            <td colSpan="10" className="py-16 text-gray-400">
              No orders found matching your filters
            </td>
          </tr>
        ) : (
          filtered.map((o, index) => {
            const total = getNumericValue(
              o.custom_price || o.final_amount || o.total_amount || 0
            );

            const remaining =
              o.remaining_amount !== null && o.remaining_amount !== undefined
                ? getNumericValue(o.remaining_amount)
                : total - getNumericValue(o.advance_paid || 0);

            return (
              <tr key={o.order_id} className="hover:bg-gray-50 transition">
                {/* S.No */}
                <td className="px-4 py-4 font-semibold text-gray-700">
                  {o.order_id}
                </td>

                {/* Order No */}
                <td className="px-4 py-4 font-mono font-semibold text-blue-600">
                  #{o.daily_order_number}
                </td>

                {/* Type */}
                <td className="px-4 py-4">
                  {o.is_bulk ? (
                    <span className="px-3 py-1 text-purple-700 text-xs font-bold">
                      BULK
                    </span>
                  ) : o.is_advance ? (
                    <span className="px-3 py-1 text-blue-700 text-xs font-bold">
                      PRE-ORDER
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-gray-600 text-xs font-bold">
                      NORMAL
                    </span>
                  )}
                </td>

                {/* Payment */}
                <td className="px-4 py-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">
                    {o.payment_mode || "N/A"}
                  </span>
                </td>

                {/* Customer */}
                <td className="px-6 py-4 text-left">
                  <div className="font-medium">
                    {o.customer?.name || "Guest"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.customer?.phone || ""}
                  </div>
                </td>

                {/* Total */}
                <td className="px-4 py-4 text-right font-semibold">
                  ₹{total.toLocaleString("en-IN")}
                </td>

                {/* Advance */}
                <td className="px-4 py-4 text-right text-amber-600 font-medium">
                  ₹{getNumericValue(o.advance_paid || 0).toLocaleString("en-IN")}
                </td>

                {/* Remaining */}
                <td className="px-4 py-4 text-right font-semibold">
                  <span
                    className={
                      remaining > 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    ₹{remaining.toLocaleString("en-IN")}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(
                      o.status
                    )}`}
                  >
                    {o.status}
                  </span>
                </td>

                {/* Date */}
                <td className=" py-4 text-sm text-gray-500">
                  {new Date(o.created_at).toLocaleDateString("en-IN")}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
    
  </div>

</div>
    </div>
  );
};

export default OrderHistory;