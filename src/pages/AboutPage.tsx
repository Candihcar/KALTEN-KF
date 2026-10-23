import { Link } from 'react-router-dom'
import { Emblem, PageHeader } from '../components/ui'

export default function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="Сведения о проекте"
        title="О портале"
        description="Назначение портала, принципы публикации документов, техническая информация и сведения о разработчике."
        breadcrumbs={[{ label: 'О портале' }]}
      />

      <div className="container page-body about-page">
        <div className="about-grid">
          <div className="about-main">
            <section className="content-section" id="purpose">
              <h2>Назначение портала</h2>
              <p>
                Официальный портал Комаринской Федерации — информационный ресурс RP-проекта. Он
                объединяет публикации государственных органов, электронную правовую базу, материалы
                Думы КФ и сведения о структуре власти.
              </p>
              <p>
                Портал не является средством массовой информации и не заменяет официальные каналы
                опубликования. Статус каждого материала указывается в его карточке.
              </p>
            </section>

            <section className="content-section" id="publication">
              <h2>Принципы публикации</h2>
              <ul className="about-list">
                <li>
                  <strong>Разделение статусов.</strong> Черновики не отображаются публично. Опубликованные
                  материалы доступны для чтения и не могут быть изменены анонимными пользователями.
                </li>
                <li>
                  <strong>Разделение дат.</strong> Дата принятия, дата опубликования и дата вступления в
                  силу указываются отдельно.
                </li>
                <li>
                  <strong>Маркировка демонстрационных данных.</strong> Материалы, созданные для проверки
                  интерфейса, помечаются как демонстрационные и не являются официальными документами.
                </li>
                <li>
                  <strong>Проверяемость.</strong> Изменения фиксируются в истории редакций и журнале
                  действий административной панели.
                </li>
                <li>
                  <strong>Защита данных.</strong> Публичный доступ ограничен политиками RLS Supabase.
                  Административные действия проверяются на уровне базы данных.
                </li>
              </ul>
            </section>

            <section className="content-section" id="data">
              <h2>Данные портала</h2>
              <p>
                Основная версия получает данные из Supabase. Для работы публикаций необходимо создать
                проект Supabase, выполнить SQL-миграции из каталога <code>supabase/migrations</code> и
                указать публичные параметры подключения при сборке сайта.
              </p>
              <p>
                Публичный anon key предназначен для браузера и защищается политиками доступа. Ключ
                <code> service_role</code> не используется в клиентском коде и не должен попадать в
                репозиторий или публичную сборку.
              </p>
              <p>
                Автономная локальная версия <code>local/index.html</code> работает без сети, Supabase и
                сборки. Её данные являются демонстрационными и хранятся только в памяти страницы.
              </p>
            </section>

            <section className="content-section" id="contacts">
              <h2>Контакты</h2>
              <p>
                Контактные сведения оператора портала публикуются по мере их утверждения. Технические
                вопросы по работе сайта решаются через администратора проекта и репозиторий исходного
                кода.
              </p>
              <p className="muted">
                Портал не публикует персональные данные должностных лиц без официального подтверждения.
              </p>
            </section>

            <section className="content-section" id="developer">
              <h2>Разработчик</h2>
              <p>
                Портал разработан KALTEN Technologies. KALTEN Technologies является разработчиком
                программного обеспечения и не является государственным органом Комаринской Федерации,
                если такой статус не установлен отдельно.
              </p>
              <div className="developer-card">
                <Emblem size={44} />
                <div>
                  <p className="developer-name">KALTEN Technologies</p>
                  <p className="developer-role">Разработка и техническая поддержка портала</p>
                </div>
              </div>
              <p className="developer-credit">Разработано KALTEN Technologies</p>
            </section>
          </div>

          <aside className="about-aside">
            <div className="meta-card">
              <h2>Кратко</h2>
              <dl className="meta-list">
                <div>
                  <dt>Государство</dt>
                  <dd>Комаринская Федерация</dd>
                </div>
                <div>
                  <dt>Сокращение</dt>
                  <dd>КФ</dd>
                </div>
                <div>
                  <dt>Язык</dt>
                  <dd>Русский</dd>
                </div>
                <div>
                  <dt>Публикация</dt>
                  <dd>GitHub Pages</dd>
                </div>
                <div>
                  <dt>Данные</dt>
                  <dd>Supabase (основная версия)</dd>
                </div>
                <div>
                  <dt>Разработчик</dt>
                  <dd>KALTEN Technologies</dd>
                </div>
              </dl>
            </div>
            <div className="meta-card">
              <h2>Локальная версия</h2>
              <p className="small muted">
                Файл <code>local/index.html</code> открывается напрямую в браузере без сервера и
                интернета. Изменения в нём не попадают в Supabase.
              </p>
              <Link className="text-link" to="/news">
                Перейти к новостям
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
