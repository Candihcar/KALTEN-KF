import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'
import { errorMessage, useAsync } from '../lib/useAsync'
import { formatDateTime, newsCategories, newsCategoryLabels } from '../lib/format'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  canManageNews,
  deleteNews,
  fetchNewsForAdmin,
  fetchProfile,
  saveNews,
  signIn,
  signOut,
  type NewsDraft
} from '../services/admin'
import {
  Badge,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  PageHeader
} from '../components/ui'
import type { NewsCategory, Profile, PublishStatus, Role } from '../types/content'

const roleLabels: Record<Role, string> = {
  user: 'Пользователь',
  editor: 'Редактор',
  duma: 'Представитель Думы',
  admin: 'Администратор'
}

const statusLabels: Record<PublishStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив'
}

const emptyDraft: NewsDraft = {
  title: '',
  summary: '',
  body: '',
  category: 'state',
  author: '',
  status: 'draft',
  is_demo: false
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="panel">
        <div className="panel-head">
          <h2>Вход для сотрудников</h2>
        </div>
        <div className="panel-body">
          <p className="muted small">
            Авторизация выполняется средствами Supabase Auth. Учётные записи создаются
            администратором портала; самостоятельная регистрация не предоставляет прав на публикацию.
          </p>
          <form className="stack" onSubmit={submit}>
            <div className="field">
              <label htmlFor="admin-email">Электронная почта</label>
              <input
                id="admin-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Пароль</label>
              <input
                id="admin-password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Вход…' : 'Войти'}
            </button>
          </form>
          <p className="field-hint">
            Пароль не сохраняется в коде портала. После входа сессия хранится в браузере средствами
            Supabase Auth.
          </p>
        </div>
      </div>
    </div>
  )
}

