import { supabase } from '@/lib/supabase/client'

type RelationErrorLike =
  | {
      code?: string | null
      message?: string | null
    }
  | null

export function isMissingRelationError(error: RelationErrorLike) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    error.message?.includes('Could not find the table') ||
    error.message?.includes('does not exist') ||
    false
  )
}

export async function selectWorkflowLogs<T>(
  selectClause: string,
  options?: {
    limit?: number
    ascending?: boolean
  },
) {
  const limit = options?.limit ?? 50
  const ascending = options?.ascending ?? false

  const publicResult = await supabase
    .from('logs_workflows')
    .select(selectClause)
    .order('created_at', { ascending })
    .limit(limit)

  if (!publicResult.error) {
    return (publicResult.data ?? []) as T[]
  }

  if (!isMissingRelationError(publicResult.error)) {
    throw publicResult.error
  }

  const fallbackResult = await supabase
    .schema('pulso_content')
    .from('logs_workflows')
    .select(selectClause)
    .order('created_at', { ascending })
    .limit(limit)

  if (fallbackResult.error) {
    throw fallbackResult.error
  }

  return (fallbackResult.data ?? []) as T[]
}
