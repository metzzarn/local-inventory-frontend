import React, { useState, useRef, useEffect } from "react";
import { PlusCircle, Calendar, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemBatch } from "@/types";

interface AddItemFormProps {
    onAddItem: (item: {
        name: string;
        category: string;
        batches: Omit<ItemBatch, 'id'>[];
    }) => Promise<void>;
    onCancel: () => void;
    existingItems: Item[];
    initialValues?: {
        name: string;
        category: string;
    };
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
    onAddItem,
    onCancel,
    existingItems,
    initialValues = { name: "", category: "" },
}) => {
    const [formData, setFormData] = useState(initialValues);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [batches, setBatches] = useState<Array<{quantity: number, expire_date: string | null}>>([{quantity: 1, expire_date: null}]);

    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFormData(initialValues);
    }, [initialValues]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getUniqueCategories = () => {
        return Array.from(new Set(existingItems.map((item) => item.category)));
    };

    const filterSuggestions = (input: string) => {
        const uniqueCategories = getUniqueCategories();
        const filtered = uniqueCategories.filter((category) =>
            category.toLowerCase().includes(input.toLowerCase())
        );
        setSuggestions(filtered);
        setSelectedSuggestionIndex(-1);
        setShowSuggestions(true);
    };

    const addBatch = () => {
        setBatches([...batches, { quantity: 1, expire_date: null }]);
    };

    const removeBatch = (index: number) => {
        if (batches.length <= 1) return; // Always keep at least one batch
        
        const updatedBatches = batches.filter((_, i) => i !== index);
        setBatches(updatedBatches);
        
        // Total quantity is auto-calculated from batches
    };

    const updateBatch = (index: number, field: 'quantity' | 'expire_date', value: number | string | null) => {
        const updatedBatches = [...batches];
        
        // Ensure quantity is at least 1
        if (field === 'quantity') {
            const quantity = typeof value === 'number' ? value : parseInt(value as string) || 1;
            updatedBatches[index] = { ...updatedBatches[index], [field]: Math.max(1, quantity) };
        } else {
            updatedBatches[index] = { ...updatedBatches[index], [field]: value };
        }
        
        setBatches(updatedBatches);
        
        // Total quantity is auto-calculated from batches
    };

    const getTotalBatchQuantity = () => {
        return batches.reduce((total, batch) => total + batch.quantity, 0);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category) {
            return;
        }

        const totalQuantity = getTotalBatchQuantity();
        
        if (totalQuantity <= 0) {
            alert("Total quantity must be greater than 0");
            return;
        }

        const finalBatches = batches.map(batch => ({
            quantity: batch.quantity,
            expire_date: batch.expire_date
        }));

        await onAddItem({
            name: formData.name,
            category: formData.category,
            batches: finalBatches,
        });

        setFormData({ name: "", category: "" });
        setBatches([{quantity: 1, expire_date: null}]);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, category: value });
        filterSuggestions(value);
    };

    const handleCategorySelect = (category: string) => {
        setFormData({ ...formData, category });
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    const handleCategoryFocus = () => {
        filterSuggestions(formData.category);
    };

    const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                    handleCategorySelect(suggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    const isFormValid = formData.name && formData.category && batches.length > 0 && getTotalBatchQuantity() > 0;

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-lg">Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Item Name"
                        className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                    />
                    {/* Quantity is now auto-calculated from batches */}
                    <div className="relative" ref={suggestionsRef}>
                        <input
                            type="text"
                            placeholder="Category"
                            className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                            value={formData.category}
                            onChange={handleCategoryChange}
                            onFocus={handleCategoryFocus}
                            onKeyDown={handleCategoryKeyDown}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                {suggestions.map((category, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 cursor-pointer text-base transition-colors ${
                                            index === selectedSuggestionIndex 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'hover:bg-gray-100'
                                        }`}
                                        onClick={() =>
                                            handleCategorySelect(category)
                                        }
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                    >
                                        {category}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Batch Management */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700">Item Batches</h4>
                            <button
                                type="button"
                                onClick={addBatch}
                                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Batch</span>
                            </button>
                        </div>
                        
                        {batches.map((batch, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    min="1"
                                    className="w-20 p-2 border rounded text-sm"
                                    value={batch.quantity || 1}
                                    onChange={(e) => updateBatch(index, 'quantity', parseInt(e.target.value) || 1)}
                                />
                                <input
                                    type="date"
                                    placeholder="Expiry (optional)"
                                    className="flex-1 p-2 border rounded text-sm"
                                    value={batch.expire_date || ''}
                                    onChange={(e) => updateBatch(index, 'expire_date', e.target.value || null)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBatch(index)}
                                    disabled={batches.length <= 1}
                                    className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        
                        {batches.length > 0 && (
                            <div className="text-sm text-gray-700 p-3 bg-blue-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total Quantity:</span>
                                    <span className="font-bold text-lg">{getTotalBatchQuantity()}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Automatically calculated from batch quantities
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] transition-colors ${
                                isFormValid
                                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Add Item
                        </button>
                        <button
                            className="bg-gray-500 text-white p-3 rounded-lg min-h-[44px] hover:bg-gray-600 transition-colors"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
