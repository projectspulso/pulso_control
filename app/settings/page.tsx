'use client'

import { Settings as SettingsIcon, Database, Key, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-zinc-400">Gerencie integrações e preferências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-bold text-white">Supabase</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Conexão com banco de dados</p>
          <span className="inline-flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>
            Conectado
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-bold text-white">N8N</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Workflows e automações</p>
          <span className="inline-flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
            Configurar
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-bold text-white">Plataformas</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">YouTube, TikTok, Instagram</p>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
            6 conectadas
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Notificações</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Alertas e avisos do sistema</p>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
            Configurar
          </span>
        </div>
      </div>
    </div>
  )
}
