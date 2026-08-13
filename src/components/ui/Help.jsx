import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import glossary from '../../data/glossary.json'

export function getGlossary(key) {
  return glossary[key] || null
}

function positionTooltip(anchorRect) {
  const TIP_W = 300
  const MARGIN = 10
  const left = Math.min(Math.max(MARGIN, anchorRect.left + anchorRect.width / 2 - TIP_W / 2), window.innerWidth - TIP_W - MARGIN)
  const nearBottom = anchorRect.top > window.innerHeight * 0.55
  const top = nearBottom ? anchorRect.top - MARGIN : anchorRect.bottom + MARGIN
  return { left, top, nearBottom }
}

export default function Help({ text, title, glossaryKey, className = '', iconSize = 'h-3.5 w-3.5' }) {
  const [tip, setTip] = useState(null)
  const btnRef = useRef(null)

  const content = text || (glossaryKey ? getGlossary(glossaryKey) : null)

  const show = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const { left, top, nearBottom } = positionTooltip(rect)
    setTip({ left, top, nearBottom })
  }, [])

  const hide = useCallback(() => setTip(null), [])

  useEffect(() => {
    if (!tip) return undefined
    function onScroll() {
      setTip(null)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [tip])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={content || title || 'More information'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (tip) hide()
          else show()
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-sky-400 focus:outline-none ${className}`}
      >
        <svg className={iconSize} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {tip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[120] w-[300px] rounded-lg border border-slate-600 bg-terminal-800 p-3 shadow-2xl"
            style={{ left: tip.left, top: tip.top, transform: tip.nearBottom ? 'translateY(-100%)' : 'none' }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            {title && <div className="mb-1 text-xs font-bold text-slate-100">{title}</div>}
            {content ? (
              <p className="text-xs leading-relaxed text-slate-300">{content}</p>
            ) : (
              <p className="text-xs italic text-slate-500">Explanation coming soon.</p>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
