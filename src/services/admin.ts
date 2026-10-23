import { getSupabase } from '../lib/supabase'
import type { NewsCategory, NewsPost, Profile, PublishStatus, Role } from '../types/content'

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

export function canManageNews(role: Role | null): boolean {
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

