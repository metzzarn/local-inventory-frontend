import React, { useState, useRef, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@/types";

interface AddItemFormProps {
    onAddItem: (item: {
        name: string;
        quantity: number;
        category: string;
    }) => Promise<void>;
    onCancel: () => void;
    existingItems: Item[];
    initialValues?: {
        name: string;
        quantity: string;
        category: string;
    };
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
    onAddItem,
    onCancel,
    existingItems,
    initialValues = { name: "", quantity: "", category: "" },
}) => {
    const [formData, setFormData] = useState(initialValues);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFormData(initialValues);
    }, [initialValues]);

    const getUniqueCategories = () => {
        return Array.from(new Set(existingItems.map((item) => item.category)));
    };

    const filterSuggestions = (input: string) => {
        const uniqueCategories = getUniqueCategories();
        const filtered = uniqueCategories.filter((category) =>
            category.toLowerCase().includes(input.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.quantity || !formData.category) {
            return;
        }

        await onAddItem({
            name: formData.name,
            quantity: parseInt(formData.quantity),
            category: formData.category,
        });

        setFormData({ name: "", quantity: "", category: "" });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, category: value });
        filterSuggestions(value);
    };

    const handleCategorySelect = (category: string) => {
        setFormData({ ...formData, category });
        setShowSuggestions(false);
    };

    const handleCategoryFocus = () => {
        filterSuggestions(formData.category);
    };

    const isFormValid = formData.name && formData.quantity && formData.category;

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
                    <input
                        type="number"
                        placeholder="Quantity"
                        className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                        value={formData.quantity}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                quantity: e.target.value,
                            })
                        }
                    />
                    <div className="relative" ref={suggestionsRef}>
                        <input
                            type="text"
                            placeholder="Category"
                            className="w-full p-3 border rounded-lg text-base min-h-[44px]"
                            value={formData.category}
                            onChange={handleCategoryChange}
                            onFocus={handleCategoryFocus}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                {suggestions.map((category, index) => (
                                    <div
                                        key={index}
                                        className="p-3 hover:bg-gray-100 cursor-pointer text-base"
                                        onClick={() =>
                                            handleCategorySelect(category)
                                        }
                                    >
                                        {category}
                                    </div>
                                ))}
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
