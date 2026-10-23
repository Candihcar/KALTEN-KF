import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Emblem } from './ui'

type IconName =
  | 'search'
  | 'menu'
  | 'close'
  | 'arrow'
  | 'admin'
  | 'news'
  | 'duma'
  | 'law'
  | 'code'
  | 'bodies'
  | 'globe'
  | 'info'

const iconPaths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  admin: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 9h16M8 13h3M8 16h6" />
    </>
  ),
  news: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  duma: (
    <>
      <path d="M4 20h16M6 20V9m4 11V9m4 11V9m4 11V9M3 9l9-5 9 5H3Z" />
    </>
  ),
  law: (
    <>
      <path d="M12 4v16M7 20h10M4 8h16M6.5 8l-3 6h6l-3-6Zm11 0-3 6h6l-3-6Z" />
    </>
  ),
  code: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M8 4v16M12 8h4M12 12h4M12 16h3" />
    </>
  ),
  bodies: (
    <>
      <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.4 2.4 3.6 5 3.6 8s-1.2 5.6-3.6 8c-2.4-2.4-3.6-5-3.6-8S9.6 6.4 12 4Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v6M12 8h.01" />
    </>
  )
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

const navItems: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Главная', icon: 'bodies' },
  { to: '/news', label: 'Новости', icon: 'news' },
  { to: '/duma', label: 'Дума КФ', icon: 'duma' },
  { to: '/legislation', label: 'Законодательство', icon: 'law' },
  { to: '/criminal-code', label: 'Уголовный кодекс', icon: 'code' },
  { to: '/administrative-code', label: 'Административный кодекс', icon: 'code' },
  { to: '/bodies', label: 'Органы власти', icon: 'bodies' },
  { to: '/international', label: 'Международные отношения', icon: 'globe' },
  { to: '/about', label: 'О портале', icon: 'info' }
]

function GlobalSearch({
  onDone,
  inputId = 'global-search'
}: {
  onDone?: () => void
  inputId?: string
}) {
  const [term, setTerm] = useState('')
  const navigate = useNavigate()

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = term.trim()
    if (!value) return
    navigate(`/search?q=${encodeURIComponent(value)}`)
    setTerm('')
    onDone?.()
  }

  return (
    <form className="search-field" role="search" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={inputId}>
        Поиск по порталу
      </label>
      <input
        id={inputId}
        name="q"
        type="search"
        placeholder="Поиск по порталу"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        autoComplete="off"
      />
      <button type="submit" aria-label="Найти">
        <Icon name="search" size={17} />
      </button>
    </form>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main-content">
        Перейти к основному содержимому
      </a>

      <div className="topline">
        <div className="container topline-inner">
          <span className="topline-note">
            Официальный информационный портал Комаринской Федерации
          </span>
          <div className="topline-links">
            <Link to="/about">О портале</Link>
            <Link to="/admin">Панель управления</Link>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="На главную страницу">
            <Emblem size={46} className="brand-emblem" />
            <span className="brand-text">
              <span className="brand-title">Комаринская Федерация</span>
              <span className="brand-subtitle">Официальный портал</span>
            </span>
          </Link>

          <div className="header-actions">
            <div className="header-search">
              <GlobalSearch />
            </div>
            <Link className="icon-button header-admin" to="/admin" aria-label="Панель управления">
              <Icon name="admin" size={19} />
              <span>Панель</span>
            </Link>
            <button
              className="icon-button menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
              <span>{menuOpen ? 'Закрыть' : 'Меню'}</span>
            </button>
          </div>
        </div>

        <nav className="main-nav" aria-label="Основная навигация">
          <div className="container">
            <ul className="nav-list">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div id="mobile-navigation" className={`mobile-panel${menuOpen ? ' open' : ''}`} hidden={!menuOpen}>
          <div className="container">
            <GlobalSearch inputId="mobile-global-search" onDone={() => setMenuOpen(false)} />
            <ul className="mobile-nav-list">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className="mobile-nav-link">
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/admin" className="mobile-nav-link">
                  <Icon name="admin" size={18} />
                  <span>Панель управления</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main id="main-content" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Emblem size={40} />
            <div>
              <p className="footer-title">Официальный портал Комаринской Федерации</p>
              <p className="footer-text">
                Единое информационное пространство для публикации новостей, нормативных актов и
                материалов Думы КФ.
              </p>
            </div>
          </div>

          <nav className="footer-col" aria-label="Разделы портала">
            <h2>Разделы</h2>
            <ul>
              <li><Link to="/news">Новости</Link></li>
              <li><Link to="/duma">Дума КФ</Link></li>
              <li><Link to="/legislation">Законодательство</Link></li>
              <li><Link to="/bodies">Органы власти</Link></li>
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Правовая база">
            <h2>Правовая база</h2>
            <ul>
              <li><Link to="/criminal-code">Уголовный кодекс КФ</Link></li>
              <li><Link to="/administrative-code">Административное законодательство</Link></li>
              <li><Link to="/international">Международные отношения</Link></li>
              <li><Link to="/about">О портале</Link></li>
            </ul>
          </nav>

          <div className="footer-col">
            <h2>Сведения</h2>
            <ul>
              <li><Link to="/about#publication">Принципы публикации</Link></li>
              <li><Link to="/about#developer">Разработчик</Link></li>
              <li><Link to="/admin">Служебный вход</Link></li>
            </ul>
            <p className="footer-note">
              Портал RP-проекта. Демонстрационные материалы помечаются и не являются официальными
              документами.
            </p>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Комаринская Федерация</span>
          <span className="footer-credit">Разработано KALTEN Technologies</span>
        </div>
      </footer>
    </>
  )
}
