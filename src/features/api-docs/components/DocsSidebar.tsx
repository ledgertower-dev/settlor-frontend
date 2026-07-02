'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/core/utils'
import { NAV_SECTIONS } from '../content/nav'

/** The page's single scroll container (the <main> in the api-docs layout). */
function getScrollContainer(): HTMLElement | null {
  return document.getElementById('docs-scroll')
}

/** Scrollspy nav links. Highlights the section currently in view. */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // root is the <main> scroll container so the spy isn't thrown off by the
      // fixed header that lives outside it.
      { root: getScrollContainer(), rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )

    const nodes = NAV_SECTIONS.map(s => document.getElementById(s.id)).filter(
      (n): n is HTMLElement => n !== null,
    )
    nodes.forEach(n => observer.observe(n))
    return () => observer.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault()
    const container = getScrollContainer()
    const el = document.getElementById(id)
    if (container && el) {
      // Scroll the container itself (never scrollIntoView, which can also scroll
      // overflow-hidden ancestors and push the fixed header off-screen).
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        16
      container.scrollTo({ top, behavior: 'smooth' })
    } else {
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setActiveId(id)
    onNavigate?.()
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_SECTIONS.map(s => {
        const active = s.id === activeId
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={e => handleClick(e, s.id)}
            className={cn(
              'rounded px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-sidebar-active text-sidebar-active-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {s.title}
          </a>
        )
      })}
    </nav>
  )
}

/** Desktop sidebar — own scroll area, hidden on small screens. */
export function DocsSidebar() {
  return (
    <aside className="bg-sidebar hidden w-60 shrink-0 overflow-y-auto border-r lg:block">
      <div className="px-4 py-6">
        <p className="text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wide uppercase">
          Payout API
        </p>
        <NavLinks />
      </div>
    </aside>
  )
}

export { NavLinks }
