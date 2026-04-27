import { inferItemKind, stripItemMarker, type ItemKind } from '@/lib/items';

interface Product {
  id: string;
  kind?: ItemKind;
  name: string;
  description: string;
  category: string;
  clientId?: string;
  price: number;
  stock: number;
  image?: string;
}

interface ProductListProps {
  products: Product[];
  categories: any[];
  clients: any[];
  viewKind: ItemKind;
  searchQuery?: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductList({
  products,
  categories,
  clients,
  viewKind,
  searchQuery = '',
  onEdit,
  onDelete,
}: ProductListProps) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || '#6366f1';
  };

  const getClientName = (clientId?: string) => {
    const client = clients.find((item) => item.id === clientId);
    return client?.name || 'Sem cliente';
  };

  const emptyTitle =
    searchQuery.trim().length > 0
      ? viewKind === 'service'
        ? 'Nenhum servico encontrado'
        : 'Nenhum item encontrado'
      : viewKind === 'service'
        ? 'Nenhum servico cadastrado'
        : 'Nenhum item de estoque cadastrado';
  const emptyText =
    searchQuery.trim().length > 0
      ? viewKind === 'service'
        ? 'Tente buscar por outro nome, cliente, descricao ou categoria.'
        : 'Tente buscar por outro nome, descricao ou categoria.'
      : viewKind === 'service'
        ? 'Comece adicionando servicos e vinculando cada um a um cliente.'
        : 'Comece adicionando pecas e itens de estoque.';

  if (products.length === 0) {
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyTitle}</h3>
        <p className="mt-1 text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {products.map((product) => {
          const kind = inferItemKind(product);

          return (
            <article
              key={product.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <svg
                      className="h-6 w-6 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {stripItemMarker(product.description)}
                      </p>
                    </div>

                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: getCategoryColor(product.category) }}
                    >
                      {getCategoryName(product.category)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Preco
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        R$ {Number(product.price || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {viewKind === 'service' ? 'Tipo' : 'Estoque'}
                      </p>
                      <div className="mt-1">
                        {kind === 'service' ? (
                          <span className="inline-flex rounded-full bg-sky-100 px-2 text-xs font-semibold leading-5 text-sky-800">
                            Servico
                          </span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              product.stock < 10
                                ? 'bg-red-100 text-red-800'
                                : product.stock < 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {product.stock} unidades
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {viewKind === 'service' && (
                    <div className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-orange-500">
                        Cliente
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {getClientName(product.clientId)}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-[1.5rem] border border-slate-200 md:block">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {viewKind === 'service' ? 'Servico' : 'Item'}
            </th>
            {viewKind === 'service' && (
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Preco
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {viewKind === 'service' ? 'Tipo' : 'Estoque'}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Acoes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {products.map((product) => {
            const kind = inferItemKind(product);

            return (
              <tr key={product.id} className="hover:bg-orange-50/40">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stripItemMarker(product.description)}
                      </div>
                    </div>
                  </div>
                </td>
                {viewKind === 'service' && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">
                      {getClientName(product.clientId)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Atendimento vinculado
                    </div>
                  </td>
                )}
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 text-white"
                    style={{ backgroundColor: getCategoryColor(product.category) }}
                  >
                    {getCategoryName(product.category)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  R$ {Number(product.price || 0).toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {kind === 'service' ? (
                    <span className="inline-flex rounded-full bg-sky-100 px-2 text-xs font-semibold leading-5 text-sky-800">
                      Servico
                    </span>
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        product.stock < 10
                          ? 'bg-red-100 text-red-800'
                          : product.stock < 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.stock} unidades
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(product)}
                    className="mr-4 text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
