export interface ProductMetadata {
  id: string
  displayName: string
  protectionType: 'DOP' | 'IGP'
  category: string
  certifyingBody: string
}

// Vite resolves this glob at build time. The product metadata is the catalog source of truth.
const metadataFiles = import.meta.glob('../../../products/*/metadata.json', { eager: true }) as Record<
  string,
  ProductMetadata
>

export function getProductMetadata(): ProductMetadata[] {
  return Object.values(metadataFiles).sort((a, b) => a.displayName.localeCompare(b.displayName, 'it'))
}
