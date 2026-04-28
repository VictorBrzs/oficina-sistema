import { useEffect, useMemo, useState } from 'react';
import { ClientForm } from './ClientForm';
import { ClientHistoryPanel } from './ClientHistoryPanel';
import { ClientList } from './ClientList';
import { ServiceForm } from './ServiceForm';
import { ServiceList } from './ServiceList';
import { StatsCards } from './StatsCards';
import { StockForm } from './StockForm';
import { StockList } from './StockList';
import { apiRequest } from '@/lib/api';
import type { Client, ServiceOrder, StockItem } from '@/lib/workshop';

interface DashboardProps {
  accessToken: string;
  userEmail: string;
  onAuthFailure: () => void | Promise<void>;
  onLogout: () => void;
}

type DashboardTab = 'stock' | 'services' | 'clients';

function normalizeSearchValue(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes('unauthorized')
  );
}

export function Dashboard({
  accessToken,
  userEmail,
  onAuthFailure,
  onLogout,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('stock');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [editingService, setEditingService] = useState<ServiceOrder | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  const handleApiError = async (currentError: unknown, fallback: string) => {
    console.error(currentError);

    if (isUnauthorizedError(currentError)) {
      setError('Sua sessao expirou. Entre novamente para continuar.');
      await onAuthFailure();
      return;
    }

    setError(currentError instanceof Error ? currentError.message : fallback);
  };

  const fetchData = async () => {
    try {
      setError('');

      const [stockResult, servicesResult, clientsResult] = await Promise.all([
        apiRequest<{ items: StockItem[] }>('/stock', accessToken),
        apiRequest<{ services: ServiceOrder[] }>('/services', accessToken),
        apiRequest<{ clients: Client[] }>('/clients', accessToken),
      ]);

      const nextStockItems = [...(stockResult.items || [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const nextClients = [...(clientsResult.clients || [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setStockItems(nextStockItems);
      setServices(servicesResult.services || []);
      setClients(nextClients);

      setSelectedClient((current) => {
        if (!current) return nextClients[0] || null;
        return nextClients.find((client) => client.id === current.id) || nextClients[0] || null;
      });
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  );

  const activeServices = useMemo(
    () => services.filter((service) => service.status !== 'completed'),
    [services],
  );

  const selectedClientHistory = useMemo(() => {
    if (!selectedClient) return [];

    return services
      .filter((service) => service.clientId === selectedClient.id)
      .sort((a, b) => {
        const left = a.updatedAt || a.createdAt || '';
        const right = b.updatedAt || b.createdAt || '';
        return right.localeCompare(left);
      });
  }, [services, selectedClient]);

  const filteredStockItems = useMemo(() => {
    const query = normalizeSearchValue(stockSearch);
    if (!query) return stockItems;

    return stockItems.filter((item) =>
      [item.partCode, item.name].some((value) =>
        normalizeSearchValue(value).includes(query),
      ),
    );
  }, [stockItems, stockSearch]);

  const filteredServices = useMemo(() => {
    const query = normalizeSearchValue(serviceSearch);
    if (!query) return activeServices;

    return activeServices.filter((service) =>
      [service.orderNumber, service.title, service.details, clientNameById.get(service.clientId)]
        .some((value) => normalizeSearchValue(value).includes(query)),
    );
  }, [activeServices, serviceSearch, clientNameById]);

  const filteredClients = useMemo(() => {
    const query = normalizeSearchValue(clientSearch);
    if (!query) return clients;

    return clients.filter((client) =>
      [
        client.name,
        client.phone,
        client.email,
        client.document,
        client.vehicle,
        client.licensePlate,
      ].some((value) => normalizeSearchValue(value).includes(query)),
    );
  }, [clients, clientSearch]);

  const stats = useMemo(() => {
    const stockValue = stockItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );

    return {
      totalStockItems: stockItems.length,
      totalClients: clients.length,
      activeServices: activeServices.length,
      completedServices: services.filter((service) => service.status === 'completed').length,
      stockValue,
      lowStockCount: stockItems.filter((item) => Number(item.quantity || 0) <= 3).length,
    };
  }, [stockItems, clients, activeServices, services]);

  const handleStockSubmit = async (data: {
    partCode: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest(
        editingStock ? `/stock/${editingStock.id}` : '/stock',
        accessToken,
        {
          method: editingStock ? 'PUT' : 'POST',
          body: JSON.stringify(data),
        },
      );

      setShowStockForm(false);
      setEditingStock(null);
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel salvar a peca.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceSubmit = async (data: {
    clientId: string;
    title: string;
    details: string;
    price: number;
    status: ServiceOrder['status'];
  }) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest(
        editingService ? `/services/${editingService.id}` : '/services',
        accessToken,
        {
          method: editingService ? 'PUT' : 'POST',
          body: JSON.stringify(data),
        },
      );

      setShowServiceForm(false);
      setEditingService(null);
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel salvar a ordem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientSubmit = async (data: Omit<Client, 'id'>) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest(
        editingClient ? `/clients/${editingClient.id}` : '/clients',
        accessToken,
        {
          method: editingClient ? 'PUT' : 'POST',
          body: JSON.stringify(data),
        },
      );

      setShowClientForm(false);
      setEditingClient(null);
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel salvar o cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStock = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peca?')) return;

    try {
      setError('');
      await apiRequest(`/stock/${id}`, accessToken, { method: 'DELETE' });
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel excluir a peca.');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem?')) return;

    try {
      setError('');
      await apiRequest(`/services/${id}`, accessToken, { method: 'DELETE' });
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel excluir a ordem.');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      setError('');
      await apiRequest(`/clients/${id}`, accessToken, { method: 'DELETE' });
      await fetchData();
    } catch (currentError) {
      await handleApiError(currentError, 'Nao foi possivel excluir o cliente.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fffaf5,_#f8fafc)]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Carregando oficina...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf5,_#f8fafc)]">
      <nav className="border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
                <img
                  src="/logo-minha-oficina.png"
                  alt="Minha Oficina"
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                  Minha Oficina
                </p>
                <h1 className="text-xl font-semibold text-slate-900">Painel da oficina</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left shadow-sm sm:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Conectado
                </p>
                <span className="text-sm font-medium text-slate-700">{userEmail}</span>
              </div>
              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <StatsCards stats={stats} />

        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto">
              {[
                ['stock', 'Estoque'],
                ['services', 'Servicos'],
                ['clients', 'Clientes'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value as DashboardTab)}
                  className={`shrink-0 border-b-2 px-2 py-4 text-sm font-medium transition ${
                    activeTab === value
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'stock' && (
              <section className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Estoque</h2>
                    <p className="text-sm text-slate-500">
                      Cadastre pecas com codigo unico, quantidade e preco.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStock(null);
                      setShowStockForm(true);
                    }}
                    className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    + Nova peca
                  </button>
                </div>

                {!showStockForm && (
                  <input
                    type="search"
                    value={stockSearch}
                    onChange={(event) => setStockSearch(event.target.value)}
                    placeholder="Buscar por codigo ou nome da peca"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                )}

                {showStockForm ? (
                  <StockForm
                    item={editingStock}
                    onSubmit={handleStockSubmit}
                    onCancel={() => {
                      setShowStockForm(false);
                      setEditingStock(null);
                    }}
                    submitting={submitting}
                  />
                ) : (
                  <StockList
                    items={filteredStockItems}
                    onEdit={(item) => {
                      setEditingStock(item);
                      setShowStockForm(true);
                    }}
                    onDelete={handleDeleteStock}
                  />
                )}
              </section>
            )}

            {activeTab === 'services' && (
              <section className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Servicos</h2>
                    <p className="text-sm text-slate-500">
                      Ordens abertas com status, detalhes e valor do atendimento.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setShowServiceForm(true);
                    }}
                    className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    + Nova ordem
                  </button>
                </div>

                {!showServiceForm && (
                  <input
                    type="search"
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder="Buscar por ordem, cliente ou servico"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                )}

                {showServiceForm ? (
                  <ServiceForm
                    clients={clients}
                    service={editingService}
                    onSubmit={handleServiceSubmit}
                    onCancel={() => {
                      setShowServiceForm(false);
                      setEditingService(null);
                    }}
                    submitting={submitting}
                  />
                ) : (
                  <ServiceList
                    services={filteredServices}
                    clients={clients}
                    onEdit={(service) => {
                      setEditingService(service);
                      setShowServiceForm(true);
                    }}
                    onDelete={handleDeleteService}
                  />
                )}
              </section>
            )}

            {activeTab === 'clients' && (
              <section className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Clientes</h2>
                    <p className="text-sm text-slate-500">
                      Cadastre os dados e toque no cliente para abrir o historico.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingClient(null);
                      setShowClientForm(true);
                    }}
                    className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    + Novo cliente
                  </button>
                </div>

                {!showClientForm && (
                  <input
                    type="search"
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                    placeholder="Buscar cliente por nome, telefone, email ou placa"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                  />
                )}

                {showClientForm ? (
                  <ClientForm
                    client={editingClient}
                    onSubmit={handleClientSubmit}
                    onCancel={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                    }}
                    submitting={submitting}
                  />
                ) : (
                  <ClientList
                    clients={filteredClients}
                    selectedClientId={selectedClient?.id}
                    onSelect={(client) => {
                      setSelectedClient(client);
                      setShowClientHistory(true);
                    }}
                    onEdit={(client) => {
                      setEditingClient(client);
                      setShowClientForm(true);
                    }}
                    onDelete={handleDeleteClient}
                  />
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {showClientHistory && (
        <ClientHistoryPanel
          client={selectedClient}
          history={selectedClientHistory}
          onClose={() => setShowClientHistory(false)}
        />
      )}
    </div>
  );
}
