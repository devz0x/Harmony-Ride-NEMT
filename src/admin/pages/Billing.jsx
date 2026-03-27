import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  DollarSign, CheckCircle, Clock, XCircle, FileDown, Eye,
  RefreshCw, Send, X, Printer, Plus, Trash2, Edit, Zap,
  AlertCircle, Info,
} from 'lucide-react'
import { useInvoices, useTrips, db, nextId } from '../../lib/useData'
import {
  calculateTripCost, tripToLineItem, getTimeCategory,
  getServiceName, rateLabel, RATES,
} from '../../lib/billingEngine'
import styles from './Billing.module.css'

const statusColor = { paid:'#16a34a', submitted:'#1e6fa8', pending:'#d97706', denied:'#ef4444' }
const statusBg    = { paid:'#d1fae5', submitted:'#dbeeff', pending:'#fef3c7', denied:'#fee2e2' }
const statusLabel = { paid:'Paid',    submitted:'Submitted', pending:'Pending', denied:'Denied' }

function fmt(n) { return `$${Number(n).toFixed(2)}` }
const EMPTY_LINE = { service:'', description:'', qty:1, rate:0, amount:0 }

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Billing() {
  const { invoices, loading, refresh } = useInvoices()
  const [filter, setFilter]         = useState('all')
  const [preview, setPreview]       = useState(null)
  const [modal, setModal]           = useState(null)   // null | 'create' | invoice obj
  const [denyModal, setDenyModal]   = useState(null)
  const [genModal, setGenModal]     = useState(false)  // Generate from Trips
  const [printInvoice, setPrintInvoice] = useState(null)

  const filtered = filter === 'all' ? invoices : invoices.filter(r => r.status === filter)

  const totals = {
    paid:      invoices.filter(r => r.status === 'paid').reduce((s,r) => s + r.lineItems.reduce((a,l) => a+l.amount,0), 0),
    pending:   invoices.filter(r => ['pending','submitted'].includes(r.status)).reduce((s,r) => s + r.lineItems.reduce((a,l) => a+l.amount,0), 0),
    denied:    invoices.filter(r => r.status === 'denied').length,
    collected: invoices.length ? Math.round((invoices.filter(r => r.status === 'paid').length / invoices.length) * 100) : 0,
  }

  async function submitInvoice(inv) {
    await db.invoices.update(inv.id, { status: 'submitted' })
    refresh()
  }

  async function resubmitInvoice(inv) {
    await db.invoices.update(inv.id, { status: 'submitted', denial_reason: null })
    refresh()
  }

  async function markPaid(inv) {
    await db.invoices.update(inv.id, { status: 'paid', paid_date: new Date().toISOString().slice(0,10) })
    refresh()
  }

  async function deleteInvoice(inv) {
    if (!window.confirm(`Delete ${inv.id}? This cannot be undone.`)) return
    await db.invoices.delete(inv.id)
    refresh()
  }

  function handlePrint(inv) {
    setPrintInvoice(inv)
    setTimeout(() => {
      window.print()
      setTimeout(() => setPrintInvoice(null), 1000)
    }, 250)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Billing & Invoices</h1>
          <p className={styles.sub}>
            {invoices.length} invoices · {invoices.filter(r=>r.status==='denied').length} denied · Net 15 terms
          </p>
        </div>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className={styles.genBtn} onClick={() => setGenModal(true)}>
            <Zap size={15}/> Generate from Trips
          </button>
          <button className={styles.newBtn} onClick={() => setModal('create')}>
            <Send size={15}/> New Invoice
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className={styles.summary}>
        <SummaryCard icon={<DollarSign size={20}/>} label="Collected"      value={fmt(totals.paid)}       color="#16a34a" bg="#d1fae5" border="#bbf7d0"/>
        <SummaryCard icon={<Clock size={20}/>}      label="Outstanding"    value={fmt(totals.pending)}    color="#d97706" bg="#fef3c7" border="#fde68a"/>
        <SummaryCard icon={<XCircle size={20}/>}    label="Denied Claims"  value={totals.denied}           color="#ef4444" bg="#fee2e2" border="#fecaca"/>
        <SummaryCard icon={<CheckCircle size={20}/>} label="Collection Rate" value={`${totals.collected}%`} color="#1e6fa8" bg="#dbeeff" border="#a8d4f5"/>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabs}>
        {['all','paid','submitted','pending','denied'].map(s => (
          <button key={s} className={`${styles.tab} ${filter===s ? styles.tabActive:''}`} onClick={() => setFilter(s)}>
            {s==='all' ? 'All' : statusLabel[s]}
            <span className={styles.tabCount}>{s==='all' ? invoices.length : invoices.filter(r=>r.status===s).length}</span>
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice #</th><th>Bill To</th><th>Invoice Date</th>
              <th>Due Date</th><th>Line Items</th><th>Total</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{textAlign:'center',padding:'32px',color:'#64748b'}}>Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:'center',padding:'24px',color:'#94a3b8',fontSize:'14px'}}>No invoices match this filter.</td></tr>
            )}
            {filtered.map(inv => {
              const total = inv.lineItems.reduce((s,l) => s+l.amount, 0)
              return (
                <tr key={inv.id} className={styles.row}>
                  <td className={styles.invoiceId}>{inv.id}</td>
                  <td className={styles.billTo}>{inv.billTo}</td>
                  <td className={styles.cell}>{fmtDateShort(inv.invoiceDate)}</td>
                  <td className={styles.cell}>{fmtDateShort(inv.dueDate)}</td>
                  <td className={styles.cell}>{inv.lineItems.length} trips</td>
                  <td className={styles.amount}>{fmt(total)}</td>
                  <td>
                    <span className={styles.status} style={{color:statusColor[inv.status],background:statusBg[inv.status]}}>
                      {statusLabel[inv.status]}
                    </span>
                    {inv.denialReason && <p className={styles.denialNote}>{inv.denialReason}</p>}
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.actionBtn} title="Preview"   onClick={() => setPreview(inv)}><Eye size={15}/></button>
                    <button className={styles.actionBtn} title="Edit"      onClick={() => setModal(inv)}><Edit size={15}/></button>
                    <button className={styles.actionBtn} title="Download PDF" onClick={() => handlePrint(inv)}><FileDown size={15}/></button>
                    {inv.status==='denied'    && <button className={styles.resubmitBtn} onClick={() => resubmitInvoice(inv)}><RefreshCw size={13}/> Resubmit</button>}
                    {inv.status==='pending'   && <button className={styles.submitBtn}   onClick={() => submitInvoice(inv)}><Send size={13}/> Submit</button>}
                    {inv.status==='submitted' && <button className={styles.submitBtn}   onClick={() => markPaid(inv)}><CheckCircle size={13}/> Mark Paid</button>}
                    {inv.status==='submitted' && <button className={styles.denyBtn}     onClick={() => setDenyModal(inv)}><XCircle size={13}/> Deny</button>}
                    <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Delete" onClick={() => deleteInvoice(inv)}><Trash2 size={15}/></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Rate Reference Card */}
      <RateReferenceCard />

      {/* Modals */}
      {preview   && <InvoicePreview invoice={preview} onClose={() => setPreview(null)} onPrint={handlePrint}/>}
      {modal     && <InvoiceModal   invoices={invoices} invoice={modal==='create' ? null : modal} onClose={() => setModal(null)} refresh={refresh}/>}
      {denyModal && <DenyModal      invoice={denyModal} onClose={() => setDenyModal(null)} refresh={refresh}/>}
      {genModal  && <GenerateModal  invoices={invoices} onClose={() => setGenModal(false)} refresh={refresh}/>}

      {/* Print Portal — isolated so @media print can target only this */}
      {printInvoice && createPortal(
        <div id="invoice-print-root">
          <InvoiceDocument invoice={printInvoice}/>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color, bg, border }) {
  return (
    <div className={styles.summaryCard} style={{borderColor:border}}>
      <div className={styles.summaryIcon} style={{background:bg,color}}>{icon}</div>
      <div><p className={styles.summaryValue}>{value}</p><p className={styles.summaryLabel}>{label}</p></div>
    </div>
  )
}

// ── Rate Reference Card ───────────────────────────────────────────────────────

function RateReferenceCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.rateCard}>
      <button className={styles.rateCardToggle} onClick={() => setOpen(o => !o)}>
        <Info size={14}/>
        <span>Billing Rate Reference (HarmonyRides_Billing_Rules_v1)</span>
        <span style={{marginLeft:'auto',fontSize:'11px',color:'#94a3b8'}}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className={styles.rateCardBody}>
          <div className={styles.rateGrid}>
            {[
              { mode:'Wheelchair / Ambulatory', std:`$90 pickup + $4.00/mi`, ah:`$125 pickup + $6.50/mi` },
              { mode:'Stretcher / Bariatric',    std:`$300 pickup + $9.50/mi`, ah:`$350 pickup + $9.50/mi` },
            ].map(r => (
              <div key={r.mode} className={styles.rateRow}>
                <span className={styles.rateMode}>{r.mode}</span>
                <span className={styles.rateStd}>Standard: {r.std}</span>
                <span className={styles.rateAh}>After-Hours: {r.ah}</span>
              </div>
            ))}
          </div>
          <div className={styles.rateExtras}>
            <span>Rush Fee (&lt;24h): $50 (W/A) · $100 (S/B)</span>
            <span>Wait Fee: $50/hr standard (&gt;40 mi) · $75/hr after-hours</span>
            <span>Attendant (stretcher): $25 std · $35 AH</span>
            <span>Late cancellation: 50% (dialysis exempt)</span>
            <span>Standard hours: Mon–Fri 8:00 AM – 3:59 PM (not holidays)</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generate Invoice from Trips Modal ────────────────────────────────────────

function GenerateModal({ invoices, onClose, refresh }) {
  const { trips, loading: tripsLoading } = useTrips()
  const today  = new Date().toISOString().slice(0,10)
  const from30 = new Date(Date.now() - 30*86400000).toISOString().slice(0,10)

  const [billTo,      setBillTo]      = useState('')
  const [billAddr,    setBillAddr]    = useState('')
  const [dateFrom,    setDateFrom]    = useState(from30)
  const [dateTo,      setDateTo]      = useState(today)
  const [filterPat,   setFilterPat]   = useState('')
  const [loadedTrips, setLoadedTrips] = useState(null)
  const [mileages,    setMileages]    = useState({})   // trip.id → miles
  const [extras,      setExtras]      = useState({})   // trip.id → { is_rush, wait_minutes, attendant }
  const [saving,      setSaving]      = useState(false)

  // Only completed trips within date range
  function loadTrips() {
    let pool = trips.filter(t =>
      t.status === 'completed' &&
      t.date >= dateFrom &&
      t.date <= dateTo
    )
    if (filterPat.trim()) {
      pool = pool.filter(t => t.patient?.toLowerCase().includes(filterPat.toLowerCase()))
    }
    pool = pool.sort((a,b) => a.date.localeCompare(b.date) || (a.patient||'').localeCompare(b.patient||''))
    setLoadedTrips(pool)
    // Initialize mileages from existing trip.mileage
    const m = {}
    const e = {}
    pool.forEach(t => {
      m[t.id] = t.mileage ? String(t.mileage) : ''
      e[t.id] = { is_rush: t.is_rush||false, wait_minutes: t.wait_minutes||0, additional_attendant: t.additional_attendant||false }
    })
    setMileages(m)
    setExtras(e)
  }

  function getLineItems() {
    if (!loadedTrips) return []
    return loadedTrips.map((t, i) => {
      const miles = parseFloat(mileages[t.id]) || 0
      const ext   = extras[t.id] || {}
      return tripToLineItem({ ...t, ...ext }, i+1, miles)
    })
  }

  const lineItems = getLineItems()
  const grandTotal = lineItems.reduce((s,l) => s+l.amount, 0)

  async function handleCreate() {
    if (!billTo || lineItems.length === 0) return
    setSaving(true)
    const due15 = new Date(Date.now()+15*86400000).toISOString().slice(0,10)
    const id    = nextId('INV-', invoices)

    await db.invoices.create({
      id,
      bill_to:         billTo,
      bill_to_address: billAddr,
      invoice_date:    today,
      due_date:        due15,
      payment_terms:   'Net 15',
      status:          'pending',
    })

    await db.lineItems.createMany(lineItems.map(l => ({
      invoice_id:  id,
      num:         l.num,
      date:        l.date,
      service:     l.service,
      description: l.description,
      qty:         l.qty,
      rate:        l.rate,
      amount:      l.amount,
    })))

    setSaving(false)
    refresh()
    onClose()
  }

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{...box, maxWidth:'900px'}}>
        <div style={mHead}>
          <h2 style={mTitle}><Zap size={16} style={{marginRight:6,color:'#d97706'}}/> Generate Invoice from Completed Trips</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <div style={{...mBody, gap:'16px'}}>

          {/* Header fields */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <F label="Bill To *">
              <input style={inp} required value={billTo} onChange={e=>setBillTo(e.target.value)} placeholder="Mary Immaculate Health Care Services"/>
            </F>
            <F label="Date Range">
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <input style={{...inp,flex:1}} type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
                <span style={{color:'#94a3b8',fontSize:'12px'}}>to</span>
                <input style={{...inp,flex:1}} type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}/>
              </div>
            </F>
          </div>
          <F label="Billing Address">
            <textarea style={{...inp,height:'56px',resize:'vertical'}} value={billAddr} onChange={e=>setBillAddr(e.target.value)} placeholder={'172 Lawrence St\nLawrence, MA 01841'}/>
          </F>
          <div style={{display:'flex',gap:'10px',alignItems:'flex-end'}}>
            <F label="Filter by Patient" style={{flex:1}}>
              <input style={inp} value={filterPat} onChange={e=>setFilterPat(e.target.value)} placeholder="Leave blank for all patients"/>
            </F>
            <button style={{...btnPri,padding:'10px 20px',whiteSpace:'nowrap',flexShrink:0}} onClick={loadTrips} disabled={tripsLoading}>
              {tripsLoading ? 'Loading…' : 'Load Trips'}
            </button>
          </div>

          {/* Trip table */}
          {loadedTrips !== null && (
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>
              {loadedTrips.length === 0 ? (
                <div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'14px'}}>
                  <AlertCircle size={16} style={{marginBottom:6,display:'block',margin:'0 auto 6px'}}/>
                  No completed trips found in this range.
                </div>
              ) : (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 100px 68px 84px 84px',gap:'6px',marginBottom:'6px',padding:'0 4px'}}>
                    {['Date','Patient','Pickup → Destination','Transport','Miles','Extras','Amount'].map((h,i) =>
                      <span key={i} style={{fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</span>
                    )}
                  </div>
                  <div style={{maxHeight:'320px',overflowY:'auto',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                    {loadedTrips.map((t, idx) => {
                      const miles   = parseFloat(mileages[t.id]) || 0
                      const ext     = extras[t.id] || {}
                      const cat     = getTimeCategory(t.date, t.time) || 'after_hours'
                      const result  = calculateTripCost({ ...t, ...ext }, miles)
                      const isAH    = cat === 'after_hours'
                      return (
                        <div key={t.id} style={{
                          display:'grid',gridTemplateColumns:'70px 1fr 1fr 100px 68px 84px 84px',
                          gap:'6px',padding:'8px 4px',alignItems:'center',
                          borderBottom: idx < loadedTrips.length-1 ? '1px solid #f1f5f9' : 'none',
                          background: idx%2===0 ? 'white' : '#fafbfc',
                        }}>
                          <span style={{fontSize:'12px',color:'#334155'}}>{fmtDateShort(t.date)}</span>
                          <div>
                            <span style={{fontSize:'12px',fontWeight:600,color:'#0f172a'}}>{t.patient}</span>
                            {isAH && <span style={{fontSize:'10px',background:'#fef3c7',color:'#d97706',padding:'1px 5px',borderRadius:'4px',marginLeft:'4px',fontWeight:700}}>AH</span>}
                          </div>
                          <span style={{fontSize:'11px',color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {t.pickup} → {t.destination}
                          </span>
                          <span style={{fontSize:'11px',color:'#475569',textTransform:'capitalize'}}>{t.transport}</span>
                          <input
                            style={{...inp,fontSize:'12px',padding:'5px 7px',textAlign:'right'}}
                            type="number" min="0" step="0.1"
                            value={mileages[t.id] || ''}
                            onChange={e => setMileages(m => ({...m,[t.id]:e.target.value}))}
                            placeholder="0.0"
                            title="Enter mileage for this trip"
                          />
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                            <label style={{fontSize:'10px',display:'flex',alignItems:'center',gap:'3px',cursor:'pointer'}}>
                              <input type="checkbox" style={{width:'11px',height:'11px'}} checked={ext.is_rush||false}
                                onChange={e => setExtras(x => ({...x,[t.id]:{...x[t.id],is_rush:e.target.checked}}))}/>
                              Rush
                            </label>
                            <label style={{fontSize:'10px',display:'flex',alignItems:'center',gap:'3px',cursor:'pointer'}}>
                              <input type="checkbox" style={{width:'11px',height:'11px'}} checked={ext.additional_attendant||false}
                                onChange={e => setExtras(x => ({...x,[t.id]:{...x[t.id],additional_attendant:e.target.checked}}))}/>
                              Att.
                            </label>
                          </div>
                          <span style={{fontSize:'13px',fontWeight:700,color:'#0f172a',textAlign:'right'}}>{fmt(result.total)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'10px',marginTop:'2px',borderTop:'2px solid #0c2d5a'}}>
                    <span style={{fontSize:'13px',color:'#475569'}}>{loadedTrips.length} trips · Enter mileage for each trip to calculate amounts</span>
                    <span style={{fontSize:'18px',fontWeight:900,color:'#0c2d5a'}}>Total: {fmt(grandTotal)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={mFoot}>
            <button style={btnSec} onClick={onClose}>Cancel</button>
            <button
              style={btnPri}
              disabled={saving || !billTo || !loadedTrips || loadedTrips.length===0}
              onClick={handleCreate}
            >
              {saving ? 'Creating…' : `Create Invoice (${loadedTrips?.length||0} trips)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── New / Edit Invoice Modal ──────────────────────────────────────────────────

function InvoiceModal({ invoices, invoice, onClose, refresh }) {
  const isNew = !invoice
  const today = new Date().toISOString().slice(0,10)
  const due15 = new Date(Date.now()+15*86400000).toISOString().slice(0,10)

  const [header, setHeader] = useState(() => isNew
    ? { bill_to:'', bill_to_address:'', invoice_date:today, due_date:due15, payment_terms:'Net 15', status:'pending' }
    : { bill_to:invoice.billTo, bill_to_address:invoice.billToAddress||'', invoice_date:invoice.invoiceDate, due_date:invoice.dueDate, payment_terms:invoice.paymentTerms||'Net 15', status:invoice.status }
  )
  const [lines, setLines] = useState(() => isNew
    ? [{ ...EMPTY_LINE }]
    : invoice.lineItems.map(l => ({ service:l.service, description:l.description, qty:l.qty, rate:l.rate, amount:l.amount }))
  )
  const [saving, setSaving] = useState(false)
  const setH = (k,v) => setHeader(h => ({...h,[k]:v}))

  const addLine    = () => setLines(l => [...l, {...EMPTY_LINE}])
  const removeLine = i  => setLines(l => l.filter((_,idx)=>idx!==i))
  const setLine    = (i,k,v) => setLines(l => l.map((row,idx) => {
    if (idx!==i) return row
    const updated = {...row,[k]:v}
    if (k==='qty'||k==='rate') updated.amount = parseFloat(updated.qty||0)*parseFloat(updated.rate||0)
    return updated
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!header.bill_to) return
    setSaving(true)
    const lineRows = lines.filter(l=>l.service||l.description).map((l,i) => ({
      num: i+1, date: header.invoice_date,
      service: l.service, description: l.description,
      qty: parseFloat(l.qty)||1, rate: parseFloat(l.rate)||0, amount: parseFloat(l.amount)||0,
    }))
    if (isNew) {
      const id = nextId('INV-', invoices)
      await db.invoices.create({...header, id})
      if (lineRows.length) await db.lineItems.createMany(lineRows.map(r=>({...r,invoice_id:id})))
    } else {
      await db.invoices.update(invoice.id, header)
      await db.lineItems.deleteByInvoice(invoice.id)
      if (lineRows.length) await db.lineItems.createMany(lineRows.map(r=>({...r,invoice_id:invoice.id})))
    }
    setSaving(false); refresh(); onClose()
  }

  const total = lines.reduce((s,l) => s+parseFloat(l.amount||0), 0)

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...box,maxWidth:'820px'}}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'New Invoice' : `Edit ${invoice.id}`}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={handleSubmit}>
          <Row2>
            <F label="Bill To *">
              <input style={inp} required value={header.bill_to} onChange={e=>setH('bill_to',e.target.value)} placeholder="Healthcare org or facility"/>
            </F>
            <F label="Status">
              <select style={inp} value={header.status} onChange={e=>setH('status',e.target.value)}>
                {['pending','submitted','paid','denied'].map(s=><option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </F>
          </Row2>
          <F label="Billing Address">
            <textarea style={{...inp,height:'64px',resize:'vertical'}} value={header.bill_to_address} onChange={e=>setH('bill_to_address',e.target.value)} placeholder={'172 Lawrence St\nLawrence, MA 01841\nUnited States'}/>
          </F>
          <Row2>
            <F label="Invoice Date"><input style={inp} type="date" value={header.invoice_date} onChange={e=>setH('invoice_date',e.target.value)}/></F>
            <F label="Due Date"><input style={inp} type="date" value={header.due_date} onChange={e=>setH('due_date',e.target.value)}/></F>
          </Row2>

          {/* Line items */}
          <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <label style={{fontSize:'11px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}}>Line Items</label>
              <button type="button" style={{...btnSec,fontSize:'12px',padding:'5px 10px',display:'flex',alignItems:'center',gap:'4px'}} onClick={addLine}>
                <Plus size={12}/> Add Line
              </button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 3fr 52px 76px 76px 28px',gap:'6px',marginBottom:'4px',padding:'0 2px'}}>
              {['Service','Description','Qty','Rate','Amount',''].map((h,i)=>
                <span key={i} style={{fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase'}}>{h}</span>
              )}
            </div>
            {lines.map((line,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 3fr 52px 76px 76px 28px',gap:'6px',marginBottom:'6px',alignItems:'center'}}>
                <input style={{...inp,fontSize:'13px'}} value={line.service}     onChange={e=>setLine(i,'service',e.target.value)}     placeholder="Wheelchair Transportation"/>
                <input style={{...inp,fontSize:'13px'}} value={line.description} onChange={e=>setLine(i,'description',e.target.value)} placeholder="Service for PATIENT on MM/DD"/>
                <input style={{...inp,fontSize:'13px'}} type="number" min="0" step="0.5" value={line.qty} onChange={e=>setLine(i,'qty',e.target.value)}/>
                <input style={{...inp,fontSize:'13px'}} type="number" min="0" step="0.01" value={line.rate} onChange={e=>setLine(i,'rate',e.target.value)}/>
                <input style={{...inp,fontSize:'13px',background:'#f8fafc'}} readOnly value={parseFloat(line.amount||0).toFixed(2)}/>
                <button type="button" style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'2px'}} onClick={()=>removeLine(i)}><Trash2 size={14}/></button>
              </div>
            ))}
            <div style={{textAlign:'right',fontSize:'15px',fontWeight:700,color:'#0f172a',paddingTop:'8px',borderTop:'2px solid #0c2d5a'}}>
              Total: {fmt(total)}
            </div>
          </div>

          <div style={mFoot}>
            <button type="button" style={btnSec} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPri} disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create Invoice' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Deny Modal ────────────────────────────────────────────────────────────────

function DenyModal({ invoice, onClose, refresh }) {
  const [reason, setReason] = useState(invoice.denialReason || '')
  const [saving, setSaving] = useState(false)

  async function handleDeny() {
    if (!reason.trim()) return
    setSaving(true)
    await db.invoices.update(invoice.id, { status:'denied', denial_reason:reason.trim() })
    setSaving(false); refresh(); onClose()
  }

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...box,maxWidth:'440px'}}>
        <div style={mHead}>
          <h2 style={mTitle}>Mark {invoice.id} as Denied</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <div style={mBody}>
          <p style={{fontSize:'13px',color:'#64748b',margin:0}}>Billed to: <strong>{invoice.billTo}</strong></p>
          <F label="Denial Reason *">
            <textarea style={{...inp,height:'80px',resize:'vertical'}} required
              placeholder="e.g. Missing prior authorization, duplicate claim…"
              value={reason} onChange={e=>setReason(e.target.value)}/>
          </F>
          <div style={mFoot}>
            <button style={btnSec} onClick={onClose}>Cancel</button>
            <button style={{...btnPri,background:'#ef4444'}} disabled={saving||!reason.trim()} onClick={handleDeny}>
              {saving ? 'Saving…' : 'Mark Denied'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────

function InvoicePreview({ invoice, onClose, onPrint }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalToolbar}>
          <span className={styles.modalToolbarTitle}>{invoice.id} — Preview</span>
          <div className={styles.modalToolbarActions}>
            <button className={styles.printBtn} onClick={() => window.print()}>
              <Printer size={15}/> Print
            </button>
            <button className={styles.downloadPdfBtn} onClick={() => onPrint(invoice)}>
              <FileDown size={15}/> Download PDF
            </button>
            <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
          </div>
        </div>
        <div className={styles.doc}>
          <InvoiceDocument invoice={invoice}/>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Document (shared between preview and print portal) ────────────────

function InvoiceDocument({ invoice }) {
  const total = invoice.lineItems.reduce((s,l) => s+l.amount, 0)
  return (
    <>
      {/* Header: company left · INVOICE right */}
      <div className={styles.docHeader}>
        <div className={styles.docCompany}>
          <div className={styles.docLogo}>
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="11" fill="#0d9488"/>
              <ellipse cx="18" cy="24" rx="8" ry="5.5" stroke="white" strokeWidth="2.5" fill="none"/>
              <ellipse cx="30" cy="24" rx="8" ry="5.5" stroke="white" strokeWidth="2.5" fill="none"/>
              <rect x="22.5" y="20" width="3" height="8" rx="1" fill="white"/>
              <rect x="20" y="22.5" width="8" height="3" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.docCompanyName}>Harmony Rides Transportation LLC</h2>
            <p className={styles.docCompanyInfo}>92 White St, Haverhill, MA 01830</p>
            <p className={styles.docCompanyInfo}>+1 (978) 225-0802 · infoharmonyrides@gmail.com</p>
          </div>
        </div>
        <h1 className={styles.docInvoiceTitle}>INVOICE</h1>
      </div>

      {/* Bill To + Invoice Details */}
      <div className={styles.docInfoRow}>
        <div className={styles.docInfoBox}>
          <p className={styles.docInfoBoxLabel}>Bill to</p>
          <p className={styles.docInfoBoxName}>{invoice.billTo}</p>
          {invoice.billToAddress && <p className={styles.docInfoBoxAddr}>{invoice.billToAddress}</p>}
        </div>
        <div className={styles.docInfoBox}>
          <p className={styles.docInfoBoxLabel}>Invoice details</p>
          <table className={styles.docDetailsTable}>
            <tbody>
              <tr><td className={styles.docDetailKey}>Invoice no.</td><td className={styles.docDetailVal}>{invoice.id}</td></tr>
              <tr><td className={styles.docDetailKey}>Terms</td>      <td className={styles.docDetailVal}>{invoice.paymentTerms||'Net 15'}</td></tr>
              <tr><td className={styles.docDetailKey}>Invoice date</td><td className={styles.docDetailVal}>{fmtDateShort(invoice.invoiceDate)}</td></tr>
              <tr><td className={styles.docDetailKey}>Due date</td>   <td className={styles.docDetailVal}>{fmtDateShort(invoice.dueDate)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Services table */}
      <table className={styles.docTable}>
        <thead>
          <tr>
            <th className={styles.docTh} style={{width:'28px'}}>#</th>
            <th className={styles.docTh} style={{width:'80px'}}>Date</th>
            <th className={styles.docTh} style={{width:'180px'}}>Product or service</th>
            <th className={styles.docTh}>Description</th>
            <th className={styles.docTh} style={{width:'38px',textAlign:'right'}}>Qty</th>
            <th className={styles.docTh} style={{width:'76px',textAlign:'right'}}>Rate</th>
            <th className={styles.docTh} style={{width:'80px',textAlign:'right'}}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item,i) => (
            <tr key={i} className={styles.docRow}>
              <td className={styles.docTd}>{item.num}</td>
              <td className={styles.docTd}>{fmtDateShort(item.date)}</td>
              <td className={`${styles.docTd} ${styles.docTdService}`}>{item.service}</td>
              <td className={styles.docTd}>{item.description}</td>
              <td className={styles.docTd} style={{textAlign:'right'}}>{item.qty}</td>
              <td className={styles.docTd} style={{textAlign:'right'}}>{fmt(item.rate)}</td>
              <td className={styles.docTd} style={{textAlign:'right',fontWeight:700}}>{fmt(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Status banners */}
      {invoice.status==='denied' && <div className={styles.docDenied}><XCircle size={16}/> Denied — {invoice.denialReason}</div>}
      {invoice.status==='paid'   && <div className={styles.docPaid}><CheckCircle size={16}/> Paid on {fmtDate(invoice.paidDate)}</div>}

      {/* Ways to pay footer */}
      <div className={styles.docWaysToPay}>
        <div className={styles.docWaysLeft}>
          <span className={styles.docWaysLabel}>Ways to pay</span>
          <div className={styles.docPayBadges}>
            <span className={styles.docPayBadge} style={{background:'#1a1f71',color:'white'}}>VISA</span>
            <span className={styles.docPayBadge} style={{background:'#eb001b',color:'white'}}>MC</span>
            <span className={styles.docPayBadge} style={{background:'#f79e1b',color:'white'}}>DISC</span>
            <span className={styles.docPayBadge} style={{background:'#016fd0',color:'white'}}>AMEX</span>
            <span className={styles.docPayBadge} style={{background:'#e8f0fe',color:'#1a1f71',border:'1px solid #c5d0f0'}}>Bank</span>
            <span className={styles.docPayBadge} style={{background:'#003087',color:'white'}}>PayPal</span>
            <span className={styles.docPayBadge} style={{background:'#008cff',color:'white'}}>Venmo</span>
          </div>
        </div>
        <div className={styles.docWaysRight}>
          <span className={styles.docWaysTotal}>Total &nbsp;{fmt(total)}</span>
        </div>
      </div>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '—'
  const [y,m,d] = str.split('-')
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`
}

function fmtDateShort(str) {
  if (!str) return '—'
  const [y,m,d] = str.split('-')
  return `${m}/${d}/${y}`
}

// ── Inline style constants ────────────────────────────────────────────────────

const overlay = {position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}
const box     = {background:'#fff',borderRadius:'12px',width:'100%',maxWidth:'600px',maxHeight:'94vh',overflow:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.3)',display:'flex',flexDirection:'column'}
const mHead   = {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:'1px solid #e2e8f0',flexShrink:0}
const mTitle  = {fontSize:'16px',fontWeight:700,color:'#0f172a',margin:0,display:'flex',alignItems:'center'}
const mClose  = {background:'none',border:'none',cursor:'pointer',color:'#64748b',display:'flex',padding:'4px'}
const mBody   = {padding:'20px 24px',display:'flex',flexDirection:'column',gap:'12px',overflowY:'auto'}
const mFoot   = {display:'flex',gap:'10px',justifyContent:'flex-end',paddingTop:'8px'}
const inp     = {width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'14px',fontFamily:'inherit',color:'#0f172a',background:'#fff',boxSizing:'border-box'}
const btnPri  = {padding:'9px 20px',borderRadius:'8px',border:'none',background:'linear-gradient(135deg,#1e6fa8,#0c2d5a)',color:'white',cursor:'pointer',fontFamily:'inherit',fontSize:'14px',fontWeight:600}
const btnSec  = {padding:'9px 16px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontFamily:'inherit',fontSize:'14px',color:'#334155'}

function F({label,children}){
  return <div><label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#64748b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>{children}</div>
}
function Row2({children}){
  return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>{children}</div>
}
