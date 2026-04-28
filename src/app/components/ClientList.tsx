import type { Client } from '@/lib/workshop';

interface ClientListProps {
  clients: Client[];
  selectedClientId?: string;
  onSelect: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientList({
  clients,
  selectedClientId,
  onSelect,
  onEdit,
  onDelete,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        Nenhum cliente cadastrado.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {clients.map((client) => {
        const isSelected = selectedClientId === client.id;

        return (
          <div
            key={client.id}
            className={`rounded-[1.5rem] border p-4 transition ${
              isSelected
                ? 'border-orange-300 bg-orange-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(client)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {client.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {client.phone || client.email || 'Sem contato informado'}
                  </p>
                  {(client.vehicle || client.licensePlate) && (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {[client.vehicle, client.licensePlate].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                  Historico
                </span>
              </div>
            </button>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(client)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(client.id)}
                className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-center text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
