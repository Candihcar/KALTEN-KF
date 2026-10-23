import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { excerpt } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchCodeArticles } from '../services/content'
import { Badge, DemoBadge, EmptyState, ErrorState, Loading, Notice, PageHeader } from '../components/ui'
import type { CodeKind } from '../types/content'

const criminalCategories = [
  'Преступления против личности',
  'Преступления против собственности',
  'Преступления против общественной безопасности',
  'Преступления против общественного порядка',
  'Преступления против государства',
  'Должностные преступления',
  'Преступления против правосудия',
  'Иные категории'
]

const administrativeCategories = [
  'Правонарушения против порядка управления',
  'Правонарушения против общественного порядка',
  'Правонарушения в сфере безопасности',
  'Правонарушения против собственности',
  'Правонарушения против личности',
  'Иные правонарушения'
]

const config: Record<
  CodeKind,
  { title: string; kicker: string; description: string; route: string; categories: string[] }
> = {
  criminal: {
    title: 'Уголовный кодекс КФ',
    kicker: 'Уголовное законодательство',
    description:
      'Структура кодекса и статьи по категориям. Каждая статья содержит состав, санкцию, примечания и сведения о редакции.',
    route: '/criminal-code',
    categories: criminalCategories
  },
  administrative: {
    title: 'Административное законодательство',
    kicker: 'Административная ответственность',
    description:
      'Кодекс об административных правонарушениях КФ: составы нарушений, санкции, органы рассмотрения и связанные нормы.',
    route: '/administrative-code',
    categories: administrativeCategories
  }
}

export default function CodePage({ kind }: { kind: CodeKind }) {
  const current = config[kind]
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [appliedCategory, setAppliedCategory] = useState('all')

  useEffect(() => {
    setQ('')
    setQuery('')
    setCategory('all')
    setAppliedCategory('all')
  }, [kind])

  const { data, loading, error } = useAsync(
    () =>
      isSupabaseConfigured
        ? fetchCodeArticles(kind, { q: query, category: appliedCategory })
        : Promise.resolve([]),
    [kind, query, appliedCategory]
  )

  const articles = data ?? []

  function apply(event: FormEvent) {
    event.preventDefault()
    setQuery(q.trim())
    setAppliedCategory(category)
  }

  const groups = current.categories
    .map((name) => ({ name, items: articles.filter((article) => article.category === name) }))
    .filter((group) => group.items.length > 0)

  const otherItems = articles.filter((article) => !current.categories.includes(article.category))

  return (
    <>
      <PageHeader
        kicker={current.kicker}
        title={current.title}
        description={current.description}
        breadcrumbs={[{ label: current.title }]}
      />

      <div className="container page-body">
        <Notice tone="info">
          Материалы с отметкой «Демонстрационный материал» не являются официально принятыми нормами
          Комаринской Федерации. Санкции публикуются только после согласования и утверждения.
        </Notice>

        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Статьи кодекса загружаются из Supabase. Пока подключение не настроено, отображается
            пустое состояние.
          </Notice>
        ) : null}

        <form className="filter-bar" onSubmit={apply} role="search">
          <div className="filter-grid">
            <div className="field field-grow">
              <label htmlFor={`${kind}-search`}>Поиск по статьям</label>
              <input
                id={`${kind}-search`}
                className="input"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Номер, название или описание состава"
              />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-category`}>Категория</label>
              <select
                id={`${kind}-category`}
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">Все категории</option>
                {current.categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" type="submit">
                Применить
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setQ('')
                  setQuery('')
                  setCategory('all')
                  setAppliedCategory('all')
                }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : articles.length === 0 ? (
          <EmptyState title="Статьи не найдены">
            {query || appliedCategory !== 'all'
              ? 'По заданным условиям ничего не найдено.'
              : 'Статьи кодекса будут опубликованы после утверждения.'}
          </EmptyState>
        ) : (
          <div className="code-groups">
            {groups.map((group) => (
              <section key={group.name} className="code-group">
                <div className="code-group-head">
                  <h2>{group.name}</h2>
                  <span>{group.items.length}</span>
                </div>
                <div className="code-grid">
                  {group.items.map((article) => (
                    <article className="code-card" key={article.id}>
                      <div className="code-card-head">
                        <span className="doc-number">Ст. {article.article_number}</span>
                        {article.is_demo ? <DemoBadge show /> : null}
                      </div>
                      <h3>
                        <Link to={`${current.route}/${article.id}`}>{article.title}</Link>
                      </h3>
                      {article.part ? <p className="code-part">Часть: {article.part}</p> : null}
                      {article.description ? (
                        <p className="code-description">{excerpt(article.description, 160)}</p>
                      ) : null}
                      <div className="code-card-foot">
                        <Badge tone="neutral">{article.category}</Badge>
                        <span className="code-sanction">
                          Санкция: {article.sanction ? excerpt(article.sanction, 70) : 'не установлена'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {otherItems.length > 0 ? (
              <section className="code-group">
                <div className="code-group-head">
                  <h2>Прочие статьи</h2>
                  <span>{otherItems.length}</span>
                </div>
                <div className="code-grid">
                  {otherItems.map((article) => (
                    <article className="code-card" key={article.id}>
                      <div className="code-card-head">
                        <span className="doc-number">Ст. {article.article_number}</span>
                        {article.is_demo ? <DemoBadge show /> : null}
                      </div>
                      <h3>
                        <Link to={`${current.route}/${article.id}`}>{article.title}</Link>
                      </h3>
                      <div className="code-card-foot">
                        <Badge tone="neutral">{article.category}</Badge>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <p className="page-note">
          Структура кодекса подготовлена как основа для дальнейшего наполнения. Итоговые санкции и
          размеры штрафов устанавливаются отдельными документами после согласования.
        </p>
      </div>
    </>
  )
}
