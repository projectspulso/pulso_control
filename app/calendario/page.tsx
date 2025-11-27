'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View, Event, EventPropGetter } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useConteudosProducao, type ConteudoProducao } from '@/lib/hooks/use-producao'
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3x3, 
  Clock, 
  User, 
  Flag, 
  X,
  Calendar,
  FileText,
  Megaphone,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
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
  resource: ConteudoProducao
}

const STATUS_CONFIG = {
  AGUARDANDO_ROTEIRO: { 
    label: 'Aguardando Roteiro', 
    color: '#52525b', 
    bgLight: '#f4f4f5',
    icon: '⏳' 
  },
  ROTEIRO_PRONTO: { 
    label: 'Roteiro Pronto', 
    color: '#2563eb', 
    bgLight: '#dbeafe',
    icon: '📝' 
  },
  AUDIO_GERADO: { 
    label: 'Áudio Gerado', 
    color: '#9333ea', 
    bgLight: '#f3e8ff',
    icon: '🎙️' 
  },
  EM_EDICAO: { 
    label: 'Em Edição', 
    color: '#ca8a04', 
    bgLight: '#fef3c7',
    icon: '✂️' 
  },
  PRONTO_PUBLICACAO: { 
    label: 'Pronto p/ Publicar', 
    color: '#16a34a', 
    bgLight: '#dcfce7',
    icon: '✅' 
  },
  PUBLICADO: { 
    label: 'Publicado', 
    color: '#059669', 
    bgLight: '#d1fae5',
    icon: '🚀' 
  },
}

