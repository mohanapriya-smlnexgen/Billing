import React, { useEffect, useState, useMemo } from "react";
import API from "../../api";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [minCredit, setMinCredit] = useState("");
  const [maxCredit, setMaxCredit] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await API.get("customers/");
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search);

      const matchMin =
        minCredit === "" || Number(c.credits) >= Number(minCredit);

      const matchMax =
        maxCredit === "" || Number(c.credits) <= Number(maxCredit);

      return matchSearch && matchMin && matchMax;
    });
  }, [customers, search, minCredit, maxCredit]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Customer Management
        </h2>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search Name / Phone"
          className="border p-2 rounded-lg text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="number"
          placeholder="Min Credits"
          className="border p-2 rounded-lg text-sm"
          value={minCredit}
          onChange={(e) => setMinCredit(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Credits"
          className="border p-2 rounded-lg text-sm"
          value={maxCredit}
          onChange={(e) => setMaxCredit(e.target.value)}
        />

        <button
          onClick={() => {
            setSearch("");
            setMinCredit("");
            setMaxCredit("");
          }}
          className="bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold"
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No customers found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Phone</th>
                <th className="p-3 text-left text-sm font-semibold">
                  Credits
                </th>
                <th className="p-3 text-left text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-medium">{c.name || "Guest"}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3 font-bold text-indigo-600">
                    ₹{c.credits}
                  </td>
                  <td className="p-3">
                    {c.credits > 100 ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        High Value
                      </span>
                    ) : c.credits > 0 ? (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                        No Credit
                      </span>
                    )}
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