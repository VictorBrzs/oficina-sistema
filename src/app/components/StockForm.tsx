import { useEffect, useState } from 'react';
import type { StockItem } from '@/lib/workshop';

interface StockFormProps {
  item?: StockItem | null;
  onSubmit: (data: {
    partCode: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function StockForm({
  item,
  onSubmit,
  onCancel,
  submitting = false,
}: StockFormProps) {
  const [formData, setFormData] = useState({
    partCode: '',
    name: '',
    quantity: '',
    price: '',
    imageUrl: '',
  });

  useEffect(() => {
    setFormData({
      partCode: item?.partCode || '',
      name: item?.name || '',
      quantity: item ? String(item.quantity ?? 0) : '',
      price: item ? String(item.price ?? 0) : '',
      imageUrl: item?.imageUrl || '',
    });
  }, [item]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      partCode: formData.partCode.trim(),
      name: formData.name.trim(),
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      imageUrl: formData.imageUrl.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[1.5rem] border border-orange-100 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Codigo da peca *
          </label>
          <input
            type="text"
            value={formData.partCode}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                partCode: event.target.value.toUpperCase(),
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            placeholder="Ex: FL-001"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nome da peca *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            placeholder="Ex: Pastilha de freio"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Quantidade *
          </label>
          <input
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(event) =>
              setFormData((current) => ({ ...current, quantity: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Preco *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(event) =>
              setFormData((current) => ({ ...current, price: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            placeholder="0,00"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          URL da imagem
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(event) =>
            setFormData((current) => ({ ...current, imageUrl: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : item ? 'Atualizar peca' : 'Salvar peca'}
        </button>
      </div>
    </form>
  );
}
