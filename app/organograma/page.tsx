"use client";

import React, { useEffect, useRef, useState } from "react";
import { Graph, Node } from "@antv/x6";
import { useCanais } from "@/lib/hooks/use-core";
import { useIdeias } from "@/lib/hooks/use-ideias";
import { useRoteiros } from "@/lib/hooks/use-roteiros";
import { useConteudosProducao } from "@/lib/hooks/use-producao";
import { ErrorState } from "@/components/ui/error-state";
import { supabase } from "@/lib/supabase/client";

export default function OrganogramaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const expandedNodesRef = useRef<Set<string>>(new Set());
  const seriesDataRef = useRef<Record<string, any[]>>({});
  
  const { data: canais, isError, refetch } = useCanais();
  const { data: ideias } = useIdeias();
  const { data: roteiros } = useRoteiros();
  const { data: producao } = useConteudosProducao();

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
          <ErrorState
            title="Erro ao carregar organograma"
            message="Não foi possível carregar a estrutura de canais. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!containerRef.current || !canais) return;

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      background: { color: "#000" },
      grid: false,
      panning: { enabled: true, eventTypes: ['leftMouseDown', 'mouseWheel'] },
      mousewheel: { enabled: true, modifiers: 'ctrl', minScale: 0.5, maxScale: 2 },
      interacting: { nodeMovable: true },
    });

    graphRef.current = graph;

    // Centro Pulso
    const centerX = containerRef.current.offsetWidth / 2;
    const centerY = containerRef.current.offsetHeight / 2;
    
    graph.addNode({
      id: "pulso-central",
      x: centerX - 110,
      y: centerY - 110,
      width: 220,
      height: 220,
      shape: "circle",
      label: "Pulso\nCentral",
      attrs: {
        body: {
          fill: "#18181b",
          stroke: "#7c3aed",
          strokeWidth: 6,
          filter: "drop-shadow(0 8px 32px rgba(124, 58, 237, 0.6))",
        },
        label: { 
          fill: "#fff", 
          fontWeight: "bold", 
          fontSize: 28,
          textWrap: { width: 180, height: 180, ellipsis: true },
        },
      },
      data: { type: "centro", tooltip: "Estratégia Central de Canais e Conteúdos" },
    });

    // Canais reais orbitando
    const radius = 320;
    const colors = ["#f59e42", "#4ade80", "#ec4899", "#3b82f6", "#a78bfa", "#fb923c"];
    
    canais.forEach((canal: any, i: number) => {
      const angle = (2 * Math.PI * i) / canais.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 70;
      const y = centerY + radius * Math.sin(angle) - 70;
      
      graph.addNode({
        id: `canal-${canal.id}`,
        x,
        y,
        width: 140,
        height: 140,
        shape: "circle",
        label: canal.nome,
        attrs: {
          body: {
            fill: colors[i % colors.length],
            stroke: "#fff",
            strokeWidth: 4,
            filter: "drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5))",
          },
          label: { 
            fill: "#fff", 
            fontWeight: "bold", 
            fontSize: 16,
            textWrap: { width: 120, ellipsis: true },
          },
        },
        data: { 
          type: "canal", 
          canalId: canal.id,
          tooltip: canal.descricao || `Canal: ${canal.nome}`,
        },
      });
      
      graph.addEdge({
        source: "pulso-central",
        target: `canal-${canal.id}`,
        attrs: {
          line: {
            stroke: "#444",
            strokeWidth: 2,
            strokeDasharray: "5 5",
          },
        },
      });
    });

    // Interatividade: expansão dinâmica
    graph.on('node:click', async ({ node }) => {
      const nodeData = node.getData();
      
      // Clique no canal: expandir séries
      if (nodeData?.type === 'canal') {
        const canalId = nodeData.canalId;
        const isExpanded = expandedNodesRef.current.has(node.id);
        
        if (isExpanded) {
          // Recolher: remover séries, ideias, roteiros
          const nodesToRemove = graph.getNodes().filter(n => 
            n.id.startsWith(`serie-${node.id}`) || 
            n.id.startsWith(`ideia-${node.id}`) ||
            n.id.startsWith(`roteiro-${node.id}`) ||
            n.id.startsWith(`producao-${node.id}`)
          );
          nodesToRemove.forEach(n => graph.removeNode(n.id));
          expandedNodesRef.current.delete(node.id);
        } else {
          // Expandir: buscar séries do canal diretamente do Supabase
          try {
            // Buscar séries do banco de dados
            let series = seriesDataRef.current[canalId];
            
            if (!series) {
              const { data, error } = await supabase
                .from('series')
                .select('*')
                .eq('canal_id', canalId)
                .order('ordem_padrao', { ascending: true });
              
              if (error) throw error;
              series = data || [];
              seriesDataRef.current[canalId] = series;
            }
            
            // Mostrar apenas séries reais
            const seriesToShow = series || [];
            
            if (seriesToShow.length === 0) {
              console.log(`Canal ${canalId} não possui séries cadastradas`);
              return;
            }
            
            const nodePos = node.position();
            const serieRadius = 180;
            
            seriesToShow.forEach((serie: any, idx: number) => {
              const angle = (Math.PI / 3) * idx - Math.PI / 6;
              const x = nodePos.x + serieRadius * Math.cos(angle);
              const y = nodePos.y + serieRadius * Math.sin(angle);
              
              graph.addNode({
                id: `serie-${node.id}-${serie.id}`,
                x,
                y,
                width: 110,
                height: 110,
                shape: "circle",
                label: serie.nome,
                attrs: {
                  body: {
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 3,
                    filter: "drop-shadow(0 2px 12px rgba(99, 102, 241, 0.5))",
                  },
                  label: { 
                    fill: "#fff", 
                    fontWeight: "bold", 
                    fontSize: 14,
                    textWrap: { width: 90, ellipsis: true },
                  },
                },
                data: { 
                  type: "serie", 
                  serieId: serie.id,
                  canalId,
                  tooltip: `Série: ${serie.nome}`,
                },
              });
              
              graph.addEdge({
                source: node.id,
                target: `serie-${node.id}-${serie.id}`,
                attrs: {
                  line: {
                    stroke: "#666",
                    strokeWidth: 2,
                  },
                },
              });
            });
            
            expandedNodesRef.current.add(node.id);
          } catch (error) {
            console.error('Erro ao buscar séries:', error);
          }
        }
      }
      
      // Clique na série: expandir ideias e roteiros
      if (nodeData?.type === 'serie') {
        const isExpanded = expandedNodesRef.current.has(node.id);
        
        if (isExpanded) {
          // Recolher
          const nodesToRemove = graph.getNodes().filter(n => 
            n.id.startsWith(`ideia-${node.id}`) ||
            n.id.startsWith(`roteiro-${node.id}`) ||
            n.id.startsWith(`producao-${node.id}`)
          );
          nodesToRemove.forEach(n => graph.removeNode(n.id));
          expandedNodesRef.current.delete(node.id);
        } else {
          // Expandir: ideias e roteiros filtrados pela série
          const serieId = nodeData.serieId;
          const ideiasFiltered = ideias?.filter(i => i.serie_id === serieId).slice(0, 5) || [];
          const roteirosFiltered = roteiros?.filter(r => r.serie_id === serieId).slice(0, 3) || [];
          
          const nodePos = node.position();
          const ideiaRadius = 150;
          
          ideiasFiltered.forEach((ideia: any, idx: number) => {
            const angle = (Math.PI / 4) * idx - Math.PI / 8;
            const x = nodePos.x + ideiaRadius * Math.cos(angle);
            const y = nodePos.y + ideiaRadius * Math.sin(angle);
            
            graph.addNode({
              id: `ideia-${node.id}-${ideia.id}`,
              x,
              y,
              width: 80,
              height: 80,
              shape: "circle",
              label: ideia.titulo?.substring(0, 10) || "Ideia",
              attrs: {
                body: {
                  fill: "#a78bfa",
                  stroke: "#fff",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 8px rgba(167, 139, 250, 0.4))",
                },
                label: { 
                  fill: "#fff", 
                  fontWeight: "bold", 
                  fontSize: 12,
                  textWrap: { width: 60, ellipsis: true },
                },
              },
              data: { 
                type: "ideia", 
                ideiaId: ideia.id,
                tooltip: ideia.titulo || "Ideia de conteúdo",
              },
            });
            
            graph.addEdge({
              source: node.id,
              target: `ideia-${node.id}-${ideia.id}`,
              attrs: {
                line: {
                  stroke: "#888",
                  strokeWidth: 1.5,
                },
              },
            });
          });
          
          roteirosFiltered.forEach((roteiro: any, idx: number) => {
            const angle = Math.PI / 2 + (Math.PI / 4) * idx;
            const x = nodePos.x + ideiaRadius * Math.cos(angle);
            const y = nodePos.y + ideiaRadius * Math.sin(angle);
            
            graph.addNode({
              id: `roteiro-${node.id}-${roteiro.id}`,
              x,
              y,
              width: 80,
              height: 80,
              shape: "circle",
              label: "Roteiro",
              attrs: {
                body: {
                  fill: "#fb923c",
                  stroke: "#fff",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 8px rgba(251, 146, 60, 0.4))",
                },
                label: { 
                  fill: "#fff", 
                  fontWeight: "bold", 
                  fontSize: 12,
                },
              },
              data: { 
                type: "roteiro", 
                roteiroId: roteiro.id,
                tooltip: roteiro.titulo || "Roteiro",
              },
            });
            
            graph.addEdge({
              source: node.id,
              target: `roteiro-${node.id}-${roteiro.id}`,
              attrs: {
                line: {
                  stroke: "#888",
                  strokeWidth: 1.5,
                },
              },
            });
          });
          
          expandedNodesRef.current.add(node.id);
        }
      }
      
      // Clique em ideia/roteiro: expandir pipeline de produção
      if (nodeData?.type === 'ideia' || nodeData?.type === 'roteiro') {
        const isExpanded = expandedNodesRef.current.has(node.id);
        
        if (isExpanded) {
          const nodesToRemove = graph.getNodes().filter(n => n.id.startsWith(`producao-${node.id}`));
          nodesToRemove.forEach(n => graph.removeNode(n.id));
          expandedNodesRef.current.delete(node.id);
        } else {
          // Filtrar produção pela ideia ou roteiro
          const entityId = nodeData.ideiaId || nodeData.roteiroId;
          const entityType = nodeData.type === 'ideia' ? 'ideia_id' : 'roteiro_id';
          const producaoFiltered = producao?.filter(p => p[entityType] === entityId).slice(0, 3) || [];
          const nodePos = node.position();
          
          producaoFiltered.forEach((item: any, idx: number) => {
            const angle = Math.PI / 4 + idx * Math.PI / 3;
            const x = nodePos.x + 120 * Math.cos(angle);
            const y = nodePos.y + 120 * Math.sin(angle);
            
            graph.addNode({
              id: `producao-${node.id}-${item.id}`,
              x,
              y,
              width: 70,
              height: 70,
              shape: "circle",
              label: "Pipeline",
              attrs: {
                body: {
                  fill: "#10b981",
                  stroke: "#fff",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))",
                },
                label: { 
                  fill: "#fff", 
                  fontWeight: "bold", 
                  fontSize: 11,
                },
              },
              data: { 
                type: "producao", 
                producaoId: item.id,
                tooltip: `Pipeline: ${item.status || 'Em produção'}`,
              },
            });
            
            graph.addEdge({
              source: node.id,
              target: `producao-${node.id}-${item.id}`,
              attrs: {
                line: {
                  stroke: "#999",
                  strokeWidth: 1.5,
                },
              },
            });
          });
          
          expandedNodesRef.current.add(node.id);
        }
      }
    });

    // Tooltips
    graph.on('node:mouseenter', ({ node }) => {
      const tooltip = node.getData()?.tooltip;
      if (tooltip && containerRef.current) {
        const bbox = node.getBBox();
        const tip = document.createElement('div');
        tip.id = 'x6-tooltip';
        tip.innerText = tooltip;
        tip.style.position = 'absolute';
        tip.style.left = `${bbox.x + bbox.width / 2}px`;
        tip.style.top = `${bbox.y + bbox.height + 10}px`;
        tip.style.background = '#1f2937';
        tip.style.color = '#fff';
        tip.style.padding = '8px 16px';
        tip.style.borderRadius = '8px';
        tip.style.fontSize = '14px';
        tip.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
        tip.style.zIndex = '1000';
        tip.style.pointerEvents = 'none';
        containerRef.current.appendChild(tip);
      }
    });
    
    graph.on('node:mouseleave', () => {
      const tip = document.getElementById('x6-tooltip');
      if (tip) tip.remove();
    });

    // Resize responsivo
    const resizeGraph = () => {
      if (containerRef.current && graphRef.current) {
        graphRef.current.resize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
      }
    };
    window.addEventListener("resize", resizeGraph);

    return () => {
      window.removeEventListener("resize", resizeGraph);
      graph.dispose();
    };
  }, [canais, ideias, roteiros, producao]);

  return (
    <div className="min-h-screen bg-zinc-950 p-0 flex flex-col">
      <div className="px-8 pt-8 pb-4 border-b border-zinc-800/50 glass">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse-glow" />
          <h1 className="text-4xl font-black bg-linear-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Organograma Pulso
          </h1>
        </div>
        <p className="text-zinc-400">Mapa mental interativo do ecossistema de conteúdo</p>
      </div>
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative"
        style={{ 
          background: "radial-gradient(circle at center, #18181b 0%, #000 100%)",
        }} 
      />
    </div>
  );
}
