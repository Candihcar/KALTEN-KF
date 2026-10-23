import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container page-body not-found">
      <p className="kicker">Ошибка 404</p>
      <h1 className="page-title">Страница не найдена</h1>
      <p className="page-description">
        Адрес может быть указан неверно, либо материал был перемещён. Воспользуйтесь навигацией или
        вернитесь на главную страницу.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/">
          На главную
        </Link>
        <Link className="btn btn-secondary" to="/search">
          Перейти к поиску
        </Link>
      </div>
    </div>
  )
}