export default function CalendarioPage() {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')
  
  const { data: conteudos, isLoading } = useConteudosProducao()

  // Filtrar conteúdos da view vw_pipeline_calendario_publicacao
  const conteudosFiltrados = useMemo(() => {
    if (!conteudos) return [];
    return conteudos.filter(c => {
      if (!c.data_publicacao_planejada) return false;
      const matchStatus = filtroStatus === 'TODOS' || c.pipeline_status === filtroStatus;
      const matchCanal = filtroCanal === 'TODOS' || c.canal === filtroCanal;
      const matchBusca = !busca || c.ideia?.toLowerCase().includes(busca.toLowerCase());
      return matchStatus && matchCanal && matchBusca;
    });
  }, [conteudos, filtroStatus, filtroCanal, busca]);

  const eventos: EventoCalendario[] = useMemo(() => {
    return conteudosFiltrados.map(conteudo => ({
      id: conteudo.pipeline_id,
      title: conteudo.ideia?.trim() || '',
      start: new Date(conteudo.data_publicacao_planejada!),
      end: new Date(conteudo.data_publicacao_planejada!),
      resource: conteudo,
    }));
  }, [conteudosFiltrados]);
  
  // Estatísticas do mês
  const estatisticas = useMemo(() => {
    if (!conteudos) return null;
    const total = conteudos.length;
    const porStatus = conteudos.reduce((acc, c) => {
      acc[c.pipeline_status] = (acc[c.pipeline_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const porCanal = conteudos.reduce((acc, c) => {
      const canal = c.canal || 'Sem canal';
      acc[canal] = (acc[canal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, porStatus, porCanal };
  }, [conteudos]);
  
  // Canais únicos para filtro
  const canaisUnicos = useMemo(() => {
    if (!conteudos) return [];
    // Filtra apenas canais reais, sem duplicados e sem 'Sem canal'
    const canais = conteudos
      .map(c => c.canal)
      .filter(nome => nome && nome !== 'Sem canal');
    return Array.from(new Set(canais));
  }, [conteudos]);

  const getEventoStyle: EventPropGetter<EventoCalendario> = useCallback((event) => {
    const status = event.resource.pipeline_status as keyof typeof STATUS_CONFIG
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.AGUARDANDO_ROTEIRO
    const prioridade = event.resource.prioridade || 5
    
    return {
      style: {
        backgroundColor: config.color,
        borderRadius: '6px',
        border: prioridade <= 3 ? `2px solid #ef4444` : 'none',
        borderLeft: `4px solid ${config.color}`,
        color: 'white',
        fontSize: '11px',
        fontWeight: prioridade <= 3 ? '600' : '500',
        padding: '4px 8px',
        boxShadow: prioridade <= 3 ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      },
    }
  }, [])
  
  const CustomEvent = ({ event }: { event: EventoCalendario }) => {
    const status = event.resource.pipeline_status as keyof typeof STATUS_CONFIG
    const config = STATUS_CONFIG[status]
    const prioridade = event.resource.prioridade || 5
    
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-xs">{config.icon}</span>
        <span className="truncate flex-1 text-xs font-medium">
          {event.title}
        </span>
        {prioridade <= 3 && (
          <Flag className="h-3 w-3 shrink-0 text-red-300" />
        )}
      </div>
    )
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
      <div className="max-w-[1800px] mx-auto">
        {/* Header com controles completos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">📅 Calendário Editorial</h1>
              <p className="text-sm text-zinc-400">
                Mostrando {conteudosFiltrados?.length || 0} de {estatisticas?.total || 0} conteúdos • {format(date, 'MMMM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <Link
              href="/producao"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <Grid3x3 className="h-4 w-4" />
              Ver Kanban
            </Link>
          </div>
          
          {/* Painel de controle unificado */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
            {/* Linha 1: Navegação e Visualizações */}
            <div className="flex items-center justify-between">
              {/* Navegação de datas */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavigate('TODAY')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Hoje
                </button>
                <div className="h-6 w-px bg-zinc-700"></div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavigate('PREV')}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleNavigate('NEXT')}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    title="Próximo mês"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <h2 className="text-lg font-bold text-white capitalize min-w-[180px]">
                  {format(date, 'MMMM yyyy', { locale: ptBR })}
                </h2>
              </div>

              {/* Visualizações */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 mr-2">Visualização:</span>
                {(['month', 'week', 'day', 'agenda'] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      view === v 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Lista'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Linha 2: Filtros de Status (chips clicáveis) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-full mb-2">
                <span className="text-sm font-semibold text-zinc-300">Filtrar por Status</span>
              </div>
              <span className="text-xs text-zinc-500 mr-1">Status:</span>
              <button
                onClick={() => setFiltroStatus('TODOS')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filtroStatus === 'TODOS'
                    ? 'bg-zinc-700 text-white ring-2 ring-zinc-600'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                Todos ({estatisticas?.total || 0})
              </button>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = estatisticas?.porStatus[status] || 0
                if (count === 0) return null
                return (
                  <button
                    key={status}
                    onClick={() => setFiltroStatus(filtroStatus === status ? 'TODOS' : status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      filtroStatus === status
                        ? 'text-white ring-2 ring-offset-2 ring-offset-zinc-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                    style={{
                      backgroundColor: filtroStatus === status ? config.color : undefined,
                    }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>
            
            {/* Linha 3: Busca e Filtros Adicionais */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por título ou canal..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-zinc-500" />
                <select
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm transition-all min-w-[180px]"
                >
                  <option value="TODOS">Todos os canais</option>
                  {canaisUnicos.map(canal => (
                    <option key={canal} value={canal}>{canal}</option>
                  ))}
                </select>
              </div>
              
              {(filtroStatus !== 'TODOS' || filtroCanal !== 'TODOS' || busca) && (
                <button
                  onClick={() => {
                    setFiltroStatus('TODOS')
                    setFiltroCanal('TODOS')
                    setBusca('')
                  }}
                  className="px-4 py-2.5 bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-400 rounded-lg text-sm transition-all flex items-center gap-2 font-medium"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendário Dark Mode */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
          <BigCalendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={(event) => setEventoSelecionado(event)}
            culture="pt-BR"
            toolbar={false} // Remove toolbar duplicada
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
              noEventsInRange: 'Nenhum conteúdo agendado neste período',
              showMore: (total) => `+${total} mais`,
            }}
            eventPropGetter={getEventoStyle}
            components={{
              event: CustomEvent,
            }}
            style={{ height: view === 'month' ? 750 : 600 }}
            popup
            selectable
          />
        </div>

        {/* Insights do mês */}
        {estatisticas && estatisticas.total > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-600/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Produtividade</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Publicados:</span>
                  <span className="text-green-400 font-semibold">
                    {estatisticas.porStatus.PUBLICADO || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Em produção:</span>
                  <span className="text-yellow-400 font-semibold">
                    {(estatisticas.porStatus.EM_EDICAO || 0) + (estatisticas.porStatus.AUDIO_GERADO || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Aguardando:</span>
                  <span className="text-zinc-400 font-semibold">
                    {estatisticas.porStatus.AGUARDANDO_ROTEIRO || 0}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Megaphone className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Por Canal</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(estatisticas.porCanal).slice(0, 3).map(([canal, count]) => (
                  <div key={String(canal)} className="flex justify-between text-sm">
                    <span className="text-zinc-400 truncate">{String(canal)}:</span>
                    <span className="text-white font-semibold ml-2">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-600/20 rounded-lg">
                  <Flag className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Prioridades</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Alta (P1-P3):</span>
                  <span className="text-red-400 font-semibold">
                    {conteudos?.filter(c => c.prioridade && c.prioridade <= 3).length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Média (P4-P6):</span>
                  <span className="text-yellow-400 font-semibold">
                    {conteudos?.filter(c => c.prioridade && c.prioridade >= 4 && c.prioridade <= 6).length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Baixa (P7-P10):</span>
                  <span className="text-zinc-400 font-semibold">
                    {conteudos?.filter(c => c.prioridade && c.prioridade >= 7).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de detalhes */}
      {eventoSelecionado && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {STATUS_CONFIG[eventoSelecionado.resource.pipeline_status as keyof typeof STATUS_CONFIG]?.icon}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {eventoSelecionado.resource.ideia}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(eventoSelecionado.start, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </div>
                  {eventoSelecionado.resource.canal && (
                    <div className="flex items-center gap-1">
                      <Megaphone className="h-4 w-4" />
                      {eventoSelecionado.resource.canal}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEventoSelecionado(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <div className="text-sm font-medium text-white">
                    {STATUS_CONFIG[eventoSelecionado.resource.pipeline_status as keyof typeof STATUS_CONFIG]?.label}
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-1">Prioridade</div>
                  <div className="flex items-center gap-2">
                    <Flag className={`h-4 w-4 ${eventoSelecionado.resource.prioridade <= 3 ? 'text-red-400' : 'text-zinc-400'}`} />
                    <span className="text-sm font-medium text-white">
                      P{eventoSelecionado.resource.prioridade || 5}
                    </span>
                  </div>
                </div>
              </div>
              
              {eventoSelecionado.resource.roteiro_status && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-2">Status do Roteiro</div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">{eventoSelecionado.resource.roteiro_status}</span>
                  </div>
                </div>
              )}
              
              {/* Campos removidos: pipeline_responsavel, pipeline_observacoes não estão na vw_pipeline_calendario_publicacao */}
              
              <div className="flex gap-3 pt-4">
                <Link
                  href={`/roteiros/${eventoSelecionado.resource.pipeline_id}`}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                  Ver Detalhes
                </Link>
                <Link
                  href="/producao"
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                  Ir para Kanban
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Dark Mode Calendar Styles */
        .rbc-calendar { 
          font-family: inherit; 
          background: #18181b;
          color: #fafafa;
        }
        
        /* Headers */
        .rbc-header { 
          padding: 16px 8px; 
          font-weight: 700; 
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #09090b;
          color: #a1a1aa; 
          border-bottom: 2px solid #7c3aed;
          border-left: 1px solid #27272a;
        }
        .rbc-header:first-child {
          border-left: none;
        }
        
        /* Days */
        .rbc-day-bg {
          background: #18181b;
          border-left: 1px solid #27272a;
          border-bottom: 1px solid #27272a;
        }
        .rbc-day-bg:hover {
          background: #1f1f23;
        }
        
        /* Today */
        .rbc-today { 
          background-color: #1e1b4b !important; 
        }
        
        /* Off range (days from other months) */
        .rbc-off-range-bg { 
          background-color: #0a0a0b; 
        }
        .rbc-off-range {
          color: #52525b;
        }
        
        /* Date cells */
        .rbc-date-cell { 
          padding: 8px; 
          text-align: right; 
          font-weight: 600;
          font-size: 14px;
          color: #d4d4d8;
        }
        .rbc-current { 
          color: #a78bfa; 
          font-weight: 700;
        }
        
        /* Events */
        .rbc-event { 
          cursor: pointer; 
          transition: all 0.2s;
          background: transparent !important;
        }
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .rbc-event-label {
          font-size: 11px;
          font-weight: 600;
        }
        .rbc-event-content {
          white-space: normal;
        }
        
        /* Show more link */
        .rbc-show-more {
          background-color: #7c3aed;
          color: white;
          font-weight: 600;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 2px 4px;
        }
        .rbc-show-more:hover {
          background-color: #6d28d9;
        }
        
        /* Month view */
        .rbc-month-view {
          border: 1px solid #27272a;
          border-radius: 8px;
          overflow: hidden;
          background: #18181b;
        }
        .rbc-month-row {
          border-top: 1px solid #27272a;
          min-height: 100px;
        }
        
        /* Week/Day view */
        .rbc-time-view {
          border: 1px solid #27272a;
          border-radius: 8px;
          overflow: hidden;
          background: #18181b;
        }
        .rbc-time-header {
          background: #09090b;
          border-bottom: 2px solid #7c3aed;
        }
        .rbc-time-header-content {
          border-left: 1px solid #27272a;
        }
        .rbc-time-content {
          border-top: 1px solid #27272a;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #27272a;
        }
        .rbc-timeslot-group {
          border-left: 1px solid #27272a;
          background: #18181b;
        }
        .rbc-current-time-indicator {
          background-color: #7c3aed;
          height: 2px;
        }
        
        /* Agenda view */
        .rbc-agenda-view {
          border: 1px solid #27272a;
          border-radius: 8px;
          overflow: hidden;
          background: #18181b;
        }
        .rbc-agenda-table {
          border: none;
        }
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          background: #09090b;
          color: #a1a1aa;
          font-weight: 600;
          border-bottom: 1px solid #27272a;
        }
        .rbc-agenda-event-cell {
          background: #18181b;
          color: #fafafa;
          border-bottom: 1px solid #27272a;
        }
        
        /* Selected */
        .rbc-selected {
          background-color: #7c3aed !important;
        }
        
        /* Popup/Overlay */
        .rbc-overlay {
          background: #18181b;
          border: 1px solid #27272a;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border-radius: 8px;
        }
        .rbc-overlay-header {
          background: #09090b;
          border-bottom: 1px solid #27272a;
          padding: 8px 12px;
          color: #a1a1aa;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}