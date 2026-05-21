import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Search,
  CreditCard,
  Wallet,
  IndianRupee,
  Pencil,
  X,
} from "lucide-react";
import API from "../../api";

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Credit Limit Modal
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [creditLimit, setCreditLimit] = useState("");

  // Fetch Customer Details
  const fetchDetails = async () => {
    try {
      setLoading(true);

      const res = await API.get(`customers/${id}/orders/`);

      setData(res.data);

      setCreditLimit(
        res.data?.customer?.credit_limit || 0
      );
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Save Credit Limit
  const handleSaveCreditLimit = async () => {
    try {
      await API.patch(
        `customers/${id}/set_credit_limit/`,
        {
          credit_limit: creditLimit,
        }
      );

      setData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          credit_limit: Number(creditLimit),
        },
      }));

      setShowLimitModal(false);
    } catch (err) {
      console.error("Failed to update credit limit:", err);
      alert("Failed to update credit limit");
    }
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];

    let result = [...data.orders];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      result = result.filter(
        (order) =>
          order.order_id.toString().includes(term) ||
          (order.customer?.name || "")
            .toLowerCase()
            .includes(term)
      );
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter(
        (order) => order.status === statusFilter
      );
    }

    // Type
    if (typeFilter !== "all") {
      if (typeFilter === "preorder") {
        result = result.filter(
          (order) => order.is_advance === true
        );
      } else if (typeFilter === "bulk") {
        result = result.filter(
          (order) => order.is_bulk === true
        );
      }
    }

    // Date
    if (dateFilter) {
      result = result.filter((order) => {
        if (!order.created_at) return false;

        const orderDate = new Date(order.created_at)
          .toISOString()
          .split("T")[0];

        return orderDate === dateFilter;
      });
    }

    return result;
  }, [
    data?.orders,
    searchTerm,
    statusFilter,
    typeFilter,
    dateFilter,
  ]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-gray-500">
            Loading customer details...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package
            size={60}
            className="mx-auto text-gray-300 mb-4"
          />

          <p className="text-xl font-medium text-gray-600">
            Customer not found
          </p>
        </div>
      </div>
    );
  }

  const totalOrders = data.orders.length;

  const totalSpent = data.orders.reduce(
    (sum, order) =>
      sum +
      Number(
        order.final_amount ||
          order.total_amount ||
          0
      ),
    0
  );

  const usedCredit = Number(
    data.customer.credits || 0
  );

  const creditLimitValue = Number(
    data.customer.credit_limit || 0
  );

  const availableCredit =
    creditLimitValue - usedCredit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600">
                {data.customer.name?.[0] || "G"}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {data.customer.name}
                </h1>

                <p className="text-gray-500">
                  {data.customer.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <button
            onClick={() => setShowLimitModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
          >
            <Pencil size={16} />
            Set Credit Limit
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Orders */}
          <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <Package className="text-indigo-600" />
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                ORDERS
              </span>
            </div>

            <p className="text-gray-500 text-sm">
              Total Orders
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {totalOrders}
            </h2>
          </div>

          {/* Spent */}
          <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <IndianRupee className="text-emerald-600" />

              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                SPENT
              </span>
            </div>

            <p className="text-gray-500 text-sm">
              Total Spent
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              ₹
              {totalSpent.toLocaleString("en-IN")}
            </h2>
          </div>

          {/* Used Credit */}
          <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <Wallet className="text-red-600" />

              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                USED
              </span>
            </div>

            <p className="text-gray-500 text-sm">
              Used Credit
            </p>

            <h2 className="text-3xl font-bold text-red-600 mt-1">
              ₹
              {usedCredit.toLocaleString("en-IN")}
            </h2>
          </div>

          {/* Credit Limit */}
          <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <CreditCard className="text-blue-600" />

              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                LIMIT
              </span>
            </div>

            <p className="text-gray-500 text-sm">
              Available Credit
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-1">
              ₹
              {availableCredit.toLocaleString("en-IN")}
            </h2>

            <p className="text-xs text-gray-400 mt-2">
              Limit: ₹
              {creditLimitValue.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-12 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            {/* Type */}
            <select
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="all">
                All Types
              </option>

              <option value="preorder">
                Pre Orders
              </option>

              <option value="bulk">
                Bulk Orders
              </option>
            </select>

            {/* Status */}
            <select
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="advance_paid">
                Advance Paid
              </option>

              <option value="paid">
                Paid
              </option>
            </select>

            {/* Date */}
            <input
              type="date"
              className="border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">
                    ORDER ID
                  </th>

                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">
                    DATE
                  </th>

                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-500">
                    TYPE
                  </th>

                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">
                    TOTAL
                  </th>

                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">
                    ADVANCE
                  </th>

                  <th className="px-8 py-5 text-right text-xs font-semibold text-gray-500">
                    BALANCE
                  </th>

                  <th className="px-8 py-5 text-center text-xs font-semibold text-gray-500">
                    STATUS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-20 text-gray-400"
                    >
                      No orders match your filters
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const total = Number(
                      order.final_amount ||
                        order.total_amount ||
                        0
                    );

                    const advance = Number(
                      order.advance_paid || 0
                    );

                    const balance =
                      total - advance;

                    return (
                      <tr
                        key={order.order_id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-8 py-5 font-mono font-semibold text-blue-600">
                          #{order.order_id}
                        </td>

                        <td className="px-8 py-5 text-gray-600">
                          {new Date(
                            order.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        <td className="px-8 py-5">
                          {order.is_bulk ? (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                              BULK
                            </span>
                          ) : order.is_advance ? (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                              PRE-ORDER
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                              NORMAL
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-5 text-right font-semibold">
                          ₹{total}
                        </td>

                        <td className="px-8 py-5 text-right text-amber-600 font-medium">
                          ₹{advance}
                        </td>

                        <td className="px-8 py-5 text-right font-semibold">
                          <span
                            className={
                              balance > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            ₹{balance}
                          </span>
                        </td>

                        <td className="px-8 py-5 text-center">
                          <span
                            className={`px-4 py-1 text-xs font-bold rounded-full ${
                              order.status ===
                              "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
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

      {/* Credit Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Set Credit Limit
              </h2>

              <button
                onClick={() =>
                  setShowLimitModal(false)
                }
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Credit Limit
                </label>

                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) =>
                    setCreditLimit(e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-2xl px-4 py-4 focus:outline-none focus:border-indigo-500"
                  placeholder="Enter limit amount"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">
                    Current Used
                  </span>

                  <span className="font-semibold text-red-600">
                    ₹{usedCredit}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Available After Update
                  </span>

                  <span className="font-semibold text-green-600">
                    ₹
                    {(
                      Number(creditLimit || 0) -
                      usedCredit
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveCreditLimit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold transition"
              >
                Save Credit Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailsPage;