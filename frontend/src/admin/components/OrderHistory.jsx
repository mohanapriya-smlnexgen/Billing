// src/components/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
  });

  const [summary, setSummary] = useState({
    total: 0,
    food: 0,
    cafe: 0,
    refund: 0,
    net: 0
  });

  const sendReport = async () => {
    try {
      await API.post('/send-report/');
      alert("✅ Report sent successfully");
    } catch (err) {
      alert("❌ Failed to send report");
      console.error(err);
    }
  };

  // FETCH
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders/');
      const data = res.data.orders || [];
      setOrders(data);
      applyFilters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters(orders);
  }, [filters]);

  // FILTER LOGIC
  const applyFilters = (data) => {
    let result = [...data];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(o =>
        o.order_id.toString().includes(s) ||
        o.customer_name?.toLowerCase().includes(s)
      );
    }

    if (filters.status)
      result = result.filter(o => o.status === filters.status);

    if (filters.paymentMode)
      result = result.filter(o => o.payment_mode === filters.paymentMode);

    if (filters.dateFrom)
      result = result.filter(o => new Date(o.created_at) >= new Date(filters.dateFrom));

    if (filters.dateTo)
      result = result.filter(o => new Date(o.created_at) <= new Date(filters.dateTo));

    setFilteredOrders(result);
    calculateSummary(result);
  };

  // ✅ SUMMARY FIXED
  const calculateSummary = (list) => {
    let total = 0, food = 0, cafe = 0, refund = 0;

    list.forEach(o => {
      if (o.status === 'paid') {

        const orderAmount =
          o.custom_price ?? o.final_amount ?? o.total_amount ?? 0;

        total += Number(orderAmount);
        refund += Number(o.refunded_amount || 0);

        // 🔥 BULK / CUSTOM ORDER
        if (o.custom_price) {
          const totalQty = o.items.reduce(
            (sum, i) => sum + Number(i.quantity || 0),
            0
          );

          o.items.forEach(i => {
            const share =
              totalQty > 0
                ? (Number(i.quantity || 0) / totalQty) * orderAmount
                : 0;

            if (i.category === 'cafe') {
              cafe += share;
            } else {
              food += share;
            }
          });
        }

        // ✅ NORMAL ORDER
        else {
          o.items.forEach(i => {
            const amt = Number(i.quantity) * Number(i.price);

            if (i.category === 'cafe') {
              cafe += amt;
            } else {
              food += amt;
            }
          });
        }
      }
    });

    setSummary({
      total,
      food,
      cafe,
      refund,
      net: total - refund
    });
  };

  const format = (n) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n);

  // CSV EXPORT
  const exportCSV = async () => {
    try {
      const res = await API.get('/orders/download-csv/', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.csv');
      document.body.appendChild(link);
      link.click();
    } catch {
      alert("Export failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-6">Order History</h2>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded">
          Export Excel
        </button>

        <button
          onClick={sendReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send Report
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid md:grid-cols-5 gap-3 mb-6 bg-white p-4 rounded shadow">

        <input
          placeholder="Search..."
          className="border p-2 rounded"
          onChange={e => setFilters({...filters, search: e.target.value})}
        />

        <select onChange={e => setFilters({...filters, status: e.target.value})} className="border p-2 rounded">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>

        <select onChange={e => setFilters({...filters, paymentMode: e.target.value})} className="border p-2 rounded">
          <option value="">Payment</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>

        <input type="date" onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="border p-2 rounded" />
        <input type="date" onChange={e => setFilters({...filters, dateTo: e.target.value})} className="border p-2 rounded" />

      </div>

      {/* SUMMARY */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <Card title="Total" value={summary.total} />
        <Card title="Food" value={summary.food} />
        <Card title="Cafe" value={summary.cafe} />
        <Card title="Refund" value={summary.refund} />
        <Card title="Net" value={summary.net} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3">Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.order_id} className="border-b">
                <td className="p-3">#{o.order_id}</td>
                <td>{o.customer_name || 'Walk-in'}</td>
                <td>
                  ₹{format(
                    o.custom_price ?? o.final_amount ?? o.total_amount ?? 0
                  )}
                </td>
                <td>{o.payment_mode}</td>
                <td>{o.status}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-white p-4 rounded shadow text-center">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-lg font-bold">₹{value.toFixed(2)}</div>
  </div>
);

export default OrderHistory;