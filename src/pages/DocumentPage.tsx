import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { docStatusLabels, docStatusTone, formatDate } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchDocument } from '../services/content'
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

export default function DocumentPage() {
  const { id = '' } = useParams()
  const { data: doc, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchDocument(id)
        : Promise.reject(new Error('База данных портала не подключена.')),
    [id]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Законодательство', to: '/legislation' }, { label: 'Документ' }]} />
        <Notice tone="warning" title="База данных не подключена">
          Документ недоступен до подключения Supabase.
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

  if (error || !doc) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Законодательство', to: '/legislation' }, { label: 'Документ' }]} />
        {error ? <ErrorState message={error} /> : <EmptyState title="Документ не найден" />}
      </div>
    )
  }

  return (
    <div className="container page-body">
      <Breadcrumbs
        items={[{ label: 'Законодательство', to: '/legislation' }, { label: `№ ${doc.doc_number}` }]}
      />

      <article>
        <header className="article-header">
          <div className="card-badges">
            <Badge tone="navy">{doc.doc_type}</Badge>
            <Badge tone={docStatusTone(doc.status)}>{docStatusLabels[doc.status]}</Badge>
            <DemoBadge show={doc.is_demo} />
          </div>
          <h1 className="article-title">{doc.title}</h1>
          <p className="article-number">Документ № {doc.doc_number}</p>
          {doc.summary ? <p className="article-summary">{doc.summary}</p> : null}
        </header>

        {doc.is_demo ? <DemoNotice /> : null}

        <div className="dates-grid">
          <div>
            <span className="dates-label">Принят</span>
            <span className="dates-value">{formatDate(doc.adopted_on)}</span>
          </div>
          <div>
            <span className="dates-label">Опубликован</span>
            <span className="dates-value">{formatDate(doc.published_on)}</span>
          </div>
          <div>
            <span className="dates-label">Вступил в силу</span>
            <span className="dates-value">{formatDate(doc.effective_on)}</span>
          </div>
          <div>
            <span className="dates-label">Редакция</span>
            <span className="dates-value">{doc.revision || '—'}</span>
          </div>
        </div>

        <div className="article-layout">
          <div className="article-body">
            <section className="content-section">
              <h2>Текст документа</h2>
              <TextBody text={doc.body} />
            </section>

            <section className="content-section">
              <h2>История изменений</h2>
              {doc.history && doc.history.length > 0 ? (
                <ul className="history-list">
                  {doc.history.map((entry, index) => (
                    <li key={`${entry.date}-${index}`}>
                      <time>{formatDate(entry.date)}</time>
                      <span>{entry.note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="История изменений не опубликована">
                  Сведения о редакциях появятся после публикации.
                </EmptyState>
              )}
            </section>
          </div>

          <aside className="article-aside">
            <div className="meta-card">
              <h2>Паспорт документа</h2>
              <dl className="meta-list">
                <div>
                  <dt>Тип</dt>
                  <dd>{doc.doc_type}</dd>
                </div>
                <div>
                  <dt>Принявший орган</dt>
                  <dd>{doc.authority}</dd>
                </div>
                <div>
                  <dt>Номер</dt>
                  <dd>{doc.doc_number}</dd>
                </div>
                <div>
                  <dt>Статус</dt>
                  <dd>{docStatusLabels[doc.status]}</dd>
                </div>
                <div>
                  <dt>Текущая редакция</dt>
                  <dd>{doc.revision || '—'}</dd>
                </div>
                <div>
                  <dt>Дата принятия</dt>
                  <dd>{formatDate(doc.adopted_on)}</dd>
                </div>
                <div>
                  <dt>Дата вступления в силу</dt>
                  <dd>{formatDate(doc.effective_on)}</dd>
                </div>
              </dl>
            </div>

            {doc.related_numbers && doc.related_numbers.length > 0 ? (
              <div className="meta-card">
                <h2>Связанные документы</h2>
                <ul className="related-list">
                  {doc.related_numbers.map((number) => (
                    <li key={number}>
                      <Link to={`/legislation?q=${encodeURIComponent(number)}`}>№ {number}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link className="btn btn-secondary btn-block" to="/legislation">
              Вся правовая база
            </Link>
          </aside>
        </div>
      </article>
    </div>
  )
}
