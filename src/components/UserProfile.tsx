import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";

interface UserProfileProps {
    onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const { makeRequest } = useApi();

    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState<"profile" | "password">(
        "profile"
    );
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        if (user) {
            setProfileData((prev) => ({
                ...prev,
                username: user.username,
                email: user.email,
            }));
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await makeRequest(
                "http://localhost:3001/api/user/profile",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        username: profileData.username,
                        email: profileData.email,
                    }),
                }
            );

            const updatedUser = await response.json();

            // Update the user in both context and localStorage
            updateUser(updatedUser);

            setMessage({
                type: "success",
                text: "Profile updated successfully!",
            });
        } catch (error) {
            setMessage({ type: "error", text: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        if (profileData.newPassword !== profileData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            setLoading(false);
            return;
        }

        if (profileData.newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "Password must be at least 6 characters long",
            });
            setLoading(false);
            return;
        }

        try {
            await makeRequest("http://localhost:3001/api/user/password", {
                method: "PUT",
                body: JSON.stringify({
                    currentPassword: profileData.currentPassword,
                    newPassword: profileData.newPassword,
                }),
            });

            setMessage({
                type: "success",
                text: "Password updated successfully!",
            });
            setProfileData((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }));
        } catch (error) {
            setMessage({ type: "error", text: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (
        field: keyof typeof profileData,
        value: string
    ) => {
        setProfileData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear message when user starts typing
        if (message.text) {
            setMessage({ type: "", text: "" });
        }
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-500 hover:text-gray-700 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        User Profile
                    </h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <Card className="mb-4">
                    <CardContent className="p-0">
                        {message.text && (
                            <div className="p-4 border-b">
                                <Alert
                                    variant={
                                        message.type === "error"
                                            ? "destructive"
                                            : "default"
                                    }
                                >
                                    <AlertDescription>
                                        {message.text}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="p-4 border-b">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`flex-1 px-4 py-3 rounded-md transition-colors text-sm font-medium min-h-[44px] ${
                                        activeTab === "profile"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-800"
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <User className="w-4 h-4" />
                                        Profile Info
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("password")}
                                    className={`flex-1 px-4 py-3 rounded-md transition-colors text-sm font-medium min-h-[44px] ${
                                        activeTab === "password"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-800"
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Password
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Profile Information Tab */}
                        {activeTab === "profile" && (
                            <div className="p-4">
                                <form
                                    onSubmit={handleProfileUpdate}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={profileData.username}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "username",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                placeholder="Enter your username"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 min-h-[48px]"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Update Profile
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Password Change Tab */}
                        {activeTab === "password" && (
                            <div className="p-4">
                                <form
                                    onSubmit={handlePasswordChange}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type={
                                                    showPasswords.current
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={
                                                    profileData.currentPassword
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "currentPassword",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                placeholder="Enter current password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    togglePasswordVisibility(
                                                        "current"
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type={
                                                    showPasswords.new
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={profileData.newPassword}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "newPassword",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                placeholder="Enter new password"
                                                minLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    togglePasswordVisibility(
                                                        "new"
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Password must be at least 6
                                            characters long
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type={
                                                    showPasswords.confirm
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={
                                                    profileData.confirmPassword
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "confirmPassword",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    togglePasswordVisibility(
                                                        "confirm"
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 min-h-[48px]"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Update Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Info Card */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center text-sm text-gray-600">
                            <p className="mb-2">Account Security</p>
                            <p className="text-xs">
                                Keep your account secure by using a strong
                                password and updating your information
                                regularly.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
