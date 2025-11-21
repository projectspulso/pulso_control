'use client'

import { useState, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useConteudosAgendados, useAtualizarDataPrevista } from '@/lib/hooks/use-producao'
import { ChevronLeft, ChevronRight, Grid3x3 } from 'lucide-react'
import Link from 'next/link'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'pt-BR': ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
})

interface EventoCalendario {
  id: string
  title: string
  start: Date
  end: Date
  resource: any
}

export default function CalendarioPage() {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  
  const mesInicio = startOfMonth(date)
  const mesFim = endOfMonth(date)
  
  const { data: conteudos, isLoading } = useConteudosAgendados(mesInicio, mesFim)
  const atualizarData = useAtualizarDataPrevista()

  const eventos: EventoCalendario[] = useMemo(() => {
    if (!conteudos) return []
    
    return conteudos
      .filter(c => c.data_prevista)
      .map(conteudo => ({
        id: conteudo.id,
        title: conteudo.ideia?.titulo || 'Sem título',
        start: new Date(conteudo.data_prevista!),
        end: new Date(conteudo.data_prevista!),
        resource: conteudo,
      }))
  }, [conteudos])

  const getEventoStyle = (event: EventoCalendario) => {
    const status = event.resource.status
    const cores: Record<string, string> = {
      AGUARDANDO_ROTEIRO: '#52525b',
      ROTEIRO_PRONTO: '#2563eb',
      AUDIO_GERADO: '#9333ea',
      EM_EDICAO: '#ca8a04',
      PRONTO_PUBLICACAO: '#16a34a',
      PUBLICADO: '#059669',
    }
    
    return {
      style: {
        backgroundColor: cores[status] || '#52525b',
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    }
  }

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'PREV') setDate(addMonths(date, -1))
    else if (action === 'NEXT') setDate(addMonths(date, 1))
    else setDate(new Date())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="text-zinc-400">Carregando calendário...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">📅 Calendário Editorial</h1>
            <Link
              href="/producao"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              Ver Kanban
            </Link>
          </div>

          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigate('TODAY')}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => handleNavigate('PREV')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleNavigate('NEXT')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-white ml-2">
                {format(date, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(['month', 'week', 'day', 'agenda'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    view === v ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Lista'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <BigCalendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            culture="pt-BR"
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Lista',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'Nenhum conteúdo agendado',
            }}
            eventPropGetter={getEventoStyle}
            style={{ height: 700 }}
          />
        </div>

        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-white mb-3">Legenda:</h3>
          <div className="grid grid-cols-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-zinc-600 rounded"></div>
              <span className="text-xs text-zinc-400">Aguardando Roteiro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs text-zinc-400">Roteiro Pronto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded"></div>
              <span className="text-xs text-zinc-400">Áudio Gerado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600 rounded"></div>
              <span className="text-xs text-zinc-400">Em Edição</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-xs text-zinc-400">Pronto p/ Publicar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-700 rounded"></div>
              <span className="text-xs text-zinc-400">Publicado</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 12px 4px; font-weight: 600; background: #18181b; color: white; border-bottom: 1px solid #27272a; }
        .rbc-today { background-color: #3730a3 !important; }
        .rbc-off-range-bg { background-color: #f4f4f5; }
        .rbc-date-cell { padding: 6px; text-align: right; }
        .rbc-event { cursor: move; }
      `}</style>
    </div>
  )
}