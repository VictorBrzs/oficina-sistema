import type { Client, ServiceOrder } from '@/lib/workshop';
import {
  formatCurrency,
  getServiceStatusClasses,
  getServiceStatusLabel,
} from '@/lib/workshop';

interface ClientHistoryPanelProps {
  client: Client | null;
  history: ServiceOrder[];
  onClose: () => void;
}

export function ClientHistoryPanel({
  client,
  history,
  onClose,
}: ClientHistoryPanelProps) {
  if (!client) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-3 sm:items-center sm:justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
              Cliente
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{client.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            X
          </button>
        </div>

        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>{client.phone || 'Telefone nao informado'}</p>
          <p>{client.email || 'Email nao informado'}</p>
          <p>{client.document || 'Documento nao informado'}</p>
          <p>
            {[client.vehicle, client.licensePlate].filter(Boolean).join(' - ') ||
              'Veiculo nao informado'}
          </p>
        </div>
        {client.notes && <p className="mt-3 text-sm text-slate-600">{client.notes}</p>}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Historico de servicos
            </h4>
            <span className="text-xs text-slate-400">{history.length} registros</span>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Nenhum servico registrado para este cliente.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                        {service.orderNumber}
                      </p>
                      <h5 className="mt-1 text-sm font-semibold text-slate-900">
                        {service.title}
                      </h5>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getServiceStatusClasses(service.status)}`}
                    >
                      {getServiceStatusLabel(service.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {service.details}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(service.price)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
