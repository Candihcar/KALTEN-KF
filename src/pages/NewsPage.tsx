import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { formatDate, newsCategories, newsCategoryLabels, readingTime } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchNews } from '../services/content'
import { Badge, DemoBadge, EmptyState, ErrorState, Loading, Notice, PageHeader } from '../components/ui'
import type { NewsCategory } from '../types/content'

const sortOptions = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'old', label: 'Сначала старые' }
]

function isCategory(value: string): value is NewsCategory {
  return (newsCategories as string[]).includes(value)
}

export default function NewsPage() {
  const [params, setParams] = useSearchParams()
  const qParam = params.get('q') ?? ''
  const categoryRaw = params.get('category') ?? 'all'
  const categoryParam: NewsCategory | 'all' = isCategory(categoryRaw) ? categoryRaw : 'all'
  const sortParam = params.get('sort') === 'old' ? 'old' : 'new'

  const [q, setQ] = useState(qParam)
  const [category, setCategory] = useState<string>(categoryParam)
  const [sort, setSort] = useState(sortParam)

  useEffect(() => {
    setQ(qParam)
    setCategory(categoryParam)
    setSort(sortParam)
  }, [qParam, categoryParam, sortParam])

  const { data, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchNews({ q: qParam, category: categoryParam, sort: sortParam })
        : Promise.resolve([]),
    [qParam, categoryParam, sortParam]
  )

  const posts = data ?? []

  function apply(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (q.trim()) next.set('q', q.trim())
    if (category !== 'all') next.set('category', category)
    if (sort !== 'new') next.set('sort', sort)
    setParams(next)
  }

  function reset() {
    setParams(new URLSearchParams())
  }

  return (
    <>
      <PageHeader
        kicker="Публикации"
        title="Новости"
        description="Официальные сообщения, заявления и объявления. Поиск и фильтрация доступны по всем опубликованным материалам."
        breadcrumbs={[{ label: 'Новости' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Лента новостей заполняется из Supabase. Пока подключение не настроено, отображается
            пустое состояние. Порядок настройки описан в разделе{' '}
            <Link to="/about#data">«Данные портала»</Link>.
          </Notice>
        ) : null}

        <form className="filter-bar" onSubmit={apply} role="search">
          <div className="filter-grid">
            <div className="field field-grow">
              <label htmlFor="news-search">Поиск по публикациям</label>
              <input
                id="news-search"
                className="input"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Заголовок, описание или текст"
              />
            </div>
            <div className="field">
              <label htmlFor="news-category">Категория</label>
              <select
                id="news-category"
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">Все категории</option>
                {newsCategories.map((item) => (
                  <option key={item} value={item}>
                    {newsCategoryLabels[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="news-sort">Сортировка</label>
              <select
                id="news-sort"
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
          <Loading label="Загрузка новостей…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : posts.length === 0 ? (
          <EmptyState title="Публикации не найдены">
            {qParam || categoryParam !== 'all' ? (
              <>По заданным условиям ничего не найдено. Измените запрос или сбросьте фильтры.</>
            ) : (
              <>Опубликованные новости появятся здесь после публикации материалов.</>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="results-meta">
              <span>Найдено публикаций: {posts.length}</span>
              {qParam ? <span>Запрос: «{qParam}»</span> : null}
            </div>
            <div className="news-grid">
              {posts.map((post) => (
                <article className="news-card" key={post.id}>
                  <div className="card-topline">
                    <div className="card-badges">
                      <Badge tone="navy">{newsCategoryLabels[post.category]}</Badge>
                      <DemoBadge show={post.is_demo} />
                    </div>
                  </div>
                  <h2 className="news-card-title">
                    <Link to={`/news/${post.id}`}>{post.title}</Link>
                  </h2>
                  {post.summary ? <p className="news-card-summary">{post.summary}</p> : null}
                  <div className="card-footer">
                    <span>{formatDate(post.published_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.author || 'Официальный портал'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{readingTime(post.body)}</span>
                  </div>
                  <Link className="card-link" to={`/news/${post.id}`}>
                    Читать публикацию
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
