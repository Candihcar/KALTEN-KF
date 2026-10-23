import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BadgeTone } from '../lib/format'

export function Emblem({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`emblem ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Временный знак официального портала Комаринской Федерации"
    >
      <rect width="64" height="64" fill="currentColor" />
      <path
        d="M32 8 52 18v16c0 11-8.4 18.6-20 22-11.6-3.4-20-11-20-22V18L32 8Z"
        fill="none"
        stroke="#c9d5e3"
        strokeWidth="2"
      />
      <path d="M22 24v16M22 32h8l7-8M30 32l7 8" fill="none" stroke="#ffffff" strokeWidth="2.4" />
      <path d="M41 24v16" stroke="#b08d57" strokeWidth="2.4" />
    </svg>
  )
}

export function Badge({
  children,
  tone = 'neutral'
}: {
  children: ReactNode
  tone?: BadgeTone
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function DemoBadge({ show }: { show?: boolean | null }) {
  if (!show) return null
  return <Badge tone="gold">Демонстрационный материал</Badge>
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="callout callout-demo" role="note">
      <strong>Демонстрационный материал.</strong>{' '}
      {children ?? 'Не является официальным документом или опубликованным решением Комаринской Федерации.'}
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children
}: {
  tone?: 'info' | 'warning' | 'error' | 'success'
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'note'}>
      {title ? <div className="notice-title">{title}</div> : null}
      <div className="notice-text">{children}</div>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav className="breadcrumbs" aria-label="Навигационная цепочка">
      <ol>
        <li>
          <Link to="/">Главная</Link>
        </li>
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  kicker,
  title,
  description,
  breadcrumbs,
  actions
}: {
  kicker?: string
  title: string
  description?: ReactNode
  breadcrumbs?: Array<{ label: string; to?: string }>
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="container">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div className="page-header-row">
          <div>
            {kicker ? <p className="kicker">{kicker}</p> : null}
            <h1 className="page-title">{title}</h1>
            {description ? <div className="page-description">{description}</div> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}

export function SectionHead({
  title,
  link,
  linkLabel = 'Смотреть все'
}: {
  title: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {link ? (
        <Link className="section-link" to={link}>
          {linkLabel}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  children,
  compact = false
}: {
  title: string
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 4h14v16H5z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <p className="empty-title">{title}</p>
      {children ? <div className="empty-text">{children}</div> : null}
    </div>
  )
}

export function Loading({ label = 'Загрузка материалов…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-title">Не удалось загрузить данные</p>
      <p className="error-text">{message}</p>
      <p className="error-hint">
        Проверьте подключение к базе данных и применение SQL-миграций. Инструкция находится в файле
        документации проекта.
      </p>
    </div>
  )
}

export function DataState({
  loading,
  error,
  onEmpty,
  children
}: {
  loading: boolean
  error: string | null
  onEmpty?: ReactNode
  children: ReactNode
}) {
  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />
  if (onEmpty) return <>{onEmpty}</>
  return <>{children}</>
}

export function TextBody({ text }: { text: string | null | undefined }) {
  if (!text || !text.trim()) {
    return <p className="muted">Полный текст не опубликован.</p>
  }
  return (
    <div className="prose">
      {text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, index) => (
          <p key={index}>{block}</p>
        ))}
    </div>
  )
}
