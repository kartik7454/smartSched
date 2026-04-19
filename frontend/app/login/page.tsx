"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/apiBase";

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Placeholder: replace with real login logic (API call)
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorData = data;
        setError(errorData.message || "Login failed.");
        setLoading(false);
        return;
      } else {
        localStorage.setItem("token", data.access_token);
        window.location.href = "/"; // redirect to home
      }
    } catch {
      setError("Login failed. Please try again later.");
      setLoading(false);
      return;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-black">
          Login
        </h1>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium text-black" htmlFor="email">
            Email
          </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-500 text-black"
            autoComplete="username"
            disabled={loading}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium text-black" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring  focus:border-blue-500 text-black"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}
        <button
          type="submit"
          className={`w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}
