import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { formatDate, newsCategoryLabels, readingTime } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchNewsById } from '../services/content'
import {
  Badge,
  Breadcrumbs,
  DemoBadge,
  DemoNotice,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  TextBody
} from '../components/ui'

export default function NewsArticlePage() {
  const { id = '' } = useParams()
  const { data: post, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchNewsById(id)
        : Promise.reject(new Error('База данных портала не подключена.')),
    [id]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Новости', to: '/news' }, { label: 'Публикация' }]} />
        <Notice tone="warning" title="База данных не подключена">
          Публикация недоступна, пока портал не подключён к Supabase. Локальная демонстрационная
          версия не требует подключения к базе.
        </Notice>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container page-body">
        <Loading label="Загрузка публикации…" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Новости', to: '/news' }, { label: 'Публикация' }]} />
        {error ? <ErrorState message={error} /> : <EmptyState title="Публикация не найдена" />}
        <p>
          <Link className="btn btn-secondary" to="/news">
            Вернуться к новостям
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="container page-body article-page">
        <Breadcrumbs items={[{ label: 'Новости', to: '/news' }, { label: post.title }]} />
        <article>
          <header className="article-header">
            <div className="card-badges">
              <Badge tone="navy">{newsCategoryLabels[post.category]}</Badge>
              <DemoBadge show={post.is_demo} />
            </div>
            <h1 className="article-title">{post.title}</h1>
            {post.summary ? <p className="article-summary">{post.summary}</p> : null}
            <div className="article-meta">
              <span>{formatDate(post.published_at)}</span>
              <span aria-hidden="true">·</span>
              <span>{post.author || 'Официальный портал'}</span>
              <span aria-hidden="true">·</span>
              <span>{readingTime(post.body)}</span>
            </div>
          </header>

          {post.is_demo ? <DemoNotice /> : null}

          <div className="article-layout">
            <div className="article-body">
              <TextBody text={post.body} />
            </div>
            <aside className="article-aside">
              <div className="meta-card">
                <h2>Сведения о публикации</h2>
                <dl className="meta-list">
                  <div>
                    <dt>Категория</dt>
                    <dd>{newsCategoryLabels[post.category]}</dd>
                  </div>
                  <div>
                    <dt>Дата публикации</dt>
                    <dd>{formatDate(post.published_at)}</dd>
                  </div>
                  <div>
                    <dt>Источник</dt>
                    <dd>{post.author || 'Официальный портал'}</dd>
                  </div>
                  <div>
                    <dt>Обновлено</dt>
                    <dd>{formatDate(post.updated_at)}</dd>
                  </div>
                </dl>
              </div>
              <Link className="btn btn-secondary btn-block" to="/news">
                Все новости
              </Link>
            </aside>
          </div>
        </article>
      </div>
    </>
  )
}
