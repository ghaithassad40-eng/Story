import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const links = [
  { to: '/', label: '🏠 Home' },
  { to: '/create', label: '✨ Create Story' },
  { to: '/examples', label: '📚 Examples' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        🌟 StoryMagic
      </Link>
      <div className={styles.links}>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.link} ${pathname === to ? styles.active : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
