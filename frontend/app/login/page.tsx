"use client";

import { useState } from "react";

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
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
        return;
      } else {
        localStorage.setItem("token", data.access_token);
        window.location.href = "/"; // redirect to home
      }

      // You could also handle storing tokens, redirect, etc. here
    } catch {
      setError("Login failed. Please try again later.");
      return;
    }

    // Placeholder: replace with real login logic (API call)
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    // Simulate login
    
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-black">
          {role === "student" ? "Student" : "Teacher"} Login
        </h1>
        <div className="flex justify-center mb-6 gap-4">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`px-4 py-2 rounded ${
              role === "student" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`px-4 py-2 rounded ${
              role === "teacher" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Teacher
          </button>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium text-black" htmlFor="email">
            email
          </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-500"
            autoComplete="username"
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
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring  focus:border-blue-500"
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}
