import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, FileText, Upload, User, Calendar, BarChart3, Menu, X, Bell, ChevronDown, CheckCircle2 } from 'lucide-react'
import JotformSection from './JotformSection'
import DocumentUploadSection from './DocumentUploadSection'
import LoanOfficerCard from './LoanOfficerCard'
import ProfileSection from './ProfileSection'
import ScheduleSection from './ScheduleSection'
import ProgressTracker from './ProgressTracker'
import ApplicationSubmission from './ApplicationSubmission'
import AssistantChat from '../AssistantChat'
import { supabase } from '../../supabaseClient'

export default function BorrowerDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [documents, setDocuments] = useState([])
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    fetchDocuments()
    fetchApplicationStatus()
    fetchUserProfile()
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setUserProfile(data)
    }
  }

  const fetchDocuments = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)

    if (!error && data) {
      setDocuments(data)
    }
  }

  const fetchApplicationStatus = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('application_status')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setApplicationStatus(data)
    }
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      // Force navigation to landing page
      window.location.href = '/'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'forms', label: 'Application Forms', icon: FileText },
    { id: 'documents', label: 'Upload Documents', icon: Upload },
    { id: 'submit', label: 'Submit Application', icon: CheckCircle2 },
    { id: 'schedule', label: 'Schedule Meeting', icon: Calendar },
    { id: 'contact', label: 'Loan Officer', icon: User },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const getCompletionPercentage = () => {
    const totalSteps = 3
    let completed = 0
    
    if (documents.length > 0) completed++
    if (documents.filter(doc => doc.status === 'approved').length > 5) completed++
    if (applicationStatus) completed++
    
    return Math.round((completed / totalSteps) * 100)
  }

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    }
    return 'U'
  }

  const getUserName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    }
    return 'User'
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 border-r border-gray-200/50 flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">SBA Portal</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Section - Sticky at Bottom */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {getUserInitials()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-32">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-white/20 flex-shrink-0 z-40">
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="ml-4 text-xl font-bold text-gray-900">
                  {activeTab === 'overview' ? 'Dashboard Overview' : 
                   activeTab === 'forms' ? 'Application Forms' :
                   activeTab === 'documents' ? 'Upload Documents' :
                   activeTab === 'submit' ? 'Submit Application' :
                   activeTab === 'schedule' ? 'Schedule Meeting' :
                   activeTab === 'contact' ? 'Your Loan Officer' :
                   'Profile Settings'}
                </h2>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto overflow-x-hidden">
          {activeTab === 'overview' && (
            <OverviewSection 
              documents={documents}
              applicationStatus={applicationStatus}
              completionPercentage={getCompletionPercentage()}
            />
          )}
          {activeTab === 'forms' && <JotformSection />}
          {activeTab === 'documents' && (
            <DocumentUploadSection 
              documents={documents} 
              onDocumentUploaded={fetchDocuments}
              userProfile={userProfile}
            />
          )}
          {activeTab === 'submit' && (
            <ApplicationSubmission 
              documents={documents}
              userProfile={userProfile}
              onApplicationSubmitted={() => {
                fetchApplicationStatus()
                setActiveTab('overview')
              }}
            />
          )}
          {activeTab === 'schedule' && <ScheduleSection />}
          {activeTab === 'contact' && <LoanOfficerCard />}
          {activeTab === 'profile' && (
            <ProfileSection 
              userProfile={userProfile}
              onProfileUpdated={fetchUserProfile}
            />
          )}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* AI Assistant Chat */}
      <AssistantChat />
    </div>
  )
}

function OverviewSection({ documents, applicationStatus, completionPercentage }) {
  const stats = [
    {
      name: 'Application Progress',
      value: `${completionPercentage}%`,
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      name: 'Documents Uploaded',
      value: documents.length,
      icon: Upload,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      name: 'Documents Approved',
      value: documents.filter(doc => doc.status === 'approved').length,
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      name: 'Status',
      value: applicationStatus?.status || 'Started',
      icon: User,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Compact Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Loan Journey</h1>
          <p className="text-blue-100 mb-4 text-sm">
            Track your progress, upload documents, and stay connected with your loan officer.
          </p>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-bold">Progress: {completionPercentage}%</span>
            </div>
            <div className="flex-1 max-w-48 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.bgColor} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Application Progress */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Application Progress</h3>
        <ProgressTracker documents={documents} applicationStatus={applicationStatus} />
      </div>
    </div>
  )
}