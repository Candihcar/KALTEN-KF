import { intlKindLabels } from '../lib/format'
import { getSupabase, isSupabaseConfigured, NotConfiguredError } from '../lib/supabase'
import type {
  Bill,
  BillEvent,
  CodeArticle,
  CodeKind,
  DumaSession,
  GovBody,
  IntlDocument,
  LegislationDocument,
  NewsCategory,
  NewsPost,
  Vote
} from '../types/content'

export interface HomeData {
  configured: boolean
  news: NewsPost[]
  documents: LegislationDocument[]
  bills: Bill[]
}

function searchTerm(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function sortByNumber<T extends { article_number: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.article_number.localeCompare(b.article_number, 'ru', { numeric: true })
  )
}

export async function fetchNews(params: {
  q?: string
  category?: NewsCategory | 'all'
  sort?: 'new' | 'old'
  limit?: number
} = {}): Promise<NewsPost[]> {
  const db = getSupabase()
  let query = db
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .eq('is_demo', false)
    .order('published_at', { ascending: params.sort === 'old', nullsFirst: false })
    .limit(params.limit ?? 60)

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  const term = searchTerm(params.q || '')
  if (term) {
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,body.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as unknown as NewsPost[]
}

export async function fetchNewsById(id: string): Promise<NewsPost> {
  const db = getSupabase()
  const { data, error } = await db
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_demo', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Публикация не найдена или ещё не опубликована.')
  return data as unknown as NewsPost
}

