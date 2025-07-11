import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, X, Edit3 } from "lucide-react";
import { Item } from "@/types";

interface EditableCellProps {
    item: Item;
    field: keyof Item;
    onUpdateItem: (id: number, field: keyof Item, value: string) => Promise<void>;
    getSuggestions?: () => string[];
    className?: string;
    placeholder?: string;
    isLoading?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
    item,
    field,
    onUpdateItem,
    getSuggestions,
    className = "",
    placeholder,
    isLoading = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const value = item[field];

    // Auto-focus when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Handle click outside to cancel editing
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isEditing &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                suggestionRef.current &&
                !suggestionRef.current.contains(event.target as Node)
            ) {
                handleCancelEdit();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditing]);

    // Update dropdown position when editing starts
    useEffect(() => {
        if (isEditing && showSuggestions && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isEditing, showSuggestions]);

    const startEdit = () => {
        setIsEditing(true);
        setEditValue(String(value));

        if (getSuggestions) {
            const suggestionList = getSuggestions();
            setSuggestions(suggestionList);
            setShowSuggestions(suggestionList.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!isEditing) return;

        try {
            await onUpdateItem(item.id, field, editValue);
            setIsEditing(false);
            setEditValue("");
            setShowSuggestions(false);
        } catch (error) {
            console.error("Failed to save edit:", error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
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
        const inputValue = e.target.value;
        setEditValue(inputValue);

        if (getSuggestions) {
            const suggestionList = getSuggestions();
            const filtered = suggestionList.filter((suggestion) =>
                suggestion.toLowerCase().includes(inputValue.toLowerCase())
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

    if (isEditing) {
        return (
            <div ref={containerRef} className="relative w-full max-w-full">
                <div className="flex items-center gap-1 w-full max-w-full overflow-hidden">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={placeholder}
                        style={{ width: 'calc(100% - 64px)' }}
                    />
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            disabled={isLoading || editValue.trim() === ""}
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
                </div>

                {showSuggestions && suggestions.length > 0 && 
                    createPortal(
                        <div
                            ref={suggestionRef}
                            className="fixed bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                            style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                width: dropdownPosition.width,
                                zIndex: 9999
                            }}
                        >
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    onClick={() => selectSuggestion(suggestion)}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>,
                        document.body
                    )
                }
            </div>
        );
    }

    return (
        <div
            onClick={startEdit}
            className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors group ${className}`}
        >
            <div className="flex items-center justify-between">
                <span>{value}</span>
                <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
};