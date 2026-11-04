import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Tone } from '../types'
import { TONE_CLASSES } from './tone'

/** The colored pill of a type or a status. */
export function ReferenceBadge({ name, tone, className }: { name: string; tone: Tone; className?: string }) {
  return <Badge variant="secondary" className={cn(TONE_CLASSES[tone], className)}>{name}</Badge>
}
