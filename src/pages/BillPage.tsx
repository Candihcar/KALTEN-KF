import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { billStatusLabels, billStatusTone, formatDate } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchBill } from '../services/content'
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

export default function BillPage() {
  const { id = '' } = useParams()
  const { data, loading, error } = useAsync(
    () => (isSupabaseConfigured ? fetchBill(id) : Promise.reject(new Error('База данных портала не подключена.'))),
    [id]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Дума КФ', to: '/duma' }, { label: 'Законопроект' }]} />
        <Notice tone="warning" title="База данных не подключена">
          Материалы Думы недоступны до подключения Supabase.
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

  if (error || !data) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Дума КФ', to: '/duma' }, { label: 'Законопроект' }]} />
        {error ? <ErrorState message={error} /> : <EmptyState title="Законопроект не найден" />}
      </div>
    )
  }

  const { bill, events, votes } = data

  return (
    <div className="container page-body">
      <Breadcrumbs items={[{ label: 'Дума КФ', to: '/duma' }, { label: `Законопроект № ${bill.number}` }]} />

      <article>
        <header className="article-header">
          <div className="card-badges">
            <Badge tone="navy">Законопроект № {bill.number}</Badge>
            <Badge tone={billStatusTone(bill.status)}>{billStatusLabels[bill.status]}</Badge>
            <DemoBadge show={bill.is_demo} />
          </div>
          <h1 className="article-title">{bill.title}</h1>
          {bill.summary ? <p className="article-summary">{bill.summary}</p> : null}
          <div className="article-meta">
            <span>Инициатор: {bill.initiator}</span>
            <span aria-hidden="true">·</span>
            <span>Внесён: {formatDate(bill.submitted_on)}</span>
          </div>
        </header>

        {bill.is_demo ? <DemoNotice /> : null}

        <div className="article-layout">
          <div className="article-body">
            <section className="content-section">
              <h2>История рассмотрения</h2>
              {events.length > 0 ? (
                <ol className="timeline">
                  {events.map((event) => (
                    <li key={event.id}>
                      <time dateTime={event.occurred_on}>{formatDate(event.occurred_on)}</time>
                      <div>
                        <h3>{event.title}</h3>
                        {event.description ? <p>{event.description}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState compact title="История рассмотрения не опубликована">
                  Сведения о стадиях рассмотрения появятся после публикации.
                </EmptyState>
              )}
            </section>

            <section className="content-section">
              <h2>Результаты голосования</h2>
              {votes.length > 0 ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <caption className="visually-hidden">Результаты голосований по законопроекту</caption>
                    <thead>
                      <tr>
                        <th scope="col">Дата</th>
                        <th scope="col">Вопрос</th>
                        <th scope="col">За</th>
                        <th scope="col">Против</th>
                        <th scope="col">Воздержались</th>
                      </tr>
                    </thead>
                    <tbody>
                      {votes.map((vote) => (
                        <tr key={vote.id}>
                          <td>{formatDate(vote.voted_on)}</td>
                          <td>
                            {vote.title}
                            {vote.source_note ? (
                              <span className="table-note">{vote.source_note}</span>
                            ) : null}
                          </td>
                          <td>{vote.for_count ?? '—'}</td>
                          <td>{vote.against_count ?? '—'}</td>
                          <td>{vote.abstain_count ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState compact title="Результаты голосования не опубликованы">
                  Голосования отображаются только после официального опубликования.
                </EmptyState>
              )}
            </section>

            <section className="content-section">
              <h2>Связанные документы</h2>
              {bill.related_law_number ? (
                <p>
                  Итоговый закон:{' '}
                  <Link to={`/legislation?q=${encodeURIComponent(bill.related_law_number)}`}>
                    № {bill.related_law_number}
                  </Link>
                </p>
              ) : (
                <p className="muted">Связанный закон пока не указан.</p>
              )}
            </section>
          </div>

          <aside className="article-aside">
            <div className="meta-card">
              <h2>Паспорт законопроекта</h2>
              <dl className="meta-list">
                <div>
                  <dt>Номер</dt>
                  <dd>{bill.number}</dd>
                </div>
                <div>
                  <dt>Статус</dt>
                  <dd>{billStatusLabels[bill.status]}</dd>
                </div>
                <div>
                  <dt>Инициатор</dt>
                  <dd>{bill.initiator}</dd>
                </div>
                <div>
                  <dt>Дата внесения</dt>
                  <dd>{formatDate(bill.submitted_on)}</dd>
                </div>
                <div>
                  <dt>Обновлён</dt>
                  <dd>{formatDate(bill.updated_at)}</dd>
                </div>
              </dl>
            </div>
            <Link className="btn btn-secondary btn-block" to="/duma">
              Все законопроекты
            </Link>
          </aside>
        </div>

        <section className="content-section">
          <h2>Текст законопроекта</h2>
          <TextBody text={null} />
          <p className="muted small">
            Полный текст публикуется отдельным документом после внесения в Думу КФ.
          </p>
        </section>
      </article>
    </div>
  )
}
