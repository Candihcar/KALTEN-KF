import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'
import { errorMessage, useAsync } from '../lib/useAsync'
import {
  billStatusLabels,
  billStatusTone,
  docStatusLabels,
  docStatusTone,
  docTypeOptions,
  formatDate,
  formatDateTime,
  intlKindLabels,
  newsCategories,
  newsCategoryLabels
} from '../lib/format'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  canManageContent,
  canManageDuma,
  canManageNews,
  deleteBill,
  deleteIntl,
  deleteLaw,
  deleteNews,
  fetchBillsForAdmin,
  fetchIntlForAdmin,
  fetchLawsForAdmin,
  fetchNewsForAdmin,
  fetchProfile,
  saveBill,
  saveIntl,
  saveLaw,
  saveNews,
  signIn,
  signOut,
  type BillDraft,
  type IntlDraft,
  type LawDraft,
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
import type {
  BillStatus,
  DocStatus,
  IntlDocKind,
  NewsCategory,
  Profile,
  PublishStatus,
  Role
} from '../types/content'

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

type AdminTab = 'news' | 'bill' | 'law' | 'intl'

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'news', label: 'Новости' },
  { id: 'bill', label: 'Законопроекты' },
  { id: 'law', label: 'Законы и НПА' },
  { id: 'intl', label: 'Международные документы' }
]

function allowedTab(tab: AdminTab, role: Role): boolean {
  if (tab === 'news') return canManageNews(role)
  if (tab === 'bill') return canManageDuma(role)
  return canManageContent(role)
}

function firstAllowedTab(role: Role): AdminTab | null {
  return tabs.find((tab) => allowedTab(tab.id, role))?.id ?? null
}

const emptyNewsDraft: NewsDraft = {
  title: '',
  summary: '',
  body: '',
  category: 'state',
  author: '',
  status: 'draft',
  is_demo: false
}

const emptyBillDraft: BillDraft = {
  number: '',
  title: '',
  summary: '',
  status: 'submitted',
  is_demo: false,
  initiator: 'Дума КФ',
  submitted_on: new Date().toISOString().slice(0, 10),
  related_law_number: ''
}

const emptyLawDraft: LawDraft = {
  doc_number: '',
  title: '',
  doc_type: 'Законы КФ',
  category: '',
  authority: 'Дума КФ',
  adopted_on: new Date().toISOString().slice(0, 10),
  published_on: new Date().toISOString().slice(0, 10),
  effective_on: new Date().toISOString().slice(0, 10),
  revision: 'Редакция 1',
  status: 'draft',
  is_demo: false,
  summary: '',
  body: '',
  related_numbers: ''
}

const emptyIntlDraft: IntlDraft = {
  title: '',
  kind: 'agreement',
  country: '',
  signed_on: new Date().toISOString().slice(0, 10),
  status: 'Подготовлен',
  is_demo: false,
  summary: '',
  body: '',
  published: false
}

type Message = { tone: 'success' | 'error'; text: string } | null

