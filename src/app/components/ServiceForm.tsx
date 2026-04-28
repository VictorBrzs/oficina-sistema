import { useEffect, useState } from 'react';
import type { Client, ServiceOrder, ServiceStatus } from '@/lib/workshop';

interface ServiceFormProps {
  clients: Client[];
  service?: ServiceOrder | null;
  onSubmit: (data: {
    clientId: string;
    title: string;
    details: string;
    price: number;
    status: ServiceStatus;
  }) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function ServiceForm({
  clients,
  service,
  onSubmit,
  onCancel,
  submitting = false,
}: ServiceFormProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    details: '',
    price: '',
    status: 'pending' as ServiceStatus,
  });

  useEffect(() => {
    setFormData({
      clientId: service?.clientId || clients[0]?.id || '',
      title: service?.title || '',
      details: service?.details || '',
      price: service ? String(service.price ?? 0) : '',
      status: service?.status || 'pending',
    });
  }, [service, clients]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      clientId: formData.clientId,
      title: formData.title.trim(),
      details: formData.details.trim(),
      price: Number(formData.price),
      status: formData.status,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[1.5rem] border border-orange-100 bg-white p-5 shadow-sm"
    >
      {clients.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre um cliente antes de abrir uma ordem de servico.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Cliente *
          </label>
          <select
            value={formData.clientId}
            onChange={(event) =>
              setFormData((current) => ({ ...current, clientId: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            required
            disabled={clients.length === 0}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                status: event.target.value as ServiceStatus,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
            required
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluido</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Valor do servico *
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
          Titulo do servico *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(event) =>
            setFormData((current) => ({ ...current, title: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
          placeholder="Ex: Troca de oleo"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Detalhes da ordem *
        </label>
        <textarea
          value={formData.details}
          onChange={(event) =>
            setFormData((current) => ({ ...current, details: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
          placeholder="Descreva o servico executado ou solicitado."
          rows={5}
          required
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
          disabled={submitting || clients.length === 0}
        >
          {submitting
            ? 'Salvando...'
            : service
              ? 'Atualizar ordem'
              : 'Salvar ordem'}
        </button>
      </div>
    </form>
  );
}
