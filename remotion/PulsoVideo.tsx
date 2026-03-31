import {
  AbsoluteFill,
  Img,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion'

// Poses do mascote baseadas no tom do conteúdo
export type MascotePose = 1 | 2 | 3 | 4 | 5
// 1 = surpreso/revelação  2 = relaxado/calmo
// 3 = animado+lanterna    4 = cool+óculos
// 5 = sério+lanterna

// Backgrounds disponíveis
export type Background = 1 | 2 | 3 | 4 | 5

export interface SubtitleWord {
  word: string
  startFrame: number
  endFrame: number
}

export interface PulsoVideoProps {
  titulo: string
  subtitles: SubtitleWord[]
  pose: MascotePose
  background: Background
  audioUrl?: string
  canalNome?: string
  showLogo?: boolean
}

// Paletas de cor por background para o texto
const BG_COLORS: Record<Background, { text: string; accent: string; overlay: string }> = {
  1: { text: '#ffffff', accent: '#f5c518', overlay: 'rgba(30,0,60,0.55)' },
  2: { text: '#ffffff', accent: '#7c3aed', overlay: 'rgba(0,20,60,0.55)' },
  3: { text: '#ffffff', accent: '#f59e0b', overlay: 'rgba(10,30,10,0.55)' },
  4: { text: '#ffffff', accent: '#ec4899', overlay: 'rgba(40,0,40,0.55)' },
  5: { text: '#1a1a2e', accent: '#7c3aed', overlay: 'rgba(255,255,255,0.15)' },
}

function Mascote({ pose, frame }: { pose: MascotePose; frame: number }) {
  const { fps } = useVideoConfig()

  // Animação suave de respiração (bob up/down)
  const bob = Math.sin((frame / fps) * 1.5) * 8

  // Entrada com spring
  const entrance = spring({ frame, fps, config: { damping: 20, stiffness: 120 } })
  const scale = interpolate(entrance, [0, 1], [0.6, 1])
  const translateY = interpolate(entrance, [0, 1], [120, 0])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 260,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY + bob}px) scale(${scale})`,
        width: 520,
        height: 620,
        zIndex: 10,
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
      }}
    >
      <Img
        src={staticFile(`/pulso/${pose}.png`)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}

function Logo({ frame }: { frame: number }) {
  const { fps } = useVideoConfig()
  const entrance = spring({ frame, fps, delay: 10, config: { damping: 25 } })
  const opacity = interpolate(entrance, [0, 1], [0, 1])

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 50,
        opacity,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Img
        src={staticFile('/pulso/logo.png')}
        style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 14 }}
      />
    </div>
  )
}

function Titulo({ titulo, frame, colors }: { titulo: string; frame: number; colors: typeof BG_COLORS[1] }) {
  const { fps } = useVideoConfig()
  const entrance = spring({ frame, fps, delay: 5, config: { damping: 18, stiffness: 100 } })
  const translateY = interpolate(entrance, [0, 1], [-40, 0])
  const opacity = interpolate(entrance, [0, 1], [0, 1])

  return (
    <div
      style={{
        position: 'absolute',
        top: 130,
        left: 40,
        right: 40,
        zIndex: 20,
        transform: `translateY(${translateY}px)`,
        opacity,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: colors.overlay,
          borderRadius: 20,
          padding: '18px 24px',
          backdropFilter: 'blur(12px)',
          border: `2px solid ${colors.accent}40`,
        }}
      >
        <p
          style={{
            color: colors.text,
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1.15,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          {titulo}
        </p>
      </div>
    </div>
  )
}

function Subtitles({
  subtitles,
  frame,
  colors,
}: {
  subtitles: SubtitleWord[]
  frame: number
  colors: typeof BG_COLORS[1]
}) {
  // Palavras visíveis no frame atual
  const visible = subtitles.filter((w) => frame >= w.startFrame && frame < w.endFrame)
  // Linha atual: últimas 6 palavras visíveis
  const line = visible.slice(-6)

  if (line.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 110,
        left: 40,
        right: 40,
        zIndex: 30,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.75)',
          borderRadius: 16,
          padding: '16px 24px',
          backdropFilter: 'blur(8px)',
          display: 'inline-block',
          maxWidth: '100%',
        }}
      >
        <p
          style={{
            color: '#ffffff',
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.2,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {line.map((w, i) => {
            // Última palavra em destaque
            const isActive = i === line.length - 1
            return (
              <span
                key={`${w.word}-${w.startFrame}`}
                style={{
                  color: isActive ? colors.accent : '#ffffff',
                  marginRight: i < line.length - 1 ? '0.25em' : 0,
                }}
              >
                {w.word}
              </span>
            )
          })}
        </p>
      </div>
    </div>
  )
}

function PulsoWatermark({ colors }: { colors: typeof BG_COLORS[1] }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        zIndex: 20,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: colors.accent,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          opacity: 0.9,
          letterSpacing: '0.15em',
          margin: 0,
        }}
      >
        @PULSO
      </p>
    </div>
  )
}

export function PulsoVideo({
  titulo,
  subtitles,
  pose,
  background,
  audioUrl,
  showLogo = true,
}: PulsoVideoProps) {
  const frame = useCurrentFrame()
  const colors = BG_COLORS[background]

  return (
    <AbsoluteFill>
      {/* Background */}
      <Img
        src={staticFile(`/pulso/back${background}.png`)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Overlay escuro para contraste */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: colors.overlay,
          zIndex: 1,
        }}
      />

      {/* Logo */}
      {showLogo && <Logo frame={frame} />}

      {/* Título */}
      <Titulo titulo={titulo} frame={frame} colors={colors} />

      {/* Mascote */}
      <Mascote pose={pose} frame={frame} />

      {/* Legendas */}
      <Subtitles subtitles={subtitles} frame={frame} colors={colors} />

      {/* Watermark */}
      <PulsoWatermark colors={colors} />

      {/* Áudio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  )
}
