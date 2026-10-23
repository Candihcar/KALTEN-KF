import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { docStatusLabels, docStatusTone, formatDate } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchCodeArticle } from '../services/content'
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
import type { CodeKind } from '../types/content'

const config: Record<CodeKind, { title: string; route: string }> = {
  criminal: { title: 'Уголовный кодекс КФ', route: '/criminal-code' },
  administrative: { title: 'Административное законодательство', route: '/administrative-code' }
}

export default function CodeArticlePage({ kind }: { kind: CodeKind }) {
  const { id = '' } = useParams()
  const current = config[kind]

  const { data: article, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchCodeArticle(id)
        : Promise.reject(new Error('База данных портала не подключена.')),
    [id]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: current.title, to: current.route }, { label: 'Статья' }]} />
        <Notice tone="warning" title="База данных не подключена">
          Статья недоступна до подключения Supabase.
        </Notice>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container page-body">
        <Loading />
      </div>
    )
  }

  if (error || !article || article.code_kind !== kind) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: current.title, to: current.route }, { label: 'Статья' }]} />
        {error ? <ErrorState message={error} /> : <EmptyState title="Статья не найдена" />}
      </div>
    )
  }

  return (
    <div className="container page-body">
      <Breadcrumbs
        items={[{ label: current.title, to: current.route }, { label: `Статья ${article.article_number}` }]}
      />

      <article>
        <header className="article-header">
          <div className="card-badges">
            <Badge tone="navy">Статья {article.article_number}</Badge>
            <Badge tone={docStatusTone(article.status)}>{docStatusLabels[article.status]}</Badge>
            <DemoBadge show={article.is_demo} />
          </div>
          <h1 className="article-title">{article.title}</h1>
          {article.part ? <p className="article-number">Часть: {article.part}</p> : null}
          <div className="article-meta">
            <span>{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>Вступает в силу: {formatDate(article.effective_on)}</span>
          </div>
        </header>

        {article.is_demo ? <DemoNotice /> : null}

        <div className="article-layout">
          <div className="article-body">
            <section className="content-section">
              <h2>Состав</h2>
              <TextBody text={article.description} />
            </section>

            <section className="content-section">
              <h2>Санкция</h2>
              {article.sanction ? (
                <TextBody text={article.sanction} />
              ) : (
                <EmptyState compact title="Санкция не установлена">
                  Санкция будет опубликована после согласования и утверждения.
                </EmptyState>
              )}
            </section>

            {article.notes ? (
              <section className="content-section">
                <h2>Примечания</h2>
                <TextBody text={article.notes} />
              </section>
            ) : null}

            <section className="content-section">
              <h2>Связанные статьи</h2>
              {article.related && article.related.length > 0 ? (
                <ul className="related-list">
                  {article.related.map((number) => (
                    <li key={number}>
                      <Link to={`${current.route}?q=${encodeURIComponent(number)}`}>
                        Статья {number}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Связанные статьи не указаны.</p>
              )}
            </section>

            <section className="content-section">
              <h2>История редакций</h2>
              {article.history && article.history.length > 0 ? (
                <ul className="history-list">
                  {article.history.map((entry, index) => (
                    <li key={`${entry.date}-${index}`}>
                      <time>{formatDate(entry.date)}</time>
                      <span>{entry.note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="История редакций не опубликована" />
              )}
            </section>
          </div>

          <aside className="article-aside">
            <div className="meta-card">
              <h2>Паспорт статьи</h2>
              <dl className="meta-list">
                <div>
                  <dt>Кодекс</dt>
                  <dd>{current.title}</dd>
                </div>
                <div>
                  <dt>Номер</dt>
                  <dd>{article.article_number}</dd>
                </div>
                <div>
                  <dt>Категория</dt>
                  <dd>{article.category}</dd>
                </div>
                <div>
                  <dt>Часть</dt>
                  <dd>{article.part || '—'}</dd>
                </div>
                <div>
                  <dt>Статус</dt>
                  <dd>{docStatusLabels[article.status]}</dd>
                </div>
                <div>
                  <dt>Вступление в силу</dt>
                  <dd>{formatDate(article.effective_on)}</dd>
                </div>
                <div>
                  <dt>Обновлено</dt>
                  <dd>{formatDate(article.updated_at)}</dd>
                </div>
              </dl>
            </div>
            <Link className="btn btn-secondary btn-block" to={current.route}>
              К списку статей
            </Link>
          </aside>
        </div>
      </article>
    </div>
  )
}
