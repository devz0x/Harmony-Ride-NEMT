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
  address: '', npi: '', medicaid_id: '', medicare_id: '',
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

// ─── Mutations ───────────────────────────────────────────────────────────────

export const db = {
  trips: {
    create: (data) => supabase.from('trips').insert(data),
    update: (id, data) => supabase.from('trips').update(data).eq('id', id),
    delete: (id) => supabase.from('trips').delete().eq('id', id),
  },
  drivers: {
    create: (data) => supabase.from('drivers').insert(data),
    update: (id, data) => supabase.from('drivers').update(data).eq('id', id),
    delete: (id) => supabase.from('drivers').delete().eq('id', id),
  },
  patients: {
    create: (data) => supabase.from('patients').insert(data),
    update: (id, data) => supabase.from('patients').update(data).eq('id', id),
    delete: (id) => supabase.from('patients').delete().eq('id', id),
  },
  vehicles: {
    create: (data) => supabase.from('vehicles').insert(data),
    update: (id, data) => supabase.from('vehicles').update(data).eq('id', id),
    delete: (id) => supabase.from('vehicles').delete().eq('id', id),
  },
  invoices: {
    create: (data) => supabase.from('invoices').insert(data),
    update: (id, data) => supabase.from('invoices').update(data).eq('id', id),
    delete: (id) => supabase.from('invoices').delete().eq('id', id),
  },
  lineItems: {
    createMany: (rows) => supabase.from('invoice_line_items').insert(rows),
    deleteByInvoice: (invoiceId) => supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId),
  },
  settings: {
    upsert: (data) => supabase.from('settings').upsert({ ...data, id: 1 }),
  },
}

// ─── ID Helpers ──────────────────────────────────────────────────────────────

export const nextId = (prefix, list, pad = 0) => {
  const nums = list
    .map(r => parseInt(r.id.replace(/[^\d]/g, '')))
    .filter(n => !isNaN(n) && n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${pad ? String(next).padStart(pad, '0') : next}`
}
