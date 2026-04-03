import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ─── Column mappers (snake_case DB → camelCase JS) ───────────────────────────

const mapDriver = (r) => ({
  ...r,
  licenseExp: r.license_exp,
  joinDate:   r.join_date,
})

const mapPatient = (r) => ({
  ...r,
  memberId:   r.member_id,
  totalTrips: r.total_trips,
  lastTrip:   r.last_trip,
  conditions: r.conditions || [],
})

const mapVehicle = (r) => ({
  ...r,
  lastService: r.last_service,
  nextService: r.next_service,
  features:    r.features || [],
})

const mapTrip = (r) => ({
  ...r,
  returnTime: r.return_time,
  tripType:   r.type,
})

const mapInvoice = (r) => ({
  ...r,
  invoiceDate:   r.invoice_date,
  dueDate:       r.due_date,
  billTo:        r.bill_to,
  billToAddress: r.bill_to_address,
  paidDate:      r.paid_date,
  denialReason:  r.denial_reason,
  paymentTerms:  r.payment_terms,
  lineItems: (r.invoice_line_items || [])
    .sort((a, b) => a.num - b.num)
    .map(li => ({ ...li, num: li.num, date: li.date })),
})

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useDrivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('drivers').select('*').order('name')
      .then(({ data }) => { setDrivers((data || []).map(mapDriver)); setLoading(false) })
  }, [])
  useEffect(load, [load])
  return { drivers, loading, refresh: load }
}

export function usePatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('patients').select('*').order('name')
      .then(({ data }) => { setPatients((data || []).map(mapPatient)); setLoading(false) })
  }, [])
  useEffect(load, [load])
  return { patients, loading, refresh: load }
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('vehicles').select('*').order('id')
      .then(({ data }) => { setVehicles((data || []).map(mapVehicle)); setLoading(false) })
  }, [])
  useEffect(load, [load])
  return { vehicles, loading, refresh: load }
}

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('trips').select('*').order('date', { ascending: false })
      .then(({ data }) => { setTrips((data || []).map(mapTrip)); setLoading(false) })
  }, [])
  useEffect(load, [load])
  return { trips, loading, refresh: load }
}

export function useInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('invoices').select('*, invoice_line_items(*)').order('invoice_date', { ascending: false })
      .then(({ data }) => { setInvoices((data || []).map(mapInvoice)); setLoading(false) })
  }, [])
  useEffect(load, [load])
  return { invoices, loading, refresh: load }
}

const DEFAULT_SETTINGS = {
  id: 1,
  company_name: 'Harmony Rides Transportation LLC',
  operating_states: '',
  primary_phone: '', dispatch_phone: '',
  support_email: '', billing_email: '',
  address: '', npi: '', medicaid_id: '', medicare_id: '', payment_link: '',
  business_hours: {
    Monday:    { open: true,  start: '06:00', end: '22:00' },
    Tuesday:   { open: true,  start: '06:00', end: '22:00' },
    Wednesday: { open: true,  start: '06:00', end: '22:00' },
    Thursday:  { open: true,  start: '06:00', end: '22:00' },
    Friday:    { open: true,  start: '06:00', end: '22:00' },
    Saturday:  { open: true,  start: '08:00', end: '18:00' },
    Sunday:    { open: false, start: '08:00', end: '18:00' },
  },
  notifications: {
    new_trip: true, unassigned_warning: true, driver_late: true,
    no_show: true,  denial: true,             maintenance: true,
    license_expiry: true, daily_summary: false,
  },
  dispatch_rules: {
    pickup_buffer: 15, same_day_cutoff: '18:00',
    max_trips_per_driver: 10, auto_confirm_hours: 24,
    auto_assign_proximity: false, strict_transport_match: true,
    prefer_usual_driver: true,   allow_overtime: false,
  },
}

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        setSettings(data || DEFAULT_SETTINGS)
        setLoading(false)
      })
  }, [])
  useEffect(load, [load])
  return { settings, loading, refresh: load }
}

// ─── Activity Logging ────────────────────────────────────────────────────────

function logActivity(action, entityType, entityId, entityLabel, details) {
  supabase.from('activity_logs').insert({
    action,
    entity_type:  entityType  || null,
    entity_id:    entityId    || null,
    entity_label: entityLabel || null,
    details:      details     || null,
  }).then(({ error }) => {
    if (error) console.error('[log]', action, error.code, error.message)
    else console.log('[log] OK:', action)
  })
}

export function useActivityLogs(limit = 200) {
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(limit)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [limit])
  useEffect(load, [load])
  return { logs, loading, refresh: load }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

console.log('[useData] db module loaded — version 2')

