interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  vehicle?: string;
  licensePlate?: string;
  notes?: string;
  createdAt?: string;
}

interface ClientListProps {
  clients: Client[];
  searchQuery?: string;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientList({
  clients,
  searchQuery = '',
  onEdit,
  onDelete,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7m5-12a2 2 0 110 4 2 2 0 010-4z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Nenhum cliente encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery.trim().length > 0
            ? 'Tente buscar por outro nome, telefone ou placa.'
            : 'Comece cadastrando os clientes da oficina.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {clients.map((client) => (
        <div
          key={client.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7m5-12a2 2 0 110 4 2 2 0 010-4z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {client.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleDateString('pt-BR')
                      : 'Cliente sem data'}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{client.phone || 'Telefone nao informado'}</p>
                  <p>{client.email || 'Email nao informado'}</p>
                  <p>{client.document || 'Documento nao informado'}</p>
                  <p>
                    {client.vehicle
                      ? client.licensePlate
                        ? `${client.vehicle} - ${client.licensePlate}`
                        : client.vehicle
                      : 'Veiculo nao informado'}
                  </p>
                </div>

                {client.notes && (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {client.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(client)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(client.id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-800"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
