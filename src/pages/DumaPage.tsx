import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { billStatusLabels, billStatusTone, formatDate } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchBills, fetchSessions } from '../services/content'
import {
  Badge,
  DemoBadge,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  PageHeader,
  TextBody
} from '../components/ui'
import type { BillStatus, SessionKind } from '../types/content'

type Tab = 'bills' | 'agenda' | 'protocols'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'bills', label: 'Законопроекты' },
  { id: 'agenda', label: 'Повестки заседаний' },
  { id: 'protocols', label: 'Протоколы' }
]

function BillsTab() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [appliedStatus, setAppliedStatus] = useState('all')

  const { data, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchBills({ q: query, status: appliedStatus })
        : Promise.resolve([]),
    [query, appliedStatus]
  )

  function apply(event: FormEvent) {
    event.preventDefault()
    setQuery(q.trim())
    setAppliedStatus(status)
  }

  const bills = data ?? []

  return (
    <>
      <form className="filter-bar filter-bar-inline" onSubmit={apply} role="search">
        <div className="filter-grid">
          <div className="field field-grow">
            <label htmlFor="bill-search">Поиск по законопроектам</label>
            <input
              id="bill-search"
              className="input"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Номер, название или описание"
            />
          </div>
          <div className="field">
            <label htmlFor="bill-status">Статус</label>
            <select
              id="bill-status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Все статусы</option>
              {(Object.keys(billStatusLabels) as BillStatus[]).map((key) => (
                <option key={key} value={key}>
                  {billStatusLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" type="submit">
              Применить
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : bills.length === 0 ? (
        <EmptyState title="Законопроекты не найдены">
          {query || appliedStatus !== 'all'
            ? 'По заданным условиям ничего не найдено.'
            : 'Законопроекты появятся после их внесения и публикации.'}
        </EmptyState>
      ) : (
        <div className="bill-list">
          {bills.map((bill) => (
            <article className="bill-card" key={bill.id}>
              <div className="bill-card-head">
                <span className="doc-number">№ {bill.number}</span>
                <Badge tone={billStatusTone(bill.status)}>{billStatusLabels[bill.status]}</Badge>
                <DemoBadge show={bill.is_demo} />
              </div>
              <h2>
                <Link to={`/duma/bills/${bill.id}`}>{bill.title}</Link>
              </h2>
              {bill.summary ? <p>{bill.summary}</p> : null}
              <div className="card-footer">
                <span>Инициатор: {bill.initiator}</span>
                <span aria-hidden="true">·</span>
                <span>Внесён: {formatDate(bill.submitted_on)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function SessionsTab({ kind }: { kind: SessionKind }) {
  const { data, loading, error } = useAsync(
    () => (isSupabaseConfigured ? fetchSessions(kind) : Promise.resolve([])),
    [kind]
  )

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />
  if (!data || data.length === 0) {
    return (
      <EmptyState title={kind === 'agenda' ? 'Повестки не опубликованы' : 'Протоколы не опубликованы'}>
        Материалы заседаний появятся после их опубликования.
      </EmptyState>
    )
  }

  return (
    <div className="session-list">
      {data.map((session) => (
        <details className="session-item" key={session.id}>
          <summary>
            <span className="doc-number">№ {session.number}</span>
            <span className="session-title">{session.title}</span>
            <span className="session-date">{formatDate(session.session_date)}</span>
          </summary>
          <div className="session-body">
            <TextBody text={session.body} />
          </div>
        </details>
      ))}
    </div>
  )
}

export default function DumaPage() {
  const [tab, setTab] = useState<Tab>('bills')

  useEffect(() => {
    setTab('bills')
  }, [])

  return (
    <>
      <PageHeader
        kicker="Законодательная власть"
        title="Дума КФ"
        description="Законопроекты, повестки заседаний, протоколы и результаты голосований. Статус каждого документа отражает текущую стадию рассмотрения."
        breadcrumbs={[{ label: 'Дума КФ' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Материалы Думы загружаются из Supabase. Пока подключение не настроено, разделы
            отображаются пустыми.
          </Notice>
        ) : null}

        <div className="tabs" role="tablist" aria-label="Материалы Думы">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={`tab${tab === item.id ? ' active' : ''}`}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              id={`tab-${item.id}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="tab-panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === 'bills' ? <BillsTab /> : null}
          {tab === 'agenda' ? <SessionsTab kind="agenda" /> : null}
          {tab === 'protocols' ? <SessionsTab kind="protocol" /> : null}
        </div>

        <p className="page-note">
          Результаты голосований публикуются только в отношении официально опубликованных
          материалов. Персональные данные должностных лиц не размещаются без подтверждения.
        </p>
      </div>
    </>
  )
}
