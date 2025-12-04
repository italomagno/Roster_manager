
import React, { useState, useEffect } from 'react';
import { Position } from '../types';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Button, Input, Modal } from '../components/ui';
import { Plus, Trash2, Tag, Edit2 } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

const PositionsPage = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const fetchPositions = async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    const data = await store.getPositions(user.companyId);
    setPositions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPositions();
  }, [user]);

  const openModal = (pos?: Position) => {
    if (pos) {
      setEditingPosition(pos);
      setName(pos.name);
      setColor(pos.color);
    } else {
      setEditingPosition(null);
      setName('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    const newPosition: Position = {
      id: editingPosition?.id || `pos_${Date.now()}`,
      companyId: user.companyId,
      name,
      color,
    };

    await store.savePosition(newPosition);
    setIsModalOpen(false);
    fetchPositions();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will not remove the position from existing shifts, but it will be removed from the list.')) {
      await store.deletePosition(id);
      fetchPositions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Positions & Roles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Define the roles available for shifts and their colors.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Position
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading positions...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {positions.map((pos) => (
            <div key={pos.id} className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: pos.color }}
                >
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{pos.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{pos.color}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal(pos)}
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(pos.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {positions.length === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-neutral-800 rounded-lg border border-dashed border-slate-300 dark:border-neutral-600 text-slate-500">
              No positions defined. Click "Add Position" to create one.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPosition ? 'Edit Position' : 'New Position'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Position Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sous Chef"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color Label</label>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 dark:ring-offset-neutral-800 ${color === c ? 'ring-slate-400 scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 rounded border border-slate-200 dark:border-neutral-700" style={{ backgroundColor: color }}></div>
               <Input 
                 value={color} 
                 onChange={(e) => setColor(e.target.value)} 
                 placeholder="#000000"
                 className="font-mono"
               />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Position</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PositionsPage;
