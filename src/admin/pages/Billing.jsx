import { useState } from 'react'
import { DollarSign, CheckCircle, Clock, XCircle, Download, Eye, RefreshCw, Send, X, Printer, Plus, Trash2, Edit } from 'lucide-react'
import { useInvoices, db, nextId } from '../../lib/useData'
import styles from './Billing.module.css'

const statusColor = { paid:'#16a34a',submitted:'#1e6fa8',pending:'#d97706',denied:'#ef4444' }
const statusBg    = { paid:'#d1fae5',submitted:'#dbeeff',pending:'#fef3c7',denied:'#fee2e2' }
const statusLabel = { paid:'Paid',submitted:'Submitted',pending:'Pending',denied:'Denied' }

function fmt(n) { return `$${Number(n).toFixed(2)}` }

const EMPTY_LINE = { service:'',description:'',qty:1,rate:0,amount:0 }

export default function Billing() {
  const { invoices, loading, refresh } = useInvoices()
  const [filter, setFilter]     = useState('all')
  const [preview, setPreview]   = useState(null)
  const [modal, setModal]       = useState(null)  // null | 'create' | invoice obj (edit)
  const [denyModal, setDenyModal] = useState(null) // invoice to deny

  const filtered = filter === 'all' ? invoices : invoices.filter(r => r.status === filter)

  const totals = {
    paid:      invoices.filter(r => r.status === 'paid').reduce((s,r) => s + r.lineItems.reduce((a,l) => a+l.amount, 0), 0),
    pending:   invoices.filter(r => ['pending','submitted'].includes(r.status)).reduce((s,r) => s + r.lineItems.reduce((a,l) => a+l.amount, 0), 0),
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
    await db.invoices.delete(inv.id) // line items cascade via FK
    refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Billing & Invoices</h1>
          <p className={styles.sub}>{invoices.length} invoices · {invoices.filter(r => r.status === 'denied').length} denied · Net 15 terms</p>
        </div>
        <button className={styles.newBtn} onClick={() => setModal('create')}><Send size={15}/> New Invoice</button>
      </div>

      <div className={styles.summary}>
        <SummaryCard icon={<DollarSign size={20}/>} label="Collected"       value={fmt(totals.paid)}       color="#16a34a" bg="#d1fae5" border="#bbf7d0"/>
        <SummaryCard icon={<Clock size={20}/>}       label="Outstanding"    value={fmt(totals.pending)}    color="#d97706" bg="#fef3c7" border="#fde68a"/>
        <SummaryCard icon={<XCircle size={20}/>}     label="Denied Claims"  value={totals.denied}           color="#ef4444" bg="#fee2e2" border="#fecaca"/>
        <SummaryCard icon={<CheckCircle size={20}/>} label="Collection Rate" value={`${totals.collected}%`} color="#1e6fa8" bg="#dbeeff" border="#a8d4f5"/>
      </div>

      <div className={styles.tabs}>
        {['all','paid','submitted','pending','denied'].map(s => (
          <button key={s} className={`${styles.tab} ${filter === s ? styles.tabActive : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : statusLabel[s]}
            <span className={styles.tabCount}>{s === 'all' ? invoices.length : invoices.filter(r => r.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Invoice #</th><th>Bill To</th><th>Invoice Date</th><th>Due Date</th><th>Line Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
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
                  <td className={styles.cell}>{inv.invoiceDate}</td>
                  <td className={styles.cell}>{inv.dueDate}</td>
                  <td className={styles.cell}>{inv.lineItems.length} items</td>
                  <td className={styles.amount}>{fmt(total)}</td>
                  <td>
                    <span className={styles.status} style={{color:statusColor[inv.status],background:statusBg[inv.status]}}>{statusLabel[inv.status]}</span>
                    {inv.denialReason && <p className={styles.denialNote}>{inv.denialReason}</p>}
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.actionBtn} title="Preview"      onClick={() => setPreview(inv)}><Eye size={15}/></button>
                    <button className={styles.actionBtn} title="Edit"         onClick={() => setModal(inv)}><Edit size={15}/></button>
                    {inv.status === 'denied'    && <button className={styles.resubmitBtn} onClick={() => resubmitInvoice(inv)}><RefreshCw size={13}/> Resubmit</button>}
                    {inv.status === 'pending'   && <button className={styles.submitBtn}   onClick={() => submitInvoice(inv)}><Send size={13}/> Submit</button>}
                    {inv.status === 'submitted' && <button className={styles.submitBtn}   onClick={() => markPaid(inv)}><CheckCircle size={13}/> Paid</button>}
                    {inv.status === 'submitted' && <button className={styles.denyBtn}     onClick={() => setDenyModal(inv)}><XCircle size={13}/> Deny</button>}
                    <button className={styles.downloadBtn} title="Print" onClick={() => { setPreview(inv); setTimeout(() => window.print(), 400) }}><Download size={15}/></button>
                    <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Delete" onClick={() => deleteInvoice(inv)}><Trash2 size={15}/></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {preview    && <InvoicePreview invoice={preview} onClose={() => setPreview(null)}/>}
      {modal      && <InvoiceModal invoices={invoices} invoice={modal === 'create' ? null : modal} onClose={() => setModal(null)} refresh={refresh}/>}
      {denyModal  && <DenyModal    invoice={denyModal} onClose={() => setDenyModal(null)} refresh={refresh}/>}
    </div>
  )
}

function SummaryCard({ icon, label, value, color, bg, border }) {
  return (
    <div className={styles.summaryCard} style={{borderColor:border}}>
      <div className={styles.summaryIcon} style={{background:bg,color}}>{icon}</div>
      <div><p className={styles.summaryValue}>{value}</p><p className={styles.summaryLabel}>{label}</p></div>
    </div>
  )
}

// ── New / Edit Invoice Modal ───────────────────────────────────────────────────

function InvoiceModal({ invoices, invoice, onClose, refresh }) {
  const isNew  = !invoice
  const today  = new Date().toISOString().slice(0,10)
  const due15  = new Date(Date.now()+15*86400000).toISOString().slice(0,10)

  const [header, setHeader] = useState(() => isNew
    ? { bill_to:'', invoice_date:today, due_date:due15, payment_terms:'Net 15', status:'pending' }
    : { bill_to: invoice.billTo, invoice_date: invoice.invoiceDate, due_date: invoice.dueDate, payment_terms: invoice.paymentTerms || 'Net 15', status: invoice.status }
  )
  const [lines, setLines] = useState(() => isNew
    ? [{ ...EMPTY_LINE }]
    : invoice.lineItems.map(l => ({ service:l.service, description:l.description, qty:l.qty, rate:l.rate, amount:l.amount }))
  )
  const [saving, setSaving] = useState(false)
  const setH = (k,v) => setHeader(h => ({...h,[k]:v}))

  const addLine    = () => setLines(l => [...l, { ...EMPTY_LINE }])
  const removeLine = (i) => setLines(l => l.filter((_,idx) => idx !== i))
  const setLine    = (i,k,v) => setLines(l => l.map((row,idx) => {
    if (idx !== i) return row
    const updated = { ...row, [k]:v }
    if (k === 'qty' || k === 'rate') updated.amount = parseFloat(updated.qty||0) * parseFloat(updated.rate||0)
    return updated
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!header.bill_to) return
    setSaving(true)
    const lineRows = lines.filter(l => l.service).map((l,i) => ({
      invoice_id: isNew ? null : invoice.id, // filled below for new
      num: i+1, date: header.invoice_date,
      service: l.service, description: l.description,
      qty: parseFloat(l.qty)||1, rate: parseFloat(l.rate)||0, amount: parseFloat(l.amount)||0,
    }))

    if (isNew) {
      const id = nextId('INV-', invoices)
      await db.invoices.create({ ...header, id })
      if (lineRows.length) await db.lineItems.createMany(lineRows.map(r => ({...r, invoice_id:id})))
    } else {
      await db.invoices.update(invoice.id, header)
      await db.lineItems.deleteByInvoice(invoice.id)
      if (lineRows.length) await db.lineItems.createMany(lineRows.map(r => ({...r, invoice_id:invoice.id})))
    }

    setSaving(false)
    refresh()
    onClose()
  }

  const total = lines.reduce((s,l) => s + parseFloat(l.amount||0), 0)

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{...box, maxWidth:'780px'}}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'New Invoice' : `Edit ${invoice.id}`}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={handleSubmit}>
          <Row2>
            <F label="Bill To *"><input style={inp} required value={header.bill_to} onChange={e => setH('bill_to',e.target.value)} placeholder="Healthcare org or facility"/></F>
            <F label="Status">
              <select style={inp} value={header.status} onChange={e => setH('status',e.target.value)}>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="paid">Paid</option>
                <option value="denied">Denied</option>
              </select>
            </F>
          </Row2>
          <Row2>
            <F label="Invoice Date"><input style={inp} type="date" value={header.invoice_date} onChange={e => setH('invoice_date',e.target.value)}/></F>
            <F label="Due Date"><input style={inp} type="date" value={header.due_date} onChange={e => setH('due_date',e.target.value)}/></F>
          </Row2>

          <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <label style={{fontSize:'11px',fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}}>Line Items</label>
              <button type="button" style={{...btnSec,fontSize:'12px',padding:'5px 10px',display:'flex',alignItems:'center',gap:'4px'}} onClick={addLine}><Plus size={12}/> Add Line</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 3fr 56px 72px 72px 32px',gap:'6px',marginBottom:'4px'}}>
              {['Service','Description','Qty','Rate','Amount',''].map((h,i) => <span key={i} style={{fontSize:'10px',fontWeight:600,color:'#94a3b8',textTransform:'uppercase'}}>{h}</span>)}
            </div>
            {lines.map((line,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 3fr 56px 72px 72px 32px',gap:'6px',marginBottom:'6px',alignItems:'center'}}>
                <input style={{...inp,fontSize:'13px'}} value={line.service}      onChange={e => setLine(i,'service',e.target.value)}     placeholder="Pick-Up Fee"/>
                <input style={{...inp,fontSize:'13px'}} value={line.description}  onChange={e => setLine(i,'description',e.target.value)} placeholder="Service description"/>
                <input style={{...inp,fontSize:'13px'}} type="number" min="0" step="0.5"  value={line.qty}  onChange={e => setLine(i,'qty',e.target.value)}/>
                <input style={{...inp,fontSize:'13px'}} type="number" min="0" step="0.01" value={line.rate} onChange={e => setLine(i,'rate',e.target.value)}/>
                <input style={{...inp,fontSize:'13px',background:'#f8fafc'}} readOnly value={parseFloat(line.amount||0).toFixed(2)}/>
                <button type="button" style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'4px'}} onClick={() => removeLine(i)}><Trash2 size={14}/></button>
              </div>
            ))}
            <div style={{textAlign:'right',fontSize:'15px',fontWeight:700,color:'#0f172a',paddingTop:'8px',borderTop:'1px solid #e2e8f0'}}>Total: {fmt(total)}</div>
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
    await db.invoices.update(invoice.id, { status: 'denied', denial_reason: reason.trim() })
    setSaving(false)
    refresh()
    onClose()
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{...box, maxWidth:'440px'}}>
        <div style={mHead}>
          <h2 style={mTitle}>Mark {invoice.id} as Denied</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <div style={mBody}>
          <p style={{fontSize:'13px',color:'#64748b',margin:0}}>
            Billed to: <strong>{invoice.billTo}</strong>
          </p>
          <F label="Denial Reason *">
            <textarea
              style={{...inp, height:'80px', resize:'vertical'}}
              required
              placeholder="e.g. Missing prior authorization, duplicate claim…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </F>
          <div style={mFoot}>
            <button style={btnSec} onClick={onClose}>Cancel</button>
            <button
              style={{...btnPri, background:'#ef4444'}}
              disabled={saving || !reason.trim()}
              onClick={handleDeny}
            >
              {saving ? 'Saving…' : 'Mark Denied'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────

function InvoicePreview({ invoice, onClose }) {
  const total = invoice.lineItems.reduce((s,l) => s+l.amount, 0)
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalToolbar}>
          <span className={styles.modalToolbarTitle}>{invoice.id} — Preview</span>
          <div className={styles.modalToolbarActions}>
            <button className={styles.printBtn} onClick={() => window.print()}><Printer size={15}/> Print</button>
            <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
          </div>
        </div>
        <div className={styles.doc}>
          <div className={styles.docHeader}>
            <div className={styles.docCompany}>
              <div className={styles.docLogo}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
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
                <p className={styles.docCompanyInfo}>+1 (978) 225-0802</p>
                <p className={styles.docCompanyInfo}>infoharmonyrides@gmail.com</p>
              </div>
            </div>
            <div className={styles.docInvoiceInfo}>
              <h1 className={styles.docInvoiceTitle}>INVOICE</h1>
              <table className={styles.docMetaTable}>
                <tbody>
                  <tr><td className={styles.docMetaLabel}>Invoice #:</td><td className={styles.docMetaValue}>{invoice.id}</td></tr>
                  <tr><td className={styles.docMetaLabel}>Date:</td>     <td className={styles.docMetaValue}>{fmtDate(invoice.invoiceDate)}</td></tr>
                  <tr><td className={styles.docMetaLabel}>Due Date:</td> <td className={styles.docMetaValue}>{fmtDate(invoice.dueDate)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.docBillTo}>
            <p className={styles.docBillToLabel}>BILL TO:</p>
            <p className={styles.docBillToName}>{invoice.billTo}</p>
          </div>
          <div className={styles.docSection}>
            <h3 className={styles.docSectionTitle}>SERVICES</h3>
            <table className={styles.docTable}>
              <thead>
                <tr>
                  <th className={styles.docTh} style={{width:'32px'}}>#</th>
                  <th className={styles.docTh} style={{width:'90px'}}>Date</th>
                  <th className={styles.docTh} style={{width:'180px'}}>Product or service</th>
                  <th className={styles.docTh}>Description</th>
                  <th className={styles.docTh} style={{width:'42px',textAlign:'right'}}>Qty</th>
                  <th className={styles.docTh} style={{width:'72px',textAlign:'right'}}>Rate</th>
                  <th className={styles.docTh} style={{width:'80px',textAlign:'right'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item,i) => (
                  <tr key={i} className={styles.docRow}>
                    <td className={styles.docTd}>{item.num}</td>
                    <td className={styles.docTd}>{fmtDateShort(item.date)}</td>
                    <td className={styles.docTd}>{item.service}</td>
                    <td className={styles.docTd}>{item.description}</td>
                    <td className={styles.docTd} style={{textAlign:'right'}}>{item.qty}</td>
                    <td className={styles.docTd} style={{textAlign:'right'}}>{fmt(item.rate)}</td>
                    <td className={styles.docTd} style={{textAlign:'right',fontWeight:600}}>{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.docTotal}>
            <div className={styles.docTotalRow}>
              <span className={styles.docTotalLabel}>Total Due:</span>
              <span className={styles.docTotalAmount}>{fmt(total)}</span>
            </div>
          </div>
          {invoice.status === 'denied' && <div className={styles.docDenied}><XCircle size={16}/> Denied — {invoice.denialReason}</div>}
          {invoice.status === 'paid'   && <div className={styles.docPaid}><CheckCircle size={16}/> Paid on {fmtDate(invoice.paidDate)}</div>}
          <div className={styles.docFooter}>
            <p>Payment Terms: {invoice.paymentTerms} &nbsp;|&nbsp; Thank you for your business!</p>
            <p>Questions? Contact us at infoharmonyrides@gmail.com &nbsp;|&nbsp; +1 (978) 225-0802</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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

const overlay = {position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}
const box     = {background:'#fff',borderRadius:'12px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflow:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.25)',display:'flex',flexDirection:'column'}
const mHead   = {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:'1px solid #e2e8f0',flexShrink:0}
const mTitle  = {fontSize:'16px',fontWeight:600,color:'#0f172a',margin:0}
const mClose  = {background:'none',border:'none',cursor:'pointer',color:'#64748b',display:'flex',padding:'4px'}
const mBody   = {padding:'20px 24px',display:'flex',flexDirection:'column',gap:'12px',overflowY:'auto'}
const mFoot   = {display:'flex',gap:'10px',justifyContent:'flex-end',paddingTop:'8px'}
const inp     = {width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'14px',fontFamily:'inherit',color:'#0f172a',background:'#fff',boxSizing:'border-box'}
const btnPri  = {padding:'9px 20px',borderRadius:'8px',border:'none',background:'#1e6fa8',color:'white',cursor:'pointer',fontFamily:'inherit',fontSize:'14px',fontWeight:500}
const btnSec  = {padding:'9px 16px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontFamily:'inherit',fontSize:'14px',color:'#334155'}
function F({label,children}){return <div><label style={{display:'block',fontSize:'11px',fontWeight:600,color:'#64748b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>{children}</div>}
function Row2({children}){return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>{children}</div>}
