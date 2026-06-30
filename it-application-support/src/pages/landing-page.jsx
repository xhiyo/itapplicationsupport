import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, User, Lock, ChevronDown, AlertCircle, LogIn } from 'lucide-react';
import GramediaLogo from '../assets/gramedia-g-logo-transparent.png';
import ITIllustration from '../assets/it_app_support_illustration.png';

function LandingPage({ onGetStarted, setAuth, isAuthenticated, setActivePage }) {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Fetch users immediately on mount if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            const fetchUsers = async () => {
                setFetchingUsers(true);
                try {
                    const res = await fetch(`http://${window.location.hostname}:5000/api/auth/users`, {
                        cache: 'no-store'
                    });
                    const data = await res.json();
                    setUsers(data);
                    if (data.length > 0) setUsername(data[0].username);
                } catch (err) {
                    console.error("Gagal mengambil daftar user:", err);
                } finally {
                    setFetchingUsers(false);
                }
            };
            fetchUsers();
        }
    }, [isAuthenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`http://${window.location.hostname}:5000/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal login");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setAuth({ token: data.token, user: data.user });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200 flex items-center justify-center p-4 lg:p-12 transition-colors animate-in fade-in duration-300"
            style={{
                backgroundColor: '#ffffff',
                backgroundImage: `
                     radial-gradient(circle at 10% 40%, #fff7d6 0%, transparent 60%),
                     radial-gradient(circle at 90% 60%, #d4eaf7 0%, transparent 60%)
                 `
            }}>

            <div className="w-full max-w-[1050px] flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16 bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] px-8 py-10 lg:px-20 lg:py-16 overflow-hidden">

                {/* LEFT CONTENT */}
                <div className="w-full max-w-[380px] flex flex-col items-center text-center relative z-10">
                    {/* Header Logo */}
                    <div className="flex items-center justify-center gap-3 relative z-10">
                        <img src={GramediaLogo} alt="Gramedia Logo" className="h-9 w-auto object-contain dark:brightness-200" />
                        <div className="flex flex-col text-left">
                            <span className="font-bold text-[1.1rem] leading-none text-slate-900 dark:text-white tracking-tight">IT Application Support Gramedia</span>
                        </div>
                    </div>

                    {/* Illustration (Sketch IT) */}
                    <img src={ITIllustration} alt="IT Support Sketch" className="w-[85%] object-contain opacity-100 mix-blend-multiply dark:mix-blend-normal animate-in zoom-in duration-500 my-8" />

                    {/* Footer Copyright */}
                    <div className="py-10 w-full flex flex-col items-center justify-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400 relative z-10">
                        <span>© 2026 PT. Gramedia Asri Media</span>
                    </div>
                </div>

                {/* RIGHT CONTENT (Login Form) */}
                <div className="w-full max-w-[420px] relative z-10">

                    {!isAuthenticated ? (
                        /* Flat & Borderless Login UI exactly like user reference, but using brand color */
                        <div className="w-full pt-6">
                            <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-1 mt-2">
                                Welcome Back
                            </h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8">
                                Welcome back! please enter your details.
                            </p>

                            <form className="space-y-4" onSubmit={handleLogin}>
                                {error && (
                                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-455 px-4 py-2.5 rounded-[4px] flex items-center gap-2.5 text-xs">
                                        <AlertCircle size={14} className="shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* PIC / Username */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-900 dark:text-slate-200 mb-1.5">PIC</label>
                                    <div className="relative">
                                        <select
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={fetchingUsers}
                                            className="block w-full pl-3 pr-10 py-2.5 border border-slate-200/80 dark:border-slate-800 rounded-[4px] text-[13px] text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                            required
                                        >
                                            {fetchingUsers ? (
                                                <option value="">Memuat nama PIC...</option>
                                            ) : (
                                                users.map(u => (
                                                    <option key={u.id} value={u.username}>{u.name}</option>
                                                ))
                                            )}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-900 dark:text-slate-200 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-slate-200/80 dark:border-slate-800 rounded-[4px] text-[13px] text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Your password"
                                        />
                                        {/* Eye icon on right */}
                                        <div
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <svg className={`w-4 h-4 transition-colors ${showPassword ? "text-blue-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {showPassword ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                )}
                                            </svg>
                                        </div>
                                    </div>

                                </div>

                                {/* Remember me */}
                                <div className="flex items-center gap-2 mt-1 mb-4">
                                    <input type="checkbox" id="remember" className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer" />
                                    <label htmlFor="remember" className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">Remember me</label>
                                </div>

                                {/* Log In Button */}
                                <button
                                    type="submit"
                                    disabled={loading || fetchingUsers}
                                    className="w-full flex justify-center items-center py-2.5 px-4 rounded-[4px] text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
                                >
                                    {loading ? "Logging in..." : "Log In"}
                                </button>

                                {/* Sign up */}
                                <div className="text-center mt-6">
                                    <p className="text-[13px] text-slate-700 dark:text-slate-300">
                                        Don't Have Account? Told Dwi As an Admin to <a href="#" className="text-slate-700 font-semibold cursor-default">Create Account</a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Authenticated Landing Welcome Page */
                        <div className="w-full animate-in fade-in duration-300 pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-slate-500 font-medium text-sm">Redirecting to Dashboard...</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default LandingPage;
