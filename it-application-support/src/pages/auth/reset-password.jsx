import { useState, useEffect } from "react";
import { Lock, User, AlertCircle, ChevronDown, ArrowLeft, KeyRound } from "lucide-react";
import gramediaLogo from "../../assets/gramedia-g-logo-transparent.png";

export default function ResetPassword({ setActivePage }) {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
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
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        if (newPassword !== confirmPassword) {
            setError("Password baru dan konfirmasi tidak cocok.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password baru minimal 6 karakter.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/auth/public-change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, oldPassword, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengubah password");
            
            setSuccess("Password berhasil diubah! Mengalihkan ke halaman Login...");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            
            setTimeout(() => {
                setActivePage("Login");
            }, 2500);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1200px] w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex overflow-hidden min-h-[680px]">

                {/* ===== KIRI: Panel Biru ===== */}
                <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col items-center justify-center relative overflow-hidden p-12">

                    {/* Ornamen lingkaran dekoratif */}
                    <div className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-white/5"></div>
                    <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-white/5"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03]"></div>

                    {/* Konten Tengah */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Logo */}
                        <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center shadow-2xl shadow-blue-900/30 mb-8">
                            <img src={gramediaLogo} alt="Gramedia Logo" className="w-16 h-16 object-contain" />
                        </div>

                        <h1 className="text-[36px] font-bold text-white leading-tight mb-3">
                            Keamanan Akun
                        </h1>
                        <p className="text-blue-100 text-[14px] leading-relaxed max-w-[320px]">
                            Ubah password Anda untuk menjaga keamanan data di portal Gramedia IT Application Support.
                        </p>
                    </div>
                </div>

                {/* ===== KANAN: Form Putih ===== */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-16 bg-white relative">
                    <button 
                        onClick={() => setActivePage("Login")}
                        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={16} /> Kembali ke Login
                    </button>

                    <div className="max-w-[340px] w-full mt-4">
                        <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                            Reset Password <KeyRound size={22} className="text-blue-600" />
                        </h2>
                        <p className="text-sm text-slate-500 mb-8">
                            Silakan masukkan password lama untuk mengubahnya.
                        </p>

                        <form className="space-y-4" onSubmit={handleReset}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[4px] flex items-center gap-3 text-sm">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-[4px] flex items-center gap-3 text-sm">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {success}
                                </div>
                            )}

                            {/* Username */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Username (Akun PIC)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <select
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={fetchingUsers}
                                        className="block w-full pl-10 pr-9 py-2 border border-slate-200/80 rounded-[4px] text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
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
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Password Lama */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password Lama</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200/80 rounded-[4px] text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="Masukkan password lama"
                                    />
                                </div>
                            </div>

                            {/* Password Baru */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password Baru</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200/80 rounded-[4px] text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="Masukkan password baru"
                                    />
                                </div>
                            </div>

                            {/* Konfirmasi Password Baru */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Konfirmasi Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200/80 rounded-[4px] text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="Ketik ulang password baru"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || fetchingUsers || success}
                                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 mt-6 rounded-[4px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? "Menyimpan..." : "Ubah Password"}
                            </button>
                        </form>
                    </div>

                    <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-300">© 2026 Gramedia IT Application Support</p>
                </div>

            </div>

        </div>
    );
}
