import { formatCurrency } from '@/lib/workshop';

interface StatsCardsProps {
  stats: {
    totalStockItems: number;
    totalClients: number;
    activeServices: number;
    completedServices: number;
    stockValue: number;
    lowStockCount: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Pecas',
      value: String(stats.totalStockItems),
    },
    {
      title: 'Ordens abertas',
      value: String(stats.activeServices),
    },
    {
      title: 'Clientes',
      value: String(stats.totalClients),
    },
    {
      title: 'Historico concluido',
      value: String(stats.completedServices),
    },
    {
      title: 'Valor em estoque',
      value: formatCurrency(stats.stockValue),
    },
    {
      title: 'Baixo estoque',
      value: String(stats.lowStockCount),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {card.title}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
