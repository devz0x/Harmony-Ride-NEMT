import { Car, Users, Truck, Clock, AlertTriangle, CheckCircle, ArrowRight, ListChecks, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTrips, useDrivers, useVehicles, useInvoices } from '../../lib/useData'
import styles from './Dashboard.module.css'

const statusColor = { confirmed:'#1e6fa8','in-transit':'#d97706',pending:'#7c3aed',completed:'#16a34a','no-show':'#ef4444' }
const statusBg    = { confirmed:'#dbeeff','in-transit':'#fef3c7',pending:'#ede9fe',completed:'#d1fae5','no-show':'#fee2e2' }
const statusLabel = { confirmed:'Confirmed','in-transit':'In Transit',pending:'Pending',completed:'Completed','no-show':'No Show' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { trips }    = useTrips()
  const { drivers }  = useDrivers()
  const { vehicles } = useVehicles()
  const { invoices } = useInvoices()

  const today     = new Date().toISOString().slice(0,10)
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel= new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  const todayTrips = trips.filter(t => t.date === today).slice(0,5)
  const avgRating  = drivers.length ? (drivers.reduce((s,d)=>s+(d.rating||0),0)/drivers.length).toFixed(1) : '—'

  // Dynamic alerts from real data
  const alerts = [
    ...vehicles.filter(v=>v.nextService&&v.nextService<=today).map(v=>({
      type:'warn', text:`${v.id} (${v.make}) service is overdue — last service ${v.lastService}`, route:'/admin/fleet',
    })),
    ...drivers.filter(d=>d.status==='suspended').map(d=>({
      type:'warn', text:`Driver ${d.name} (${d.id}) is suspended — reassign any open trips`, route:'/admin/drivers',
    })),
    ...trips.filter(t=>!t.driver&&t.status==='pending').slice(0,3).map(t=>({
      type:'info', text:`${t.id} (${t.patient}) needs a driver — ${t.date} at ${t.time}`, route:'/admin/dispatch',
    })),
    ...invoices.filter(inv=>inv.status==='denied').map(inv=>({
      type:'info', text:`${inv.id} denied by ${inv.billTo} — ${inv.denialReason||'review required'}`, route:'/admin/billing',
    })),
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{greeting}, Admin</h1>
          <p className={styles.sub}>{todayLabel} · Here's what needs your attention today.</p>
        </div>
        <button className={styles.newTripBtn} onClick={()=>navigate('/admin/trips')}>+ New Trip</button>
      </div>

      <div className={styles.kpiGrid}>
        <KPICard icon={<Car size={20}/>}        label="Today's Trips"      value={trips.filter(t=>t.date===today).length} sub={`${trips.filter(t=>t.status==='in-transit').length} in transit`}                     color="#1e6fa8" bg="#dbeeff"/>
        <KPICard icon={<CheckCircle size={20}/>} label="Completed Today"    value={trips.filter(t=>t.status==='completed'&&t.date===today).length} sub="as of right now"                                              color="#16a34a" bg="#d1fae5"/>
        <KPICard icon={<Clock size={20}/>}       label="Pending Assignment" value={trips.filter(t=>t.status==='pending'&&!t.driver).length} sub="need driver/vehicle"                                                 color="#d97706" bg="#fef3c7" alert/>
        <KPICard icon={<Users size={20}/>}       label="Drivers On Duty"    value={drivers.filter(d=>d.status==='on-duty').length} sub={`of ${drivers.length} total`}                                                 color="#7c3aed" bg="#ede9fe"/>
        <KPICard icon={<Truck size={20}/>}       label="Vehicles In Use"    value={vehicles.filter(v=>v.status==='in-use').length} sub={`${vehicles.filter(v=>v.status==='available').length} available`}             color="#0d9488" bg="#ccfbf1"/>
        <KPICard icon={<ListChecks size={20}/>}  label="Total Trips"        value={trips.length} sub="all time in system"                                                                                              color="#16a34a" bg="#d1fae5"/>
        <KPICard icon={<AlertTriangle size={20}/>} label="Denied Invoices"  value={invoices.filter(i=>i.status==='denied').length} sub="require resubmission"                                                         color="#ef4444" bg="#fee2e2" alert={invoices.some(i=>i.status==='denied')}/>
        <KPICard icon={<Star size={20}/>}        label="Avg Driver Rating"  value={avgRating} sub="patient satisfaction"                                                                                               color="#f59e0b" bg="#fef3c7"/>
      </div>

      <div className={styles.body}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today's Trips</h2>
            <button className={styles.panelLink} onClick={()=>navigate('/admin/trips')}>View all <ArrowRight size={14}/></button>
          </div>
          <div className={styles.tripList}>
            {todayTrips.length===0 && <p style={{color:'#94a3b8',fontSize:'14px',padding:'12px 0'}}>No trips scheduled for today.</p>}
            {todayTrips.map(trip=>(
              <div key={trip.id} className={styles.tripRow}>
                <div className={styles.tripTime}>{trip.time}</div>
                <div className={styles.tripInfo}>
                  <p className={styles.tripPatient}>{trip.patient}</p>
                  <p className={styles.tripRoute}>{trip.pickup} → {trip.destination}</p>
                </div>
                <div className={styles.tripMeta}>
                  <span className={styles.tripDriver}>{trip.driver||'⚠ Unassigned'}</span>
                  <span className={styles.tripStatus} style={{color:statusColor[trip.status],background:statusBg[trip.status]}}>
                    {statusLabel[trip.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}><AlertTriangle size={16} color="#d97706"/> Alerts</h2>
            </div>
            <div className={styles.alertList}>
              {alerts.length===0 && <p style={{color:'#94a3b8',fontSize:'14px'}}>No alerts — everything looks good!</p>}
              {alerts.map((alert,i)=>(
                <div key={i} className={`${styles.alertItem} ${alert.type==='warn'?styles.alertWarn:styles.alertInfo}`}>
                  <p className={styles.alertText}>{alert.text}</p>
                  <button className={styles.alertAction} onClick={()=>navigate(alert.route)}>View →</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Driver Status</h2>
              <button className={styles.panelLink} onClick={()=>navigate('/admin/drivers')}>View all <ArrowRight size={14}/></button>
            </div>
            <div className={styles.driverList}>
              {drivers.slice(0,5).map(d=>(
                <div key={d.id} className={styles.driverRow}>
                  <div className={styles.driverAvatar} style={{background:d.status==='on-duty'?'#1e6fa8':d.status==='suspended'?'#ef4444':'#94a3b8'}}>{d.photo}</div>
                  <div className={styles.driverInfo}>
                    <p className={styles.driverName}>{d.name}</p>
                    <p className={styles.driverVehicle}>{d.vehicle||'No vehicle'}</p>
                  </div>
                  <span className={`${styles.driverStatus} ${styles['dStatus_'+d.status.replace('-','_')]}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ icon, label, value, sub, color, bg, alert }) {
  return (
    <div className={`${styles.kpi} ${alert?styles.kpiAlert:''}`}>
      <div className={styles.kpiIcon} style={{background:bg,color}}>{icon}</div>
      <div>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiLabel}>{label}</p>
        <p className={styles.kpiSub}>{sub}</p>
      </div>
    </div>
  )
}
