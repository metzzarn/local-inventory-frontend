import React, { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Item } from "@/types";
import { EditableCell } from "./EditableCell";

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
    const [isLoading, setIsLoading] = useState<number | null>(null);

    const getUniqueCategories = (): string[] => {
        return Array.from(
            new Set(items.map((item) => item.category).filter(Boolean))
        );
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

    const handleUpdateItem = async (
        id: number,
        field: keyof Item,
        value: string
    ) => {
        try {
            setIsLoading(id);
            await onUpdateItem(id, field, value);
        } catch (error) {
            console.error("Failed to update item:", error);
            throw error; // Re-throw to let EditableCell handle it
        } finally {
            setIsLoading(null);
        }
    };

    const getStockStatus = (quantity: number) => {
        if (quantity <= 1) {
            return {
                color: "bg-red-50 border-red-200",
                indicator: "bg-red-500 animate-pulse",
                label: "Low Stock",
                textColor: "text-red-800",
            };
        } else if (quantity <= 3) {
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
                            <table className="w-full table-fixed">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                                            Item
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/4">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12">
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
                                                <td className="px-6 py-4 whitespace-nowrap w-1/3">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                                                                <span className="text-white font-bold text-sm">
                                                                    {item.name
                                                                        .charAt(0)
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                <EditableCell
                                                                    item={item}
                                                                    field="name"
                                                                    onUpdateItem={handleUpdateItem}
                                                                    placeholder="Enter item name"
                                                                    isLoading={isLoading === item.id}
                                                                />
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: #{item.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap w-1/4">
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
                                                                isLoading === item.id
                                                            }
                                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap w-1/6">
                                                    <div className="w-full max-w-full overflow-hidden">
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-full max-w-full">
                                                            <EditableCell
                                                                item={item}
                                                                field="category"
                                                                onUpdateItem={handleUpdateItem}
                                                                getSuggestions={getUniqueCategories}
                                                                placeholder="Enter category"
                                                                isLoading={isLoading === item.id}
                                                            />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center w-1/12">
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteItem(item.id)
                                                        }
                                                        disabled={isLoading === item.id}
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
                                                    <EditableCell
                                                        item={item}
                                                        field="name"
                                                        onUpdateItem={handleUpdateItem}
                                                        placeholder="Enter item name"
                                                        isLoading={isLoading === item.id}
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        <EditableCell
                                                            item={item}
                                                            field="category"
                                                            onUpdateItem={handleUpdateItem}
                                                            getSuggestions={getUniqueCategories}
                                                            placeholder="Enter category"
                                                            isLoading={isLoading === item.id}
                                                        />
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