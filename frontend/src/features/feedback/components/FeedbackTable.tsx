import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFeedback } from '../FeedbackProvider'
import { byId, formatDate } from '../format'
import type { Feedback } from '../types'
import { ReferenceBadge } from './ReferenceBadge'

interface FeedbackTableProps {
  feedbacks: Feedback[]
  /** Where a row leads: `${basePath}/${id}`. */
  basePath?: string
  /** The admin list shows who wrote each feedback. */
  showAuthor?: boolean
}

export function FeedbackTable({ feedbacks, basePath = '/feedback', showAuthor = false }: FeedbackTableProps) {
  const { t, i18n } = useTranslation()
  const { types, statuses } = useFeedback()

  if (feedbacks.length === 0) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t('feedback.list.empty')}</p>
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('feedback.list.title')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('feedback.list.type')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('feedback.list.status')}</TableHead>
            {showAuthor && <TableHead className="hidden sm:table-cell">{t('feedback.list.author')}</TableHead>}
            <TableHead className="hidden sm:table-cell">{t('feedback.list.updated')}</TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">{t('feedback.list.replies')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((feedback) => {
            const type = byId(types, feedback.typeId)
            const status = byId(statuses, feedback.statusId)
            const replies = feedback.messages.filter((message) => message.kind === 'comment').length
            return (
              <TableRow key={feedback.id}>
                <TableCell className="max-w-[16rem] font-medium sm:max-w-sm">
                  <Link to={`${basePath}/${feedback.id}`} className="block truncate hover:underline">
                    {feedback.title}
                  </Link>
                  {/* Small screens: the columns are hidden, the badges move under the title. */}
                  <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                    {type && <ReferenceBadge name={type.name} tone={type.tone} />}
                    {status && <ReferenceBadge name={status.name} tone={status.tone} />}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{type && <ReferenceBadge name={type.name} tone={type.tone} />}</TableCell>
                <TableCell className="hidden sm:table-cell">{status && <ReferenceBadge name={status.name} tone={status.tone} />}</TableCell>
                {showAuthor && <TableCell className="hidden sm:table-cell">{feedback.createdByUsername}</TableCell>}
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(feedback.updatedAt, i18n.language)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {replies > 0 && (
                    <span className="inline-flex items-center gap-1" title={t('feedback.list.replies')}>
                      <MessageSquare aria-hidden className="size-3.5" />
                      {replies}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
