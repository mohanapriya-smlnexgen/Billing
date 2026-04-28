// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import { Eye, EyeOff } from "lucide-react";   // ← Add this import

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);   // ← New state

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("login/", {
        identifier: form.identifier.trim(),
        password: form.password,
      });

      const { user, access, refresh } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/menu");
      }, 800);

    } catch (err) {
      console.log(err.response?.data);
      setMessage(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/30">

        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 7h.01M12 11h.01M12 15h.01" />
          </svg>
        </div>

        <h2 className="text-center text-3xl font-bold text-gray-800 mb-2">
          Welcome Back
        </h2>

        <p className="text-center text-gray-600 text-sm mb-8">
          Login to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username/Email Field */}
          <input
            type="text"
            name="identifier"
            placeholder="Username or Email"
            value={form.identifier}
            onChange={handleChange}
            required
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none"
          />

          {/* Password Field with Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none pr-12"
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-105"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className={`mt-5 p-3 rounded-lg text-center text-sm border ${
            message.includes("successful") 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-red-100 text-red-700 border-red-200"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-3">Don't have an account?</p>
          <button
            onClick={() => navigate("/signup")}
            className="w-full py-3 rounded-xl text-purple-600 border-2 border-purple-600 hover:bg-purple-50 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;