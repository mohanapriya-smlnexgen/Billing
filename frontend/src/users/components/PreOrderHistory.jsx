// src/pages/modules/orders/PreOrderHistory.jsx

import React, { useEffect, useState } from "react";
import API from "../../api";
import { Search, Download } from "lucide-react";
import * as XLSX from "xlsx";

const PreOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, statusFilter, dateFilter, orders]);

  // ✅ FETCH ORDERS
  const fetchOrders = async () => {
    try {
      const res = await API.get("cashier-orders/");

      const data = Array.isArray(res.data)
  ? res.data
  : Array.isArray(res.data?.results)
  ? res.data.results
  : [];

      // ✅ Correct Pre-order Logic
      const advanceOrders = data.filter(
        (o) =>
          
          o.advance_paid > 0
         
      );

      setOrders(advanceOrders);
    } catch (err) {
      console.error("Failed to fetch preorder history", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ APPLY FILTERS
  const applyFilters = () => {
    let data = [...orders];

    // 🔍 Search
    if (search) {
      data = data.filter(
        (o) =>
          o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.customer?.phone?.includes(search)
      );
    }

    // 🎯 Status filter
    if (statusFilter !== "all") {
      data = data.filter((o) => o.status === statusFilter);
    }

    // 📅 Date filter
    if (dateFilter) {
      data = data.filter((o) => {
        const orderDate = new Date(o.created_at)
          .toISOString()
          .split("T")[0];
        return orderDate === dateFilter;
      });
    }

    setFiltered(data);
  };

  // ✅ EXPORT TO EXCEL
  const exportToExcel = () => {
    const excelData = filtered.map((o) => ({
      OrderID: o.id,
      Customer: o.customer?.name || "Guest",
      Phone: o.customer?.phone || "-",
      Total: o.total_amount,
      Advance: o.advance_paid,
      Remaining: o.remaining_amount,
      Status: o.status,
      ScheduledTime: o.scheduled_time
        ? new Date(o.scheduled_time).toLocaleString()
        : "-",
      CreatedAt: new Date(o.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PreOrders");

    XLSX.writeFile(workbook, "PreOrderHistory.xlsx");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "advance_paid":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Pre Order History
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* SEARCH */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search name / phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm"
            />
          </div>

          {/* STATUS FILTER */}
          <select
            className="border rounded-lg px-3 py-2 text-sm shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="advance_paid">Advance Paid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* DATE FILTER */}
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm shadow-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {/* EXPORT BUTTON */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b text-gray-600 text-sm">
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Advance</th>
              <th className="p-3 text-left">Remaining</th>
              <th className="p-3 text-left">Scheduled</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  No Pre Orders Found
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-b hover:bg-gray-50 text-sm"
                >
                 <td className="p-3 font-medium">#{o.order_id}</td>

                  <td className="p-3">
                    {o.customer?.name || "Guest"}
                  </td>

                  <td className="p-3">
                    {o.customer?.phone || "-"}
                  </td>

                  <td className="p-3 font-semibold">
                    ₹{o.custom_price || o.final_amount || o.total_amount}
                  </td>

                  <td className="p-3 text-yellow-600 font-semibold">
                    ₹{o.advance_paid}
                  </td>

                  <td
  className={`p-3 font-semibold ${
    (o.remaining_amount ?? 0) > 0
      ? "text-red-500"
      : "text-green-600"
  }`}
>
                    ₹{
  o.remaining_amount !== null && o.remaining_amount !== undefined
    ? o.remaining_amount
    : (o.custom_price || o.final_amount || o.total_amount) - (o.advance_paid || 0)
}
                  </td>

                  <td className="p-3">
                    {o.scheduled_time
                      ? new Date(o.scheduled_time).toLocaleString()
                      : "-"}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreOrderHistory;