import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackBannerProps {
  tone: FeedbackTone
  title: string
  message: string
  onDismiss?: () => void
}

function getToneStyles(tone: FeedbackTone) {
  if (tone === 'success') {
    return {
      container: 'border-green-500/30 bg-green-500/10 text-green-100',
      icon: <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-300" />,
    }
  }

  if (tone === 'error') {
    return {
      container: 'border-red-500/30 bg-red-500/10 text-red-100',
      icon: <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />,
    }
  }

  return {
    container: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
    icon: <Info className="mt-0.5 h-5 w-5 text-blue-300" />,
  }
}

export function FeedbackBanner({
  tone,
  title,
  message,
  onDismiss,
}: FeedbackBannerProps) {
  const styles = getToneStyles(tone)

  return (
    <div className={`rounded-2xl border p-4 ${styles.container}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {styles.icon}
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm opacity-90">{message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-current/80 transition hover:bg-white/10 hover:text-current"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
