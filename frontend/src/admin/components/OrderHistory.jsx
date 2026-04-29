// src/pages/modules/orders/OrderHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import API from "../../api";
import { Search, Download, Package, TrendingUp, ShoppingBag } from "lucide-react";
import * as XLSX from "xlsx";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, statusFilter, typeFilter, dateFilter, orders]);

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

      setOrders(relevantOrders);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...orders];

    if (search) {
      data = data.filter((o) =>
        o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer?.phone?.includes(search)
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

    setFiltered(data);
  };

  // Helper function to safely get numeric value
  const getNumericValue = (value) => {
    if (!value) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      preorder: { count: 0, totalValue: 0 },
      bulk: { count: 0, totalValue: 0 },
      normal: { count: 0, totalValue: 0 }
    };

    filtered.forEach(order => {
      // Safely get the total amount as a number
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
      Type: o.is_bulk ? "Bulk Order" : o.is_advance ? "Pre Order" : "Normal",
      Customer: o.customer?.name || "Guest",
      Phone: o.customer?.phone || "-",
      Total: getNumericValue(o.custom_price || o.final_amount || o.total_amount || 0),
      Advance: getNumericValue(o.advance_paid || 0),
      Remaining: getNumericValue(
        o.remaining_amount !== null && o.remaining_amount !== undefined
          ? o.remaining_amount
          : (o.custom_price || o.final_amount || o.total_amount || 0) - (o.advance_paid || 0)
      ),
      ScheduledTime: o.scheduled_time
        ? new Date(o.scheduled_time).toLocaleString()
        : "-",
      Status: o.status,
      CreatedAt: new Date(o.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    XLSX.writeFile(workbook, "Order_History.xlsx");
  };

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
        return "bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          Order History
        </h2>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Pre Orders Stats */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pre Orders</p>
              <p className="text-3xl font-bold mt-1">{statistics.preorder.count}</p>
              <p className="text-blue-100 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                Total Value: ₹{statistics.preorder.totalValue.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* Bulk Orders Stats */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Bulk Orders</p>
              <p className="text-3xl font-bold mt-1">{statistics.bulk.count}</p>
              <p className="text-purple-100 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                Total Value: ₹{statistics.bulk.totalValue.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* Normal Orders Stats */}
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Normal Orders</p>
              <p className="text-3xl font-bold mt-1">{statistics.normal.count}</p>
              <p className="text-gray-100 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                Total Value: ₹{statistics.normal.totalValue.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 grid md:grid-cols-5 gap-3">
        <div className="flex items-center border rounded-lg px-3">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search name / phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 outline-none text-sm"
          />
        </div>

        <select
          className="border rounded-lg p-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="preorder">Pre Orders</option>
          <option value="bulk">Bulk Orders</option>
        </select>

        <select
          className="border rounded-lg p-2 text-sm"
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
          className="border rounded-lg p-2 text-sm"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <div className="text-xs text-gray-400 flex items-center">
          {filtered.length} orders found
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 text-left">Order ID</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-right">Total (₹)</th>
                <th className="p-4 text-right">Advance (₹)</th>
                <th className="p-4 text-right">Remaining (₹)</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const total = getNumericValue(o.custom_price || o.final_amount || o.total_amount || 0);
                  const remaining = o.remaining_amount !== null && o.remaining_amount !== undefined
                    ? getNumericValue(o.remaining_amount)
                    : total - getNumericValue(o.advance_paid || 0);

                  return (
                    <tr
                      key={o.order_id}
                      className="border-t hover:bg-gray-50 transition text-sm"
                    >
                      <td className="p-4 font-semibold text-indigo-600">
                        #{o.order_id}
                      </td>

                      <td className="p-4">
                        {o.is_bulk ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            BULK
                          </span>
                        ) : o.is_advance ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            PRE
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                            NORMAL
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-gray-800">
                          {o.customer?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {o.customer?.phone || ""}
                        </div>
                      </td>

                      <td className="p-4 text-right font-semibold">
                        ₹{total.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      <td className="p-4 text-right text-yellow-600 font-semibold">
                        ₹{getNumericValue(o.advance_paid || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      <td className="p-4 text-right font-semibold">
                        <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                          ₹{remaining.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(o.created_at).toLocaleString()}
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