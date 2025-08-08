import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Plus, Users, FileText, Video, MessageCircle, Menu, X, Bell, ChevronDown, BarChart3, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import AssistantChat from './AssistantChat'

export default function ReferralDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [leads, setLeads] = useState([])
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    fetchLeads()
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

  const fetchLeads = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('referral_leads')
        .select('*')
        .eq('referral_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching leads:', error)
        return
      }

      if (data) {
        setLeads(data)
      }
    } catch (err) {
      console.error('Fetch leads error:', err)
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
    { id: 'leads', label: 'Lead Pipeline', icon: Users },
    { id: 'training', label: 'Training Library', icon: Video },
    { id: 'contact', label: 'Referral Partner Contact', icon: FileText },
  ]

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    }
    return 'RP'
  }

  const getUserName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    }
    return 'Referral Partner'
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 border-r border-gray-200/50 flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-green-600 to-emerald-600 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Referral Portal</h1>
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
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
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
                   activeTab === 'leads' ? 'Lead Pipeline' :
                   activeTab === 'training' ? 'Training Library' :
                   'Referral Partner Contact'}
                </h2>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full text-xs"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto overflow-x-hidden">
          {activeTab === 'overview' && (
            <OverviewSection leads={leads} />
          )}
          {activeTab === 'leads' && (
            <LeadPipeline 
              leads={leads} 
              showForm={showLeadForm}
              onToggleForm={setShowLeadForm}
              onLeadAdded={fetchLeads}
            />
          )}
          {activeTab === 'training' && <TrainingLibrary />}
          {activeTab === 'contact' && <ReferralPartnerContact />}
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

