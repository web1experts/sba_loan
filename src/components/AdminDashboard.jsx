import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Users, FileText, Calendar, BarChart3, Menu, X, Bell, ChevronDown, CheckCircle2, Eye, Download, User, Building, Mail, Phone, Clock, MapPin } from 'lucide-react'
import { supabase } from '../supabaseClient'
import AssistantChat from './AssistantChat'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [applications, setApplications] = useState([])
  const [borrowers, setBorrowers] = useState([])
  const [meetings, setMeetings] = useState([])
  const [referralLeads, setReferralLeads] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchApplications(),
        fetchBorrowers(),
        fetchMeetings(),
        fetchReferralLeads()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('application_status')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .eq('status', 'documents_pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchBorrowers = async () => {
    try {
      const { data, error } = await supabase
        .from('application_status')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setBorrowers(data || [])
    } catch (error) {
      console.error('Error fetching borrowers:', error)
    }
  }

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .order('meeting_date', { ascending: false })

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    }
  }

  const fetchReferralLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_leads')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReferralLeads(data || [])
    } catch (error) {
      console.error('Error fetching referral leads:', error)
    }
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      window.location.href = '/'
    }
  }

  const handleApproveApplication = async (applicationId) => {
    try {
      const { error } = await supabase
        .from('application_status')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', applicationId)

      if (error) throw error
      
      await fetchAllData()
      alert('Application approved successfully!')
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Failed to approve application')
    }
  }

  const handleUpdateMeetingStatus = async (meetingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)

      if (error) throw error
      
      await fetchMeetings()
    } catch (error) {
      console.error('Error updating meeting status:', error)
      alert('Failed to update meeting status')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'borrowers', label: 'Borrower List', icon: Users },
    { id: 'meetings', label: 'Customer Scheduled Meetings', icon: Calendar },
    { id: 'referrals', label: 'Referral Leads', icon: Users }
  ]

  const stats = [
    {
      name: 'Pending Applications',
      value: applications.length,
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      name: 'Active Borrowers',
      value: borrowers.length,
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      name: 'Scheduled Meetings',
      value: meetings.filter(m => m.status === 'scheduled').length,
      icon: Calendar,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      name: 'Referral Leads',
      value: referralLeads.length,
      icon: Users,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 border-r border-gray-200/50 flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-700 to-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
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
                      ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg'
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

        {/* User Section */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500 truncate max-w-32">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

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

      {/* Main Content */}
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
                   activeTab === 'applications' ? 'Applications' :
                   activeTab === 'borrowers' ? 'Borrower List' :
                   activeTab === 'meetings' ? 'Meeting Management' :
                   'Referral Leads'}
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

        {/* Page Content */}
        <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewSection stats={stats} />
              )}
              {activeTab === 'applications' && (
                <ApplicationsSection 
                  applications={applications}
                  onApprove={handleApproveApplication}
                  selectedApplication={selectedApplication}
                  setSelectedApplication={setSelectedApplication}
                />
              )}
              {activeTab === 'borrowers' && (
                <BorrowersSection borrowers={borrowers} />
              )}
              {activeTab === 'meetings' && (
                <MeetingsSection 
                  meetings={meetings}
                  onUpdateStatus={handleUpdateMeetingStatus}
                />
              )}
              {activeTab === 'referrals' && (
                <ReferralLeadsSection referralLeads={referralLeads} />
              )}
            </>
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

function OverviewSection({ stats }) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-300 mb-4 text-sm">
            Manage loan applications, borrowers, and system operations.
          </p>
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
    </div>
  )
}

function ApplicationsSection({ applications, onApprove, selectedApplication, setSelectedApplication }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending applications</h3>
        <p className="mt-1 text-sm text-gray-500">Applications will appear here when submitted by borrowers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Applications ({applications.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {application.user_profiles?.first_name} {application.user_profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{application.user_profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.user_profiles?.company || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onApprove(application.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BorrowersSection({ borrowers }) {
  if (borrowers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No approved borrowers</h3>
        <p className="mt-1 text-sm text-gray-500">Approved borrowers will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Approved Borrowers ({borrowers.length})</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Borrower
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approved Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {borrowers.map((borrower) => (
              <tr key={borrower.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {borrower.user_profiles?.first_name} {borrower.user_profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{borrower.user_profiles?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {borrower.user_profiles?.company || 'Not specified'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {borrower.user_profiles?.phone || 'Not provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(borrower.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MeetingsSection({ meetings, onUpdateStatus }) {
  const [activeTab, setActiveTab] = useState('all')
  
  const callbackRequests = meetings.filter(m => m.meeting_type === 'callback')
  const inPersonMeetings = meetings.filter(m => m.meeting_type === 'in-person')
  
  const getFilteredMeetings = () => {
    switch(activeTab) {
      case 'callback':
        return callbackRequests
      case 'in-person':
        return inPersonMeetings
      default:
        return meetings
    }
  }
  
  const filteredMeetings = getFilteredMeetings()

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled meetings</h3>
        <p className="mt-1 text-sm text-gray-500">Meetings scheduled by borrowers will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meeting Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customer Scheduled Meetings ({meetings.length})</h3>
          <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('callback')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'callback'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Call Back Requests ({callbackRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('in-person')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'in-person'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In-Person Meetings ({inPersonMeetings.length})
            </button>
          </div>
        </div>
      
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'callback' ? 'callback requests' : activeTab === 'in-person' ? 'in-person meetings' : 'meetings'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'callback' ? 'Contact Info' : 'Date & Time'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          meeting.meeting_type === 'callback' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            meeting.meeting_type === 'callback' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {meeting.user_profiles?.first_name} {meeting.user_profiles?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{meeting.user_profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {meeting.meeting_type === 'callback' ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{meeting.contact_info}</div>
                          <div className="text-sm text-gray-500">Preferred: {meeting.meeting_time}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(meeting.meeting_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">{meeting.meeting_time}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {meeting.meeting_type === 'callback' && <Phone className="w-4 h-4 mr-1 text-green-600" />}
                        {meeting.meeting_type === 'in-person' && <MapPin className="w-4 h-4 mr-1 text-blue-600" />}
                        <span className="capitalize">
                          {meeting.meeting_type === 'callback' ? 'Call Back Request' : 'In-Person Meeting'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={meeting.notes}>
                        {meeting.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {meeting.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(meeting.id, 'completed')}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => onUpdateStatus(meeting.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ReferralLeadsSection({ referralLeads }) {
  if (referralLeads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No referral leads</h3>
        <p className="mt-1 text-sm text-gray-500">Referral leads will appear here when submitted.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Referral Leads ({referralLeads.length})</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loan Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referred By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {referralLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.business_name}</div>
                    <div className="text-sm text-gray-500">{lead.business_type}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.contact_name}</div>
                    <div className="text-sm text-gray-500">{lead.contact_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.loan_amount || 'Not specified'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {lead.user_profiles?.first_name} {lead.user_profiles?.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    lead.status === 'approved' ? 'bg-green-100 text-green-800' :
                    lead.status === 'funded' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}