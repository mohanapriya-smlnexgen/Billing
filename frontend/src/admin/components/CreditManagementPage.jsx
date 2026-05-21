import React, { useEffect, useState } from "react";
import API from "../../api";

const CreditManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [payAmount, setPayAmount] = useState("");

  const [paymentMode, setPaymentMode] =
    useState("cash");

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await API.get("/cashier-orders/");

      // ✅ ALL CREDIT ORDERS
      const creditOrders = res.data.filter(
        (order) => order.payment_mode === "credit"
      );

      // ✅ GROUP CUSTOMER WISE
      const grouped = {};

      creditOrders.forEach((order) => {
        const phone =
          order.customer?.phone ||
          order.customer_phone ||
          "unknown";

        const customerName =
          order.customer?.name ||
          order.customer_name ||
          "Walk-in";

        if (!grouped[phone]) {
          grouped[phone] = {
            customer_name: customerName,
            phone: phone,
            total_credit: 0,
            total_orders: 0,
            order_ids: [],
            orders: [],
          };
        }

        // ✅ CREDIT AMOUNT
        const amount = Number(
          order.remaining_amount > 0
            ? order.remaining_amount
            : order.final_amount || 0
        );

        grouped[phone].total_credit += amount;

        grouped[phone].total_orders += 1;

        // ✅ ORDER IDS
        grouped[phone].order_ids.push(
          order.order_id
        );

        // ✅ IMPORTANT FIX
        grouped[phone].orders.push({
          ...order,
          id: order.order_id,
        });
      });

      setCustomers(Object.values(grouped));

    } catch (err) {
      console.error(
        "Failed to fetch credit details",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPEN PAYMENT MODAL
  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPayAmount("");
    setPaymentMode("cash");
  };

  // ✅ COLLECT PAYMENT
  const handleCreditPayment = async () => {
    try {
      if (!payAmount || Number(payAmount) <= 0) {
        alert("Enter valid amount");
        return;
      }

      let remainingPayment = Number(payAmount);

      // oldest first
      const sortedOrders = [
        ...selectedCustomer.orders,
      ].sort((a, b) => a.id - b.id);

      for (const order of sortedOrders) {
        if (remainingPayment <= 0) break;

        const due = Number(
          order.remaining_amount > 0
            ? order.remaining_amount
            : order.final_amount
        );

        if (due <= 0) continue;

        const paying = Math.min(
          due,
          remainingPayment
        );

        console.log(
          "PAYING ORDER:",
          order.id,
          paying
        );

        await API.post(
          `/cashier-orders/${order.order_id}/mark_paid/`,
          {
            received_amount: paying,
            payment_mode: paymentMode,
          }
        );

        remainingPayment -= paying;
      }

      alert("Payment collected successfully");

      setSelectedCustomer(null);

      fetchCredits();

    } catch (err) {
      console.error(err);

      alert("Payment failed");
    }
  };

  // ✅ OVERALL TOTALS
  const overallCredit = customers.reduce(
    (sum, customer) =>
      sum + customer.total_credit,
    0
  );

  const overallOrders = customers.reduce(
    (sum, customer) =>
      sum + customer.total_orders,
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Credit Management
        </h1>

        <p className="text-gray-500">
          Customer-wise credit summary
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-gray-500 text-sm">
            Total Customers
          </p>

          <h2 className="text-3xl font-bold text-indigo-600">
            {customers.length}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-gray-500 text-sm">
            Total Credit Orders
          </p>

          <h2 className="text-3xl font-bold text-orange-500">
            {overallOrders}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-gray-500 text-sm">
            Total Credit Amount
          </p>

          <h2 className="text-3xl font-bold text-red-500">
            ₹{overallCredit.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">
                Customer
              </th>

              <th className="px-4 py-3 text-left">
                Phone
              </th>

              <th className="px-4 py-3 text-left">
                Orders
              </th>

              <th className="px-4 py-3 text-left">
                Order IDs
              </th>

              <th className="px-4 py-3 text-left">
                Pending Amount
              </th>

              <th className="px-4 py-3 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {customers.map(
              (customer, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-gray-50"
                >
                  {/* CUSTOMER */}
                  <td className="px-4 py-3 font-semibold">
                    {
                      customer.customer_name
                    }
                  </td>

                  {/* PHONE */}
                  <td className="px-4 py-3">
                    {customer.phone}
                  </td>

                  {/* ORDERS */}
                  <td className="px-4 py-3">
                    {
                      customer.total_orders
                    }
                  </td>

                  {/* ORDER IDS */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {customer.order_ids.map(
                        (id, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                          >
                            #{id}
                          </span>
                        )
                      )}
                    </div>
                  </td>

                  {/* CREDIT */}
                  <td className="px-4 py-3 text-red-500 font-bold">
                    ₹
                    {customer.total_credit.toFixed(
                      2
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        openPaymentModal(
                          customer
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Collect Payment
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {/* EMPTY */}
        {customers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No credit records found
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Collect Credit Payment
            </h2>

            <div className="space-y-4">
              {/* CUSTOMER */}
              <div>
                <p className="text-sm text-gray-500">
                  Customer
                </p>

                <p className="font-semibold">
                  {
                    selectedCustomer.customer_name
                  }
                </p>
              </div>

              {/* ORDER IDS */}
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Order IDs
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.order_ids.map(
                    (id, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                      >
                        #{id}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* PENDING */}
              <div>
                <p className="text-sm text-gray-500">
                  Pending Amount
                </p>

                <p className="font-bold text-red-500 text-lg">
                  ₹
                  {selectedCustomer.total_credit.toFixed(
                    2
                  )}
                </p>
              </div>

              {/* PAYMENT */}
              <div>
                <label className="block text-sm mb-1">
                  Payment Amount
                </label>

                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter amount"
                />
              </div>

              {/* MODE */}
              <div>
                <label className="block text-sm mb-1">
                  Payment Mode
                </label>

                <select
                  value={paymentMode}
                  onChange={(e) =>
                    setPaymentMode(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="card">
                    Card
                  </option>
                </select>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() =>
                    setSelectedCustomer(null)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleCreditPayment
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Collect Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;