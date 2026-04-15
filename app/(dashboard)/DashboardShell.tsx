'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import type { Company, Profile } from '@/types'

interface DashboardShellProps {
  profile: Profile
  companies: Company[]
  children: React.ReactNode
}

export default function DashboardShell({ profile, companies, children }: DashboardShellProps) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => {
    // Récupérer la société active depuis localStorage
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('finora_current_company')
      return companies.find(c => c.id === savedId) || companies[0] || null
    }
    return companies[0] || null
  })

  const handleCompanyChange = (company: Company) => {
    setCurrentCompany(company)
    localStorage.setItem('finora_current_company', company.id)
  }

  // Exposer la société courante via un event pour les pages enfants
  useEffect(() => {
    if (currentCompany) {
      window.dispatchEvent(new CustomEvent('finora:company-change', { detail: currentCompany }))
    }
  }, [currentCompany])

  return (
    <div className="flex h-screen bg-[#f4f5f9] overflow-hidden">
      <Sidebar
        profile={profile}
        companies={companies}
        currentCompany={currentCompany}
        onCompanyChange={handleCompanyChange}
      />
      {/* Main content */}
      <main className="flex-1 lg:ml-60 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
