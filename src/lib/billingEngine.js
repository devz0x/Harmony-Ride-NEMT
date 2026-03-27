// ── HarmonyRides Billing Engine ──────────────────────────────────────────────
// Rules source: HarmonyRides_Billing_Rules_v1
// Three axes: Mode × Schedule × Extras

// ── Official Rate Tables ──────────────────────────────────────────────────────
// CRITICAL: Ambulatory uses identical rates to Wheelchair (per rules doc)

export const RATES = {
  wheelchair: {
    standard:    { pickup: 90.00,  mile: 4.00 },
    after_hours: { pickup: 125.00, mile: 6.50 },
  },
  ambulatory: {
    standard:    { pickup: 90.00,  mile: 4.00 },
    after_hours: { pickup: 125.00, mile: 6.50 },
  },
  stretcher: {
    standard:    { pickup: 300.00, mile: 9.50 },
    after_hours: { pickup: 350.00, mile: 9.50 },
  },
  bariatric: {
    standard:    { pickup: 300.00, mile: 9.50 },
    after_hours: { pickup: 350.00, mile: 9.50 },
  },
}

// Rush Fee: triggered when booking created <24h before scheduled PU
export const RUSH_FEES = {
  wheelchair: 50.00,
  ambulatory: 50.00,
  stretcher:  100.00,
  bariatric:  100.00,
}

// Driver Wait Fee (per hour, billed in whole-hour increments)
// Standard applies only when mileage > 40; After-Hours applies always
export const WAIT_RATES = {
  standard:    50.00,
  after_hours: 75.00,
}

// Additional Attendant (Stretcher/Bariatric only)
export const ATTENDANT_FEES = {
  standard:    25.00,
  after_hours: 35.00,
}

// ── US Federal Holidays ───────────────────────────────────────────────────────
function isUSFederalHoliday(dateStr) {
  const d   = new Date(dateStr + 'T12:00:00')
  const m   = d.getMonth() + 1  // 1-12
  const day = d.getDate()
  const dow = d.getDay()          // 0=Sun

  // Fixed-date holidays
  if (m === 1  && day === 1)  return true   // New Year's Day
  if (m === 6  && day === 19) return true   // Juneteenth
  if (m === 7  && day === 4)  return true   // Independence Day
  if (m === 11 && day === 11) return true   // Veterans Day
  if (m === 12 && day === 25) return true   // Christmas Day

  // Floating Monday holidays
  const weekOfMonth = Math.floor((day - 1) / 7)  // 0-indexed week
  if (m === 1  && dow === 1 && weekOfMonth === 2) return true  // MLK Jr. Day (3rd Mon Jan)
  if (m === 2  && dow === 1 && weekOfMonth === 2) return true  // Presidents' Day (3rd Mon Feb)
  if (m === 9  && dow === 1 && weekOfMonth === 0) return true  // Labor Day (1st Mon Sep)
  if (m === 10 && dow === 1 && weekOfMonth === 1) return true  // Columbus Day (2nd Mon Oct)

  // Memorial Day: last Monday of May (day > 24 guarantees it's the last)
  if (m === 5 && dow === 1 && day > 24) return true

  // Thanksgiving: 4th Thursday of November
  if (m === 11 && dow === 4 && weekOfMonth === 3) return true

  return false
}

// ── Schedule Classification ───────────────────────────────────────────────────
// Standard: Mon–Fri, 08:00–15:59 (scheduled PU time, NOT actual pickup)
// After-Hours: everything else (weekends, before 8 AM, 4 PM+, holidays)
// EDGE CASE: Will Call trips with 12:00 AM time → do NOT auto-classify as AH

export function getTimeCategory(dateStr, timeStr) {
  if (!dateStr || !timeStr) return 'after_hours'

  const d   = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()  // 0=Sun, 6=Sat

  if (dow === 0 || dow === 6) return 'after_hours'
  if (isUSFederalHoliday(dateStr)) return 'after_hours'

  // Parse time (supports "HH:MM", "H:MM AM/PM", "HH:MM:SS")
  const t = timeStr.trim()
  let hours = 0, minutes = 0

  const upper = t.toUpperCase()
  const parts = t.replace(/[APM]/gi, '').trim().split(':')
  hours   = parseInt(parts[0]) || 0
  minutes = parseInt(parts[1]) || 0

  if (upper.includes('PM') && hours !== 12) hours += 12
  if (upper.includes('AM') && hours === 12) hours = 0

  // Midnight "12:00 AM" / "00:00" on Will Call → treat as unknown, inherit Leg A
  if (hours === 0 && minutes === 0) return null  // caller handles

  const totalMins = hours * 60 + minutes
  return (totalMins >= 480 && totalMins < 960) ? 'standard' : 'after_hours'
}

