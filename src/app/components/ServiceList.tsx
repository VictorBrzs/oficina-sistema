import type { Client, ServiceOrder } from '@/lib/workshop';
import {
  getServiceStatusClasses,
  getServiceStatusLabel,
} from '@/lib/workshop';

interface ServiceListProps {
  services: ServiceOrder[];
  clients: Client[];
  onEdit: (service: ServiceOrder) => void;
  onDelete: (id: string) => void;
}

export function ServiceList({
  services,
  clients,
  onEdit,
  onDelete,
}: ServiceListProps) {
  const getClientName = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.name || 'Cliente removido';

  if (services.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        Nenhuma ordem aberta no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {services.map((service) => (
        <article
          key={service.id}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                  {service.orderNumber}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  {service.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {getClientName(service.clientId)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getServiceStatusClasses(service.status)}`}
              >
                {getServiceStatusLabel(service.status)}
              </span>
            </div>

            <p className="text-sm leading-7 text-slate-600">{service.details}</p>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(service)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(service.id)}
                className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
