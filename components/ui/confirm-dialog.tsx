import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
  isConfirming?: boolean
  confirmDisabled?: boolean
  confirmTone?: 'primary' | 'danger'
}

function getConfirmToneClasses(confirmTone: 'primary' | 'danger') {
  if (confirmTone === 'danger') {
    return 'bg-red-600 hover:bg-red-700'
  }

  return 'bg-violet-600 hover:bg-violet-700'
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  children,
  isConfirming = false,
  confirmDisabled = false,
  confirmTone = 'primary',
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-fade-in">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-sm text-zinc-400">{description}</p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled || isConfirming}
            className={`flex-1 rounded-lg px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${getConfirmToneClasses(
              confirmTone,
            )}`}
          >
            {isConfirming ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
