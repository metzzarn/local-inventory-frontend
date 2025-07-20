import React, { useState, useEffect } from "react";
import {
    PlusCircle,
    Plus,
    LogOut,
    Settings,
    Menu,
    Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Item, ItemBatch } from "@/types";
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
        category: "",
    });

    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showErrorAlert = (message: string) => {
        setAlertMessage(message);
        setShowAlert(true);
    };

    const hideAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

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



    // Note: Direct quantity changes removed - items now always use batch management

    const handleAddItem = async (itemData: {
        name: string;
        category: string;
        batches: Omit<ItemBatch, 'id'>[];
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
            setNewItem({ name: "", category: "" });
            hideAlert();
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding item:", error);
            showErrorAlert("Failed to add item");
        }
    };

    const handleUpdateBatch = async (batchId: number, field: 'quantity' | 'expire_date', value: string | number) => {
        try {
            const response = await makeRequest(
                `http://localhost:3001/api/items/batches/${batchId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({ [field]: value }),
                }
            );

            const updatedBatch = await response.json();
            fetchItems(); // Refresh the entire list to get updated totals
            hideAlert(); // Clear any previous errors
        } catch (error) {
            console.error("Error updating batch:", error);
            showErrorAlert("Failed to update batch");
        }
    };

    const handleDeleteBatch = async (batchId: number) => {
        try {
            const response = await makeRequest(
                `http://localhost:3001/api/items/batches/${batchId}`,
                {
                    method: "DELETE",
                }
            );

            fetchItems(); // Refresh the entire list to get updated totals
            hideAlert(); // Clear any previous errors
        } catch (error) {
            console.error("Error deleting batch:", error);
            showErrorAlert("Failed to delete batch");
        }
    };

    const handleAddBatch = async (itemId: number, quantity: number, expireDate: string | null) => {
        try {
            const response = await makeRequest(
                `http://localhost:3001/api/items/${itemId}/batches`,
                {
                    method: "POST",
                    body: JSON.stringify({ quantity, expire_date: expireDate }),
                }
            );

            fetchItems(); // Refresh the entire list to get updated totals
            hideAlert(); // Clear any previous errors
        } catch (error) {
            console.error("Error adding batch:", error);
            showErrorAlert("Failed to add batch");
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
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => onNavigate("admin")}
                                    className="text-purple-500 hover:text-purple-700 flex items-center gap-1"
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin
                                </button>
                            )}
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
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => {
                                        onNavigate("admin");
                                        setShowMobileMenu(false);
                                    }}
                                    className="text-purple-500 hover:text-purple-700 flex items-center gap-2 px-2 py-1"
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin
                                </button>
                            )}
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
                    <Alert variant="destructive" className="mb-4 cursor-pointer" onClick={hideAlert}>
                        <AlertDescription>
                            {alertMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Floating Action Button */}
                <div className="fixed bottom-4 right-4 z-30">
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
                        onDeleteItem={handleDeleteItem}
                        onUpdateItem={handleUpdateItem}
                        onUpdateBatch={handleUpdateBatch}
                        onDeleteBatch={handleDeleteBatch}
                        onAddBatch={handleAddBatch}
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
                            item. Use the + button to get started.
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add First Item
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};