export async function fetchDocuments(params: {
  q?: string
  category?: string
  status?: string
  sort?: 'new' | 'old'
  limit?: number
} = {}): Promise<LegislationDocument[]> {
  const db = getSupabase()
  let query = db
    .from('legislation_documents')
    .select('*')
    .eq('is_demo', false)
    .order('adopted_on', { ascending: params.sort === 'old', nullsFirst: false })
    .limit(params.limit ?? 80)

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  const term = searchTerm(params.q || '')
  if (term) {
    query = query.or(
      `doc_number.ilike.%${term}%,title.ilike.%${term}%,body.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as unknown as LegislationDocument[]
}

export async function fetchDocument(id: string): Promise<LegislationDocument> {
  const db = getSupabase()
  const { data, error } = await db
    .from('legislation_documents')
    .select('*')
    .eq('id', id)
    .eq('is_demo', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Документ не найден.')
  return data as unknown as LegislationDocument
}

export async function fetchCodeArticles(
  kind: CodeKind,
  params: { q?: string; category?: string } = {}
): Promise<CodeArticle[]> {
  const db = getSupabase()
  let query = db.from('code_articles').select('*').eq('code_kind', kind).eq('is_demo', false)

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  const term = searchTerm(params.q || '')
  if (term) {
    query = query.or(
      `article_number.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return sortByNumber((data || []) as unknown as CodeArticle[])
}

export async function fetchCodeArticle(id: string): Promise<CodeArticle> {
  const db = getSupabase()
  const { data, error } = await db.from('code_articles').select('*').eq('id', id).eq('is_demo', false).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Статья не найдена.')
  return data as unknown as CodeArticle
}

export async function fetchBills(params: {
  q?: string
  status?: string
} = {}): Promise<Bill[]> {
  const db = getSupabase()
  let query = db
    .from('bills')
    .select('*')
    .eq('is_demo', false)
    .order('submitted_on', { ascending: false, nullsFirst: false })
    .limit(100)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  const term = searchTerm(params.q || '')
  if (term) {
    query = query.or(`number.ilike.%${term}%,title.ilike.%${term}%,summary.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as unknown as Bill[]
}

export async function fetchBill(id: string): Promise<{
  bill: Bill
  events: BillEvent[]
  votes: Vote[]
}> {
  const db = getSupabase()
  const { data: bill, error } = await db.from('bills').select('*').eq('id', id).eq('is_demo', false).maybeSingle()
  if (error) throw new Error(error.message)
  if (!bill) throw new Error('Законопроект не найден.')

  const [eventsResult, votesResult] = await Promise.all([
    db.from('bill_events').select('*').eq('bill_id', id).order('occurred_on', { ascending: true }),
    db.from('votes').select('*').eq('bill_id', id).eq('published', true).order('voted_on', { ascending: false })
  ])

  if (eventsResult.error) throw new Error(eventsResult.error.message)
  if (votesResult.error) throw new Error(votesResult.error.message)

  return {
    bill: bill as unknown as Bill,
    events: (eventsResult.data || []) as unknown as BillEvent[],
    votes: (votesResult.data || []) as unknown as Vote[]
  }
}

export async function fetchSessions(kind: 'agenda' | 'protocol'): Promise<DumaSession[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('duma_sessions')
    .select('*')
    .eq('kind', kind)
    .eq('published', true)
    .order('session_date', { ascending: false, nullsFirst: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as DumaSession[]
}

export async function fetchBodies(): Promise<GovBody[]> {
  const db = getSupabase()
  const { data, error } = await db.from('gov_bodies').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return (data || []) as unknown as GovBody[]
}

export async function fetchBody(slug: string): Promise<GovBody> {
  const db = getSupabase()
  const { data, error } = await db.from('gov_bodies').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Орган не найден.')
  return data as unknown as GovBody
}

export async function fetchIntlDocuments(): Promise<IntlDocument[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('intl_documents')
    .select('*')
    .eq('published', true)
    .eq('is_demo', false)
    .order('signed_on', { ascending: false, nullsFirst: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as IntlDocument[]
}

export async function fetchHomeData(): Promise<HomeData> {
  if (!isSupabaseConfigured) {
    return { configured: false, news: [], documents: [], bills: [] }
  }
  const db = getSupabase()
  const [newsResult, docsResult, billsResult] = await Promise.all([
    db
      .from('news_posts')
      .select('*')
      .eq('status', 'published')
      .eq('is_demo', false)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(6),
    db
      .from('legislation_documents')
      .select('*')
      .eq('is_demo', false)
      .order('published_on', { ascending: false, nullsFirst: false })
      .limit(4),
    db
      .from('bills')
      .select('*')
      .eq('is_demo', false)
      .order('submitted_on', { ascending: false, nullsFirst: false })
      .limit(4)
  ])

  if (newsResult.error) throw new Error(newsResult.error.message)
  if (docsResult.error) throw new Error(docsResult.error.message)
  if (billsResult.error) throw new Error(billsResult.error.message)

  return {
    configured: true,
    news: (newsResult.data || []) as unknown as NewsPost[],
    documents: (docsResult.data || []) as unknown as LegislationDocument[],
    bills: (billsResult.data || []) as unknown as Bill[]
  }
}

export interface SearchGroup {
  label: string
  items: Array<{ id: string; title: string; meta: string; to: string }>
}

export async function globalSearch(term: string): Promise<SearchGroup[]> {
  const db = getSupabase()
  const safe = searchTerm(term)
  if (!safe) return []

  const [newsResult, docsResult, billsResult, codeResult, intlResult] = await Promise.all([
    db
      .from('news_posts')
      .select('*')
      .eq('status', 'published')
      .eq('is_demo', false)
      .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,body.ilike.%${safe}%`)
      .limit(10),
    db
      .from('legislation_documents')
      .select('*')
      .eq('is_demo', false)
      .or(`doc_number.ilike.%${safe}%,title.ilike.%${safe}%,body.ilike.%${safe}%`)
      .limit(10),
    db
      .from('bills')
      .select('*')
      .eq('is_demo', false)
      .or(`number.ilike.%${safe}%,title.ilike.%${safe}%,summary.ilike.%${safe}%`)
      .limit(10),
    db
      .from('code_articles')
      .select('*')
      .eq('is_demo', false)
      .or(`article_number.ilike.%${safe}%,title.ilike.%${safe}%,description.ilike.%${safe}%`)
      .limit(10),
    db
      .from('intl_documents')
      .select('*')
      .eq('published', true)
      .eq('is_demo', false)
      .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,body.ilike.%${safe}%,country.ilike.%${safe}%`)
      .limit(10)
  ])

  for (const result of [newsResult, docsResult, billsResult, codeResult, intlResult]) {
    if (result.error) throw new Error(result.error.message)
  }

  const news = (newsResult.data || []) as unknown as NewsPost[]
  const docs = (docsResult.data || []) as unknown as LegislationDocument[]
  const bills = (billsResult.data || []) as unknown as Bill[]
  const code = (codeResult.data || []) as unknown as CodeArticle[]
  const intl = (intlResult.data || []) as unknown as IntlDocument[]

  return [
    {
      label: 'Новости',
      items: news.map((item) => ({
        id: item.id,
        title: item.title,
        meta: item.author || 'Портал КФ',
        to: `/news/${item.id}`
      }))
    },
    {
      label: 'Законодательство',
      items: docs.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.doc_type} · № ${item.doc_number}`,
        to: `/legislation/${item.id}`
      }))
    },
    {
      label: 'Дума КФ',
      items: bills.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `Законопроект № ${item.number}`,
        to: `/duma/bills/${item.id}`
      }))
    },
    {
      label: 'Кодексы',
      items: code.map((item) => ({
        id: item.id,
        title: `Ст. ${item.article_number}. ${item.title}`,
        meta: item.code_kind === 'criminal' ? 'Уголовный кодекс КФ' : 'Кодекс об административных правонарушениях',
        to: item.code_kind === 'criminal' ? `/criminal-code/${item.id}` : `/administrative-code/${item.id}`
      }))
    },
    {
      label: 'Международные отношения',
      items: intl.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${intlKindLabels[item.kind]} · ${item.country}`,
        to: '/international'
      }))
    }
  ].filter((group) => group.items.length > 0)
}

export { NotConfiguredError }
