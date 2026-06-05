import { useNavigate } from "react-router-dom";
import React from "react";
import VM from "../assets/VM.png";
import { useState } from "react";
import { loginUser } from "../api/authApi";
export default function FinanceHubLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleLogin = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const data = await loginUser({
      email,
      password,
    });

    console.log("Login Success:", data);

    // Optional: store token
   localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
    

    navigate("/dashboard");
  } catch (err) {
    setError(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      {/* Glass Card */}
      <div className="w-full max-w-[430px] 
  bg-[#1e293b]
  border border-gray-800 
  rounded-[18px] 
  shadow-2xl
  p-8 md:p-10">

        {/* Header */}
        <div className="flex flex-col items-center">
          <img
    src={VM}
    alt="VM Logo"
    className="w-30 h-20 object-contain mb-3"
  />
          <h1 className="mt-2 text-[28px] font-bold text-orange-600 tracking-tight">
            VM LOGIN
          </h1>

          <p className="mt-2 text-[#9aa4b2] text-[18px]">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form className="mt-10 space-y-6" onSubmit={handleLogin}>

          {/* Email */}
          <div>
            <label className="block text-[16px] font-semibold text-[#e5e7eb] mb-3">
              Email Address
            </label>

            <div className="flex items-center h-12 rounded-xl 
              bg-white/5 
              backdrop-blur-xl
              border border-gray-700
              px-4
              transition-all duration-300
              focus-within:border-orange-500
              focus-within:shadow-[0_0_15px_rgba(249,115,22,0.4)]
              hover:border-white/20">

              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"
                className="w-5 h-5 text-[#94a3b8]">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21.75 7.5v9A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5v-9m19.5 0A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 9.659A2.25 2.25 0 012.25 7.743V7.5" />
              </svg>

             <input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full bg-transparent outline-none px-3 text-[15px] text-gray-200 placeholder:text-[#6b7280]"
/>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[16px] font-semibold text-[#e5e7eb] mb-3">
              Password
            </label>

            <div className="flex items-center h-12 rounded-xl 
              bg-white/5 
              backdrop-blur-xl
              border border-white/10 
              px-4
              transition-all duration-300
              focus-within:border-orange-500
              focus-within:shadow-[0_0_15px_rgba(249,115,22,0.4)]
              hover:border-white/20">

              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"
                className="w-5 h-5 text-[#94a3b8]">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014.5 19.5V12a1.5 1.5 0 011.5-1.5z" />
              </svg>

              <input
  type="password"
  placeholder="Enter your password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full bg-transparent outline-none px-3 text-[15px] text-gray-200 placeholder:text-[#6b7280]"
/>
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                className="text-orange-400 text-[14px] font-medium hover:text-orange-300 transition-colors"
              >
                Forgot password?
              </button>
             
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full h-12 rounded-xl text-white font-semibold text-[17px]
            bg-gradient-to-r from-orange-600 to-orange-500
            shadow-[0_0_20px_rgba(249,115,22,0.35)]
            hover:shadow-[0_0_35px_rgba(249,115,22,0.6)]
            hover:scale-[1.02]
            active:scale-95
            transition-all duration-300 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
           {loading ? "Signing In..." : "Sign In"}
          </button>
          
        </form>

        <p className="text-[14px] text-[#9aa4b2] mt-4 text-center">
          Need an account? Please contact your administrator.
        </p>

      </div>
    </div>
  );
}