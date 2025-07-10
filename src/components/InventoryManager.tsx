import React, { useState, useEffect, useRef } from "react";
import {
    PlusCircle,
    Trash2,
    Plus,
    Minus,
    Check,
    X,
    Camera,
    XCircle,
    LogOut,
    Settings,
    Menu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Item } from "@/types";
import { ViewMode } from "./AppRouter";

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

    const [editingCell, setEditingCell] = useState<{
        id: number;
        field: keyof Item;
    } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const editInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
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
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingCell]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                editInputRef.current &&
                !editInputRef.current.contains(event.target as Node) &&
                (!suggestionsRef.current ||
                    !suggestionsRef.current.contains(event.target as Node))
            ) {
                saveEdit();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [editingCell, editValue]);

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

    const getRowColor = (quantity: number) => {
        if (quantity <= 5) return "bg-red-50";
        if (quantity <= 20) return "bg-yellow-50";
        return "";
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

    const getUniqueCategories = () => {
        return Array.from(new Set(items.map((item) => item.category)));
    };

    const filterSuggestions = (input: string) => {
        const uniqueCategories = getUniqueCategories();
        const filtered = uniqueCategories.filter((category) =>
            category.toLowerCase().includes(input.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.quantity || !newItem.category) {
            setShowAlert(true);
            return;
        }

        try {
            const response = await makeRequest(
                "http://localhost:3001/api/items",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...newItem,
                        quantity: parseInt(newItem.quantity),
                    }),
                }
            );

            const item = await response.json();
            setItems([...items, item]);
            setNewItem({ name: "", quantity: "", category: "" });
            setShowAlert(false);
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding item:", error);
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

    const startEditing = (
        id: number,
        field: keyof Item,
        value: string | number
    ) => {
        setEditingCell({ id, field });
        setEditValue(value.toString());
        setShowSuggestions(field === "category");
        if (field === "category") {
            filterSuggestions(value.toString());
        }
    };

    const handleCellClick = (
        id: number,
        field: keyof Item,
        value: string | number
    ) => {
        if (!editingCell) {
            startEditing(id, field, value);
        }
    };

    const saveEdit = async () => {
        if (editingCell) {
            try {
                const response = await makeRequest(
                    `http://localhost:3001/api/items/${editingCell.id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            [editingCell.field]: editValue,
                        }),
                    }
                );

                const updatedItem = await response.json();
                setItems(
                    items.map((item) =>
                        item.id === editingCell.id ? updatedItem : item
                    )
                );
                setEditingCell(null);
                setEditValue("");
                setShowSuggestions(false);
            } catch (error) {
                console.error("Error updating item:", error);
            }
        }
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
        setShowSuggestions(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setEditValue(input);
        filterSuggestions(input);
    };

    const handleSelectCategory = (category: string) => {
        setEditValue(category);
        saveEdit();
    };

    const renderCell = (item: Item, field: keyof Item) => {
        const isEditing =
            editingCell?.id === item.id && editingCell?.field === field;

        if (isEditing) {
            return (
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <input
                            ref={editInputRef}
                            type="text"
                            className="w-full p-2 border rounded text-sm"
                            value={editValue}
                            onChange={
                                field === "category"
                                    ? handleCategoryChange
                                    : (e) => setEditValue(e.target.value)
                            }
                            onKeyDown={handleKeyPress}
                        />
                        {field === "category" &&
                            showSuggestions &&
                            suggestions.length > 0 && (
                                <div
                                    className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg"
                                    ref={suggestionsRef}
                                >
                                    {suggestions.map((category, index) => (
                                        <div
                                            key={index}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() =>
                                                handleSelectCategory(category)
                                            }
                                        >
                                            {category}
                                        </div>
                                    ))}
                                </div>
                            )}
                    </div>
                    <button
                        onClick={saveEdit}
                        className="text-green-500 hover:text-green-700 p-1"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={cancelEdit}
                        className="text-red-500 hover:text-red-700 p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        return (
            <div
                className="cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[44px] flex items-center text-sm"
                onClick={() => handleCellClick(item.id, field, item[field])}
            >
                {item[field]}
            </div>
        );
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
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Add New Item
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                                    value={newItem.name}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            name: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                                    value={newItem.quantity}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            quantity: e.target.value,
                                        })
                                    }
                                />
                                <div className="relative" ref={suggestionsRef}>
                                    <input
                                        type="text"
                                        placeholder="Category"
                                        className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                                        value={newItem.category}
                                        onChange={(e) => {
                                            setNewItem({
                                                ...newItem,
                                                category: e.target.value,
                                            });
                                            filterSuggestions(e.target.value);
                                        }}
                                        onFocus={() =>
                                            filterSuggestions(newItem.category)
                                        }
                                    />
                                    {showSuggestions &&
                                        suggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                                {suggestions.map(
                                                    (category, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 hover:bg-gray-100 cursor-pointer text-base"
                                                            onClick={() => {
                                                                setNewItem({
                                                                    ...newItem,
                                                                    category,
                                                                });
                                                                setShowSuggestions(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            {category}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px]"
                                        onClick={handleAddItem}
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add Item
                                    </button>
                                    <button
                                        className="bg-gray-500 text-white p-3 rounded-lg min-h-[44px]"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                <div className="space-y-3">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="p-3 text-left">
                                                    Name
                                                </th>
                                                <th className="p-3 text-left">
                                                    Quantity
                                                </th>
                                                <th className="p-3 text-left">
                                                    Category
                                                </th>
                                                <th className="p-3 text-left">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className={`border-b transition-colors ${getRowColor(
                                                        item.quantity
                                                    )}`}
                                                >
                                                    <td className="p-3">
                                                        {renderCell(
                                                            item,
                                                            "name"
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityChange(
                                                                        item.id,
                                                                        -1
                                                                    )
                                                                }
                                                                className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded min-h-[44px]"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="min-w-[3rem] text-center font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityChange(
                                                                        item.id,
                                                                        1
                                                                    )
                                                                }
                                                                className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded min-h-[44px]"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        {renderCell(
                                                            item,
                                                            "category"
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteItem(
                                                                    item.id
                                                                )
                                                            }
                                                            className="p-2 text-red-500 hover:text-red-700 min-h-[44px]"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {items.map((item) => (
                            <Card
                                key={item.id}
                                className={`${getRowColor(item.quantity)}`}
                            >
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-base mb-1">
                                                    {renderCell(item, "name")}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Category:{" "}
                                                    {renderCell(
                                                        item,
                                                        "category"
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleDeleteItem(item.id)
                                                }
                                                className="p-2 text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px]"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                Quantity:
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            item.id,
                                                            -1
                                                        )
                                                    }
                                                    className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded min-h-[44px] min-w-[44px]"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-lg font-semibold min-w-[3rem] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            item.id,
                                                            1
                                                        )
                                                    }
                                                    className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded min-h-[44px] min-w-[44px]"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {items.length === 0 && (
                    <Card className="mt-8">
                        <CardContent className="p-8 text-center">
                            <div className="text-gray-500 mb-4">
                                <PlusCircle className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-lg">No items in inventory</p>
                                <p className="text-sm">
                                    Add your first item to get started
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
