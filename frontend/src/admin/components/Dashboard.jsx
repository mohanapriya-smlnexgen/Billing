// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import AddFoodForm from "./AddFoodForm";
import FoodList from "./FoodList";
import EditFoodForm from "./EditFoodForm";
import TableList from "./TableList";
import TimingManager from "../pages/Timingmanage";
import OrderHistory from './OrderHistory';
import CustomersPage from '../../users/components/CustomersPage';
import PreOrderHistory from "../../users/components/PreOrderHistory"

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

  const fetchOrders = async () => {
  try {
    const res = await API.get("/orders/");
    const data = res.data.orders || [];
    setKots(data); // reuse same state
  } catch (err) {
    console.error("Failed to fetch orders:", err);
  } finally {
    setLoading(false);
  }
};

    fetchOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleEditFood = (foodId) => {
    setEditingFoodId(foodId);
    setActiveSection("edit-food");
  };

  const handleBackToFoodList = () => {
    setEditingFoodId(null);
    setActiveSection("food-menu");
  };

  const handleBackToDashboard = () => {
    setActiveSection("dashboard");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Close sidebar on mobile when a section is selected
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar when clicking on overlay
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome kots={kots} user={user} />;
      case "food-menu":
        return <FoodList onEditFood={handleEditFood} />;
      case "add-food":
        return <AddFoodForm onBack={handleBackToFoodList} />;
      case "tables":
        return <TableList />;
      case "timing-manager":
        return <TimingManager />;
      case "order-history":
        return <OrderHistory />;
      case "customers":
        return <CustomersPage />;
      case "preorders":
         return <PreOrderHistory />;
      case "edit-food":
        return <EditFoodForm foodId={editingFoodId} onBack={handleBackToFoodList} />;
      default:
        return <DashboardHome kots={kots} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar - Fixed height on desktop */}
      <div className={`
        fixed lg:fixed inset-y-0 left-0 z-30
        w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-l font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-800">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
            <button
              onClick={() => handleSectionChange("dashboard")}
              className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${activeSection === "dashboard"
                ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
       
            <button
              onClick={() => handleSectionChange("food-menu")}
              className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${activeSection === "food-menu"
                ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Food Menu
            </button>

            {/* <button
              onClick={() => handleSectionChange("tables")}
              className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${activeSection === "tables"
                ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Table Management
            </button> */}

            <button
              onClick={() => handleSectionChange("timing-manager")}
              className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${activeSection === "timing-manager"
                ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timing & Stock Manager
            </button>
            <button
              onClick={() => handleSectionChange("order-history")}
              className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${activeSection === "order-history"
                ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 110-4H5a2 2 0 110 4h14z" />
              </svg>
              Order History
            </button>
            <button
  onClick={() => handleSectionChange("customers")}
  className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${
    activeSection === "customers"
      ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
      : "text-gray-700 hover:bg-gray-50"
  }`}
>
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2
      M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0" />
  </svg>
  Customers
</button>
<button
  onClick={() => handleSectionChange("preorders")}
  className={`w-full flex items-center px-4 py-3 text-left font-medium rounded-lg transition ${
    activeSection === "preorders"
      ? "text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600"
      : "text-gray-700 hover:bg-gray-50"
  }`}
>
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14" />
  </svg>
  Pre Orders
</button>
      

          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 flex">
            <button
              onClick={()=> handleLogout()}
              className="w-full flex items-center justify-center px-4 py-3 text-left font-medium rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
  <button  onClick={()=> navigate(-1)

  }
              className="w-full flex items-center justify-center px-4 py-3 text-left font-medium rounded-lg text-blue-700 hover:bg-red-50 transition"
            >
              Back</button>

          </div>
        </div>
      </div>

      {/* Main Content - Scrollable on desktop */}
      <div className="flex-1 min-w-0 lg:ml-64 lg:overflow-y-auto lg:h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">KOT System</span>
            </div>

            <div className="w-6"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ kots, user }) => {

  // 🔹 Calculate Top Selling Items
  const topItems = {};
  kots.forEach(order => {
    order.items?.forEach(item => {
      const name = item.name || "Item";
      topItems[name] = (topItems[name] || 0) + (item.quantity || 1);
    });
  });

  const sortedTopItems = Object.entries(topItems)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 🔹 Discount State
  const [discount, setDiscount] = React.useState({
    type: "percentage",
    value: 0
  });
const [saving, setSaving] = React.useState(false);

const handleSaveDiscount = async () => {
  setSaving(true);

  try {
    await API.post("/cashier-orders/set_discount/", {
  type: discount.type,
  value: discount.value
});
  alert("Discount saved successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Welcome, {user?.username}!
          </h2>
        </div>
        
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        
        {/* Active */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <p className="text-sm text-gray-600">Active Orders</p>
          <p className="text-2xl font-bold text-indigo-600">
            {kots.filter(o => o.status === 'pending').length}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {kots.filter(o => o.status === 'paid').length}
          </p>
        </div>

        {/* Orders Count */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-purple-600">
            {kots.length}
          </p>
        </div>
      </div>

      {/* 🔥 New Section: Top Selling + Discount */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* 🔹 Top Selling Items */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔥 Top Selling Items
          </h3>

          {sortedTopItems.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <ul className="space-y-3">
              {sortedTopItems.map(([name, qty], index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg"
                >
                  <span className="font-medium text-gray-700">{name}</span>
                  <span className="text-indigo-600 font-semibold">
                    {qty} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🔹 Discount Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💸 Discount Settings
          </h3>

          <div className="space-y-4">
            
            {/* Type */}
            <div>
              <label className="text-sm text-gray-600">Discount Type</label>
              <select
                value={discount.type}
                onChange={(e) =>
                  setDiscount({ ...discount, type: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="text-sm text-gray-600">Value</label>
              <input
                type="number"
                value={discount.value}
                onChange={(e) =>
                  setDiscount({ ...discount, value: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter discount"
              />
            </div>

            {/* Preview */}
            <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700">
              {discount.type === "percentage"
                ? `Applying ${discount.value || 0}% discount`
                : `Applying ₹${discount.value || 0} discount`}
            </div>

            {/* Save Button */}
           <button
  onClick={handleSaveDiscount}
  disabled={saving}
  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
>
  {saving ? "Saving..." : "Save Discount"}
</button>
          </div>
        </div>
      </div>

      {/* Recent Orders (Updated - removed table column) */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Orders
        </h3>

        {kots.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No orders found</p>
        ) : (
          <div className="space-y-3">
            {kots.slice(0, 10).map((kot) => (
              <div
                key={kot.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {kot.items?.length || 0} items
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(kot.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₹{kot.custom_price ?? kot.final_amount ?? kot.total_amount ?? 0}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    kot.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {kot.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;