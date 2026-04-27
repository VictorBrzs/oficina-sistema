import { useEffect, useState } from 'react';
import {
  encodeDescriptionForKind,
  inferItemKind,
  stripItemMarker,
  type ItemKind,
} from '@/lib/items';

interface ProductFormProps {
  categories: any[];
  clients: any[];
  product?: any;
  initialKind?: ItemKind;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export function ProductForm({
  categories,
  clients,
  product,
  initialKind = 'stock',
  onSubmit,
  onCancel,
  submitting = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    kind: 'stock' as ItemKind,
    name: '',
    description: '',
    category: '',
    clientId: '',
    price: '',
    stock: '',
    image: '',
  });

  useEffect(() => {
    if (product) {
      const kind = inferItemKind(product);
      setFormData({
        kind,
        name: product.name || '',
        description: stripItemMarker(product.description),
        category: product.category || '',
        clientId: product.clientId || '',
        price: product.price?.toString() || '',
        stock: kind === 'service' ? '' : product.stock?.toString() || '',
        image: product.image || '',
      });
      return;
    }

    setFormData({
      kind: initialKind,
      name: '',
      description: '',
      category: categories[0]?.id || '',
      clientId: initialKind === 'service' ? clients[0]?.id || '' : '',
      price: '',
      stock: '',
      image: '',
    });
  }, [product, categories, clients, initialKind]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      kind: formData.kind,
      clientId: formData.kind === 'service' ? formData.clientId : '',
      description: encodeDescriptionForKind(formData.kind, formData.description),
      price: Number(formData.price),
      stock: formData.kind === 'service' ? 0 : Number(formData.stock),
    });
  };

  const hasCategories = categories.length > 0;
  const isService = formData.kind === 'service';
  const hasClients = clients.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6"
    >
      {!hasCategories && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Crie pelo menos uma categoria antes de cadastrar itens.
        </div>
      )}

      {isService && !hasClients && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre pelo menos um cliente antes de salvar um servico.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tipo do item *
          </label>
          <select
            value={formData.kind}
            onChange={(e) =>
              setFormData((current) => ({
                ...current,
                kind: e.target.value === 'service' ? 'service' : 'stock',
                clientId:
                  e.target.value === 'service'
                    ? current.clientId || clients[0]?.id || ''
                    : '',
                stock: e.target.value === 'service' ? '' : current.stock,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          >
            <option value="stock">Estoque</option>
            <option value="service">Servico</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Categoria *
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            required
            disabled={!hasCategories}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {isService ? 'Nome do servico *' : 'Nome do item *'}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder={
              isService
                ? 'Ex: Alinhamento, troca de oleo...'
                : 'Ex: Filtro de oleo, pastilha de freio...'
            }
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Preco (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            placeholder="0.00"
            required
          />
        </div>

        {isService && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
              required={isService}
              disabled={!hasClients}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isService && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantidade em estoque *
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
              placeholder="0"
              required={!isService}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Descricao
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          placeholder={
            isService
              ? 'Descreva o servico executado para esse cliente...'
              : 'Codigo de referencia, marca, aplicacao, observacoes...'
          }
          rows={3}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          URL da imagem
        </label>
        <input
          type="url"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          placeholder="https://..."
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
          disabled={submitting || !hasCategories || (isService && !hasClients)}
        >
          {submitting ? 'Salvando...' : product?.id ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
