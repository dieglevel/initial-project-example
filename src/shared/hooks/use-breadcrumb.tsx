import { Link, useMatches } from '@tanstack/react-router'

export function Breadcrumbs() {
  const matches = useMatches()

  const crumbs = matches
    .filter((m) => m.context.breadcrumb)
    .map((m) => ({
      label: m.context.breadcrumb,
      to: m.pathname,
    }))

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={crumb.to}>
          <Link to={crumb.to}>{crumb.label}</Link>
          {index < crumbs.length - 1 && ' / '}
        </span>
      ))}
    </nav>
  )
}
