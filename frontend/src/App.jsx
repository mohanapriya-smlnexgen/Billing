// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./admin/pages/Login";
import Signup from "./admin/pages/Signup";
import Dashboard from "./admin/components/Dashboard";
import MenuPage from "./users/components/MenuPage";
import OrderSuccess from "./users/components/OrderSuccess";
import PaymentPage from "./users/components/PaymentPage";

import EditFoodForm from "./admin/components/EditFoodForm";
import AddFoodForm from "./admin/components/AddFoodForm";
import FoodList from "./admin/components/FoodList";
import CashierPortal from "./cashier/components/CashierPortal";
import CashierWait from "./cashier/pages/CashierWait";
import PendingOrdersPage from "./cashier/components/PendingOrdersPage";
import CompletedOrdersPage from "./cashier/components/CompletedOrdersPage";
import WaiterOrderHistory from "./users/components/WaiterOrderHistory";
import Stocks from "./cashier/pages/Stocks";
import TableManage from "./cashier/components/TableManage";
import BillingPage from "./users/components/BillingPage";


// ======================================================
// AUTH HELPER
// ======================================================

const isAuthenticated = () => !!localStorage.getItem("access_token");


// ======================================================
// SIMPLE PROTECTED ROUTE (NO ROLE)
// ======================================================

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};


// ======================================================
// APP ROUTES
// ======================================================

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ================= PROTECTED ROUTES ================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/food-menu"
        element={
          <ProtectedRoute>
            <FoodList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-food"
        element={
          <ProtectedRoute>
            <AddFoodForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-food/:id"
        element={
          <ProtectedRoute>
            <EditFoodForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier"
        element={
          <ProtectedRoute>
            <CashierPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier-wait"
        element={
          <ProtectedRoute>
            <CashierWait />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/pending-orders"
        element={
          <ProtectedRoute>
            <PendingOrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/completed-orders"
        element={
          <ProtectedRoute>
            <CompletedOrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stocks"
        element={
          <ProtectedRoute>
            <Stocks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/tablemanage"
        element={
          <ProtectedRoute>
            <TableManage />
          </ProtectedRoute>
        }
      />

      {/* ================= USER FLOW ================= */}

      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/waiter/history"
        element={
          <ProtectedRoute>
            <WaiterOrderHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/success"
        element={
          <ProtectedRoute>
            <OrderSuccess />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;