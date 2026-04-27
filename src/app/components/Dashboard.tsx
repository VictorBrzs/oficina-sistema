import { useEffect, useMemo, useState } from 'react';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { ClientForm } from './ClientForm';
import { ClientList } from './ClientList';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { StatsCards } from './StatsCards';
import { apiRequest } from '@/lib/api';
import { inferItemKind, type ItemKind } from '@/lib/items';

interface DashboardProps {
  accessToken: string;
  userEmail: string;
  onAuthFailure: () => void | Promise<void>;
  onLogout: () => void;
}

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
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'clients'>(
    'products',
  );
  const [itemView, setItemView] = useState<ItemKind>('stock');
  const [newItemKind, setNewItemKind] = useState<ItemKind>('stock');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleApiError = async (error: unknown, fallback: string) => {
    console.error(error);

    if (isUnauthorizedError(error)) {
      setError('Sua sessao expirou. Entre novamente para continuar.');
      await onAuthFailure();
      return;
    }

    setError(error instanceof Error ? error.message : fallback);
  };

  const fetchData = async () => {
    try {
      setError('');

      const [productsResult, categoriesResult, clientsResult] = await Promise.allSettled([
        apiRequest<{ products: any[] }>('/products', accessToken),
        apiRequest<{ categories: any[] }>('/categories', accessToken),
        apiRequest<{ clients: any[] }>('/clients', accessToken),
      ]);

      if (productsResult.status === 'rejected') {
        throw productsResult.reason;
      }

      if (categoriesResult.status === 'rejected') {
        throw categoriesResult.reason;
      }

      const productsData = productsResult.value;
      const categoriesData = categoriesResult.value;

      setProducts(
        (productsData.products || []).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCategories(
        (categoriesData.categories || []).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      if (clientsResult.status === 'fulfilled') {
        setClients(
          (clientsResult.value.clients || []).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } else {
        setClients([]);
        setError(
          'A area de clientes precisa da Edge Function atualizada no Supabase para funcionar por completo.',
        );
      }
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel carregar os dados da oficina.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const stockProducts = useMemo(
    () => products.filter((product) => inferItemKind(product) === 'stock'),
    [products],
  );

  const serviceProducts = useMemo(
    () => products.filter((product) => inferItemKind(product) === 'service'),
    [products],
  );

  const categoryNamesById = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.id, category.name ?? 'Sem categoria']),
      ),
    [categories],
  );

  const clientNamesById = useMemo(
    () =>
      new Map(clients.map((client) => [client.id, client.name ?? 'Sem cliente'])),
    [clients],
  );

  const visibleProducts = itemView === 'service' ? serviceProducts : stockProducts;

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchValue(productSearch);

    if (!query) return visibleProducts;

    return visibleProducts.filter((product) => {
      const categoryName = categoryNamesById.get(product.category) || '';
      const clientName = clientNamesById.get(product.clientId) || '';

      return [product.name, product.description, categoryName, clientName].some((value) =>
        normalizeSearchValue(value).includes(query),
      );
    });
  }, [visibleProducts, productSearch, categoryNamesById, clientNamesById]);

  const filteredCategories = useMemo(() => {
    const query = normalizeSearchValue(categorySearch);

    if (!query) return categories;

    return categories.filter((category) =>
      normalizeSearchValue(category.name).includes(query),
    );
  }, [categories, categorySearch]);

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

  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      totalStockItems: stockProducts.length,
      totalServices: serviceProducts.length,
      totalCategories: categories.length,
      totalValue: stockProducts.reduce(
        (sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0),
        0,
      ),
      totalStock: stockProducts.reduce(
        (sum, product) => sum + Number(product.stock || 0),
        0,
      ),
      lowStockCount: stockProducts.filter(
        (product) => Number(product.stock || 0) < 10,
      ).length,
      totalClients: clients.length,
    }),
    [products, stockProducts, serviceProducts, categories, clients],
  );

  const handleProductSubmit = async (productData: any) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest(
        editingProduct?.id ? `/products/${editingProduct.id}` : '/products',
        accessToken,
        {
          method: editingProduct?.id ? 'PUT' : 'POST',
          body: JSON.stringify(productData),
        },
      );

      await fetchData();
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel salvar o item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      setError('');
      await apiRequest(`/products/${id}`, accessToken, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel excluir o item.');
    }
  };

  const handleCategorySubmit = async (categoryData: any) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest('/categories', accessToken, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });

      await fetchData();
      setShowCategoryForm(false);
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel salvar a categoria.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientSubmit = async (clientData: any) => {
    try {
      setSubmitting(true);
      setError('');

      await apiRequest(
        editingClient?.id ? `/clients/${editingClient.id}` : '/clients',
        accessToken,
        {
          method: editingClient?.id ? 'PUT' : 'POST',
          body: JSON.stringify(clientData),
        },
      );

      await fetchData();
      setShowClientForm(false);
      setEditingClient(null);
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel salvar o cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const linkedServices = products.filter(
      (product) => inferItemKind(product) === 'service' && product.clientId === id,
    );

    if (linkedServices.length > 0) {
      setError('Esse cliente ainda esta vinculado a servicos cadastrados.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      setError('');
      await apiRequest(`/clients/${id}`, accessToken, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel excluir o cliente.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const linkedProducts = products.filter((product) => product.category === id);
    if (linkedProducts.length > 0) {
      setError('Essa categoria ainda esta vinculada a itens de estoque ou servicos.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      setError('');
      await apiRequest(`/categories/${id}`, accessToken, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (error) {
      await handleApiError(error, 'Nao foi possivel excluir a categoria.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_28%),linear-gradient(180deg,_#fff7ed,_#f8fafc_55%,_#e2e8f0)]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Carregando dados da oficina...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_28%),linear-gradient(180deg,_#fff7ed,_#f8fafc_45%,_#e2e8f0)]">
      <nav className="border-b border-white/50 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-col justify-between gap-4 py-4 md:flex-row md:items-center">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-200">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                  sistema para oficinas
                </p>
                <h1 className="text-2xl font-bold text-slate-900">
                  Painel da oficina
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Conectado
                </p>
                <span className="text-sm font-medium text-slate-700">
                  {userEmail}
                </span>
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-6 rounded-[2rem] border border-white/60 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/30 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-orange-300">
              Operacao conectada
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Divida a operacao entre estoque, servicos e clientes sem perder visao do todo.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              Agora voce pode acompanhar itens fisicos, servicos prestados e a
              carteira de clientes em areas separadas, com filtros e indicadores
              mais claros.
            </p>
          </div>
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <span>Itens em estoque</span>
              <strong>{stockProducts.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <span>Servicos cadastrados</span>
              <strong>{serviceProducts.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <span>Categorias ativas</span>
              <strong>{categories.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <span>Clientes cadastrados</span>
              <strong>{clients.length}</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <StatsCards stats={stats} />

        <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/80 shadow-xl shadow-slate-300/20 backdrop-blur">
          <div className="border-b">
            <div className="flex space-x-6 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-5 border-b-2 font-medium text-sm transition ${
                  activeTab === 'products'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Estoque e Servicos
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-5 border-b-2 font-medium text-sm transition ${
                  activeTab === 'categories'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Categorias
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-5 border-b-2 font-medium text-sm transition ${
                  activeTab === 'clients'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Clientes
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <>
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Gerenciar estoque e servicos
                    </h2>
                    <p className="text-sm text-slate-500">
                      Alterne entre itens fisicos e servicos para organizar melhor
                      a operacao diaria e vincular cada atendimento a um cliente.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        onClick={() => setItemView('stock')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          itemView === 'stock'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Estoque
                      </button>
                      <button
                        onClick={() => setItemView('service')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          itemView === 'service'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Servicos
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setNewItemKind(itemView);
                        setShowProductForm(true);
                      }}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                    >
                      {itemView === 'service' ? '+ Novo servico' : '+ Novo item'}
                    </button>
                  </div>
                </div>

                {!showProductForm && (
                  <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full max-w-2xl">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={
                          itemView === 'service'
                            ? 'Buscar servico por nome, cliente, descricao ou categoria'
                            : 'Buscar item por nome, descricao ou categoria'
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {filteredProducts.length} de {visibleProducts.length}{' '}
                      {itemView === 'service' ? 'servicos' : 'itens'}
                    </p>
                  </div>
                )}

                {showProductForm ? (
                  <ProductForm
                    categories={categories}
                    clients={clients}
                    product={editingProduct}
                    initialKind={editingProduct?.id ? inferItemKind(editingProduct) : newItemKind}
                    onSubmit={handleProductSubmit}
                    onCancel={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    submitting={submitting}
                  />
                ) : (
                  <ProductList
                    products={filteredProducts}
                    categories={categories}
                    clients={clients}
                    viewKind={itemView}
                    searchQuery={productSearch}
                    onEdit={(product) => {
                      setEditingProduct(product);
                      setShowProductForm(true);
                    }}
                    onDelete={handleDeleteProduct}
                  />
                )}
              </>
            )}

            {activeTab === 'clients' && (
              <>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Gerenciar clientes
                    </h2>
                    <p className="text-sm text-slate-500">
                      Cadastre os dados dos clientes e vincule cada servico ao
                      atendimento correto.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingClient(null);
                      setShowClientForm(true);
                    }}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                  >
                    + Novo cliente
                  </button>
                </div>

                {!showClientForm && (
                  <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full max-w-2xl">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="search"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente por nome, telefone, email, documento ou placa"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                      />
                      {clientSearch && (
                        <button
                          type="button"
                          onClick={() => setClientSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {filteredClients.length} de {clients.length} clientes
                    </p>
                  </div>
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
                    searchQuery={clientSearch}
                    onEdit={(client) => {
                      setEditingClient(client);
                      setShowClientForm(true);
                    }}
                    onDelete={handleDeleteClient}
                  />
                )}
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Gerenciar categorias
                    </h2>
                    <p className="text-sm text-slate-500">
                      Organize o catalogo com grupos visuais para facilitar busca
                      e operacao.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                  >
                    + Nova categoria
                  </button>
                </div>

                {!showCategoryForm && (
                  <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full max-w-2xl">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="search"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Buscar categoria por nome"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {filteredCategories.length} de {categories.length} categorias
                    </p>
                  </div>
                )}

                {showCategoryForm ? (
                  <CategoryForm
                    onSubmit={handleCategorySubmit}
                    onCancel={() => setShowCategoryForm(false)}
                    submitting={submitting}
                  />
                ) : (
                  <CategoryList
                    categories={filteredCategories}
                    searchQuery={categorySearch}
                    onDelete={handleDeleteCategory}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
