import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Package, CreditCard } from "lucide-react";
import API from "../../api";

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await API.get(`customers/${id}/orders/`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (!data) return <div className="p-10 text-center">Customer not found.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 font-bold text-sm"
      >
        <ArrowLeft size={16} /> BACK TO CUSTOMERS
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-black mb-4">
            {data.customer.name?.[0] || "G"}
          </div>
          <h2 className="text-xl font-black text-gray-800">{data.customer.name}</h2>
          <p className="text-gray-500 text-sm mb-4">{data.customer.phone}</p>
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Outstanding Credit</span>
              <span className="font-bold text-rose-600">₹{data.customer.credits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Total Orders</span>
              <span className="font-bold text-indigo-600">{data.orders.length}</span>
            </div>
          </div>
        </div>

        {/* Right: Order History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Package size={18} /> Order History
          </h3>
          
          {data.orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Order #{order.order_id}</span>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                    <Calendar size={12} /> {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-800">₹{order.final_amount}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Item list in the order */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                    <span className="font-semibold text-gray-800">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {data.orders.length === 0 && (
            <div className="bg-white p-10 rounded-2xl text-center text-gray-400 border-2 border-dashed">
              No orders found for this customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;