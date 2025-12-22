// Tipos para la Contact Picker API
export interface ContactAddress {
  streetAddress?: string
  locality?: string
  region?: string
  postalCode?: string
  country?: string
}

export interface Contact {
  name?: string | string[]
  email?: string | string[]
  tel?: string | string[]
  address?: ContactAddress | ContactAddress[]
}

declare global {
  interface Navigator {
    contacts?: {
      select: (
        properties: string[],
        options?: { multiple?: boolean }
      ) => Promise<Contact[]>
    }
  }

  interface Window {
    ContactsManager?: any
  }
}

