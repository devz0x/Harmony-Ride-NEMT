import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'

// Landing page
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import WhyChooseUs from './components/WhyChooseUs'
import InsurancePartners from './components/InsurancePartners'
import Testimonials from './components/Testimonials'
import CoverageArea from './components/CoverageArea'
import BookingCTA from './components/BookingCTA'
import Footer from './components/Footer'
import BookingModal from './components/BookingModal'

// Admin
import AuthGuard from './admin/AuthGuard'
import Login from './admin/Login'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/pages/Dashboard'
import Trips from './admin/pages/Trips'
import Dispatch from './admin/pages/Dispatch'
import Patients from './admin/pages/Patients'
import Drivers from './admin/pages/Drivers'
import Fleet from './admin/pages/Fleet'
import Billing from './admin/pages/Billing'
import Settings from './admin/pages/Settings'

function LandingPage() {
  const [bookingOpen, setBookingOpen] = useState(false)
  return (
    <div style={{ overflowX: 'hidden' }}>
      <Navbar onBookNow={() => setBookingOpen(true)} />
      <Hero onBookNow={() => setBookingOpen(true)} />
      <StatsBar />
      <Services />
      <HowItWorks />
      <WhyChooseUs />
      <InsurancePartners />
      <Testimonials />
      <CoverageArea />
      <BookingCTA onBookNow={() => setBookingOpen(true)} />
      <Footer />
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="trips" element={<Trips />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="patients" element={<Patients />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
