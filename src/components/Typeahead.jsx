import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Typeahead / autocomplete input.
 *
 * Props:
 *   value          – controlled string value
 *   onChange(v)    – called with new string on keystrokes or suggestion selection
 *   suggestions    – string[] of all candidates (component filters internally)
 *   tokenize       – if true, matches/replaces only the last comma-separated token
 *   All other props are forwarded to the underlying <input>.
 */
export default function Typeahead({ value, onChange, suggestions = [], tokenize = false, onFocus, onKeyDown, ...rest }) {
  const [open, setOpen]     = useState(false)
  const [cursor, setCursor] = useState(-1)
  const [dropRect, setDropRect] = useState(null)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)

  // For tokenize mode, match against the last comma-separated segment
  const activeToken = tokenize
    ? value.split(',').pop().trim()
    : value

  const filtered = activeToken.length >= 1
    ? suggestions
        .filter(s =>
          s.toLowerCase().includes(activeToken.toLowerCase()) &&
          s.toLowerCase() !== activeToken.toLowerCase()
        )
        .slice(0, 8)
    : []

  // Recalculate dropdown position every time it opens (or on scroll/resize)
  const updateRect = useCallback(() => {
    if (inputRef.current) setDropRect(inputRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!open) return
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open, updateRect])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(suggestion) {
    if (tokenize) {
      const parts = value.split(',')
      parts[parts.length - 1] = ' ' + suggestion
      // Avoid leading ", " when it's the only/first token
      const joined = parts.join(',').replace(/^,\s*/, '')
      onChange(joined)
    } else {
      onChange(suggestion)
    }
    setOpen(false)
    setCursor(-1)
  }

  function handleKeyDown(e) {
    if (onKeyDown) onKeyDown(e)
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); select(filtered[cursor]) }
    if (e.key === 'Escape') { setOpen(false); setCursor(-1) }
  }

  function handleFocus(e) {
    if (onFocus) onFocus(e)
    if (filtered.length > 0) { updateRect(); setOpen(true) }
  }

  const dropdown = open && filtered.length > 0 && dropRect && createPortal(
    <ul
      style={{
        position: 'fixed',
        top:   dropRect.bottom + 2,
        left:  dropRect.left,
        width: dropRect.width,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
      }}
      role="listbox"
    >
      {filtered.map((s, i) => (
        <li
          key={s}
          role="option"
          aria-selected={i === cursor}
          style={{
            padding: '9px 12px',
            fontSize: '14px',
            color: '#0f172a',
            cursor: 'pointer',
            background: i === cursor ? '#f0f6ff' : 'transparent',
            fontFamily: 'inherit',
          }}
          onMouseEnter={() => setCursor(i)}
          onMouseDown={e => { e.preventDefault(); select(s) }}
        >
          {highlight(s, activeToken)}
        </li>
      ))}
    </ul>,
    document.body
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        {...rest}
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); updateRect(); setCursor(-1); setOpen(true) }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {dropdown}
    </div>
  )
}

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: '#1e6fa8', fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  )
}
