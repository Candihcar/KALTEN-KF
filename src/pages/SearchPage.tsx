import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { isSupabaseConfigured } from '../lib/supabase'
import { globalSearch } from '../services/content'
import { EmptyState, ErrorState, Loading, Notice, PageHeader } from '../components/ui'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const [term, setTerm] = useState(q)
  const navigate = useNavigate()

  useEffect(() => {
    setTerm(q)
  }, [q])

  const { data, loading, error } = useAsync(
    () => (isSupabaseConfigured && q ? globalSearch(q) : Promise.resolve([])),
    [q]
  )

  const groups = data ?? []
  const total = groups.reduce((sum, group) => sum + group.items.length, 0)

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = term.trim()
    if (!value) return
    navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <>
      <PageHeader
        kicker="Поиск"
        title="Поиск по порталу"
        description="Единый поиск по новостям, нормативным актам, законопроектам и статьям кодексов."
        breadcrumbs={[{ label: 'Поиск' }]}
      />

      <div className="container page-body">
        {!isSupabaseConfigured ? (
          <Notice tone="warning" title="База данных не подключена">
            Поиск работает по опубликованным материалам Supabase. Пока подключение не настроено,
            результаты недоступны.
          </Notice>
        ) : null}

        <form className="search-page-form" onSubmit={submit} role="search">
          <label className="visually-hidden" htmlFor="page-search">
            Поисковый запрос
          </label>
          <input
            id="page-search"
            className="input input-lg"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Введите запрос"
            autoFocus
          />
          <button className="btn btn-primary" type="submit">
            Найти
          </button>
        </form>

        {!q ? (
          <EmptyState title="Введите поисковый запрос">
            Например, номер документа, название законопроекта или ключевое слово.
          </EmptyState>
        ) : loading ? (
          <Loading label="Поиск…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : total === 0 ? (
          <EmptyState title="Ничего не найдено">
            По запросу «{q}» опубликованных материалов не найдено.
          </EmptyState>
        ) : (
          <>
            <div className="results-meta">
              <span>Найдено материалов: {total}</span>
              <span>Запрос: «{q}»</span>
            </div>
            <div className="search-groups">
              {groups.map((group) => (
                <section className="search-group" key={group.label}>
                  <div className="code-group-head">
                    <h2>{group.label}</h2>
                    <span>{group.items.length}</span>
                  </div>
                  <ul className="search-list">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link to={item.to}>{item.title}</Link>
                        <span>{item.meta}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
