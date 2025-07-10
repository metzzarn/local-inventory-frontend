import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    Eye,
    EyeOff,
    User,
    Mail,
    Lock,
    LogIn,
    UserPlus,
    Loader2,
} from "lucide-react";

export const LoginForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = isLogin
                ? await login(formData.username, formData.password)
                : await register(
                      formData.username,
                      formData.email,
                      formData.password
                  );

            if (!result.success) {
                setError(result.error || "Unknown error occurred");
            }
        } catch (error) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError(""); // Clear error when user types
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setFormData({ username: "", email: "", password: "" });
        setShowPassword(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center text-white">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {isLogin ? (
                                <LogIn className="w-10 h-10" />
                            ) : (
                                <UserPlus className="w-10 h-10" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold mb-2">
                            {isLogin ? "Welcome Back!" : "Join Us Today!"}
                        </h1>
                        <p className="text-blue-100 text-sm">
                            {isLogin
                                ? "Sign in to manage your inventory"
                                : "Create your account to get started"}
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 py-8">
                        {/* Demo Credentials Banner */}
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                <span className="text-amber-800 font-medium text-sm">
                                    Demo Account
                                </span>
                            </div>
                            <p className="text-amber-700 text-sm">
                                <strong>Username:</strong> admin
                                <br />
                                <strong>Password:</strong> admin123
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Alert */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    !
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-red-700 text-sm font-medium">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium text-sm block">
                                    Username
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "username",
                                                e.target.value
                                            )
                                        }
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Field (Register only) */}
                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-gray-700 font-medium text-sm block">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium text-sm block">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={formData.password}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "password",
                                                e.target.value
                                            )
                                        }
                                        className="w-full pl-12 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-3 min-h-[56px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Please wait...</span>
                                    </>
                                ) : (
                                    <>
                                        {isLogin ? (
                                            <>
                                                <LogIn className="w-5 h-5" />
                                                <span>Sign In</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                <span>Create Account</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Mode Toggle */}
                        <div className="mt-8 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">
                                        or
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={switchMode}
                                className="mt-4 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm underline-offset-4 hover:underline"
                            >
                                {isLogin
                                    ? "Don't have an account? Create one here"
                                    : "Already have an account? Sign in instead"}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-2">
                                Secure & Reliable Inventory Management
                            </p>
                            <div className="flex justify-center items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-xs text-gray-400">
                                    System Online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-white/80 text-sm">
                        Professional inventory management made simple
                    </p>
                </div>
            </div>
        </div>
    );
};
