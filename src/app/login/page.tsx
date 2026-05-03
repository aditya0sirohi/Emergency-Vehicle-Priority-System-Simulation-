"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  // State for the Toggle: 'admin' or 'driver'
  const [loginType, setLoginType] = useState<"admin" | "driver">("admin");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Security Check: Did they log in to the right tab?
        // (Prevents a Driver from logging in on the Admin tab)
        if (data.role !== "ambulance" && loginType === "driver") {
            setError("Access Denied: You are not a Driver.");
            setLoading(false);
            return;
        }
        if (data.role !== "admin" && loginType === "admin") {
            setError("Access Denied: You are not an Admin.");
            setLoading(false);
            return;
        }

        // Store Data
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);

        // Redirect
        if (data.role === "admin") router.push("/admin");
        else router.push("/driver");
        
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Cannot connect to server. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 transition-colors duration-500 ${loginType === 'admin' ? 'bg-slate-900' : 'bg-red-950'}`}>
      <Card className="w-full max-w-md border-slate-700 bg-slate-800 text-slate-100 shadow-2xl">
        
        {/* THE TABS */}
        <div className="grid grid-cols-2 p-1 bg-slate-700/50 rounded-t-lg">
            <button 
                onClick={() => setLoginType("admin")}
                className={`py-3 text-sm font-bold rounded-md transition-all ${loginType === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                ADMIN PORTAL
            </button>
            <button 
                onClick={() => setLoginType("driver")}
                className={`py-3 text-sm font-bold rounded-md transition-all ${loginType === 'driver' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                AMBULANCE DRIVER
            </button>
        </div>

        <CardHeader className="text-center pt-8">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${loginType === 'admin' ? 'bg-blue-600' : 'bg-red-600'}`}>
            {loginType === 'admin' ? (
                // Admin Icon (Building/Shield)
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ) : (
                // Driver Icon (Truck/Ambulance)
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {loginType === 'admin' ? 'Command Center' : 'Vehicle Login'}
          </CardTitle>
          <p className="text-sm text-slate-400">
            {loginType === 'admin' ? 'Restricted Access: Traffic Control' : 'Authorized Emergency Vehicles Only'}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Username</label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-600 bg-slate-900 p-3 text-white placeholder-slate-500 focus:border-white focus:outline-none"
                placeholder={loginType === 'admin' ? "admin" : "driver1"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-md border border-slate-600 bg-slate-900 p-3 text-white placeholder-slate-500 focus:border-white focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="text-sm text-red-400 text-center font-semibold bg-red-900/20 p-2 rounded">{error}</div>}

            <Button type="submit" className={`w-full text-lg font-bold py-6 ${loginType === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`} disabled={loading}>
              {loading ? "Verifying..." : "Secure Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}