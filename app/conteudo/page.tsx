'use client'

import { FileText, Video, Image as ImageIcon, Calendar } from 'lucide-react'

export default function ConteudoPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Conteúdo</h1>
        <p className="text-zinc-400">Biblioteca de conteúdos e assets</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-5 w-5 text-red-500" />
            <span className="text-sm text-zinc-400">Vídeos</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-zinc-400">Imagens</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-zinc-400">Roteiros</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <span className="text-sm text-zinc-400">Agendados</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
        <FileText className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Em breve</h3>
        <p className="text-zinc-500">Gestão de conteúdo e biblioteca de assets</p>
      </div>
    </div>
  )
}