function ManagerToolbar({
  profile,
  description,
  onNew
}: {
  profile: Profile
  description: string
  onNew: () => void
}) {
  return (
    <div className="admin-toolbar">
      <div>
        <p className="admin-user">
          {profile.display_name || 'Сотрудник портала'}
          <Badge tone="navy">{roleLabels[profile.role]}</Badge>
        </p>
        <p className="muted small">{description}</p>
      </div>
      <button className="btn btn-secondary btn-sm" type="button" onClick={onNew}>
        Новый материал
      </button>
    </div>
  )
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
  const [draft, setDraft] = useState<NewsDraft>(emptyNewsDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const posts = data ?? []

  function startNew() {
    setDraft(emptyNewsDraft)
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
      setDraft(emptyNewsDraft)
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
        setDraft(emptyNewsDraft)
      }
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <div className="admin-workspace">
      <ManagerToolbar
        profile={profile}
        description="Управление новостями. Доступ проверяется политиками Supabase RLS."
        onNew={startNew}
      />

      {message ? (
        <Notice tone={message.tone === 'success' ? 'success' : 'error'}>{message.text}</Notice>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : posts.length === 0 ? (
        <EmptyState title="Публикаций пока нет">
          Создайте первую публикацию. Демонстрационные записи можно удалить из этой панели.
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
              <label htmlFor="news-title">Заголовок</label>
              <input
                id="news-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="news-summary">Краткое описание</label>
              <textarea
                id="news-summary"
                className="input textarea"
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                maxLength={600}
              />
            </div>
            <div className="field">
              <label htmlFor="news-body">Полный текст</label>
              <textarea
                id="news-body"
                className="input textarea"
                rows={10}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              <p className="field-hint">Абзацы разделяются пустой строкой.</p>
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="news-category">Категория</label>
                <select
                  id="news-category"
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
                <label htmlFor="news-status">Статус</label>
                <select
                  id="news-status"
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
              <label htmlFor="news-author">Автор или орган</label>
              <input
                id="news-author"
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

function BillManager({ profile }: { profile: Profile }) {
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = useAsync(() => fetchBillsForAdmin(), [refresh])
  const [draft, setDraft] = useState<BillDraft>(emptyBillDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const bills = data ?? []

  function startNew() {
    setDraft(emptyBillDraft)
    setEditingId(null)
    setMessage(null)
    document.getElementById('bill-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startEdit(id: string) {
    const bill = bills.find((item) => item.id === id)
    if (!bill) return
    setDraft({
      number: bill.number,
      title: bill.title,
      summary: bill.summary ?? '',
      status: bill.status,
      is_demo: bill.is_demo,
      initiator: bill.initiator,
      submitted_on: bill.submitted_on ?? '',
      related_law_number: bill.related_law_number ?? ''
    })
    setEditingId(bill.id)
    setMessage(null)
    document.getElementById('bill-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (draft.number.trim().length < 2 || draft.title.trim().length < 3) {
      setMessage({ tone: 'error', text: 'Укажите номер и заголовок законопроекта.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await saveBill({ ...draft, id: editingId ?? undefined })
      setMessage({ tone: 'success', text: editingId ? 'Законопроект обновлён.' : 'Законопроект создан.' })
      setDraft(emptyBillDraft)
      setEditingId(null)
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Удалить законопроект «${title}»? Действие необратимо.`)) return
    try {
      await deleteBill(id)
      setMessage({ tone: 'success', text: 'Законопроект удалён.' })
      if (editingId === id) {
        setEditingId(null)
        setDraft(emptyBillDraft)
      }
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <div className="admin-workspace">
      <ManagerToolbar
        profile={profile}
        description="Управление законопроектами Думы. Доступ проверяется политиками Supabase RLS."
        onNew={startNew}
      />

      {message ? (
        <Notice tone={message.tone === 'success' ? 'success' : 'error'}>{message.text}</Notice>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : bills.length === 0 ? (
        <EmptyState title="Законопроектов пока нет">
          Создайте первую запись или удалите демонстрационные материалы.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <caption className="visually-hidden">Список законопроектов</caption>
            <thead>
              <tr>
                <th scope="col">Номер и название</th>
                <th scope="col">Статус</th>
                <th scope="col">Внесён</th>
                <th scope="col">Обновлено</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <span className="admin-post-title">{bill.title}</span>
                    <span className="doc-number">№ {bill.number}</span>
                    {bill.is_demo ? <span className="demo-inline">Демо</span> : null}
                  </td>
                  <td>
                    <Badge tone={billStatusTone(bill.status)}>{billStatusLabels[bill.status]}</Badge>
                  </td>
                  <td>{formatDate(bill.submitted_on)}</td>
                  <td>{formatDateTime(bill.updated_at)}</td>
                  <td className="admin-row-actions">
                    <button className="text-button" type="button" onClick={() => startEdit(bill.id)}>
                      Изменить
                    </button>
                    <button
                      className="text-button text-button-danger"
                      type="button"
                      onClick={() => remove(bill.id, bill.title)}
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

      <section className="panel" id="bill-editor">
        <div className="panel-head">
          <h2>{editingId ? 'Редактирование законопроекта' : 'Новый законопроект'}</h2>
          {editingId ? (
            <button className="text-button" type="button" onClick={startNew}>
              Отменить редактирование
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          <form className="admin-form" onSubmit={submit}>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="bill-number">Номер законопроекта</label>
                <input
                  id="bill-number"
                  className="input"
                  value={draft.number}
                  onChange={(event) => setDraft({ ...draft, number: event.target.value })}
                  placeholder="Например: КФ-ЗП-05"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="bill-status">Статус рассмотрения</label>
                <select
                  id="bill-status"
                  className="select"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as BillStatus })}
                >
                  {(Object.keys(billStatusLabels) as BillStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {billStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="bill-title">Заголовок</label>
              <input
                id="bill-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="bill-summary">Краткое описание</label>
              <textarea
                id="bill-summary"
                className="input textarea"
                rows={4}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                maxLength={600}
              />
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="bill-date">Дата внесения</label>
                <input
                  id="bill-date"
                  className="input"
                  type="date"
                  value={draft.submitted_on}
                  onChange={(event) => setDraft({ ...draft, submitted_on: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bill-initiator">Инициатор</label>
                <input
                  id="bill-initiator"
                  className="input"
                  value={draft.initiator}
                  onChange={(event) => setDraft({ ...draft, initiator: event.target.value })}
                  placeholder="Например: Дума КФ"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="bill-related">Связанный закон</label>
              <input
                id="bill-related"
                className="input"
                value={draft.related_law_number}
                onChange={(event) => setDraft({ ...draft, related_law_number: event.target.value })}
                placeholder="Номер итогового закона, если известен"
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
              <Link className="btn btn-ghost" to="/duma">
                Открыть раздел Думы
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function LawManager({ profile }: { profile: Profile }) {
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = useAsync(() => fetchLawsForAdmin(), [refresh])
  const [draft, setDraft] = useState<LawDraft>(emptyLawDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const documents = data ?? []

  function startNew() {
    setDraft(emptyLawDraft)
    setEditingId(null)
    setMessage(null)
    document.getElementById('law-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startEdit(id: string) {
    const doc = documents.find((item) => item.id === id)
    if (!doc) return
    setDraft({
      doc_number: doc.doc_number,
      title: doc.title,
      doc_type: doc.doc_type,
      category: doc.category,
      authority: doc.authority,
      adopted_on: doc.adopted_on ?? '',
      published_on: doc.published_on ?? '',
      effective_on: doc.effective_on ?? '',
      revision: doc.revision ?? '',
      status: doc.status,
      is_demo: doc.is_demo,
      summary: doc.summary ?? '',
      body: doc.body ?? '',
      related_numbers: (doc.related_numbers ?? []).join(', ')
    })
    setEditingId(doc.id)
    setMessage(null)
    document.getElementById('law-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (draft.doc_number.trim().length < 2 || draft.title.trim().length < 3) {
      setMessage({ tone: 'error', text: 'Укажите номер и название документа.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await saveLaw({ ...draft, id: editingId ?? undefined })
      setMessage({ tone: 'success', text: editingId ? 'Документ обновлён.' : 'Документ создан.' })
      setDraft(emptyLawDraft)
      setEditingId(null)
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Удалить документ «${title}»? Действие необратимо.`)) return
    try {
      await deleteLaw(id)
      setMessage({ tone: 'success', text: 'Документ удалён.' })
      if (editingId === id) {
        setEditingId(null)
        setDraft(emptyLawDraft)
      }
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <div className="admin-workspace">
      <ManagerToolbar
        profile={profile}
        description="Управление законами и нормативными актами. Доступ проверяется политиками Supabase RLS."
        onNew={startNew}
      />

      {message ? (
        <Notice tone={message.tone === 'success' ? 'success' : 'error'}>{message.text}</Notice>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : documents.length === 0 ? (
        <EmptyState title="Документов пока нет">
          Создайте первый нормативный акт или удалите демонстрационные материалы.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <caption className="visually-hidden">Список нормативных актов</caption>
            <thead>
              <tr>
                <th scope="col">Номер и название</th>
                <th scope="col">Тип</th>
                <th scope="col">Статус</th>
                <th scope="col">Принят</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span className="admin-post-title">{doc.title}</span>
                    <span className="doc-number">№ {doc.doc_number}</span>
                    {doc.is_demo ? <span className="demo-inline">Демо</span> : null}
                  </td>
                  <td>{doc.doc_type}</td>
                  <td>
                    <Badge tone={docStatusTone(doc.status)}>{docStatusLabels[doc.status]}</Badge>
                  </td>
                  <td>{formatDate(doc.adopted_on)}</td>
                  <td className="admin-row-actions">
                    <button className="text-button" type="button" onClick={() => startEdit(doc.id)}>
                      Изменить
                    </button>
                    <button
                      className="text-button text-button-danger"
                      type="button"
                      onClick={() => remove(doc.id, doc.title)}
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

      <section className="panel" id="law-editor">
        <div className="panel-head">
          <h2>{editingId ? 'Редактирование документа' : 'Новый документ'}</h2>
          {editingId ? (
            <button className="text-button" type="button" onClick={startNew}>
              Отменить редактирование
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          <form className="admin-form" onSubmit={submit}>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="law-type">Тип документа</label>
                <select
                  id="law-type"
                  className="select"
                  value={draft.doc_type}
                  onChange={(event) => setDraft({ ...draft, doc_type: event.target.value })}
                >
                  {docTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="law-number">Номер документа</label>
                <input
                  id="law-number"
                  className="input"
                  value={draft.doc_number}
                  onChange={(event) => setDraft({ ...draft, doc_number: event.target.value })}
                  placeholder="Например: КФ-З-14"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="law-title">Название</label>
              <input
                id="law-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={240}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="law-status">Статус</label>
                <select
                  id="law-status"
                  className="select"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as DocStatus })}
                >
                  {(Object.keys(docStatusLabels) as DocStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {docStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="law-authority">Принявший орган</label>
                <input
                  id="law-authority"
                  className="input"
                  value={draft.authority}
                  onChange={(event) => setDraft({ ...draft, authority: event.target.value })}
                  placeholder="Например: Дума КФ"
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="law-adopted">Дата принятия</label>
                <input
                  id="law-adopted"
                  className="input"
                  type="date"
                  value={draft.adopted_on}
                  onChange={(event) => setDraft({ ...draft, adopted_on: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="law-published">Дата опубликования</label>
                <input
                  id="law-published"
                  className="input"
                  type="date"
                  value={draft.published_on}
                  onChange={(event) => setDraft({ ...draft, published_on: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="law-effective">Вступает в силу</label>
                <input
                  id="law-effective"
                  className="input"
                  type="date"
                  value={draft.effective_on}
                  onChange={(event) => setDraft({ ...draft, effective_on: event.target.value })}
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="law-revision">Редакция</label>
                <input
                  id="law-revision"
                  className="input"
                  value={draft.revision}
                  onChange={(event) => setDraft({ ...draft, revision: event.target.value })}
                  placeholder="Например: Редакция 1"
                />
              </div>
              <div className="field">
                <label htmlFor="law-related">Связанные документы</label>
                <input
                  id="law-related"
                  className="input"
                  value={draft.related_numbers}
                  onChange={(event) => setDraft({ ...draft, related_numbers: event.target.value })}
                  placeholder="Номера через запятую"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="law-summary">Краткое описание</label>
              <textarea
                id="law-summary"
                className="input textarea"
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                maxLength={600}
              />
            </div>
            <div className="field">
              <label htmlFor="law-body">Полный текст</label>
              <textarea
                id="law-body"
                className="input textarea"
                rows={10}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              <p className="field-hint">Абзацы разделяются пустой строкой.</p>
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
              <Link className="btn btn-ghost" to="/legislation">
                Открыть правовую базу
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function IntlManager({ profile }: { profile: Profile }) {
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = useAsync(() => fetchIntlForAdmin(), [refresh])
  const [draft, setDraft] = useState<IntlDraft>(emptyIntlDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const documents = data ?? []

  function startNew() {
    setDraft(emptyIntlDraft)
    setEditingId(null)
    setMessage(null)
    document.getElementById('intl-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startEdit(id: string) {
    const doc = documents.find((item) => item.id === id)
    if (!doc) return
    setDraft({
      title: doc.title,
      kind: doc.kind,
      country: doc.country,
      signed_on: doc.signed_on ?? '',
      status: doc.status,
      is_demo: doc.is_demo,
      summary: doc.summary ?? '',
      body: doc.body ?? '',
      published: doc.published
    })
    setEditingId(doc.id)
    setMessage(null)
    document.getElementById('intl-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      await saveIntl({ ...draft, id: editingId ?? undefined })
      setMessage({ tone: 'success', text: editingId ? 'Документ обновлён.' : 'Документ создан.' })
      setDraft(emptyIntlDraft)
      setEditingId(null)
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Удалить международный документ «${title}»? Действие необратимо.`)) return
    try {
      await deleteIntl(id)
      setMessage({ tone: 'success', text: 'Документ удалён.' })
      if (editingId === id) {
        setEditingId(null)
        setDraft(emptyIntlDraft)
      }
      setRefresh((value) => value + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <div className="admin-workspace">
      <ManagerToolbar
        profile={profile}
        description="Управление международными документами. Доступ проверяется политиками Supabase RLS."
        onNew={startNew}
      />

      {message ? (
        <Notice tone={message.tone === 'success' ? 'success' : 'error'}>{message.text}</Notice>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : documents.length === 0 ? (
        <EmptyState title="Документов пока нет">
          Создайте первую запись или удалите демонстрационные материалы.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <caption className="visually-hidden">Список международных документов</caption>
            <thead>
              <tr>
                <th scope="col">Название</th>
                <th scope="col">Тип</th>
                <th scope="col">Страна</th>
                <th scope="col">Статус</th>
                <th scope="col">Подписан</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span className="admin-post-title">{doc.title}</span>
                    {doc.is_demo ? <span className="demo-inline">Демо</span> : null}
                  </td>
                  <td>{intlKindLabels[doc.kind]}</td>
                  <td>{doc.country || '—'}</td>
                  <td>
                    <Badge tone={doc.published ? 'green' : 'amber'}>
                      {doc.published ? 'Опубликован' : 'Черновик'}
                    </Badge>
                    <span className="muted small">{doc.status}</span>
                  </td>
                  <td>{formatDate(doc.signed_on)}</td>
                  <td className="admin-row-actions">
                    <button className="text-button" type="button" onClick={() => startEdit(doc.id)}>
                      Изменить
                    </button>
                    <button
                      className="text-button text-button-danger"
                      type="button"
                      onClick={() => remove(doc.id, doc.title)}
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

      <section className="panel" id="intl-editor">
        <div className="panel-head">
          <h2>{editingId ? 'Редактирование документа' : 'Новый документ'}</h2>
          {editingId ? (
            <button className="text-button" type="button" onClick={startNew}>
              Отменить редактирование
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          <form className="admin-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="intl-title">Название</label>
              <input
                id="intl-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={240}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="intl-kind">Тип материала</label>
                <select
                  id="intl-kind"
                  className="select"
                  value={draft.kind}
                  onChange={(event) =>
                    setDraft({ ...draft, kind: event.target.value as IntlDocKind })
                  }
                >
                  {(Object.keys(intlKindLabels) as IntlDocKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {intlKindLabels[kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="intl-country">Страна или сторона</label>
                <input
                  id="intl-country"
                  className="input"
                  value={draft.country}
                  onChange={(event) => setDraft({ ...draft, country: event.target.value })}
                  placeholder="Например: Республика ..."
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="field">
                <label htmlFor="intl-date">Дата подписания / принятия</label>
                <input
                  id="intl-date"
                  className="input"
                  type="date"
                  value={draft.signed_on}
                  onChange={(event) => setDraft({ ...draft, signed_on: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="intl-status">Статус</label>
                <input
                  id="intl-status"
                  className="input"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  placeholder="Например: Подготовлен к подписанию"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="intl-summary">Краткое описание</label>
              <textarea
                id="intl-summary"
                className="input textarea"
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                maxLength={600}
              />
            </div>
            <div className="field">
              <label htmlFor="intl-body">Полный текст</label>
              <textarea
                id="intl-body"
                className="input textarea"
                rows={10}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              <p className="field-hint">Абзацы разделяются пустой строкой.</p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
              />
              <span>Опубликовать документ</span>
            </label>
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
              <Link className="btn btn-ghost" to="/international">
                Открыть международный раздел
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function Workspace({ profile }: { profile: Profile }) {
  const initial = firstAllowedTab(profile.role)
  const [tab, setTab] = useState<AdminTab>(initial ?? 'news')
  const visibleTabs = tabs.filter((item) => allowedTab(item.id, profile.role))

  if (!initial) {
    return (
      <Notice tone="warning" title="Недостаточно прав">
        Роль «{roleLabels[profile.role]}» не позволяет управлять материалами. Обратитесь к
        администратору портала для изменения роли. Публичный просмотр материалов доступен без входа.
      </Notice>
    )
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Типы материалов">
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            className={`tab${tab === item.id ? ' active' : ''}`}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            aria-controls={`admin-panel-${item.id}`}
            id={`admin-tab-${item.id}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="tab-panel"
        role="tabpanel"
        id={`admin-panel-${tab}`}
        aria-labelledby={`admin-tab-${tab}`}
      >
        {tab === 'news' && canManageNews(profile.role) ? <NewsManager profile={profile} /> : null}
        {tab === 'bill' && canManageDuma(profile.role) ? <BillManager profile={profile} /> : null}
        {tab === 'law' && canManageContent(profile.role) ? <LawManager profile={profile} /> : null}
        {tab === 'intl' && canManageContent(profile.role) ? <IntlManager profile={profile} /> : null}
      </div>
    </>
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
            <Workspace profile={profile} />
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
