import { getSupabase } from '../lib/supabase'
import type {
  Bill,
  BillStatus,
  DocStatus,
  IntlDocKind,
  IntlDocument,
  LegislationDocument,
  NewsCategory,
  NewsPost,
  Profile,
  PublishStatus,
  Role
} from '../types/content'

export interface NewsDraft {
  id?: string
  title: string
  summary: string
  body: string
  category: NewsCategory
  author: string
  status: PublishStatus
  is_demo: boolean
  slug?: string
}

export interface BillDraft {
  id?: string
  number: string
  title: string
  summary: string
  status: BillStatus
  is_demo: boolean
  initiator: string
  submitted_on: string
  related_law_number: string
}

export interface LawDraft {
  id?: string
  doc_number: string
  title: string
  doc_type: string
  category: string
  authority: string
  adopted_on: string
  published_on: string
  effective_on: string
  revision: string
  status: DocStatus
  is_demo: boolean
  summary: string
  body: string
  related_numbers: string
}

export interface IntlDraft {
  id?: string
  title: string
  kind: IntlDocKind
  country: string
  signed_on: string
  status: string
  is_demo: boolean
  summary: string
  body: string
  published: boolean
}

function slugify(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya'
  }
  const transliterated = value
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function canManageNews(role: Role | null): boolean {
  return role === 'editor' || role === 'admin'
}

export function canManageDuma(role: Role | null): boolean {
  return role === 'duma' || role === 'admin'
}

export function canManageContent(role: Role | null): boolean {
  return role === 'editor' || role === 'admin'
}

export async function signIn(email: string, password: string): Promise<void> {
  const db = getSupabase()
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  const db = getSupabase()
  const { error } = await db.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const db = getSupabase()
  const { data, error } = await db
    .from('profiles')
    .select('id, display_name, role, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Профиль пользователя не найден. Обратитесь к администратору портала.')
  return data as unknown as Profile
}

export async function fetchNewsForAdmin(): Promise<NewsPost[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('news_posts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as NewsPost[]
}

export async function saveNews(draft: NewsDraft): Promise<void> {
  const db = getSupabase()
  const {
    data: { user },
    error: userError
  } = await db.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Требуется авторизация.')

  const payload: Record<string, unknown> = {
    title: draft.title.trim(),
    summary: draft.summary.trim() || null,
    body: draft.body.trim() || null,
    category: draft.category,
    author: draft.author.trim() || null,
    status: draft.status,
    is_demo: draft.is_demo
  }

  if (draft.status === 'published') {
    payload.published_at = new Date().toISOString()
  }

  if (draft.id) {
    const { error } = await db.from('news_posts').update(payload).eq('id', draft.id)
    if (error) throw new Error(error.message)
    return
  }

  const baseSlug = draft.slug?.trim() || slugify(draft.title) || `news-${Date.now()}`
  const payloadWithSlug = {
    ...payload,
    slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
    created_by: user.id
  }
  const { error } = await db.from('news_posts').insert(payloadWithSlug)
  if (error) throw new Error(error.message)
}

export async function deleteNews(id: string): Promise<void> {
  const db = getSupabase()
  const { error } = await db.from('news_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchBillsForAdmin(): Promise<Bill[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('bills')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as Bill[]
}

export async function saveBill(draft: BillDraft): Promise<void> {
  const db = getSupabase()
  const payload = {
    number: draft.number.trim(),
    title: draft.title.trim(),
    summary: nullable(draft.summary),
    status: draft.status,
    is_demo: draft.is_demo,
    initiator: draft.initiator.trim(),
    submitted_on: nullable(draft.submitted_on),
    related_law_number: nullable(draft.related_law_number)
  }

  const query = draft.id
    ? db.from('bills').update(payload).eq('id', draft.id)
    : db.from('bills').insert(payload)
  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function deleteBill(id: string): Promise<void> {
  const db = getSupabase()
  const { error } = await db.from('bills').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchLawsForAdmin(): Promise<LegislationDocument[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('legislation_documents')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(300)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as LegislationDocument[]
}

export async function saveLaw(draft: LawDraft): Promise<void> {
  const db = getSupabase()
  const payload = {
    doc_number: draft.doc_number.trim(),
    title: draft.title.trim(),
    doc_type: draft.doc_type,
    category: draft.category.trim() || draft.doc_type,
    authority: draft.authority.trim(),
    adopted_on: nullable(draft.adopted_on),
    published_on: nullable(draft.published_on),
    effective_on: nullable(draft.effective_on),
    revision: nullable(draft.revision),
    status: draft.status,
    is_demo: draft.is_demo,
    summary: nullable(draft.summary),
    body: nullable(draft.body),
    related_numbers: parseList(draft.related_numbers)
  }

  const query = draft.id
    ? db.from('legislation_documents').update(payload).eq('id', draft.id)
    : db.from('legislation_documents').insert(payload)
  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function deleteLaw(id: string): Promise<void> {
  const db = getSupabase()
  const { error } = await db.from('legislation_documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchIntlForAdmin(): Promise<IntlDocument[]> {
  const db = getSupabase()
  const { data, error } = await db
    .from('intl_documents')
    .select('*')
    .order('signed_on', { ascending: false, nullsFirst: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data || []) as unknown as IntlDocument[]
}

export async function saveIntl(draft: IntlDraft): Promise<void> {
  const db = getSupabase()
  const payload = {
    title: draft.title.trim(),
    kind: draft.kind,
    country: draft.country.trim(),
    signed_on: nullable(draft.signed_on),
    status: draft.status.trim() || 'Проект',
    is_demo: draft.is_demo,
    summary: nullable(draft.summary),
    body: nullable(draft.body),
    published: draft.published
  }

  const query = draft.id
    ? db.from('intl_documents').update(payload).eq('id', draft.id)
    : db.from('intl_documents').insert(payload)
  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function deleteIntl(id: string): Promise<void> {
  const db = getSupabase()
  const { error } = await db.from('intl_documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
