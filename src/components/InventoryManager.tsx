import React, { useState, useEffect, useRef } from "react";
import {
    PlusCircle,
    Plus,
    Camera,
    XCircle,
    LogOut,
    Settings,
    Menu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Item } from "@/types";
import { ViewMode } from "./AppRouter";
import { InventoryTable } from "./InventoryTable";
import { AddItemForm } from "./AddItemForm";

interface InventoryManagerProps {
    onNavigate: (view: ViewMode) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
    onNavigate,
}) => {
    const { user, logout } = useAuth();
    const { makeRequest } = useApi();

    const [items, setItems] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState({
        name: "",
        quantity: "",
        category: "",
    });

    const [showAlert, setShowAlert] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch items with authentication
    const fetchItems = async () => {
        try {
            const response = await makeRequest(
                "http://localhost:3001/api/items"
            );
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setShowScanner(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setShowScanner(false);
    };

    const handleScan = () => {
        const mockScannedItem = {
            name: "Scanned Item " + Math.floor(Math.random() * 1000),
            quantity: "1",
            category: "Scanned",
        };
        setNewItem(mockScannedItem);
        setShowAddForm(true);
        stopCamera();
    };

    const handleQuantityChange = async (id: number, increment: number) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;

        const newQuantity = Math.max(0, item.quantity + increment);

        try {
            const response = await makeRequest(
                `http://localhost:3001/api/items/${id}/quantity`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ quantity: newQuantity }),
                }
            );

            const updatedItem = await response.json();
            setItems(items.map((i) => (i.id === id ? updatedItem : i)));
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const handleAddItem = async (itemData: {
        name: string;
        quantity: number;
        category: string;
    }) => {
        try {
            const response = await makeRequest(
                "http://localhost:3001/api/items",
                {
                    method: "POST",
                    body: JSON.stringify(itemData),
                }
            );

            const item = await response.json();
            setItems([...items, item]);
            setNewItem({ name: "", quantity: "", category: "" });
            setShowAlert(false);
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding item:", error);
            setShowAlert(true);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await makeRequest(`http://localhost:3001/api/items/${id}`, {
                    method: "DELETE",
                });

                setItems(items.filter((item) => item.id !== id));
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

const handleUpdateItem = async (id: number, field: keyof Item, value: string) => {
    try {
        // Find the current item to get all its current values
        const currentItem = items.find(item => item.id === id);
        if (!currentItem) {
            console.error("Item not found");
            return;
        }

        // Create the updated item data with all fields
        const updatedItemData = {
            name: field === 'name' ? value : currentItem.name,
            quantity: field === 'quantity' ? parseInt(value) || 0 : currentItem.quantity,
            category: field === 'category' ? value : currentItem.category,
        };

        const response = await makeRequest(
            `http://localhost:3001/api/items/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(updatedItemData),
            }
        );

        const updatedItem = await response.json();
        setItems(
            items.map((item) =>
                item.id === id ? updatedItem : item
            )
        );
    } catch (error) {
        console.error("Error updating item:", error);
    }
};

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-40">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900 truncate">
                        Store Inventory
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="p-2 text-gray-500 hover:text-gray-700 md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Welcome, {user?.username}
                            </span>
                            <button
                                onClick={() => onNavigate("profile")}
                                className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Settings className="w-4 h-4" />
                                Profile
                            </button>
                            <button
                                onClick={logout}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="mt-3 pt-3 border-t md:hidden">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm text-gray-600 px-2">
                                Welcome, {user?.username}
                            </span>
                            <button
                                onClick={() => {
                                    onNavigate("profile");
                                    setShowMobileMenu(false);
                                }}
                                className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-2 py-1"
                            >
                                <Settings className="w-4 h-4" />
                                Profile
                            </button>
                            <button
                                onClick={logout}
                                className="text-red-500 hover:text-red-700 flex items-center gap-2 px-2 py-1"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 max-w-4xl mx-auto">
                {/* Scanner Interface */}
                {showScanner && (
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="relative aspect-video w-full max-w-md mx-auto mb-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full rounded-lg"
                                />
                                <div className="absolute inset-0 border-2 border-red-500 pointer-events-none rounded-lg">
                                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500" />
                                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-red-500" />
                                </div>
                            </div>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={handleScan}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 min-h-[44px]"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capture
                                </button>
                                <button
                                    onClick={stopCamera}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 min-h-[44px]"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Cancel
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Add Item Form */}
                {showAddForm && (
                    <AddItemForm
                        onAddItem={handleAddItem}
                        onCancel={() => setShowAddForm(false)}
                        existingItems={items}
                        initialValues={newItem}
                    />
                )}

                {/* Alert */}
                {showAlert && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            Please fill in all fields before adding an item.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Floating Action Buttons */}
                <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-30">
                    <button
                        className="bg-purple-500 text-white p-4 rounded-full shadow-lg hover:bg-purple-600 min-h-[56px] min-w-[56px]"
                        onClick={startCamera}
                    >
                        <Camera className="w-6 h-6" />
                    </button>
                    <button
                        className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 min-h-[56px] min-w-[56px]"
                        onClick={() => setShowAddForm(true)}
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Items Table/Cards */}
                {items.length > 0 ? (
                    <InventoryTable
                        items={items}
                        onQuantityChange={handleQuantityChange}
                        onDeleteItem={handleDeleteItem}
                        onUpdateItem={handleUpdateItem}
                    />
                ) : (
                    /* Empty State */
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PlusCircle className="w-12 h-12 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Items Yet
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            Start building your inventory by adding your first
                            item. Use the + button or scan a barcode to get
                            started.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add First Item
                            </button>
                            <button
                                onClick={startCamera}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <Camera className="w-5 h-5" />
                                Scan Barcode
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};