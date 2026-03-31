import { Composition } from 'remotion'
import { PulsoVideo, type PulsoVideoProps } from './PulsoVideo'

// Composição padrão: 9:16, 60fps, 60 segundos
export function RemotionRoot() {
  const defaultProps: PulsoVideoProps = {
    titulo: 'Título do Vídeo',
    subtitles: [],
    pose: 3,
    background: 1,
    audioUrl: undefined,
    canalNome: 'Pulso Dark PT',
    showLogo: true,
  }

  return (
    <Composition
      id="PulsoShort"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={PulsoVideo as any}
      durationInFrames={1800} // 60s × 30fps
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  )
}
