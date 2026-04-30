import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Package, Search, Filter } from "lucide-react";
import API from "../../api";

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await API.get(`customers/${id}/orders/`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch customer details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];

    let result = [...data.orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.order_id.toString().includes(term) ||
        (order.customer?.name || "").toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "preorder") {
        result = result.filter(order => order.is_advance === true);
      } else if (typeFilter === "bulk") {
        result = result.filter(order => order.is_bulk === true);
      }
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at).toISOString().split("T")[0];
        return orderDate === dateFilter;
      });
    }

    return result;
  }, [data?.orders, searchTerm, statusFilter, typeFilter, dateFilter]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package size={60} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-600">Customer not found</p>
        </div>
      </div>
    );
  }

  const totalOrders = data.orders.length;
  const totalSpent = data.orders.reduce((sum, order) => 
    sum + Number(order.final_amount || order.total_amount || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600">
                {data.customer.name?.[0] || "G"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.customer.name}</h1>
                <p className="text-gray-500">{data.customer.phone}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-indigo-600">{totalOrders}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-emerald-600">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-12 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="preorder">Pre Orders</option>
              <option value="bulk">Bulk Orders</option>
            </select>

            <select
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="advance_paid">Advance Paid</option>
              <option value="paid">Paid</option>
            </select>

            <input
              type="date"
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">ORDER ID</th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">DATE</th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">TYPE</th>
                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">TOTAL</th>
                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">ADVANCE</th>
                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">BALANCE</th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-gray-500">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-20 text-gray-400">
                      No orders match your filters
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const total = Number(order.final_amount || order.total_amount || 0);
                    const advance = Number(order.advance_paid || 0);
                    const balance = total - advance;

                    return (
                      <tr key={order.order_id} className="hover:bg-gray-50 transition">
                        <td className="px-8 py-5 font-mono font-semibold text-blue-600">
                          #{order.order_id}
                        </td>
                        <td className="px-8 py-5 text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-8 py-5">
                          {order.is_bulk ? (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">BULK</span>
                          ) : order.is_advance ? (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">PRE-ORDER</span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">NORMAL</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right font-semibold">₹{total}</td>
                        <td className="px-8 py-5 text-right text-amber-600 font-medium">₹{advance}</td>
                        <td className="px-8 py-5 text-right font-semibold">
                          <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                            ₹{balance}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-4 py-1 text-xs font-bold rounded-full ${
                            order.status === "paid" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
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
    </div>
  );
};

export default CustomerDetailsPage;