export const db = {
  trips: {
    create: async (data) => {
      const res = await supabase.from('trips').insert(data)
      if (!res.error) logActivity('Trip Created', 'trip', data.id, data.patient, {
        date: data.date, time: data.time, pickup: data.pickup,
        destination: data.destination, transport: data.transport, status: data.status,
      })
      return res
    },
    update: async (id, data) => {
      const res = await supabase.from('trips').update(data).eq('id', id)
      if (!res.error) logActivity('Trip Updated', 'trip', id, data.patient || id, {
        ...(data.status    && { status: data.status }),
        ...(data.driver    && { driver: data.driver }),
        ...(data.vehicle   && { vehicle: data.vehicle }),
        ...(data.pickup    && { pickup: data.pickup }),
        ...(data.destination && { destination: data.destination }),
      })
      return res
    },
    delete: async (id) => {
      const res = await supabase.from('trips').delete().eq('id', id)
      if (!res.error) logActivity('Trip Deleted', 'trip', id, id)
      return res
    },
  },
  drivers: {
    create: async (data) => {
      const res = await supabase.from('drivers').insert(data)
      if (!res.error) logActivity('Driver Added', 'driver', data.id, data.name, {
        phone: data.phone, status: data.status, vehicle: data.vehicle,
      })
      return res
    },
    update: async (id, data) => {
      const res = await supabase.from('drivers').update(data).eq('id', id)
      if (!res.error) logActivity('Driver Updated', 'driver', id, data.name || id, {
        ...(data.status  && { status: data.status }),
        ...(data.vehicle && { vehicle: data.vehicle }),
        ...(data.rating  && { rating: data.rating }),
      })
      return res
    },
    delete: async (id) => {
      const res = await supabase.from('drivers').delete().eq('id', id)
      if (!res.error) logActivity('Driver Removed', 'driver', id, id)
      return res
    },
  },
  patients: {
    create: async (data) => {
      const res = await supabase.from('patients').insert(data)
      if (!res.error) logActivity('Patient Added', 'patient', data.id, data.name, {
        phone: data.phone, insurance: data.insurance, transport: data.transport,
      })
      return res
    },
    update: async (id, data) => {
      const res = await supabase.from('patients').update(data).eq('id', id)
      if (!res.error) logActivity('Patient Updated', 'patient', id, data.name || id, {
        ...(data.status    && { status: data.status }),
        ...(data.insurance && { insurance: data.insurance }),
        ...(data.transport && { transport: data.transport }),
      })
      return res
    },
    delete: async (id) => {
      const res = await supabase.from('patients').delete().eq('id', id)
      if (!res.error) logActivity('Patient Removed', 'patient', id, id)
      return res
    },
  },
  vehicles: {
    create: async (data) => {
      const res = await supabase.from('vehicles').insert(data)
      const label = [data.year, data.make].filter(Boolean).join(' ') || data.id
      if (!res.error) logActivity('Vehicle Added', 'vehicle', data.id, label, {
        type: data.type, plate: data.plate, status: data.status,
      })
      return res
    },
    update: async (id, data) => {
      const res = await supabase.from('vehicles').update(data).eq('id', id)
      const label = [data.year, data.make].filter(Boolean).join(' ') || id
      if (!res.error) logActivity('Vehicle Updated', 'vehicle', id, label, {
        ...(data.status      && { status: data.status }),
        ...(data.mileage     && { mileage: data.mileage }),
        ...(data.next_service && { next_service: data.next_service }),
      })
      return res
    },
    delete: async (id) => {
      const res = await supabase.from('vehicles').delete().eq('id', id)
      if (!res.error) logActivity('Vehicle Removed', 'vehicle', id, id)
      return res
    },
  },
  invoices: {
    create: async (data) => {
      const res = await supabase.from('invoices').insert(data)
      if (!res.error) logActivity('Invoice Created', 'invoice', data.id, data.bill_to || data.id, {
        date: data.invoice_date, status: data.status, terms: data.payment_terms,
      })
      return res
    },
    update: async (id, data) => {
      const res = await supabase.from('invoices').update(data).eq('id', id)
      if (!res.error) logActivity('Invoice Updated', 'invoice', id, data.bill_to || id, {
        ...(data.status        && { status: data.status }),
        ...(data.paid_date     && { paid_date: data.paid_date }),
        ...(data.denial_reason && { denial_reason: data.denial_reason }),
      })
      return res
    },
    delete: async (id) => {
      const res = await supabase.from('invoices').delete().eq('id', id)
      if (!res.error) logActivity('Invoice Deleted', 'invoice', id, id)
      return res
    },
  },
  lineItems: {
    createMany: (rows) => supabase.from('invoice_line_items').insert(rows),
    deleteByInvoice: (invoiceId) => supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId),
  },
  settings: {
    upsert: async (data) => {
      const res = await supabase.from('settings').upsert({ ...data, id: 1 })
      if (!res.error) logActivity('Settings Updated', 'settings', '1', 'System Settings', {
        company_name: data.company_name,
      })
      return res
    },
  },
}

export function useMyPatient() {
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('patients').select('*')
      .eq('portal_user_id', user.id).maybeSingle()
    setPatient(data ? mapPatient(data) : null)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { patient, loading, refresh: load }
}

export function useMyTrips(patientName) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    if (!patientName) { setLoading(false); return }
    setLoading(true)
    supabase.from('trips').select('*')
      .ilike('patient', patientName)
      .order('date', { ascending: false })
      .then(({ data }) => { setTrips((data || []).map(mapTrip)); setLoading(false) })
  }, [patientName])
  useEffect(load, [load])
  return { trips, loading, refresh: load }
}

// ─── ID Helpers ──────────────────────────────────────────────────────────────

export const nextId = (prefix, list, pad = 0) => {
  const nums = list
    .map(r => parseInt(r.id.replace(/[^\d]/g, '')))
    .filter(n => !isNaN(n) && n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${pad ? String(next).padStart(pad, '0') : next}`
}
