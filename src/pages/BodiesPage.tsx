import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { bodyKindLabels } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchBodies } from '../services/content'
import { EmptyState, ErrorState, Loading, Notice, PageHeader } from '../components/ui'
import type { BodyKind, GovBody } from '../types/content'

const order: BodyKind[] = ['head', 'government', 'duma', 'judicial', 'law_enforcement', 'agency']

export default function BodiesPage() {
  const { data, loading, error } = useAsync(
    () => (isSupabaseConfigured ? fetchBodies() : Promise.resolve([])),
    []
  )

  const bodies = data ?? []
  const groups = order
    .map((kind) => ({ kind, items: bodies.filter((body) => body.kind === kind) }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <PageHeader
        kicker="Структура государства"
        title="Органы власти"
        description="Сведения о государственных органах Комаринской Федерации. Персональные данные должностных лиц публикуются только при наличии официального подтверждения."
        breadcrumbs={[{ label: 'Органы власти' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Сведения об органах власти загружаются из Supabase. После подключения здесь появятся
            карточки государственных органов.
          </Notice>
        ) : null}

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : bodies.length === 0 ? (
          <EmptyState title="Сведения об органах власти не опубликованы">
            Карточки государственных органов появятся после публикации.
          </EmptyState>
        ) : (
          <div className="bodies-groups">
            {groups.map((group) => (
              <section className="bodies-group" key={group.kind}>
                <div className="code-group-head">
                  <h2>{bodyKindLabels[group.kind]}</h2>
                  <span>{group.items.length}</span>
                </div>
                <div className="bodies-grid">
                  {group.items.map((body) => (
                    <BodyCard key={body.id} body={body} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="page-note">
          Раздел описывает структуру органов. Полномочия и персональный состав публикуются только на
          основании официальных материалов.
        </p>
      </div>
    </>
  )
}

function BodyCard({ body }: { body: GovBody }) {
  return (
    <article className="body-card">
      <span className="body-kind">{bodyKindLabels[body.kind]}</span>
      <h3>
        <Link to={`/bodies/${body.slug}`}>{body.name}</Link>
      </h3>
      <p>{body.summary || 'Краткое описание готовится к публикации.'}</p>
      <Link className="card-link" to={`/bodies/${body.slug}`}>
        Подробнее
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
