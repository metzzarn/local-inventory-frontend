import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Check, X, Trash2, Edit3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Item } from "@/types";

interface InventoryTableProps {
    items: Item[];
    onQuantityChange: (id: number, increment: number) => Promise<void>;
    onDeleteItem: (id: number) => Promise<void>;
    onUpdateItem: (
        id: number,
        field: keyof Item,
        value: string
    ) => Promise<void>;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
    items,
    onQuantityChange,
    onDeleteItem,
    onUpdateItem,
}) => {
    const [editingCell, setEditingCell] = useState<{
        id: number;
        field: keyof Item;
    } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Auto-focus when editing starts
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    // Handle click outside to cancel editing
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                editingCell &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                suggestionRef.current &&
                !suggestionRef.current.contains(event.target as Node)
            ) {
                handleCancelEdit();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [editingCell]);

    const getUniqueCategories = (): string[] => {
        return Array.from(
            new Set(items.map((item) => item.category).filter(Boolean))
        );
    };

    const startEdit = (
        id: number,
        field: keyof Item,
        currentValue: string | number
    ) => {
        setEditingCell({ id, field });
        setEditValue(String(currentValue));

        if (field === "category") {
            const categories = getUniqueCategories();
            setSuggestions(categories);
            setShowSuggestions(categories.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingCell) return;

        try {
            setIsLoading(editingCell.id);
            await onUpdateItem(editingCell.id, editingCell.field, editValue);
            setEditingCell(null);
            setEditValue("");
            setShowSuggestions(false);
        } catch (error) {
            console.error("Failed to save edit:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEditValue(value);

        if (editingCell?.field === "category") {
            const categories = getUniqueCategories();
            const filtered = categories.filter((cat) =>
                cat.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        setEditValue(suggestion);
        setShowSuggestions(false);
        setTimeout(handleSaveEdit, 0);
    };

    const handleQuantityChange = async (id: number, increment: number) => {
        try {
            setIsLoading(id);
            await onQuantityChange(id, increment);
        } catch (error) {
            console.error("Failed to update quantity:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleDeleteItem = async (id: number) => {
        try {
            setIsLoading(id);
            await onDeleteItem(id);
        } catch (error) {
            console.error("Failed to delete item:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const getStockStatus = (quantity: number) => {
        if (quantity <= 5) {
            return {
                color: "bg-red-50 border-red-200",
                indicator: "bg-red-500 animate-pulse",
                label: "Low Stock",
                textColor: "text-red-800",
            };
        } else if (quantity <= 20) {
            return {
                color: "bg-yellow-50 border-yellow-200",
                indicator: "bg-yellow-500",
                label: "Medium Stock",
                textColor: "text-yellow-800",
            };
        } else {
            return {
                color: "bg-green-50 border-green-200",
                indicator: "bg-green-500",
                label: "In Stock",
                textColor: "text-green-800",
            };
        }
    };

    const renderEditableCell = (
        item: Item,
        field: keyof Item,
        className: string = ""
    ) => {
        const isEditing =
            editingCell?.id === item.id && editingCell?.field === field;
        const value = item[field];

        if (isEditing) {
            return (
                <div className="relative">
                    <div className="flex items-center gap-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={
                                field === "name"
                                    ? "Enter item name"
                                    : field === "category"
                                    ? "Enter category"
                                    : ""
                            }
                        />
                        <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            disabled={
                                isLoading === item.id || editValue.trim() === ""
                            }
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {showSuggestions &&
                        suggestions.length > 0 &&
                        field === "category" && (
                            <div
                                ref={suggestionRef}
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto"
                            >
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        onClick={() =>
                                            selectSuggestion(suggestion)
                                        }
                                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            );
        }

        return (
            <div
                onClick={() => startEdit(item.id, field, value)}
                className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors group ${className}`}
            >
                <div className="flex items-center justify-between">
                    <span>{value}</span>
                    <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        );
    };

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="text-gray-500">
                        <p className="text-lg font-medium">
                            No items in inventory
                        </p>
                        <p className="text-sm mt-1">
                            Add some items to get started
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Card className="overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Item
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item) => {
                                        const stockStatus = getStockStatus(
                                            item.quantity
                                        );
                                        return (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-gray-50 transition-colors ${stockStatus.color}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                                                                <span className="text-white font-bold text-sm">
                                                                    {item.name
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {renderEditableCell(
                                                                    item,
                                                                    "name"
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: #{item.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    item.id,
                                                                    -1
                                                                )
                                                            }
                                                            disabled={
                                                                item.quantity <=
                                                                    0 ||
                                                                isLoading ===
                                                                    item.id
                                                            }
                                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${stockStatus.indicator}`}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    item.id,
                                                                    1
                                                                )
                                                            }
                                                            disabled={
                                                                isLoading ===
                                                                item.id
                                                            }
                                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {renderEditableCell(
                                                            item,
                                                            "category"
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteItem(
                                                                item.id
                                                            )
                                                        }
                                                        disabled={
                                                            isLoading ===
                                                            item.id
                                                        }
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {items.map((item) => {
                    const stockStatus = getStockStatus(item.quantity);
                    return (
                        <Card
                            key={item.id}
                            className={`shadow-sm hover:shadow-md transition-all duration-200 ${stockStatus.color}`}
                        >
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className="flex-shrink-0">
                                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {item.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {renderEditableCell(
                                                        item,
                                                        "name"
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {renderEditableCell(
                                                            item,
                                                            "category"
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        ID: #{item.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleDeleteItem(item.id)
                                            }
                                            disabled={isLoading === item.id}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Quantity Control */}
                                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={`w-3 h-3 rounded-full ${stockStatus.indicator}`}
                                            />
                                            <span
                                                className={`text-sm font-medium ${stockStatus.textColor}`}
                                            >
                                                {stockStatus.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        item.id,
                                                        -1
                                                    )
                                                }
                                                disabled={
                                                    item.quantity <= 0 ||
                                                    isLoading === item.id
                                                }
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="text-xl font-bold text-gray-900 min-w-[2ch] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        item.id,
                                                        1
                                                    )
                                                }
                                                disabled={isLoading === item.id}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