function NewsManager({ profile }: { profile: Profile }) {
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = useAsync(() => fetchNewsForAdmin(), [refresh])
  const [draft, setDraft] = useState<NewsDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const posts = data ?? []

  function startNew() {
    setDraft(emptyDraft)
    setEditingId(null)
    setMessage(null)
    document.getElementById('news-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startEdit(id: string) {
    const post = posts.find((item) => item.id === id)
    if (!post) return
    setDraft({
      title: post.title,
      summary: post.summary ?? '',
      body: post.body ?? '',
      category: post.category,
      author: post.author ?? '',
      status: post.status,
      is_demo: post.is_demo
    })
    setEditingId(post.id)
    setMessage(null)
    document.getElementById('news-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (draft.title.trim().length < 3) {
      setMessage({ tone: 'error', text: 'Заголовок должен содержать не менее 3 символов.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await saveNews({ ...draft, id: editingId ?? undefined })
      setMessage({ tone: 'success', text: editingId ? 'Публикация обновлена.' : 'Публикация создана.' })
      setDraft(emptyDraft)
      setEditingId(null)
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Удалить публикацию «${title}»? Действие необратимо.`)) return
    try {
      await deleteNews(id)
      setMessage({ tone: 'success', text: 'Публикация удалена.' })
      if (editingId === id) {
        setEditingId(null)
        setDraft(emptyDraft)
      }
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <div className="admin-workspace">
      <div className="admin-toolbar">
        <div>
          <p className="admin-user">
            {profile.display_name || 'Сотрудник портала'}
            <Badge tone="navy">{roleLabels[profile.role]}</Badge>
          </p>
          <p className="muted small">Управление новостями. Доступ проверяется политиками Supabase RLS.</p>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={startNew}>
          Новая публикация
        </button>
      </div>

      {message ? (
        <Notice tone={message.tone === 'success' ? 'success' : 'error'}>{message.text}</Notice>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : posts.length === 0 ? (
        <EmptyState title="Публикаций пока нет">
          Создайте первую публикацию или примените демонстрационный набор данных.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <caption className="visually-hidden">Список публикаций</caption>
            <thead>
              <tr>
                <th scope="col">Заголовок</th>
                <th scope="col">Категория</th>
                <th scope="col">Статус</th>
                <th scope="col">Обновлено</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className="admin-post-title">{post.title}</span>
                    {post.is_demo ? <span className="demo-inline">Демо</span> : null}
                  </td>
                  <td>{newsCategoryLabels[post.category]}</td>
                  <td>
                    <Badge tone={post.status === 'published' ? 'green' : post.status === 'draft' ? 'amber' : 'neutral'}>
                      {statusLabels[post.status]}
                    </Badge>
                  </td>
                  <td>{formatDateTime(post.updated_at)}</td>
                  <td className="admin-row-actions">
                    <button className="text-button" type="button" onClick={() => startEdit(post.id)}>
                      Изменить
                    </button>
                    <button
                      className="text-button text-button-danger"
                      type="button"
                      onClick={() => remove(post.id, post.title)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="panel" id="news-editor">
        <div className="panel-head">
          <h2>{editingId ? 'Редактирование публикации' : 'Новая публикация'}</h2>
          {editingId ? (
            <button className="text-button" type="button" onClick={startNew}>
              Отменить редактирование
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          <form className="admin-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="post-title">Заголовок</label>
              <input
                id="post-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="post-summary">Краткое описание</label>
              <textarea
                id="post-summary"
                className="input textarea"
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                maxLength={600}
              />
            </div>
            <div className="field">
              <label htmlFor="post-body">Полный текст</label>
              <textarea
                id="post-body"
                className="input textarea"
                rows={10}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              <p className="field-hint">Абзацы разделяются пустой строкой.</p>
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="post-category">Категория</label>
                <select
                  id="post-category"
                  className="select"
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({ ...draft, category: event.target.value as NewsCategory })
                  }
                >
                  {newsCategories.map((category) => (
                    <option key={category} value={category}>
                      {newsCategoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="post-status">Статус</label>
                <select
                  id="post-status"
                  className="select"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as PublishStatus })
                  }
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                  <option value="archived">Архив</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="post-author">Автор или орган</label>
              <input
                id="post-author"
                className="input"
                value={draft.author}
                onChange={(event) => setDraft({ ...draft, author: event.target.value })}
                placeholder="Например: Пресс-служба Правительства КФ"
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.is_demo}
                onChange={(event) => setDraft({ ...draft, is_demo: event.target.checked })}
              />
              <span>Пометить материал как демонстрационный</span>
            </label>
            <div className="admin-form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <Link className="btn btn-ghost" to="/news">
                Открыть публичную ленту
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileError(null)
      return
    }
    let active = true
    setProfileLoading(true)
    setProfileError(null)
    fetchProfile(session.user.id)
      .then((value) => {
        if (active) setProfile(value)
      })
      .catch((err) => {
        if (active) setProfileError(errorMessage(err))
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    return () => {
      active = false
    }
  }, [session])

  async function logout() {
    try {
      await signOut()
      setProfile(null)
    } catch (err) {
      setProfileError(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        kicker="Служебный раздел"
        title="Панель управления"
        description="Управление публикациями портала. Доступ предоставляется по ролям и проверяется на уровне базы данных."
        breadcrumbs={[{ label: 'Панель управления' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Административная панель доступна после настройки Supabase. Инструкция по миграциям
            находится в файле <code>docs/DEPLOYMENT.md</code>. Локальная демонстрационная версия не
            использует эту панель.
          </Notice>
        ) : authLoading ? (
          <Loading label="Проверка сессии…" />
        ) : !session ? (
          <>
            <Notice tone="info" title="Защищённый раздел">
              Новые учётные записи не получают административные права автоматически. Роль назначается
              администратором портала в таблице <code>profiles</code>.
            </Notice>
            <LoginForm />
          </>
        ) : profileLoading ? (
          <Loading label="Загрузка профиля…" />
        ) : profileError ? (
          <>
            <Notice tone="error" title="Не удалось получить профиль">
              {profileError}
            </Notice>
            <button className="btn btn-secondary" type="button" onClick={logout}>
              Выйти
            </button>
          </>
        ) : profile ? (
          <>
            {!canManageNews(profile.role) ? (
              <Notice tone="warning" title="Недостаточно прав">
                Роль «{roleLabels[profile.role]}» не позволяет управлять новостями. Обратитесь к
                администратору портала для изменения роли. Публичный просмотр материалов доступен без
                входа.
              </Notice>
            ) : (
              <NewsManager profile={profile} />
            )}
            <p className="admin-footer-actions">
              <button className="text-button" type="button" onClick={logout}>
                Выйти из панели
              </button>
            </p>
          </>
        ) : null}
      </div>
    </>
  )
}
