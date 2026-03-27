import { MapPin, CheckCircle } from 'lucide-react'
import styles from './CoverageArea.module.css'

const states = [
  { name: 'Florida', cities: ['Tampa', 'Orlando', 'Miami', 'Jacksonville', 'St. Petersburg'] },
  { name: 'Georgia', cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'] },
  { name: 'Texas', cities: ['Houston', 'Dallas', 'San Antonio', 'Austin'] },
  { name: 'North Carolina', cities: ['Charlotte', 'Raleigh', 'Durham', 'Greensboro'] },
]

export default function CoverageArea() {
  return (
    <section id="coverage" className={styles.section}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.content}>
            <span className={styles.eyebrow}>Coverage Area</span>
            <h2 className={styles.title}>Serving Patients Across the Southeast</h2>
            <p className={styles.desc}>
              We currently operate in 12 states with 200+ vehicles. Our network of certified drivers
              covers urban medical centers and rural clinics alike.
            </p>

            <div className={styles.states}>
              {states.map((state, i) => (
                <div key={i} className={styles.stateCard}>
                  <div className={styles.stateName}>
                    <MapPin size={16} color="#1e6fa8" />
                    <span>{state.name}</span>
                  </div>
                  <div className={styles.cities}>
                    {state.cities.map((city, j) => (
                      <div key={j} className={styles.city}>
                        <CheckCircle size={12} color="#16a34a" />
                        {city}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.expandNote}>
              <div className={styles.expandDot} />
              <p>Expanding to 4 new states in 2025. <a href="tel:+19782250802">Call to check your area.</a></p>
            </div>
          </div>

          {/* Map — Mapbox integration point */}
          <div className={styles.mapWrap}>
            <div className={styles.map}>
              {/* TODO: Replace with Mapbox GL JS map
                  mapboxgl.accessToken = process.env.VITE_MAPBOX_TOKEN
                  new mapboxgl.Map({ container: 'coverage-map', style: 'mapbox://styles/mapbox/light-v11',
                    center: [-82.4572, 32.1656], zoom: 5 })
                  Add GeoJSON layer for coverage states + animated pulse markers per city
              */}
              <div className={styles.mapPlaceholder}>
                <div className={styles.mapBg}>
                  {/* Southeast US coverage visualization */}
                  <svg viewBox="0 0 480 340" className={styles.mapSvg} aria-hidden="true">
                    <defs>
                      <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#e8f4fd"/>
                        <stop offset="100%" stopColor="#c8dff0"/>
                      </radialGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    <rect width="480" height="340" fill="url(#mapBgGrad)" rx="0"/>
                    {/* Grid lines */}
                    {[60,120,180,240,300].map(y => (
                      <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="#b8d4e8" strokeWidth="0.5" strokeDasharray="6,6"/>
                    ))}
                    {[80,160,240,320,400].map(x => (
                      <line key={x} x1={x} y1="0" x2={x} y2="340" stroke="#b8d4e8" strokeWidth="0.5" strokeDasharray="6,6"/>
                    ))}
                    {/* Coverage region fill */}
                    <ellipse cx="240" cy="200" rx="190" ry="110" fill="#1e6fa8" fillOpacity="0.06"/>
                    {/* Active city pins */}
                    {[
                      { x: 175, y: 245, label: 'Tampa', size: 14, primary: true },
                      { x: 215, y: 230, label: 'Orlando', size: 11, primary: true },
                      { x: 235, y: 275, label: 'Miami', size: 10, primary: true },
                      { x: 148, y: 262, label: 'St. Pete', size: 9, primary: true },
                      { x: 270, y: 155, label: 'Atlanta', size: 13, primary: true },
                      { x: 340, y: 140, label: 'Charlotte', size: 11, primary: true },
                      { x: 165, y: 155, label: 'Houston', size: 12, primary: true },
                      { x: 210, y: 260, label: 'Fort Laud.', size: 8, primary: false },
                      { x: 308, y: 160, label: 'Raleigh', size: 9, primary: false },
                      { x: 108, y: 140, label: 'Dallas', size: 10, primary: false },
                    ].map((dot, i) => (
                      <g key={i} filter={dot.primary ? "url(#glow)" : ""}>
                        {dot.primary && (
                          <circle cx={dot.x} cy={dot.y} r={dot.size + 8} fill="#1e6fa8" fillOpacity="0.12">
                            <animate attributeName="r" values={`${dot.size+4};${dot.size+14};${dot.size+4}`} dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
                          </circle>
                        )}
                        <circle cx={dot.x} cy={dot.y} r={dot.size/2 + 2} fill={dot.primary ? '#1e6fa8' : '#94a3b8'} opacity={dot.primary ? 1 : 0.55}/>
                        <circle cx={dot.x} cy={dot.y} r={dot.size/2} fill="white"/>
                        <circle cx={dot.x} cy={dot.y} r={dot.size/4} fill={dot.primary ? '#1e6fa8' : '#94a3b8'} opacity={dot.primary ? 1 : 0.55}/>
                        <rect x={dot.x - 26} y={dot.y + 6} width="52" height="14" rx="7" fill="white" opacity="0.92"/>
                        <text x={dot.x} y={dot.y + 16} textAnchor="middle" fontSize="8.5" fill={dot.primary ? '#0c2d5a' : '#64748b'} fontWeight={dot.primary ? '700' : '500'} fontFamily="system-ui, sans-serif">
                          {dot.label}
                        </text>
                      </g>
                    ))}
                    {/* Mapbox badge */}
                    <rect x="340" y="308" width="132" height="24" rx="4" fill="white" fillOpacity="0.9"/>
                    <text x="347" y="323" fontSize="9" fill="#64748b" fontFamily="system-ui" fontWeight="600">Map powered by Mapbox</text>
                  </svg>
                </div>

                <div className={styles.mapLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: '#1e6fa8' }} />
                    <span>Active coverage</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: '#94a3b8' }} />
                    <span>Expanding soon</span>
                  </div>
                  <div className={styles.legendMapbox}>
                    <span className={styles.mapboxBadge}>Mapbox integration ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
