import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Database } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function ConnectionStatus() {
  const [status, setStatus] = useState({
    supabase: 'checking',
    auth: 'checking',
    database: 'checking',
    storage: 'checking'
  })
  const [config, setConfig] = useState({
    url: '',
    hasAnonKey: false
  })

  useEffect(() => {
    checkConnections()
  }, [])

  const checkConnections = async () => {
    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    setConfig({
      url: supabaseUrl || 'Not configured',
      hasAnonKey: !!supabaseKey
    })

    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('documents').select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Supabase connection error:', error)
        setStatus(prev => ({ ...prev, supabase: 'error', database: 'error' }))
      } else {
        setStatus(prev => ({ ...prev, supabase: 'connected', database: 'connected' }))
      }
    } catch (err) {
      console.error('Supabase test failed:', err)
      setStatus(prev => ({ ...prev, supabase: 'error', database: 'error' }))
    }

    // Test Auth
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setStatus(prev => ({ ...prev, auth: 'connected' }))
    } catch (err) {
      console.error('Auth test failed:', err)
      setStatus(prev => ({ ...prev, auth: 'error' }))
    }

    // Test Storage
    try {
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Storage test failed:', error)
        setStatus(prev => ({ ...prev, storage: 'error' }))
      } else {
        const hasBorrowerDocs = data.some(bucket => bucket.name === 'borrower-docs')
        const hasReferralUploads = data.some(bucket => bucket.name === 'referral_uploads')
        
        if (hasBorrowerDocs && hasReferralUploads) {
          setStatus(prev => ({ ...prev, storage: 'connected' }))
        } else {
          setStatus(prev => ({ ...prev, storage: 'partial' }))
        }
      }
    } catch (err) {
      console.error('Storage test failed:', err)
      setStatus(prev => ({ ...prev, storage: 'error' }))
    }
  }

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      case 'partial':
        return 'Partial'
      default:
        return 'Checking...'
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'partial':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Connection Status</h1>
          <p className="text-gray-600">Checking your database and service connections</p>
        </div>

        {/* Configuration Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Supabase URL:</span>
              <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {config.url.length > 50 ? `${config.url.substring(0, 50)}...` : config.url}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Anonymous Key:</span>
              <span className={`text-sm font-medium ${config.hasAnonKey ? 'text-green-600' : 'text-red-600'}`}>
                {config.hasAnonKey ? 'Configured' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.supabase)}
                <span className="font-medium text-gray-900">Supabase Client</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(status.supabase)}`}>
                {getStatusText(status.supabase)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.auth)}
                <span className="font-medium text-gray-900">Authentication</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(status.auth)}`}>
                {getStatusText(status.auth)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.database)}
                <span className="font-medium text-gray-900">Database Tables</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(status.database)}`}>
                {getStatusText(status.database)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.storage)}
                <span className="font-medium text-gray-900">Storage Buckets</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(status.storage)}`}>
                {getStatusText(status.storage)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          
          {status.supabase === 'error' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Connection Issues Detected</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Check your VITE_SUPABASE_URL environment variable</li>
                <li>• Verify your VITE_SUPABASE_ANON_KEY is correct</li>
                <li>• Ensure your Supabase project is active</li>
                <li>• Run the database migration script if tables are missing</li>
              </ul>
            </div>
          )}

          {status.storage === 'partial' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Storage Setup Incomplete</h3>
              <p className="text-sm text-yellow-700">
                Some storage buckets are missing. Please create the 'borrower-docs' and 'referral_uploads' buckets in your Supabase dashboard.
              </p>
            </div>
          )}

          {status.supabase === 'connected' && status.database === 'connected' && status.storage === 'connected' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">✅ All Systems Connected!</h3>
              <p className="text-sm text-green-700">
                Your Supabase integration is working perfectly. You can now proceed with using the application.
              </p>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <button
              onClick={checkConnections}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Recheck Connections
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go to Application
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}