// ── Human-readable service name ───────────────────────────────────────────────
export function getServiceName(transport) {
  const map = {
    wheelchair: 'Wheelchair Transportation',
    ambulatory: 'Ambulatory Transportation',
    stretcher:  'Stretcher Transportation',
    bariatric:  'Bariatric Transportation',
  }
  return map[(transport || 'ambulatory').toLowerCase()] || 'Transportation Service'
}

// ── Core Fare Calculator ──────────────────────────────────────────────────────
// Returns { total, breakdown, isCancellationPenalty }

export function calculateTripCost(trip, overrideMileage) {
  const mode    = (trip.transport || 'ambulatory').toLowerCase()
  const rates   = RATES[mode] || RATES.ambulatory
  const timeCat = getTimeCategory(trip.date, trip.time) || 'after_hours'
  const r       = rates[timeCat]

  const mileage    = parseFloat(overrideMileage ?? trip.mileage ?? 0) || 0
  const pickupFee  = r.pickup
  const mileageFee = Math.round(mileage * r.mile * 100) / 100

  // Rush fee
  let rushFee = 0
  if (trip.is_rush) {
    rushFee = RUSH_FEES[mode] || 50
  }

  // Wait fee (whole-hour increments)
  let waitFee = 0
  const waitMins = parseInt(trip.wait_minutes) || 0
  if (waitMins > 0) {
    const waitHours = Math.ceil(waitMins / 60)
    if (timeCat === 'after_hours' || mileage > 40) {
      waitFee = waitHours * WAIT_RATES[timeCat]
    }
  }

  // Additional attendant (Stretcher/Bariatric only)
  let attendantFee = 0
  if (trip.additional_attendant && (mode === 'stretcher' || mode === 'bariatric')) {
    attendantFee = ATTENDANT_FEES[timeCat]
  }

  // Cleaning fee
  const cleaningFee = parseFloat(trip.cleaning_fee) || 0

  let total = pickupFee + mileageFee + rushFee + waitFee + attendantFee + cleaningFee

  // Late-cancellation penalty (50% — dialysis patients are exempt)
  let isCancellationPenalty = false
  if (trip.status === 'cancelled' && !trip.is_dialysis) {
    total = Math.round(total * 0.5 * 100) / 100
    isCancellationPenalty = true
  } else {
    total = Math.round(total * 100) / 100
  }

  return {
    total,
    isCancellationPenalty,
    breakdown: {
      timeCat,
      mode,
      pickupFee,
      mileageFee,
      rushFee,
      waitFee,
      attendantFee,
      cleaningFee,
      mileage,
      ratePerMile: r.mile,
    },
  }
}

// ── Convert trip → invoice line item ─────────────────────────────────────────
export function tripToLineItem(trip, lineNum, overrideMileage) {
  const mode      = (trip.transport || 'ambulatory').toLowerCase()
  const timeCat   = getTimeCategory(trip.date, trip.time) || 'after_hours'
  const result    = calculateTripCost(trip, overrideMileage)
  const service   = getServiceName(mode)
  const ahSuffix  = timeCat === 'after_hours' ? ' (After-Hours)' : ''
  const miles     = parseFloat(overrideMileage ?? trip.mileage ?? 0) || 0

  const [, m, d]  = (trip.date || '----').split('-')
  const shortDate = trip.date ? `${m}/${d}` : ''

  return {
    num:         lineNum,
    date:        trip.date || '',
    service:     service + ahSuffix,
    description: `${service} service for ${(trip.patient || '').toUpperCase()} on ${shortDate}`,
    qty:         1,
    rate:        result.total,
    amount:      result.total,
    _mileage:    miles,
    _time_cat:   timeCat,
    _trip_id:    trip.id,
  }
}

// ── Rate summary string (for UI display) ─────────────────────────────────────
export function rateLabel(mode, timeCat) {
  const r = (RATES[mode] || RATES.ambulatory)[timeCat || 'standard']
  return `$${r.pickup} + $${r.mile}/mi`
}
