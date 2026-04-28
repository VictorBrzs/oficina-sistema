import type { Client, ServiceOrder } from '@/lib/workshop';
import {
  getServiceStatusClasses,
  getServiceStatusLabel,
} from '@/lib/workshop';

interface ClientHistoryPanelProps {
  client: Client | null;
  history: ServiceOrder[];
}

export function ClientHistoryPanel({
  client,
  history,
}: ClientHistoryPanelProps) {
  if (!client) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Selecione um cliente para ver os dados e o historico.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
          Cliente
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{client.name}</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>{client.phone || 'Telefone nao informado'}</p>
          <p>{client.email || 'Email nao informado'}</p>
          <p>{client.document || 'Documento nao informado'}</p>
          <p>
            {[client.vehicle, client.licensePlate].filter(Boolean).join(' - ') ||
              'Veiculo nao informado'}
          </p>
        </div>
        {client.notes && <p className="mt-3 text-sm text-slate-600">{client.notes}</p>}
      </div>

      <div>
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
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
