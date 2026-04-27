interface StatsCardsProps {
  stats: {
    totalProducts?: number;
    totalCategories?: number;
    totalValue?: number;
    totalStock?: number;
    lowStockCount?: number;
    totalStockItems?: number;
    totalServices?: number;
    totalClients?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Itens de Estoque',
      value: stats.totalStockItems || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      color: 'from-sky-500 to-blue-600',
    },
    {
      title: 'Servicos',
      value: stats.totalServices || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.02 3.14a1 1 0 00.95.69h3.3c.969 0 1.371 1.24.588 1.81l-2.67 1.94a1 1 0 00-.364 1.118l1.02 3.14c.3.922-.755 1.688-1.539 1.118l-2.67-1.94a1 1 0 00-1.176 0l-2.67 1.94c-.783.57-1.838-.196-1.539-1.118l1.02-3.14a1 1 0 00-.364-1.118l-2.67-1.94c-.783-.57-.38-1.81.588-1.81h3.3a1 1 0 00.95-.69l1.02-3.14z"
          />
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Clientes',
      value: stats.totalClients || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7m5-12a2 2 0 110 4 2 2 0 010-4z"
          />
        </svg>
      ),
      color: 'from-cyan-500 to-sky-600',
    },
    {
      title: 'Valor em Estoque',
      value: `R$ ${Number(stats.totalValue || 0).toFixed(2)}`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Unidades em Estoque',
      value: stats.totalStock || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h18M5 7l1 12h12l1-12M9 11v4m6-4v4"
          />
        </svg>
      ),
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Alerta de Estoque',
      value: stats.lowStockCount || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: 'from-red-500 to-rose-600',
    },
    {
      title: 'Categorias',
      value: stats.totalCategories || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      color: 'from-slate-500 to-slate-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-7">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-[1.5rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/30 backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div
              className={`rounded-2xl bg-gradient-to-br ${card.color} p-3 text-white shadow-lg`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
