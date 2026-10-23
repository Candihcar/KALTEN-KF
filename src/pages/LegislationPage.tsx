import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import {
  docStatusLabels,
  docStatusTone,
  docTypeOptions,
  formatDate
} from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchDocuments } from '../services/content'
import { Badge, DemoBadge, EmptyState, ErrorState, Loading, Notice, PageHeader } from '../components/ui'
import type { DocStatus } from '../types/content'

export default function LegislationPage() {
  const [params, setParams] = useSearchParams()
  const qParam = params.get('q') ?? ''
  const categoryParam = params.get('category') ?? 'all'
  const statusParam = params.get('status') ?? 'all'
  const sortParam = params.get('sort') === 'old' ? 'old' : 'new'

  const [q, setQ] = useState(qParam)
  const [category, setCategory] = useState(categoryParam)
  const [status, setStatus] = useState(statusParam)
  const [sort, setSort] = useState(sortParam)

  useEffect(() => {
    setQ(qParam)
    setCategory(categoryParam)
    setStatus(statusParam)
    setSort(sortParam)
  }, [qParam, categoryParam, statusParam, sortParam])

  const { data, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchDocuments({ q: qParam, category: categoryParam, status: statusParam, sort: sortParam })
        : Promise.resolve([]),
    [qParam, categoryParam, statusParam, sortParam]
  )

  const documents = data ?? []

  function apply(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (q.trim()) next.set('q', q.trim())
    if (category !== 'all') next.set('category', category)
    if (status !== 'all') next.set('status', status)
    if (sort !== 'new') next.set('sort', sort)
    setParams(next)
  }

  function reset() {
    setParams(new URLSearchParams())
  }

  return (
    <>
      <PageHeader
        kicker="Электронная правовая база"
        title="Законодательство КФ"
        description="Конституция, кодексы, федеральные законы, постановления и указы. Поиск выполняется по номеру, названию и тексту документа."
        breadcrumbs={[{ label: 'Законодательство' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Правовая база заполняется из Supabase. После подключения здесь появятся опубликованные
            документы. Порядок настройки описан в разделе <Link to="/about#data">«Данные портала»</Link>.
          </Notice>
        ) : null}

        <form className="filter-bar" onSubmit={apply} role="search">
          <div className="filter-grid filter-grid-docs">
            <div className="field field-grow">
              <label htmlFor="law-search">Поиск по документам</label>
              <input
                id="law-search"
                className="input"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Номер, название или содержание"
              />
            </div>
            <div className="field">
              <label htmlFor="law-category">Категория</label>
              <select
                id="law-category"
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">Все категории</option>
                {docTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="law-status">Статус</label>
              <select
                id="law-status"
                className="select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Все статусы</option>
                {(Object.keys(docStatusLabels) as DocStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {docStatusLabels[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="law-sort">Сортировка</label>
              <select
                id="law-sort"
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="new">Сначала новые</option>
                <option value="old">Сначала старые</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" type="submit">
                Применить
              </button>
              <button className="btn btn-ghost" type="button" onClick={reset}>
                Сбросить
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <Loading label="Загрузка правовой базы…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : documents.length === 0 ? (
          <EmptyState title="Документы не найдены">
            {qParam || categoryParam !== 'all' || statusParam !== 'all'
              ? 'По заданным условиям ничего не найдено. Измените запрос или сбросьте фильтры.'
              : 'Опубликованные нормативные акты появятся в правовой базе.'}
          </EmptyState>
        ) : (
          <>
            <div className="results-meta">
              <span>Документов: {documents.length}</span>
              {qParam ? <span>Запрос: «{qParam}»</span> : null}
            </div>
            <div className="doc-list">
              {documents.map((doc) => (
                <article className="doc-card" key={doc.id}>
                  <div className="doc-card-head">
                    <span className="doc-type">{doc.doc_type}</span>
                    <span className="doc-number">№ {doc.doc_number}</span>
                    <Badge tone={docStatusTone(doc.status)}>{docStatusLabels[doc.status]}</Badge>
                    <DemoBadge show={doc.is_demo} />
                  </div>
                  <h2>
                    <Link to={`/legislation/${doc.id}`}>{doc.title}</Link>
                  </h2>
                  {doc.summary ? <p>{doc.summary}</p> : null}
                  <div className="card-footer">
                    <span>{doc.authority}</span>
                    <span aria-hidden="true">·</span>
                    <span>Принят: {formatDate(doc.adopted_on)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Опубликован: {formatDate(doc.published_on)}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <p className="page-note">
          Дата принятия, дата опубликования и дата вступления в силу указываются отдельно. Статус
          документа отражает сведения, размещённые оператором портала.
        </p>
      </div>
    </>
  )
}
