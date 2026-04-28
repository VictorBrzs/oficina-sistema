export type ServiceStatus = 'pending' | 'in_progress' | 'completed';

export interface StockItem {
  id: string;
  partCode: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  vehicle?: string;
  licensePlate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  title: string;
  details: string;
  status: ServiceStatus;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export function getServiceStatusLabel(status: ServiceStatus) {
  if (status === 'in_progress') return 'Em andamento';
  if (status === 'completed') return 'Concluido';
  return 'Pendente';
}

export function getServiceStatusClasses(status: ServiceStatus) {
  if (status === 'in_progress') {
    return 'bg-amber-100 text-amber-800';
  }

  if (status === 'completed') {
    return 'bg-emerald-100 text-emerald-800';
  }

  return 'bg-slate-100 text-slate-700';
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}
