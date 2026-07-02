import { createHighlighter, type Highlighter } from 'shiki'

/**
 * Single shared shiki highlighter for the API docs. Only the languages and the
 * two themes we actually use are loaded, so the bundle stays small and the
 * highlighter is created once and reused across every code block.
 */
let highlighterPromise: Promise<Highlighter> | null = null

export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const

export function getDocsHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      langs: ['bash', 'javascript', 'python', 'json', 'http'],
    })
  }
  return highlighterPromise
}
