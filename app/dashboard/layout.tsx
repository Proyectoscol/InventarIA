"use client"

import { SessionProvider } from "next-auth/react"
import { DashboardHeader } from "@/components/layout/DashboardHeader"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}

