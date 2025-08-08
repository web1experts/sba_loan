import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Users, FileText, Calendar, BarChart3, Menu, X, Bell, ChevronDown, UserPlus, Settings, Building2, Download, Eye, CheckCircle, XCircle, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import AssistantChat from './AssistantChat'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [data, setData] = useState({
    applications: [],
    borrowers: [],
    documents: [],
    referralLeads: [],
    meetings: [],
    teamMembers: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [applications, setApplications] = useState([])
  const [meetings, setMeetings] = useState([])

  useEffect(() => {
    fetchAllData()
    fetchApplications()
    fetchMeetings()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [applications, borrowers, documents, referralLeads, meetings, teamMembers] = await Promise.all([
        supabase.from('application_status').select('*, user_profiles(first_name, last_name, email, company)'),
        supabase.from('user_profiles').select('*').eq('role', 'borrower'),
        supabase.from('documents').select('*, user_profiles(first_name, last_name, email)'),
        supabase.from('referral_leads').select('*, user_profiles(first_name, last_name, email)'),
        supabase.from('meetings').select('*, user_profiles(first_name, last_name, email)'),
        supabase.from('team_members').select('*')
      ])

      setData({
        applications: applications.data || [],
        borrowers: borrowers.data || [],
        documents: documents.data || [],
        referralLeads: referralLeads.data || [],
        meetings: meetings.data || [],
        teamMembers: teamMembers.data || []
      })
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
        .select('*, user_profiles(first_name, last_name, email, company)')
      
      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, user_profiles(first_name, last_name, email)')
      
      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    }
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      window.location.href = '/'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'borrowers', label: 'Borrowers', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'referrals', label: 'Referral Pipeline', icon: Building2 },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'team', label: 'Team Members', icon: UserPlus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    }
    return 'AD'
  }

  const getUserName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    }
    return 'Administrator'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-lg font-bold text-white">Admin Portal</h1>
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

        {/* User Section - Sticky at Bottom */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
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
                   activeTab === 'applications' ? 'Application Management' :
                   activeTab === 'borrowers' ? 'Borrower Management' :
                   activeTab === 'documents' ? 'Document Management' :
                   activeTab === 'referrals' ? 'Referral Pipeline' :
                   activeTab === 'meetings' ? 'Meeting Management' :
                   activeTab === 'team' ? 'Team Member Management' :
                   'System Settings'}
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
          {activeTab === 'overview' && <OverviewSection data={data} />}
          {activeTab === 'applications' && <ApplicationsSection applications={data.applications} onRefresh={fetchAllData} />}
          {activeTab === 'borrowers' && <BorrowersSection borrowers={data.borrowers} />}
          {activeTab === 'documents' && <DocumentsSection documents={data.documents} onRefresh={fetchAllData} />}
          {activeTab === 'referrals' && <ReferralsSection referralLeads={data.referralLeads} onRefresh={fetchAllData} />}
          {activeTab === 'meetings' && <MeetingsSection meetings={data.meetings} />}
          {activeTab === 'team' && <TeamMembersSection teamMembers={data.teamMembers} onRefresh={fetchAllData} />}
          {activeTab === 'settings' && <SettingsSection />}
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

