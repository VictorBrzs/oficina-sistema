import { useState } from 'react';

interface CategoryFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
}

const PRESET_COLORS = [
  '#f97316',
  '#ef4444',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#71717a',
  '#78716c',
  '#dc2626',
];

export function CategoryForm({
  onSubmit,
  onCancel,
  submitting = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#f97316',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Nome da categoria *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          placeholder="Ex: Motor, Freios, Suspensão, Elétrica..."
          required
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Cor da categoria *
        </label>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`h-10 w-10 rounded-lg transition ${
                formData.color === color
                  ? 'ring-2 ring-gray-900 ring-offset-2'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="mt-3">
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10 w-full cursor-pointer rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 rounded-lg border bg-white p-4">
        <div
          className="h-12 w-12 rounded-lg"
          style={{ backgroundColor: formData.color }}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {formData.name || 'Nome da categoria'}
          </p>
          <p className="text-xs text-gray-500">Prévia</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-lg bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Criar categoria'}
        </button>
      </div>
    </form>
  );
}
