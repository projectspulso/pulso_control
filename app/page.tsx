'use client'

import { DashboardStats } from "@/components/dashboard/stats";
import { IdeiasLista } from "@/components/dashboard/ideias-lista";
import { WorkflowsLog } from "@/components/dashboard/workflows-log";
import { RealtimeUpdates } from "@/components/realtime-updates";
import { useCanais } from "@/lib/hooks/use-core";
import { useIdeias } from "@/lib/hooks/use-ideias";
import { ErrorState } from "@/components/ui/error-state";
import { Megaphone, TrendingUp, Zap, Sparkles, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: canais, isError: isCanaisError, refetch: refetchCanais } = useCanais()
  const { data: ideias, isError: isIdeiasError, refetch: refetchIdeias } = useIdeias()
  const [currentTime, setCurrentTime] = useState('')
  const [mounted, setMounted] = useState(false)

  // Atualizar tempo apenas no cliente
  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (isCanaisError || isIdeiasError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar dashboard"
            message="Não foi possível carregar os dados do Centro de Comando. Verifique sua conexão."
            onRetry={() => {
              refetchCanais()
              refetchIdeias()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with gradient and glow */}
        <header className="relative animate-fade-in">
          <div className="absolute inset-0 bg-linear-to-r from-purple-600/10 via-pink-600/10 to-yellow-600/10 blur-3xl -z-10" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Zap className="h-10 w-10 text-purple-500 animate-pulse-glow" />
                  <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-float" />
                </div>
                <h1 className="text-5xl font-black bg-linear-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent animate-slide-in-left">
                  Centro de Comando
                </h1>
              </div>
              <p className="text-zinc-400 text-lg ml-1 flex items-center gap-2 animate-slide-in-left" style={{ animationDelay: '100ms' }}>
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                Visão geral do ecossistema PULSO em tempo real
              </p>
            </div>
            
            <div className="glass rounded-2xl px-6 py-4 text-right space-y-1 animate-slide-in-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Sistema Online</p>
              <p className="text-2xl font-bold bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent tabular-nums">
                {mounted ? currentTime : '--:--:--'}
              </p>
            </div>
          </div>
        </header>

        {/* Quick Stats with glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/canais"
            className="group glass glass-hover rounded-2xl p-6 relative overflow-hidden animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-600/20 blur-2xl group-hover:bg-purple-600/30 transition-all duration-500" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Megaphone className="h-6 w-6 text-purple-400" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
              
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">Canais Ativos</p>
                <p className="text-4xl font-black text-white group-hover:text-purple-400 transition-colors duration-300 tabular-nums">
                  {canais?.length || 0}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/ideias"
            className="group glass glass-hover rounded-2xl p-6 relative overflow-hidden animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl group-hover:bg-blue-600/30 transition-all duration-500" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
              
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">Ideias Total</p>
                <p className="text-4xl font-black text-white group-hover:text-blue-400 transition-colors duration-300 tabular-nums">
                  {ideias?.length || 0}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/roteiros"
            className="group glass glass-hover rounded-2xl p-6 relative overflow-hidden animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-600/20 blur-2xl group-hover:bg-green-600/30 transition-all duration-500" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-600 group-hover:text-green-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
              
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">Roteiros</p>
                <p className="text-4xl font-black text-white group-hover:text-green-400 transition-colors duration-300 tabular-nums">
                  {ideias?.filter((i: any) => i.status === 'EM_PRODUCAO').length || 0}
                </p>
              </div>
            </div>
          </Link>

          <div className="glass rounded-2xl p-6 relative overflow-hidden animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-600/20 blur-2xl" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <TrendingUp className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-xs font-bold text-green-400">+12%</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">Aprovadas</p>
                <p className="text-4xl font-black text-white tabular-nums">
                  {ideias?.filter((i: any) => i.status === 'APROVADA').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="animate-fade-in" style={{ animationDelay: '600ms' }}>
          <DashboardStats />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <IdeiasLista />
          <WorkflowsLog />
        </div>

        {/* Realtime Updates Component */}
        <RealtimeUpdates />
      </div>
    </main>
  );
}
