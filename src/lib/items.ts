export type ItemKind = 'stock' | 'service';

const SERVICE_MARKER = '[service]';

export function inferItemKind(item: { kind?: unknown; description?: unknown }) {
  if (item.kind === 'service') return 'service' as ItemKind;

  const description =
    typeof item.description === 'string' ? item.description.trimStart() : '';

  if (description.startsWith(SERVICE_MARKER)) {
    return 'service' as ItemKind;
  }

  return 'stock' as ItemKind;
}

export function stripItemMarker(description: unknown) {
  if (typeof description !== 'string') return '';

  const normalized = description.trimStart();
  if (normalized.startsWith(SERVICE_MARKER)) {
    return normalized.slice(SERVICE_MARKER.length).trimStart();
  }

  return description;
}

export function encodeDescriptionForKind(kind: ItemKind, description: unknown) {
  const cleanDescription = stripItemMarker(description);

  if (kind === 'service') {
    return cleanDescription
      ? `${SERVICE_MARKER} ${cleanDescription}`
      : SERVICE_MARKER;
  }

  return cleanDescription;
}
