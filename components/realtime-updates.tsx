'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function RealtimeUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Roteiros
    const roteirosChannel = supabase
      .channel('roteiros-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'roteiros' }, (payload) => {
        toast.success('🎉 Novo roteiro gerado pela IA!')
        queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      })
      .subscribe()
    // Áudios
    const audiosChannel = supabase
      .channel('audios-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audios' }, (payload) => {
        toast.success('🎙️ Áudio TTS gerado com sucesso!')
        queryClient.invalidateQueries({ queryKey: ['audios'] })
      })
      .subscribe()
    // Pipeline
    const pipelineChannel = supabase
      .channel('pipeline-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pipeline_producao' }, (payload) => {
        toast('🔄 Pipeline atualizado!')
        queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      })
      .subscribe()
    return () => {
      roteirosChannel.unsubscribe()
      audiosChannel.unsubscribe()
      pipelineChannel.unsubscribe()
    }
  }, [queryClient])
  return null
}