// Overview Section Component
function OverviewSection({ data }) {
  const stats = [
    {
      name: 'Total Applications',
      value: data.applications.length,
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      name: 'Active Borrowers',
      value: data.borrowers.length,
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      name: 'Documents Uploaded',
      value: data.documents.length,
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      name: 'Referral Leads',
      value: data.referralLeads.length,
      icon: Building2,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ]

  const recentApplications = data.applications.slice(0, 5)
  const upcomingMeetings = data.meetings.filter(m => new Date(m.meeting_date) >= new Date()).slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-200 mb-4 text-sm">
            Monitor and manage all aspects of the SBA loan application system.
          </p>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-bold">Applications: {data.applications.length}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-bold">Documents: {data.documents.length}</span>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Recent Applications</h3>
          </div>
          <div className="p-6">
            {recentApplications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {app.user_profiles?.first_name} {app.user_profiles?.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{app.user_profiles?.company}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Upcoming Meetings</h3>
          </div>
          <div className="p-6">
            {upcomingMeetings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming meetings</p>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {meeting.user_profiles?.first_name} {meeting.user_profiles?.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(meeting.meeting_date).toLocaleDateString()} at {meeting.meeting_time}
                      </p>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">{meeting.purpose}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Team Members Section Component
function TeamMembersSection({ teamMembers, onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    'Loan Officer',
    'Underwriter',
    'Support Specialist',
    'Manager',
    'Administrator'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          status: formData.status,
          created_by: user.id
        })

      if (error) {
        throw new Error(error.message)
      }

      setFormData({ full_name: '', email: '', role: '', status: 'active' })
      setShowAddForm(false)
      onRefresh()
      
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this team member?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      onRefresh()
    } catch (err) {
      alert('Error deleting team member: ' + err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
            <p className="text-gray-600">Manage your team and their roles</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl text-sm font-semibold hover:from-gray-800 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {teamMembers.length}
            </div>
            <div className="text-sm font-medium text-blue-800">Total Members</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {teamMembers.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm font-medium text-green-800">Active</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              {teamMembers.filter(m => m.status === 'inactive').length}
            </div>
            <div className="text-sm font-medium text-red-800">Inactive</div>
          </div>
        </div>
      </div>

      {/* Add Team Member Form */}
      {showAddForm && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Team Member</h3>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Team Member'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Team Members ({teamMembers.length})</h3>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first team member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

function ApplicationsSection({ applications, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_profiles?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateApplicationStatus = async (id, newStatus, newStage) => {
    try {
      const { error } = await supabase
        .from('application_status')
        .update({ 
          status: newStatus,
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw new Error(error.message)
      onRefresh()
    } catch (err) {
      alert('Error updating status: ' + err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header and Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Management</h2>
            <p className="text-gray-600">Review and manage loan applications</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by borrower name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="started">Started</option>
            <option value="documents_pending">Documents Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="funded">Funded</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Applications ({filteredApplications.length})</h3>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">No applications match your current filters.</p>
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
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {app.user_profiles?.first_name} {app.user_profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{app.user_profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.user_profiles?.company || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.stage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value, app.stage)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="started">Started</option>
                        <option value="documents_pending">Documents Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="funded">Funded</option>
                        <option value="declined">Declined</option>
                      </select>
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

function BorrowersSection({ borrowers }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBorrowers = borrowers.filter(borrower => {
    return !searchTerm || 
      borrower.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.company?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Borrower Management</h2>
            <p className="text-gray-600">View and manage registered borrowers</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search borrowers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Borrowers Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Borrowers ({filteredBorrowers.length})</h3>
        </div>

        {filteredBorrowers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowers found</h3>
            <p className="mt-1 text-sm text-gray-500">No borrowers match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {borrower.first_name?.[0]}{borrower.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {borrower.first_name} {borrower.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {borrower.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {borrower.company || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {borrower.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(borrower.created_at).toLocaleDateString()}
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

function DocumentsSection({ documents, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.doc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateDocumentStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw new Error(error.message)
      onRefresh()
    } catch (err) {
      alert('Error updating document status: ' + err.message)
    }
  }

  const downloadDocument = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('borrower-docs')
        .download(filePath)

      if (error) throw new Error(error.message)

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading document: ' + err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header and Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
            <p className="text-gray-600">Review and approve uploaded documents</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents or borrowers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="uploaded">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Documents ({filteredDocuments.length})</h3>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">No documents match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.file_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {doc.user_profiles?.first_name} {doc.user_profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{doc.user_profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.doc_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DocumentStatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {doc.status === 'uploaded' && (
                          <>
                            <button
                              onClick={() => updateDocumentStatus(doc.id, 'approved')}
                              className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors"
                              title="Approve document"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Reject document"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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

function ReferralsSection({ referralLeads, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredLeads = referralLeads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('referral_leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw new Error(error.message)
      onRefresh()
    } catch (err) {
      alert('Error updating lead status: ' + err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header and Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Referral Pipeline</h2>
            <p className="text-gray-600">Manage referral leads and track progress</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="funded">Funded</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Referral Leads ({filteredLeads.length})</h3>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">No leads match your current filters.</p>
          </div>
        ) : (
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
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Amount
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
                {filteredLeads.map((lead) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.user_profiles?.first_name} {lead.user_profiles?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.loan_amount || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ReferralStatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="funded">Funded</option>
                        <option value="declined">Declined</option>
                      </select>
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

function MeetingsSection({ meetings }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMeetings = meetings.filter(meeting => {
    return !searchTerm || 
      meeting.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const upcomingMeetings = filteredMeetings.filter(m => new Date(m.meeting_date) >= new Date())
  const pastMeetings = filteredMeetings.filter(m => new Date(m.meeting_date) < new Date())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meeting Management</h2>
            <p className="text-gray-600">View and manage scheduled meetings</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Upcoming Meetings ({upcomingMeetings.length})</h3>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming meetings</h3>
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
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meeting.user_profiles?.first_name} {meeting.user_profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{meeting.user_profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(meeting.meeting_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{meeting.meeting_time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.meeting_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MeetingStatusBadge status={meeting.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Past Meetings ({pastMeetings.length})</h3>
        </div>

        {pastMeetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No past meetings</h3>
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
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastMeetings.slice(0, 10).map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meeting.user_profiles?.first_name} {meeting.user_profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{meeting.user_profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(meeting.meeting_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{meeting.meeting_time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.meeting_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MeetingStatusBadge status={meeting.status} />
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

function SettingsSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
        <p className="text-gray-600 mb-6">Configure system preferences and integrations</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Notifications</h3>
            <p className="text-gray-600 mb-4">Configure email notification preferences</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Configure
            </button>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Integration Status</h3>
            <p className="text-gray-600 mb-4">Monitor system integrations</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              View Status
            </button>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600 mb-4">Manage user roles and permissions</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Manage Users
            </button>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Backup</h3>
            <p className="text-gray-600 mb-4">Configure automated backups</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Status Badge Components
function StatusBadge({ status }) {
  const statusConfig = {
    started: { color: 'bg-blue-100 text-blue-800', label: 'Started' },
    documents_pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Documents Pending' },
    under_review: { color: 'bg-purple-100 text-purple-800', label: 'Under Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    funded: { color: 'bg-green-100 text-green-800', label: 'Funded' },
    declined: { color: 'bg-red-100 text-red-800', label: 'Declined' }
  }

  const config = statusConfig[status] || statusConfig.started

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

function DocumentStatusBadge({ status }) {
  const statusConfig = {
    uploaded: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
  }

  const config = statusConfig[status] || statusConfig.uploaded

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

function ReferralStatusBadge({ status }) {
  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
    contacted: { color: 'bg-yellow-100 text-yellow-800', label: 'Contacted' },
    in_review: { color: 'bg-purple-100 text-purple-800', label: 'In Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    funded: { color: 'bg-green-100 text-green-800', label: 'Funded' },
    declined: { color: 'bg-red-100 text-red-800', label: 'Declined' }
  }

  const config = statusConfig[status] || statusConfig.new

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

function MeetingStatusBadge({ status }) {
  const statusConfig = {
    scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    rescheduled: { color: 'bg-yellow-100 text-yellow-800', label: 'Rescheduled' }
  }

  const config = statusConfig[status] || statusConfig.scheduled

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}