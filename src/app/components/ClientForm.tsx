import { useEffect, useState } from 'react';

interface ClientFormProps {
  client?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export function ClientForm({
  client,
  onSubmit,
  onCancel,
  submitting = false,
}: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    vehicle: '',
    licensePlate: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        document: client.document || '',
        vehicle: client.vehicle || '',
        licensePlate: client.licensePlate || '',
        notes: client.notes || '',
      });
      return;
    }

    setFormData({
      name: '',
      phone: '',
      email: '',
      document: '',
      vehicle: '',
      licensePlate: '',
      notes: '',
    });
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nome do cliente *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Joao da Silva"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="(13) 99999-9999"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Documento
          </label>
          <input
            type="text"
            value={formData.document}
            onChange={(e) =>
              setFormData({ ...formData, document: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="CPF ou CNPJ"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Veiculo
          </label>
          <input
            type="text"
            value={formData.vehicle}
            onChange={(e) =>
              setFormData({ ...formData, vehicle: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Gol 1.0 2018"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Placa
          </label>
          <input
            type="text"
            value={formData.licensePlate}
            onChange={(e) =>
              setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="ABC1D23"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Observacoes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          placeholder="Informacoes importantes sobre o cliente ou o veiculo..."
          rows={4}
        />
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
          {submitting
            ? 'Salvando...'
            : client?.id
              ? 'Atualizar cliente'
              : 'Criar cliente'}
        </button>
      </div>
    </form>
  );
}
