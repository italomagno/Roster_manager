'use client'

import { useState, useEffect } from 'react'
import { Position, CompanyRole } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getPositions, savePosition, deletePosition } from '../../../lib/services/positions'
import { Button, Modal, Input } from '../../../components/ui'
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
]

export default function PositionsPage() {
  const { user } = useAuth()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  const isManager = user?.role === CompanyRole.MANAGER || user?.role === CompanyRole.OWNER

  const fetchData = async () => {
    if (!user?.companyId) return
    setIsLoading(true)
    try {
      const pos = await getPositions(user.companyId)
      setPositions(pos)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleAddPosition = () => {
    if (!isManager) return
    setEditingPosition(null)
    setSelectedColor(PRESET_COLORS[0])
    setIsModalOpen(true)
  }

  const handleEditPosition = (position: Position) => {
    if (!isManager) return
    setEditingPosition(position)
    setSelectedColor(position.color)
    setIsModalOpen(true)
  }

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const positionData: Position = {
      id: editingPosition?.id || `pos_${Date.now()}`,
      companyId: user!.companyId,
      name: formData.get('name') as string,
      color: selectedColor,
    }

    await savePosition(positionData)
    setIsModalOpen(false)
    fetchData()
  }

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this position? This action cannot be undone.')) return
    await deletePosition(positionId)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Positions</h1>
          <p className="text-sm text-slate-500 mt-1">
            {positions.length} position{positions.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        {isManager && (
          <Button onClick={handleAddPosition} className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Position
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${pos.color}20`, border: `2px solid ${pos.color}` }}
                  >
                    <Briefcase className="w-5 h-5" style={{ color: pos.color }} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {pos.name}
                    </h3>
                  </div>
                </div>
                {isManager && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEditPosition(pos)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePosition(pos.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Color:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border-2"
                      style={{ backgroundColor: pos.color, borderColor: pos.color }}
                    ></div>
                    <span className="text-slate-600 font-mono text-xs">{pos.color}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {positions.length === 0 && !isLoading && (
            <div className="col-span-full bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No positions yet. Add your first position to get started.</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPosition ? 'Edit Position' : 'Add Position'}
      >
        <form onSubmit={handleSavePosition} className="space-y-4 text-left">
          <Input
            label="Position Name"
            name="name"
            defaultValue={editingPosition?.name || ''}
            required
            placeholder="e.g., Server, Bartender, Chef"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Position Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-full h-12 rounded-md border-2 transition-all ${
                    selectedColor === color
                      ? 'border-slate-900 scale-105 shadow-md'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <span className="text-white font-bold text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Input
                label="Or enter a custom hex color"
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
