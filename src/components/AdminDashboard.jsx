import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Users, FileText, BarChart3, Menu, X, Bell, ChevronDown, Eye, CheckCircle, Clock, AlertCircle, Download, User, Building, Calendar, Phone, Mail } from 'lucide-react'
import { supabase } from '../supabaseClient'
import AssistantChat from './AssistantChat'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Applications state
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applicationDocuments, setApplicationDocuments] = useState([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  
  // Borrowers state
  const [borrowers, setBorrowers] = useState([])
  
  // Documents state
  const [documents, setDocuments] = useState([])
  
  // Referrals state
  const [referrals, setReferrals] = useState([])

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchApplications(),
        fetchBorrowers(),
        fetchDocuments(),
        fetchReferrals()
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
          user_profiles!inner(first_name, last_name, email, phone, company)
        `)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      setApplications([])
    }
  }

  const fetchBorrowers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'borrower')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBorrowers(data || [])
    } catch (error) {
      console.error('Error fetching borrowers:', error)
      setBorrowers([])
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          user_profiles!inner(first_name, last_name, email)
        `)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    }
  }

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_leads')
        .select(`
          *,
          user_profiles!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReferrals(data || [])
    } catch (error) {
      console.error('Error fetching referrals:', error)
      setReferrals([])
    }
  }

  const fetchApplicationDocuments = async (userId) => {
    setLoadingDocuments(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      
      // Generate signed URLs for documents
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('borrower-docs')
              .createSignedUrl(doc.file_path, 3600) // 1 hour expiry
            
            return {
              ...doc,
              signed_url: urlData?.signedUrl || null
            }
          } catch (urlError) {
            console.error('Error generating signed URL for:', doc.file_name, urlError)
            return { ...doc, signed_url: null }
          }
        })
      )
      
      setApplicationDocuments(documentsWithUrls)
    } catch (error) {
      console.error('Error fetching application documents:', error)
      setApplicationDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  const approveDocument = async (documentId) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'approved' })
        .eq('id', documentId)

      if (error) throw error
      
      // Refresh documents
      if (selectedApplication) {
        fetchApplicationDocuments(selectedApplication.user_id)
      }
      fetchDocuments()
    } catch (error) {
      console.error('Error approving document:', error)
      alert('Failed to approve document')
    }
  }

  const approveApplication = async (applicationId, userId) => {
    try {
      const { error } = await supabase
        .from('application_status')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error
      
      // Refresh data
      fetchApplications()
      setSelectedApplication(null)
      alert('Application approved successfully!')
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Failed to approve application')
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
    { id: 'borrowers', label: 'Borrower List', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'referrals', label: 'Referrals', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 border-r border-gray-200/50 flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
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
                    setSelectedApplication(null)
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
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
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
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
        {/* Header */}
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
                   activeTab === 'documents' ? 'Documents' :
                   'Referrals'}
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
          {activeTab === 'overview' && (
            <OverviewSection 
              applications={applications}
              borrowers={borrowers}
              documents={documents}
              referrals={referrals}
            />
          )}
          
          {activeTab === 'applications' && (
            <ApplicationsSection 
              applications={applications}
              selectedApplication={selectedApplication}
              setSelectedApplication={setSelectedApplication}
              applicationDocuments={applicationDocuments}
              loadingDocuments={loadingDocuments}
              fetchApplicationDocuments={fetchApplicationDocuments}
              approveDocument={approveDocument}
              approveApplication={approveApplication}
            />
          )}
          
          {activeTab === 'borrowers' && (
            <BorrowersSection borrowers={borrowers} />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsSection documents={documents} approveDocument={approveDocument} />
          )}
          
          {activeTab === 'referrals' && (
            <ReferralsSection referrals={referrals} />
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

      <AssistantChat />
    </div>
  )
}

function OverviewSection({ applications, borrowers, documents, referrals }) {
  const stats = [
    {
      name: 'Total Applications',
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
      name: 'Documents Uploaded',
      value: documents.length,
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      name: 'Referral Leads',
      value: referrals.length,
      icon: Users,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ]

  return (
    <div className="space-y-8">
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recent Applications</h3>
        </div>
        <div className="p-6">
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">Applications will appear here when borrowers submit them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {app.user_profiles?.first_name} {app.user_profiles?.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{app.user_profiles?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={app.status} />
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </p>
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

function ApplicationsSection({ 
  applications, 
  selectedApplication, 
  setSelectedApplication,
  applicationDocuments,
  loadingDocuments,
  fetchApplicationDocuments,
  approveDocument,
  approveApplication
}) {
  const handleViewApplication = (application) => {
    setSelectedApplication(application)
    fetchApplicationDocuments(application.user_id)
  }

  if (selectedApplication) {
    return (
      <ApplicationDetailView
        application={selectedApplication}
        documents={applicationDocuments}
        loadingDocuments={loadingDocuments}
        onBack={() => setSelectedApplication(null)}
        approveDocument={approveDocument}
        approveApplication={approveApplication}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Submitted Applications</h3>
          <p className="text-gray-600">Review and approve loan applications</p>
        </div>

        <div className="p-6">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications submitted</h3>
              <p className="mt-1 text-sm text-gray-500">Applications will appear here when borrowers submit them.</p>
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
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
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {app.user_profiles?.first_name} {app.user_profiles?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{app.user_profiles?.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.user_profiles?.email}</div>
                        <div className="text-sm text-gray-500">{app.user_profiles?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
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
    </div>
  )
}

function ApplicationDetailView({ 
  application, 
  documents, 
  loadingDocuments, 
  onBack, 
  approveDocument, 
  approveApplication 
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Applications
        </button>
        <button
          onClick={() => approveApplication(application.id, application.user_id)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve Application</span>
        </button>
      </div>

      {/* Application Details */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrower Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {application.user_profiles?.first_name} {application.user_profiles?.last_name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{application.user_profiles?.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{application.user_profiles?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{application.user_profiles?.company || 'Not provided'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <StatusBadge status={application.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Uploaded Documents</h3>
          <p className="text-gray-600">Review and approve borrower documents</p>
        </div>

        <div className="p-6">
          {loadingDocuments ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">Documents will appear here when the borrower uploads them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{doc.doc_name}</h4>
                      <p className="text-sm text-gray-600">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={doc.status} />
                    
                    <div className="flex items-center space-x-2">
                      {doc.signed_url && (
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      
                      {doc.status !== 'approved' && (
                        <button
                          onClick={() => approveDocument(doc.id)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Approve document"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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

function BorrowersSection({ borrowers }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Borrower List</h3>
        <p className="text-gray-600">All registered borrowers</p>
      </div>

      <div className="p-6">
        {borrowers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowers yet</h3>
            <p className="mt-1 text-sm text-gray-500">Borrowers will appear here when they register.</p>
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
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {borrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {borrower.company || 'Not provided'}
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

function DocumentsSection({ documents, approveDocument }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">All Documents</h3>
        <p className="text-gray-600">Review all uploaded documents</p>
      </div>

      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Documents will appear here when borrowers upload them.</p>
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
                    Uploaded
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.doc_name}</div>
                        <div className="text-sm text-gray-500">{doc.file_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.user_profiles?.first_name} {doc.user_profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {doc.status !== 'approved' && (
                        <button
                          onClick={() => approveDocument(doc.id)}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
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

function ReferralsSection({ referrals }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Referral Leads</h3>
        <p className="text-gray-600">All referral partner submissions</p>
      </div>

      <div className="p-6">
        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals yet</h3>
            <p className="mt-1 text-sm text-gray-500">Referral leads will appear here when partners submit them.</p>
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
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{referral.business_name}</div>
                        <div className="text-sm text-gray-500">{referral.business_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{referral.contact_name}</div>
                        <div className="text-sm text-gray-500">{referral.contact_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.user_profiles?.first_name} {referral.user_profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
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
    started: { color: 'bg-gray-100 text-gray-800', label: 'Started' },
    documents_pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Documents Pending' },
    under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    funded: { color: 'bg-green-100 text-green-800', label: 'Funded' },
    declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
    uploaded: { color: 'bg-yellow-100 text-yellow-800', label: 'Uploaded' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
    contacted: { color: 'bg-purple-100 text-purple-800', label: 'Contacted' },
    in_review: { color: 'bg-orange-100 text-orange-800', label: 'In Review' }
  }

  const config = statusConfig[status] || statusConfig.started

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}