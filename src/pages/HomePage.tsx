import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { formatDate, newsCategoryLabels, readingTime } from '../lib/format'
import { fetchHomeData } from '../services/content'
import {
  Badge,
  DemoBadge,
  Emblem,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  SectionHead
} from '../components/ui'
import type { Bill, LegislationDocument, NewsPost } from '../types/content'

const quickLinks = [
  { to: '/legislation', title: 'Правовая база', text: 'Нормативные акты, кодексы и постановления.' },
  { to: '/duma', title: 'Дума КФ', text: 'Законопроекты, повестки и протоколы заседаний.' },
  { to: '/criminal-code', title: 'Уголовный кодекс КФ', text: 'Структура кодекса и статьи.' },
  { to: '/bodies', title: 'Органы власти', text: 'Структура государственных органов.' },
  { to: '/international', title: 'Международные отношения', text: 'Договоры, соглашения и заявления.' },
  { to: '/about', title: 'О портале', text: 'Назначение, принципы публикации и разработчик.' }
]

function FeaturedNews({ post }: { post: NewsPost }) {
  return (
    <article className="featured-card">
      <div className="card-topline">
        <div className="card-badges">
          <Badge tone="navy">{newsCategoryLabels[post.category]}</Badge>
          <DemoBadge show={post.is_demo} />
        </div>
        <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
      </div>
      <h3 className="featured-title">
        <Link to={`/news/${post.id}`}>{post.title}</Link>
      </h3>
      {post.summary ? <p className="featured-summary">{post.summary}</p> : null}
      <div className="card-footer">
        <span>{post.author || 'Официальный портал'}</span>
        <span aria-hidden="true">·</span>
        <span>{readingTime(post.body)}</span>
        <Link className="text-link" to={`/news/${post.id}`}>
          Читать
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

function NewsRow({ post }: { post: NewsPost }) {
  return (
    <article className="news-row">
      <div className="news-row-date" aria-hidden="true">
        <span className="news-row-day">
          {post.published_at ? new Date(post.published_at).getDate() : '—'}
        </span>
        <span className="news-row-month">
          {post.published_at
            ? new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(post.published_at))
            : ''}
        </span>
      </div>
      <div className="news-row-body">
        <div className="news-row-meta">
          <span>{newsCategoryLabels[post.category]}</span>
          {post.is_demo ? <span className="demo-inline">Демо</span> : null}
        </div>
        <h3>
          <Link to={`/news/${post.id}`}>{post.title}</Link>
        </h3>
        {post.summary ? <p>{post.summary}</p> : null}
      </div>
    </article>
  )
}

function BillRow({ bill }: { bill: Bill }) {
  const statusLabels: Record<string, string> = {
    draft: 'Проект',
    submitted: 'Внесён',
    under_review: 'На рассмотрении',
    voting: 'На голосовании',
    adopted: 'Принят',
    rejected: 'Отклонён',
    revision: 'На доработке',
    signed: 'Подписан',
    published: 'Опубликован',
    void: 'Утратил силу'
  }
  return (
    <article className="doc-row">
      <div className="doc-row-main">
        <div className="doc-row-kicker">
          <span>Законопроект № {bill.number}</span>
          <span className="doc-row-sep" aria-hidden="true">·</span>
          <span>{statusLabels[bill.status]}</span>
        </div>
        <h3>
          <Link to={`/duma/bills/${bill.id}`}>{bill.title}</Link>
        </h3>
        <p>{bill.summary || 'Краткое описание не опубликовано.'}</p>
      </div>
      <div className="doc-row-meta">
        <span>{bill.initiator}</span>
        <span>{formatDate(bill.submitted_on)}</span>
      </div>
    </article>
  )
}

function LawRow({ doc }: { doc: LegislationDocument }) {
  return (
    <article className="doc-row">
      <div className="doc-row-main">
        <div className="doc-row-kicker">
          <span>{doc.doc_type}</span>
          <span className="doc-row-sep" aria-hidden="true">·</span>
          <span>№ {doc.doc_number}</span>
        </div>
        <h3>
          <Link to={`/legislation/${doc.id}`}>{doc.title}</Link>
        </h3>
        <p>{doc.summary || 'Краткое описание не опубликовано.'}</p>
      </div>
      <div className="doc-row-meta">
        <span>Принят: {formatDate(doc.adopted_on)}</span>
        <span>Опубликован: {formatDate(doc.published_on)}</span>
      </div>
    </article>
  )
}

export default function HomePage() {
  const { data, loading, error } = useAsync(fetchHomeData, [])
  const news = data?.news ?? []
  const documents = data?.documents ?? []
  const bills = data?.bills ?? []
  const featured = news[0]
  const latest = news.slice(1)
  const announcements = news.filter((post) => post.category === 'announcements')
  const configured = data?.configured ?? false

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <p className="hero-kicker">Официальный информационный портал</p>
            <h1 className="hero-title">Комаринская Федерация</h1>
            <p className="hero-lead">
              Единая точка доступа к официальным публикациям, законодательной базе, документам Думы КФ
              и сведениям о государственных органах.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/legislation">
                Открыть правовую базу
              </Link>
              <Link className="btn btn-secondary" to="/news">
                Перейти к новостям
              </Link>
            </div>
            <p className="hero-note">
              Портал RP-проекта. Статус каждого материала указывается отдельно; демонстрационные
              публикации помечаются.
            </p>
          </div>

          <aside className="hero-aside" aria-label="Сведения о портале">
            <div className="hero-seal-row">
              <Emblem size={72} className="hero-emblem" />
              <div>
                <p className="hero-seal-label">Временный знак</p>
                <p className="hero-seal-text">
                  Официальная символика будет размещена после её утверждения.
                </p>
              </div>
            </div>
            <div className="hero-divider" />
            <dl className="hero-facts">
              <div>
                <dt>Правовая база</dt>
                <dd><Link to="/legislation">Законодательство КФ</Link></dd>
              </div>
              <div>
                <dt>Законодательный орган</dt>
                <dd><Link to="/duma">Дума КФ</Link></dd>
              </div>
              <div>
                <dt>Публикация материалов</dt>
                <dd><Link to="/about#publication">Принципы публикации</Link></dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="container home-body">
        {!loading && !configured ? (
          <Notice tone="warning" title="База данных портала не подключена">
            Интерфейс портала готов к работе. Публикации появятся после подключения Supabase и
            применения SQL-миграций. Порядок настройки описан в разделе{' '}
            <Link to="/about#data">«Данные портала»</Link>.
          </Notice>
        ) : null}

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <div className="home-grid">
              <section className="home-main" aria-labelledby="main-news-title">
                <SectionHead title="Главное" link="/news" linkLabel="Все новости" />
                <h2 id="main-news-title" className="visually-hidden">
                  Главная новость
                </h2>
                {featured ? (
                  <FeaturedNews post={featured} />
                ) : (
                  <EmptyState title="Публикации отсутствуют">
                    Опубликованные новости появятся после подключения базы данных и публикации
                    материалов.
                  </EmptyState>
                )}
                {latest.length > 0 ? (
                  <div className="news-rows">
                    {latest.map((post) => (
                      <NewsRow key={post.id} post={post} />
                    ))}
                  </div>
                ) : null}
              </section>

              <aside className="home-aside">
                <section className="panel">
                  <div className="panel-head">
                    <h2>Государственные объявления</h2>
                  </div>
                  <div className="panel-body">
                    {announcements.length > 0 ? (
                      <ul className="announcement-list">
                        {announcements.map((post) => (
                          <li key={post.id}>
                            <time dateTime={post.published_at ?? undefined}>
                              {formatDate(post.published_at)}
                            </time>
                            <Link to={`/news/${post.id}`}>{post.title}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState compact title="Объявления не опубликованы">
                        Раздел заполняется по мере публикации официальных объявлений.
                      </EmptyState>
                    )}
                  </div>
                </section>

                <section className="panel panel-muted">
                  <div className="panel-head">
                    <h2>Быстрый доступ</h2>
                  </div>
                  <div className="panel-body">
                    <ul className="quick-list">
                      {quickLinks.slice(0, 4).map((item) => (
                        <li key={item.to}>
                          <Link to={item.to}>
                            <span>{item.title}</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </aside>
            </div>

            <section className="section" aria-labelledby="duma-documents-title">
              <SectionHead title="Последние документы Думы" link="/duma" linkLabel="Раздел Думы" />
              <h2 id="duma-documents-title" className="visually-hidden">
                Последние документы Думы
              </h2>
              {bills.length > 0 ? (
                <div className="doc-list">
                  {bills.map((bill) => (
                    <BillRow key={bill.id} bill={bill} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Документы Думы не опубликованы">
                  Законопроекты и постановления появятся здесь после публикации.
                </EmptyState>
              )}
            </section>

            <section className="section" aria-labelledby="recent-laws-title">
              <SectionHead
                title="Недавно опубликованные законы"
                link="/legislation"
                linkLabel="Правовая база"
              />
              <h2 id="recent-laws-title" className="visually-hidden">
                Недавно опубликованные законы
              </h2>
              {documents.length > 0 ? (
                <div className="doc-list">
                  {documents.map((doc) => (
                    <LawRow key={doc.id} doc={doc} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Нормативные акты не опубликованы">
                  Опубликованные документы появятся в правовой базе.
                </EmptyState>
              )}
            </section>

            <section className="section section-last" aria-labelledby="quick-links-title">
              <div className="section-head">
                <h2 id="quick-links-title" className="section-title">
                  Важные разделы
                </h2>
              </div>
              <div className="quick-grid">
                {quickLinks.map((item) => (
                  <Link className="quick-card" to={item.to} key={item.to}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <span className="quick-card-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  )
}
