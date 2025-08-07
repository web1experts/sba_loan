import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ConnectionStatus from './components/ConnectionStatus'
import TestUserSetup from './components/TestUserSetup'
import SignUp from './components/auth/SignUp'
import Login from './components/auth/Login'
import AdminLogin from './components/auth/AdminLogin'
import BorrowerDashboard from './components/borrower/BorrowerDashboard'
import ReferralDashboard from './components/ReferralDashboard'
import AdminDashboard from './components/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <DashboardRedirect role={userRole} /> : <LandingPage />} />
        <Route path="/connection-status" element={<ConnectionStatus />} />
        <Route path="/setup-users" element={<TestUserSetup />} />
        <Route path="/borrower" element={user ? <DashboardRedirect role={userRole} /> : <SignUp />} />
        <Route path="/borrower/login" element={user ? <DashboardRedirect role={userRole} /> : <Login />} />

        {/* Protected Routes */}
        <Route 
          path="/borrower/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['borrower']}>
              <BorrowerDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/referral" 
          element={
            <ProtectedRoute allowedRoles={['referral']}>
              <ReferralDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// Helper component to redirect authenticated users to their dashboard
function DashboardRedirect({ role }: { role: string }) {
  if (role === 'borrower') {
    return <Navigate to="/borrower/dashboard" replace />
  } else if (role === 'referral') {
    return <Navigate to="/referral" replace />
  } else if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Navigate to="/" replace />
}

export default App