'use client'

import { Player } from '@remotion/player'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { PulsoVideo } from '@/remotion/PulsoVideo'
import type { PulsoVideoProps } from '@/remotion/PulsoVideo'

interface Props {
  videoProps: PulsoVideoProps
  duracao: number
}

export default function VideoPlayer({ videoProps, duracao }: Props) {
  const fps = 30
  const durationInFrames = duracao * fps

  return (
    <Player
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={PulsoVideo as any}
      inputProps={videoProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{ width: '100%', height: '100%' }}
      controls
      loop
    />
  )
}
