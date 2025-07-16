import React, { useState, useMemo } from "react";
import { Plus, Minus, Trash2, ChevronUp, ChevronDown, ChevronRight, Calendar, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemBatch } from "@/types";
import { EditableCell } from "./EditableCell";

interface InventoryTableProps {
    items: Item[];
    onDeleteItem: (id: number) => Promise<void>;
    onUpdateItem: (
        id: number,
        field: keyof Item,
        value: string
    ) => Promise<void>;
    onUpdateBatch: (batchId: number, field: 'quantity' | 'expire_date', value: string | number) => Promise<void>;
    onDeleteBatch: (batchId: number) => Promise<void>;
    onAddBatch: (itemId: number, quantity: number, expireDate: string | null) => Promise<void>;
}

type SortField = 'name' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
    items,
    onDeleteItem,
    onUpdateItem,
    onUpdateBatch,
    onDeleteBatch,
    onAddBatch,
}) => {
    const [isLoading, setIsLoading] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [editingBatch, setEditingBatch] = useState<number | null>(null);
    const [addingBatchFor, setAddingBatchFor] = useState<number | null>(null);
    const [newBatchData, setNewBatchData] = useState({ quantity: 1, expire_date: '' });

    const getUniqueCategories = (): string[] => {
        return Array.from(
            new Set(items.map((item) => item.category).filter(Boolean))
        );
    };

    const sortedItems = useMemo(() => {
        if (!sortConfig) return items;

        return [...items].sort((a, b) => {
            const aValue = a[sortConfig.field].toLowerCase();
            const bValue = b[sortConfig.field].toLowerCase();

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [items, sortConfig]);

    const handleSort = (field: SortField) => {
        setSortConfig(current => {
            if (current?.field === field) {
                if (current.direction === 'asc') {
                    return { field, direction: 'desc' };
                } else {
                    return null; // Remove sorting
                }
            }
            return { field, direction: 'asc' };
        });
    };

    const getSortIcon = (field: SortField) => {
        if (!sortConfig || sortConfig.field !== field) {
            return null;
        }
        return sortConfig.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />;
    };

    const getCalculatedQuantity = (item: Item) => {
        if (item.batches && item.batches.length > 0) {
            return item.batches.reduce((total, batch) => total + batch.quantity, 0);
        }
        return 0; // Items should always have batches
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

    const toggleExpanded = (itemId: number) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "No expiry";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatCreatedDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return { text: "Added today", fullDate: date.toLocaleDateString() };
        } else if (diffDays === 1) {
            return { text: "Added yesterday", fullDate: date.toLocaleDateString() };
        } else if (diffDays < 7) {
            return { text: `Added ${diffDays} days ago`, fullDate: date.toLocaleDateString() };
        } else {
            const fullDate = date.toLocaleDateString();
            return { text: `Added ${fullDate}`, fullDate };
        }
    };

    const isExpiringSoon = (dateString: string | null) => {
        if (!dateString) return false;
        const expireDate = new Date(dateString);
        const today = new Date();
        const diffTime = expireDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    };

    const isExpired = (dateString: string | null) => {
        if (!dateString) return false;
        const expireDate = new Date(dateString);
        const today = new Date();
        return expireDate < today;
    };

    const getExpiryStatus = (dateString: string | null) => {
        if (isExpired(dateString)) {
            return { color: "text-red-600", label: "Expired" };
        } else if (isExpiringSoon(dateString)) {
            return { color: "text-orange-600", label: "Expiring Soon" };
        } else {
            return { color: "text-green-600", label: "Fresh" };
        }
    };

    const handleUpdateBatch = async (batchId: number, field: 'quantity' | 'expire_date', value: string | number) => {
        if (!onUpdateBatch) return;
        try {
            setIsLoading(batchId);
            await onUpdateBatch(batchId, field, value);
        } catch (error) {
            console.error("Failed to update batch:", error);
        } finally {
            setIsLoading(null);
            setEditingBatch(null);
        }
    };

    const handleDeleteBatch = async (batchId: number) => {
        if (!onDeleteBatch) return;
        try {
            setIsLoading(batchId);
            await onDeleteBatch(batchId);
        } catch (error) {
            console.error("Failed to delete batch:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleAddNewBatch = async (itemId: number) => {
        if (!onAddBatch) return;
        try {
            setIsLoading(itemId);
            await onAddBatch(itemId, newBatchData.quantity, newBatchData.expire_date || null);
            setAddingBatchFor(null);
            setNewBatchData({ quantity: 1, expire_date: '' });
        } catch (error) {
            console.error("Failed to add batch:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCancelAddBatch = () => {
        setAddingBatchFor(null);
        setNewBatchData({ quantity: 1, expire_date: '' });
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/4">
                                            <button 
                                                onClick={() => handleSort('name')}
                                                className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            >
                                                <span>Item</span>
                                                {getSortIcon('name')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/8">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6">
                                            <button 
                                                onClick={() => handleSort('category')}
                                                className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            >
                                                <span>Category</span>
                                                {getSortIcon('category')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6">
                                            Expiry Info
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedItems.map((item) => {
                                        const calculatedQuantity = getCalculatedQuantity(item);
                                        const stockStatus = getStockStatus(calculatedQuantity);
                                        const isExpanded = expandedItems.has(item.id);
                                        const hasBatches = item.batches && item.batches.length > 0;
                                        
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className={`hover:bg-gray-50 transition-colors ${stockStatus.color}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap w-1/4">
                                                        <div className="flex items-center">
                                                            {hasBatches && (
                                                                <button
                                                                    onClick={() => toggleExpanded(item.id)}
                                                                    className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                                                >
                                                                    <ChevronRight 
                                                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                                                    />
                                                                </button>
                                                            )}
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
                                                    <td className="px-6 py-4 whitespace-nowrap w-1/8">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
                                                                {calculatedQuantity}
                                                            </span>
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${stockStatus.indicator}`}
                                                            />
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                ({hasBatches ? item.batches!.length : 1} batch{hasBatches && item.batches!.length !== 1 ? 'es' : ''})
                                                            </span>
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
                                                    <td className="px-6 py-4 whitespace-nowrap w-1/6">
                                                        <div className="space-y-1">
                                                            {hasBatches ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {item.batches!.length} batch{item.batches!.length !== 1 ? 'es' : ''}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500">No batches</div>
                                                            )}
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
                                                
                                                {/* Expanded rows for batches */}
                                                {isExpanded && hasBatches && item.batches!.map((batch) => (
                                                    <tr key={`batch-${batch.id}`} className="bg-gray-50">
                                                        <td className="px-6 py-3 pl-16">
                                                            <div 
                                                                className="text-sm text-gray-600 cursor-help"
                                                                title={formatCreatedDate(batch.created_at).fullDate}
                                                            >
                                                                {formatCreatedDate(batch.created_at).text}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            {editingBatch === batch.id ? (
                                                                <input
                                                                    type="number"
                                                                    defaultValue={batch.quantity}
                                                                    className="w-20 p-1 border rounded text-sm"
                                                                    onBlur={(e) => handleUpdateBatch(batch.id, 'quantity', parseInt(e.target.value))}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleUpdateBatch(batch.id, 'quantity', parseInt(e.currentTarget.value));
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-medium">
                                                                        {batch.quantity} units
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setEditingBatch(batch.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded"
                                                                    >
                                                                        <Edit className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="text-sm text-gray-500">-</div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                                <input
                                                                    type="date"
                                                                    defaultValue={batch.expire_date || ''}
                                                                    className="text-sm border rounded px-2 py-1"
                                                                    onChange={(e) => handleUpdateBatch(batch.id, 'expire_date', e.target.value || '')}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <button
                                                                onClick={() => handleDeleteBatch(batch.id)}
                                                                disabled={isLoading === batch.id}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                
                                                {/* Add new batch row - only show when expanded */}
                                                {isExpanded && addingBatchFor === item.id ? (
                                                    <tr className="bg-blue-50">
                                                        <td className="px-6 py-3 pl-16">
                                                            <div className="text-sm text-blue-600 font-medium">
                                                                New Batch
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={newBatchData.quantity}
                                                                className="w-20 p-1 border rounded text-sm"
                                                                onChange={(e) => setNewBatchData({...newBatchData, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                                                                autoFocus
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="text-sm text-gray-500">-</div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                                <input
                                                                    type="date"
                                                                    value={newBatchData.expire_date}
                                                                    className="text-sm border rounded px-2 py-1"
                                                                    onChange={(e) => setNewBatchData({...newBatchData, expire_date: e.target.value})}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center space-x-1">
                                                                <button
                                                                    onClick={() => handleAddNewBatch(item.id)}
                                                                    disabled={isLoading === item.id}
                                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors disabled:opacity-50"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelAddBatch}
                                                                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-1 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : isExpanded ? (
                                                    <tr className="bg-gray-50">
                                                        <td colSpan={5} className="px-6 py-2">
                                                            <button
                                                                onClick={() => setAddingBatchFor(item.id)}
                                                                className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                <span>Add new batch</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </React.Fragment>
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
                {sortedItems.map((item) => {
                    const calculatedQuantity = getCalculatedQuantity(item);
                    const stockStatus = getStockStatus(calculatedQuantity);
                    const hasBatches = item.batches && item.batches.length > 0;
                    const isExpanded = expandedItems.has(item.id);
                    
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

                                    {/* Expiry Info */}
                                    {hasBatches && (
                                        <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Expiry
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {hasBatches ? (
                                                    <>
                                                        <span className="text-sm text-gray-600">
                                                            {item.batches!.length} batch{item.batches!.length !== 1 ? 'es' : ''}
                                                        </span>
                                                        <button
                                                            onClick={() => toggleExpanded(item.id)}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        >
                                                            <ChevronRight 
                                                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                                            />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No batches</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expanded Batches */}
                                    {isExpanded && hasBatches && (
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                            {item.batches!.map((batch) => (
                                                <div key={batch.id} className="bg-white rounded-lg p-3 border">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span 
                                                            className="text-sm font-medium text-gray-700 cursor-help"
                                                            title={formatCreatedDate(batch.created_at).fullDate}
                                                        >
                                                            {formatCreatedDate(batch.created_at).text}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteBatch(batch.id)}
                                                            disabled={isLoading === batch.id}
                                                            className="text-red-600 hover:text-red-800 p-1 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Quantity:</span>
                                                            {editingBatch === batch.id ? (
                                                                <input
                                                                    type="number"
                                                                    defaultValue={batch.quantity}
                                                                    className="w-20 p-1 border rounded text-sm"
                                                                    onBlur={(e) => handleUpdateBatch(batch.id, 'quantity', parseInt(e.target.value))}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleUpdateBatch(batch.id, 'quantity', parseInt(e.currentTarget.value));
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-medium">
                                                                        {batch.quantity} units
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setEditingBatch(batch.id)}
                                                                        className="p-1 hover:bg-gray-200 rounded"
                                                                    >
                                                                        <Edit className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Expiry Date:</span>
                                                            <input
                                                                type="date"
                                                                defaultValue={batch.expire_date || ''}
                                                                className="text-sm border rounded px-2 py-1"
                                                                onChange={(e) => handleUpdateBatch(batch.id, 'expire_date', e.target.value || '')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Add new batch card for mobile - only show when expanded */}
                                            {isExpanded && addingBatchFor === item.id ? (
                                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-blue-700">
                                                            New Batch
                                                        </span>
                                                        <div className="flex items-center space-x-1">
                                                            <button
                                                                onClick={() => handleAddNewBatch(item.id)}
                                                                disabled={isLoading === item.id}
                                                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelAddBatch}
                                                                className="text-gray-600 hover:text-gray-800 p-1 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Quantity:</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={newBatchData.quantity}
                                                                className="w-20 p-1 border rounded text-sm"
                                                                onChange={(e) => setNewBatchData({...newBatchData, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">Expiry Date:</span>
                                                            <input
                                                                type="date"
                                                                value={newBatchData.expire_date}
                                                                className="text-sm border rounded px-2 py-1"
                                                                onChange={(e) => setNewBatchData({...newBatchData, expire_date: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : isExpanded ? (
                                                <div className="bg-gray-50 rounded-lg p-3 border">
                                                    <button
                                                        onClick={() => setAddingBatchFor(item.id)}
                                                        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span>Add new batch</span>
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

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
                                        <div className="text-center">
                                            <span className="text-xl font-bold text-gray-900">
                                                {calculatedQuantity}
                                            </span>
                                            <div className="text-xs text-gray-500">
                                                {hasBatches ? item.batches!.length : 1} batch{hasBatches && item.batches!.length !== 1 ? 'es' : ''}
                                            </div>
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