import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { User, ShoppingBag, ArrowRight } from "lucide-react";
import API from "../../api";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [minCredit, setMinCredit] = useState("");
  const [maxCredit, setMaxCredit] = useState("");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Assuming your backend returns order_count in the customer list
      const res = await API.get("customers/");
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic to identify the customer with the most orders
  const topCustomerThreshold = useMemo(() => {
    if (customers.length === 0) return 0;
    return Math.max(...customers.map(c => c.order_count || 0));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search);
      const matchMin = minCredit === "" || Number(c.credits) >= Number(minCredit);
      const matchMax = maxCredit === "" || Number(c.credits) <= Number(maxCredit);
      return matchSearch && matchMin && matchMax;
    });
  }, [customers, search, minCredit, maxCredit]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-indigo-600" /> Customer Management
        </h2>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search Name / Phone"
          className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Credits"
          className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={minCredit}
          onChange={(e) => setMinCredit(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Credits"
          className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={maxCredit}
          onChange={(e) => setMaxCredit(e.target.value)}
        />
        <button
          onClick={() => { setSearch(""); setMinCredit(""); setMaxCredit(""); }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold transition"
        >
          Reset Filters
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Total Orders</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Credits</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="border-b last:border-0 hover:bg-indigo-50/30 cursor-pointer transition group"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{c.name || "Guest"}</div>
                    {c.order_count === topCustomerThreshold && c.order_count > 0 && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase">
                        🔥 Top Buyer
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{c.phone}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <ShoppingBag size={14} /> {c.order_count || 0}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-indigo-600">₹{c.credits}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      c.credits > 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.credits > 100 ? "Premium" : "Standard"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <ArrowRight size={18} className="inline text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;