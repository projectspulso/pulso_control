'use client'

import { WorkflowQueueMonitor } from '@/components/workflow-queue-monitor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowQueuePage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/workflows"
            className="p-2 rounded-xl glass glass-hover border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </Link>
          
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Fila de Workflows
            </h1>
            <p className="text-zinc-400 mt-1">
              Monitoramento e gerenciamento de retry automático
            </p>
          </div>
        </div>

        {/* Monitor Component */}
        <WorkflowQueueMonitor />
      </div>
    </div>
  )
}
