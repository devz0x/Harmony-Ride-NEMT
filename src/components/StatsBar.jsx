import { useEffect, useRef, useState } from 'react'
import styles from './StatsBar.module.css'

const stats = [
  { value: 50000, suffix: '+', label: 'Rides Completed', prefix: '' },
  { value: 98, suffix: '%', label: 'On-Time Arrival Rate', prefix: '' },
  { value: 12, suffix: '', label: 'States Covered', prefix: '' },
  { value: 4.9, suffix: '/5', label: 'Patient Satisfaction', prefix: '' },
]

function CountUp({ target, suffix, prefix, isDecimal }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, isDecimal])

  const display = isDecimal ? count.toFixed(1) : count.toLocaleString()

  return (
    <span ref={ref} className={styles.value}>
      {prefix}{display}{suffix}
    </span>
  )
}

export default function StatsBar() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.stat}>
              <CountUp
                target={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
                isDecimal={typeof stat.value === 'number' && !Number.isInteger(stat.value)}
              />
              <p className={styles.label}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
