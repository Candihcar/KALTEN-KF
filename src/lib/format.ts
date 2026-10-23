import type {
  BillStatus,
  BodyKind,
  CodeKind,
  DocStatus,
  IntlDocKind,
  NewsCategory
} from '../types/content'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter.format(date)
}

export const newsCategoryLabels: Record<NewsCategory, string> = {
  state: 'Государство',
  government: 'Правительство',
  duma: 'Дума',
  legislation: 'Законодательство',
  international: 'Международные отношения',
  security: 'Безопасность',
  statements: 'Официальные заявления',
  announcements: 'Объявления'
}

export const newsCategories = Object.keys(newsCategoryLabels) as NewsCategory[]

export const docStatusLabels: Record<DocStatus, string> = {
  draft: 'Проект',
  in_force: 'Действует',
  amended: 'Изменён',
  suspended: 'Приостановлен',
  repealed: 'Утратил силу',
  cancelled: 'Отменён'
}

export const billStatusLabels: Record<BillStatus, string> = {
  draft: 'Проект',
  submitted: 'Внесён',
  under_review: 'На рассмотрении',
  voting: 'На голосовании',
  adopted: 'Принят',
  rejected: 'Отклонён',
  revision: 'На доработке',
  signed: 'Подписан',
  published: 'Опубликован',
  void: 'Утратил силу'
}

export const bodyKindLabels: Record<BodyKind, string> = {
  head: 'Глава государства',
  government: 'Правительство',
  duma: 'Законодательный орган',
  judicial: 'Судебные органы',
  law_enforcement: 'Правоохранительные органы',
  agency: 'Иные ведомства'
}

export const intlKindLabels: Record<IntlDocKind, string> = {
  treaty: 'Договор',
  agreement: 'Соглашение',
  statement: 'Заявление',
  negotiation: 'Переговоры'
}

export const codeKindLabels: Record<CodeKind, string> = {
  criminal: 'Уголовный кодекс КФ',
  administrative: 'Кодекс об административных правонарушениях КФ'
}

export const docTypeOptions = [
  'Конституция КФ',
  'Уголовный кодекс КФ',
  'Кодекс об административных правонарушениях',
  'Иные кодексы',
  'Федеральные законы',
  'Постановления Думы',
  'Указы главы государства',
  'Постановления правительства',
  'Прочие нормативные акты'
]

export type BadgeTone = 'neutral' | 'navy' | 'green' | 'amber' | 'red' | 'gold'

export function docStatusTone(status: DocStatus): BadgeTone {
  if (status === 'in_force') return 'green'
  if (status === 'amended') return 'amber'
  if (status === 'suspended') return 'amber'
  if (status === 'repealed' || status === 'cancelled') return 'red'
  return 'neutral'
}

export function billStatusTone(status: BillStatus): BadgeTone {
  if (status === 'adopted' || status === 'signed' || status === 'published') return 'green'
  if (status === 'rejected' || status === 'void') return 'red'
  if (status === 'voting' || status === 'revision') return 'amber'
  if (status === 'draft') return 'neutral'
  return 'navy'
}

export function readingTime(body: string | null | undefined): string {
  const words = (body || '').trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 180))
  return `${minutes} мин чтения`
}

export function excerpt(text: string | null | undefined, max = 180): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}