function OverviewSection({ leads }) {
  const totalLeads = leads.length
  const newLeads = leads.filter(lead => lead.status === 'new').length
  const fundedLeads = leads.filter(lead => lead.status === 'funded').length
  const approvedLeads = leads.filter(lead => lead.status === 'approved').length

  const stats = [
    {
      name: 'Total Leads',
      value: totalLeads,
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      name: 'New Leads',
      value: newLeads,
      icon: Plus,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      name: 'Approved',
      value: approvedLeads,
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      name: 'Funded',
      value: fundedLeads,
      icon: DollarSign,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ]

  const recentLeads = leads.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Referral Dashboard</h1>
          <p className="text-green-100 mb-4 text-sm">
            Track your leads, access training resources, and grow your referral business.
          </p>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-bold">Total Leads: {totalLeads}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="font-bold">Funded: {fundedLeads}</span>
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

      {/* Recent Leads */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recent Leads</h3>
          <p className="text-gray-600">Your latest referral submissions</p>
        </div>

        <div className="p-6">
          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by submitting your first lead.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{lead.business_name}</h4>
                      <p className="text-sm text-gray-600">{lead.contact_name} • {lead.loan_amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={lead.status} />
                    <span className="text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LeadPipeline({ leads, showForm, onToggleForm, onLeadAdded }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    loan_amount: '',
    business_type: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate required fields
      if (!formData.business_name || !formData.contact_name || !formData.contact_email) {
        throw new Error('Please fill in all required fields')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.contact_email)) {
        throw new Error('Please enter a valid email address')
      }

      console.log('Submitting lead with data:', {
        ...formData,
        referral_user_id: user.id
      })

      const { data, error } = await supabase
        .from('referral_leads')
        .insert({
          referral_user_id: user.id,
          business_name: formData.business_name.trim(),
          contact_name: formData.contact_name.trim(),
          contact_email: formData.contact_email.trim().toLowerCase(),
          contact_phone: formData.contact_phone.trim(),
          loan_amount: formData.loan_amount.trim(),
          business_type: formData.business_type.trim(),
          notes: formData.notes.trim(),
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        throw new Error(`Failed to save lead: ${error.message}`)
      }

      console.log('Lead submitted successfully:', data)

      // Reset form
      setFormData({
        business_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        loan_amount: '',
        business_type: '',
        notes: ''
      })
      
      onToggleForm(false)
      onLeadAdded()
      
      // Show success message
      alert('Lead submitted successfully!')
      
    } catch (err) {
      console.error('Lead submission error:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Add Lead Button */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
            <p className="text-gray-600">Track your referred leads and their progress</p>
          </div>
          
          <button
            onClick={() => onToggleForm(!showForm)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {leads.length}
            </div>
            <div className="text-sm font-medium text-blue-800">Total Leads</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {leads.filter(l => l.status === 'new').length}
            </div>
            <div className="text-sm font-medium text-yellow-800">New</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {leads.filter(l => l.status === 'approved').length}
            </div>
            <div className="text-sm font-medium text-purple-800">Approved</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {leads.filter(l => l.status === 'funded').length}
            </div>
            <div className="text-sm font-medium text-green-800">Funded</div>
          </div>
        </div>
      </div>

      {/* Lead Submission Form */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Submit New Lead</h3>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                {error}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter business name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Amount</label>
                <input
                  type="text"
                  placeholder="$500,000"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({...formData, loan_amount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
                <input
                  type="text"
                  placeholder="Restaurant, Manufacturing, etc."
                  value={formData.business_type}
                  onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Any additional information about this lead..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Lead'
                )}
              </button>
              <button
                type="button"
                onClick={() => onToggleForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Your Leads ({leads.length})</h3>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by submitting your first lead.</p>
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
                    Loan Amount
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
                {leads.map((lead) => (
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
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
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

function StatusBadge({ status }) {
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

function TrainingLibrary() {
  const trainingVideos = [
    {
      id: 1,
      title: 'SBA Loan Basics',
      description: 'Understanding SBA loan types and requirements',
      duration: '15 min',
      category: 'Basics',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 2,
      title: 'Lead Qualification Process',
      description: 'How to identify and qualify potential borrowers',
      duration: '20 min',
      category: 'Lead Generation',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 3,
      title: 'Documentation Requirements',
      description: 'What documents borrowers need to provide',
      duration: '12 min',
      category: 'Process',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 4,
      title: 'Referral Best Practices',
      description: 'Tips for successful referral partnerships',
      duration: '18 min',
      category: 'Best Practices',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  ]

  const [selectedVideo, setSelectedVideo] = useState(null)

  const handleWatchVideo = (video) => {
    setSelectedVideo(video)
  }

  const closeVideoModal = () => {
    setSelectedVideo(null)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Library</h2>
        <p className="text-gray-600">Educational resources to help you succeed as a referral partner</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainingVideos.map((video, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{video.title}</h3>
                <p className="text-gray-600 mb-4">{video.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {video.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {video.duration}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleWatchVideo(video)}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
                    Watch
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h3>
              <button
                onClick={closeVideoModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
                <iframe
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {selectedVideo.category}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedVideo.duration}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mt-4">{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReferralPartnerContact() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Profile Card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Your Referral Partner Contact</h2>
            <p className="text-green-100">Direct line to Chris Foster for all referral matters</p>
          </div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-6">
            {/* Avatar and Basic Info */}
            <div className="flex-shrink-0 text-center lg:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg mx-auto lg:mx-0 mb-4">
                <span className="text-3xl font-bold text-green-600">CF</span>
              </div>
              
              {/* Quick Contact Buttons */}
              <div className="flex flex-col space-y-2 w-full max-w-xs mx-auto lg:mx-0">
                <button
                  onClick={() => window.location.href = 'tel:+1234567890'}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Call Now
                </button>
                
                <button
                  onClick={() => window.location.href = 'mailto:chris@fostercompany.com'}
                  className="flex items-center justify-center px-4 py-2 border-2 border-green-300 text-green-700 rounded-lg font-medium bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Send Email
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-gray-900 mb-1">Chris Foster</h3>
                <p className="text-lg text-green-600 font-semibold mb-1">Referral Partner Manager</p>
                <p className="text-gray-500 mb-4">The Foster Company</p>

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Direct Line</p>
                      <a href="tel:+1234567890" className="font-bold text-green-600 hover:text-green-800">
                        (123) 456-7890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href="mailto:chris@fostercompany.com" className="font-bold text-green-600 hover:text-green-800">
                        chris@fostercompany.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <p className="font-bold text-gray-900">Mon-Fri, 9 AM - 5 PM EST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-2">About Chris</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Chris Foster brings over 15 years of specialized experience in SBA lending and referral partnerships. 
                  He has personally guided hundreds of referral partners to success, helping them build profitable 
                  relationships while serving business owners nationwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">$50M+</div>
          <div className="font-semibold text-green-800 mb-1">Loans Funded</div>
          <div className="text-xs text-gray-600">Through referral partnerships</div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">200+</div>
          <div className="font-semibold text-blue-800 mb-1">Active Partners</div>
          <div className="text-xs text-gray-600">Successful referral relationships</div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">15+</div>
          <div className="font-semibold text-purple-800 mb-1">Years Experience</div>
          <div className="text-xs text-gray-600">In referral partnerships</div>
        </div>
      </div>

      {/* Referral Program Benefits */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Referral Program Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Competitive referral fees on all funded loans</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Dedicated support throughout the loan process</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Fast response times on lead inquiries</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Regular updates on referral status</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Marketing materials and training resources</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">No exclusivity requirements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}