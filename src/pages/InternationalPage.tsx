import { useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { formatDate, intlKindLabels } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchIntlDocuments } from '../services/content'
import {
  Badge,
  DemoBadge,
  DemoNotice,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  PageHeader,
  TextBody
} from '../components/ui'
import type { IntlDocKind } from '../types/content'

const kinds = Object.keys(intlKindLabels) as IntlDocKind[]

export default function InternationalPage() {
  const [kind, setKind] = useState<string>('all')
  const [q, setQ] = useState('')

  const { data, loading, error } = useAsync(
    () => (isSupabaseConfigured ? fetchIntlDocuments() : Promise.resolve([])),
    []
  )

  const documents = (data ?? []).filter((doc) => {
    if (kind !== 'all' && doc.kind !== kind) return false
    const term = q.trim().toLowerCase()
    if (!term) return true
    return [doc.title, doc.summary, doc.body, doc.country]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  })

  return (
    <>
      <PageHeader
        kicker="Внешняя политика"
        title="Международные отношения"
        description="Договоры, соглашения, заявления и материалы переговоров Комаринской Федерации с другими государствами RP-проекта."
        breadcrumbs={[{ label: 'Международные отношения' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Материалы международного раздела загружаются из Supabase. После подключения здесь
            появятся опубликованные документы.
          </Notice>
        ) : null}

        <div className="filter-bar">
          <div className="filter-grid">
            <div className="field field-grow">
              <label htmlFor="intl-search">Поиск по материалам</label>
              <input
                id="intl-search"
                className="input"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Название, страна или содержание"
              />
            </div>
            <div className="field">
              <label htmlFor="intl-kind">Тип материала</label>
              <select
                id="intl-kind"
                className="select"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="all">Все типы</option>
                {kinds.map((item) => (
                  <option key={item} value={item}>
                    {intlKindLabels[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : documents.length === 0 ? (
          <EmptyState title="Материалы не найдены">
            {q || kind !== 'all'
              ? 'По заданным условиям ничего не найдено.'
              : 'Международные документы появятся после публикации.'}
          </EmptyState>
        ) : (
          <div className="intl-list">
            {documents.map((doc) => (
              <article className="intl-card" key={doc.id}>
                <div className="intl-card-head">
                  <Badge tone="navy">{intlKindLabels[doc.kind]}</Badge>
                  <span className="intl-country">{doc.country}</span>
                  <span className="intl-date">{formatDate(doc.signed_on)}</span>
                  <DemoBadge show={doc.is_demo} />
                </div>
                <h2>{doc.title}</h2>
                {doc.summary ? <p>{doc.summary}</p> : null}
                {doc.is_demo ? <DemoNotice /> : null}
                <div className="intl-meta">
                  <span>Статус: {doc.status}</span>
                </div>
                {doc.body ? (
                  <details className="intl-body">
                    <summary>Читать материал</summary>
                    <TextBody text={doc.body} />
                  </details>
                ) : (
                  <p className="muted small">Полный текст не опубликован.</p>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="page-note">
          Раздел ведётся в хронологическом порядке. Материалы с отметкой «Демонстрационный материал»
          не отражают официальных дипломатических решений.
        </p>
      </div>
    </>
  )
}
