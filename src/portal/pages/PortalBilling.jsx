import { useState } from 'react'
import { X, CreditCard, Phone, Mail, FileText } from 'lucide-react'
import { useMyPatient, useMyTrips, useSettings } from '../../lib/useData'
import styles from './PortalBilling.module.css'

const SELF_PAY_INSURANCES = ['Self-Pay']

const BASE_FEES = {
  ambulatory: 90,
  wheelchair: 90,
  stretcher:  350,
  bariatric:  350,
}

function calcEstimate(trip) {
  return BASE_FEES[trip.transport] ?? 90
}

function formatCurrency(n) {
  return '$' + n.toFixed(2)
}

export default function PortalBilling() {
  const { patient, loading: patientLoading } = useMyPatient()
  const { trips,   loading: tripsLoading   } = useMyTrips(patient?.name)
  const { settings, loading: settingsLoading } = useSettings()
  const [payModalOpen, setPayModalOpen] = useState(false)

  const isSelfPay = patient && SELF_PAY_INSURANCES.includes(patient.insurance)

  const completedTrips = trips.filter(t => t.status === 'completed')
  const totalEstimate  = completedTrips.reduce((sum, t) => sum + calcEstimate(t), 0)

  if (patientLoading || settingsLoading) {
    return <div className={styles.loading}>Loading billing information…</div>
  }

  if (!patient) {
    return (
      <div className={styles.loading}>
        Unable to load your patient record. Please contact us at{' '}
        <a href="tel:+19782250802">(978) 225-0802</a>.
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Billing</h1>
        <p className={styles.sub}>Your insurance and payment information</p>
      </div>

      {/* Insurance Info Card */}
      <div className={styles.insuranceCard}>
        <div className={styles.insuranceTop}>
          <div>
            <p className={styles.insuranceLabel}>Your Coverage</p>
            <p className={styles.insurancePlan}>{patient.insurance}</p>
          </div>
          {isSelfPay ? (
            <span className={styles.selfPayBadge}>Self-Pay Patient</span>
          ) : (
            <span className={styles.coveredBadge}>Insurance Covered</span>
          )}
        </div>
        {patient.memberId && (
          <div className={styles.memberRow}>
            <span className={styles.memberLabel}>Member ID</span>
            <span className={styles.memberId}>{patient.memberId}</span>
          </div>
        )}
      </div>

      {/* Self-Pay: Trip Costs */}
      {isSelfPay && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Trips &amp; Estimated Costs</h2>
          {tripsLoading ? (
            <p className={styles.loadingInner}>Loading trips…</p>
          ) : completedTrips.length === 0 ? (
            <div className={styles.noTrips}>No completed trips yet.</div>
          ) : (
            <div className={styles.costTable}>
              <div className={styles.costTableHeader}>
                <span>Date</span>
                <span>Route</span>
                <span>Transport</span>
                <span className={styles.alignRight}>Estimated Cost</span>
              </div>
              {completedTrips.map(trip => (
                <div key={trip.id} className={styles.costRow}>
                  <span className={styles.costDate}>{trip.date}</span>
                  <span className={styles.costRoute}>{trip.pickup} → {trip.destination}</span>
                  <span className={styles.costTransport}>{trip.transport}</span>
                  <span className={`${styles.costAmount} ${styles.alignRight}`}>
                    {formatCurrency(calcEstimate(trip))}
                  </span>
                </div>
              ))}
              <div className={styles.costFooter}>
                <p className={styles.costNote}>
                  * Final amount may vary based on mileage and additional services.
                </p>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Estimated Balance</span>
                  <span className={styles.totalAmount}>{formatCurrency(totalEstimate)}</span>
                </div>
              </div>
            </div>
          )}

          {completedTrips.length > 0 && (
            <button className={styles.payNowBtn} onClick={() => setPayModalOpen(true)}>
              <CreditCard size={18} />
              Pay Now — {formatCurrency(totalEstimate)}
            </button>
          )}
        </div>
      )}

      {/* Insurance Patients: Contact Billing */}
      {!isSelfPay && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Billing Information</h2>
          <div className={styles.insuranceBillingCard}>
            <p className={styles.insuredNote}>
              Your trips are billed directly to your insurance provider ({patient.insurance}).
              You should not receive a bill for covered services.
            </p>
            <p className={styles.insuredNote}>
              Questions about your billing? Contact our billing team:
            </p>
            <div className={styles.contactItems}>
              <a href="mailto:infoharmonyrides@gmail.com" className={styles.contactItem}>
                <Mail size={16} /> infoharmonyrides@gmail.com
              </a>
              <a href="tel:+19782250802" className={styles.contactItem}>
                <Phone size={16} /> (978) 225-0802
              </a>
            </div>
            <button
              className={styles.statementBtn}
              onClick={() => {
                window.location.href = `mailto:infoharmonyrides@gmail.com?subject=Itemized Statement Request&body=Hello, I would like to request an itemized statement for my transportation services.%0A%0APatient Name: ${patient.name}%0AMember ID: ${patient.memberId || 'N/A'}%0AInsurance: ${patient.insurance}`
              }}
            >
              <FileText size={16} />
              Request Itemized Statement
            </button>
          </div>
        </div>
      )}

      {/* Pay Now Modal */}
      {payModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setPayModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Pay Your Balance</h2>
              <button className={styles.modalClose} onClick={() => setPayModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalAmount}>
              <span className={styles.modalAmountLabel}>Total Estimated Amount</span>
              <span className={styles.modalAmountValue}>{formatCurrency(totalEstimate)}</span>
            </div>

            <div className={styles.paymentOptions}>
              {settings?.payment_link ? (
                <a
                  href={settings.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.payCardBtn}
                >
                  <CreditCard size={20} />
                  Pay with Card / PayPal
                </a>
              ) : (
                <div className={styles.payComingSoon}>
                  <p>Online payments coming soon.</p>
                  <p>Please call to pay: <a href="tel:+19782250802">(978) 225-0802</a></p>
                </div>
              )}
            </div>

            <div className={styles.paymentIcons}>
              <span className={styles.cardBadge}>VISA</span>
              <span className={styles.cardBadge}>MC</span>
              <span className={styles.cardBadge}>DISC</span>
              <span className={styles.cardBadge}>AMEX</span>
            </div>

            <p className={styles.payReference}>
              When paying, please include your name and the dates of your trips as a reference.
            </p>

            <div className={styles.phonePayRow}>
              <Phone size={15} />
              Or pay by phone: <a href="tel:+19782250802">(978) 225-0802</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
