'use client'

import { DashboardStats } from "@/components/dashboard/stats";
import { IdeiasLista } from "@/components/dashboard/ideias-lista";
import { WorkflowsLog } from "@/components/dashboard/workflows-log";
import { useCanais } from "@/lib/hooks/use-core";
import { useIdeias } from "@/lib/hooks/use-ideias";
import { Megaphone, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: canais } = useCanais()
  const { data: ideias } = useIdeias()
  const [currentTime, setCurrentTime] = useState('')

  // Atividade recente (últimas 5 ideias)
  const atividadeRecente = ideias?.slice(0, 5) || []

  // Atualizar tempo apenas no cliente
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-purple-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
                Centro de Comando
              </h1>
            </div>
            <p className="text-zinc-400">
              Visão geral do ecossistema PULSO
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Última atualização</p>
            <p className="text-white font-medium">{currentTime || '--:--:--'}</p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Link
          href="/canais"
          className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-600/30 rounded-lg p-6 hover:border-purple-600/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-zinc-400">Canais Ativos</span>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
            {canais?.length || 0}
          </p>
        </Link>

        <Link
          href="/ideias"
          className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/30 rounded-lg p-6 hover:border-blue-600/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-zinc-400">Ideias Total</span>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{ideias?.length || 0}</p>
        </Link>

        <Link
          href="/roteiros"
          className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-600/30 rounded-lg p-6 hover:border-green-600/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-5 w-5 text-green-400" />
            <span className="text-sm text-zinc-400">Roteiros</span>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">
            {ideias?.filter((i: any) => i.status === 'EM_PRODUCAO').length || 0}
          </p>
        </Link>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 border border-yellow-600/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-zinc-400">Aprovadas</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {ideias?.filter((i: any) => i.status === 'APROVADA').length || 0}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="mb-8">
        <DashboardStats />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IdeiasLista />
        <WorkflowsLog />
      </div>
    </main>
  );
}
