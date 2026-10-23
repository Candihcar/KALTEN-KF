import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { bodyKindLabels } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchBody } from '../services/content'
import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  TextBody
} from '../components/ui'

export default function BodyPage() {
  const { slug = '' } = useParams()
  const { data: body, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchBody(slug)
        : Promise.reject(new Error('База данных портала не подключена.')),
    [slug]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Органы власти', to: '/bodies' }, { label: 'Орган' }]} />
        <Notice tone="warning" title="База данных не подключена">
          Сведения об органе недоступны до подключения Supabase.
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

  if (error || !body) {
    return (
      <div className="container page-body">
        <Breadcrumbs items={[{ label: 'Органы власти', to: '/bodies' }, { label: 'Орган' }]} />
        {error ? <ErrorState message={error} /> : <EmptyState title="Орган не найден" />}
      </div>
    )
  }

  return (
    <div className="container page-body">
      <Breadcrumbs items={[{ label: 'Органы власти', to: '/bodies' }, { label: body.name }]} />

      <div className="article-header">
        <p className="kicker">{bodyKindLabels[body.kind]}</p>
        <h1 className="article-title">{body.name}</h1>
        {body.summary ? <p className="article-summary">{body.summary}</p> : null}
      </div>

      <div className="article-layout">
        <div className="article-body">
          <section className="content-section">
            <h2>Сведения об органе</h2>
            {body.description ? (
              <TextBody text={body.description} />
            ) : (
              <EmptyState compact title="Описание готовится к публикации" />
            )}
          </section>

          <section className="content-section">
            <h2>Структура</h2>
            {body.structure ? (
              <TextBody text={body.structure} />
            ) : (
              <EmptyState compact title="Структура не опубликована">
                Схема и состав органа будут размещены после официального подтверждения.
              </EmptyState>
            )}
          </section>

          <section className="content-section">
            <h2>Контакты</h2>
            {body.contacts ? (
              <TextBody text={body.contacts} />
            ) : (
              <EmptyState compact title="Контактные сведения не опубликованы" />
            )}
          </section>
        </div>

        <aside className="article-aside">
          <div className="meta-card">
            <h2>Общие сведения</h2>
            <dl className="meta-list">
              <div>
                <dt>Тип органа</dt>
                <dd>{bodyKindLabels[body.kind]}</dd>
              </div>
              <div>
                <dt>Наименование</dt>
                <dd>{body.name}</dd>
              </div>
            </dl>
          </div>
          <Link className="btn btn-secondary btn-block" to="/bodies">
            Все органы власти
          </Link>
        </aside>
      </div>
    </div>
  )
}
