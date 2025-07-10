import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trash2, Plus, Minus, Check, X, Camera, XCircle, LogOut, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { Item } from '@/types';
import { ViewMode } from './AppRouter';

interface InventoryManagerProps {
  onNavigate: (view: ViewMode) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { makeRequest } = useApi();
  
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    category: '',
  });

  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Item } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch items with authentication
  const fetchItems = async () => {
    try {
      const response = await makeRequest('http://localhost:3001/api/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
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
      if (editInputRef.current && !editInputRef.current.contains(event.target as Node) &&
          (!suggestionsRef.current || !suggestionsRef.current.contains(event.target as Node))) {
        saveEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell, editValue]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowScanner(false);
  };

  const handleScan = () => {
    const mockScannedItem = {
      name: 'Scanned Item ' + Math.floor(Math.random() * 1000),
      quantity: '1',
      category: 'Scanned',
    };
    setNewItem(mockScannedItem);
    stopCamera();
  };

  const getRowColor = (quantity: number) => {
    if (quantity <= 5) return 'bg-red-50';
    if (quantity <= 20) return 'bg-yellow-50';
    return '';
  };

  const handleQuantityChange = async (id: number, increment: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + increment);

    try {
      const response = await makeRequest(`http://localhost:3001/api/items/${id}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const updatedItem = await response.json();
      setItems(items.map(i => i.id === id ? updatedItem : i));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(items.map(item => item.category)));
  };

  const filterSuggestions = (input: string) => {
    const uniqueCategories = getUniqueCategories();
    const filtered = uniqueCategories.filter(category =>
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
      const response = await makeRequest('http://localhost:3001/api/items', {
        method: 'POST',
        body: JSON.stringify({
          ...newItem,
          quantity: parseInt(newItem.quantity),
        }),
      });
      
      const item = await response.json();
      setItems([...items, item]);
      setNewItem({ name: '', quantity: '', category: '' });
      setShowAlert(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await makeRequest(`http://localhost:3001/api/items/${id}`, {
        method: 'DELETE',
      });

      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const startEditing = (id: number, field: keyof Item, value: string | number) => {
    setEditingCell({ id, field });
    setEditValue(value.toString());
    setShowSuggestions(field === 'category');
    if (field === 'category') {
      filterSuggestions(value.toString());
    }
  };

  const handleCellClick = (id: number, field: keyof Item, value: string | number) => {
    if (!editingCell) {
      startEditing(id, field, value);
    }
  };

  const saveEdit = async () => {
    if (editingCell) {
      try {
        const response = await makeRequest(`http://localhost:3001/api/items/${editingCell.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ [editingCell.field]: editValue }),
        });

        const updatedItem = await response.json();
        setItems(items.map(item => item.id === editingCell.id ? updatedItem : item));
        setEditingCell(null);
        setEditValue('');
        setShowSuggestions(false);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
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
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <input
              ref={editInputRef}
              type="text"
              className="w-full p-1 border rounded"
              value={editValue}
              onChange={field === 'category' ? handleCategoryChange : (e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            {field === 'category' && showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg" ref={suggestionsRef}>
                {suggestions.map((category, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectCategory(category)}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={saveEdit} className="text-green-500 hover:text-green-700">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={cancelEdit} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
        onClick={() => handleCellClick(item.id, field, item[field])}
      >
        {item[field]}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Store Inventory Management</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <button
                onClick={() => onNavigate('profile')}
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
        </CardHeader>
        <CardContent>
          {showScanner ? (
            <div className="relative mb-4">
              <div className="relative aspect-video w-full max-w-xl mx-auto">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="w-full h-full rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-red-500 pointer-events-none">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500"/>
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-red-500"/>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={handleScan}
                  className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                placeholder="Item Name"
                className="p-2 border rounded"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <input
                type="number"
                placeholder="Quantity"
                className="p-2 border rounded"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
              <div className="relative" ref={suggestionsRef}>
                <input
                  type="text"
                  placeholder="Category"
                  className="p-2 border rounded w-full"
                  value={newItem.category}
                  onChange={(e) => {
                    setNewItem({ ...newItem, category: e.target.value });
                    filterSuggestions(e.target.value);
                  }}
                  onFocus={() => filterSuggestions(newItem.category)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                    {suggestions.map((category, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setNewItem({ ...newItem, category });
                          setShowSuggestions(false);
                        }}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2"
                onClick={handleAddItem}
              >
                <PlusCircle className="w-4 h-4" />
                Add Item
              </button>
              <button
                className="bg-purple-500 text-white p-2 rounded flex items-center justify-center gap-2"
                onClick={startCamera}
              >
                <Camera className="w-4 h-4" />
                Scan Item
              </button>
            </div>
          )}

          {showAlert && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Please fill in all fields before adding an item.
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={`border-b transition-colors ${getRowColor(item.quantity)}`}>
                    <td className="p-2">{renderCell(item, 'name')}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2">{renderCell(item, 'category')}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};