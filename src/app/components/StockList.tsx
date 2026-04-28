import type { StockItem } from '@/lib/workshop';
import { formatCurrency } from '@/lib/workshop';

interface StockListProps {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
}

export function StockList({ items, onEdit, onDelete }: StockListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        Nenhuma peca cadastrada.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Peca
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                    {item.partCode}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {item.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {item.quantity} un.
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
