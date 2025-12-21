"use client"

import { create } from "zustand"

interface Company {
  id: string
  name: string
}

interface CompanyStore {
  currentCompany: Company | null
  setCurrentCompany: (company: Company) => void
  clearCompany: () => void
}

export const useCompany = create<CompanyStore>((set) => ({
  currentCompany: null,
  setCurrentCompany: (company) => set({ currentCompany: company }),
  clearCompany: () => set({ currentCompany: null })
}))

