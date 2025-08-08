import React, { useState } from 'react'
import { CheckCircle2, FileText, Upload, Send, AlertCircle, User, Building } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function ApplicationSubmission({ documents, userProfile, onApplicationSubmitted }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const requiredCategories = [
    'Business Bank Statements (3 Months)',
    'Business Tax Returns (3 Years)',
    'Personal Bank Statements (3 Months)',
    'Personal Tax Returns (3 Years)',
    'Credit Report'
  ]

  const uploadedCategories = [...new Set(documents.map(doc => doc.doc_name))]
  const missingCategories = requiredCategories.filter(cat => !uploadedCategories.includes(cat))
  const canSubmit = missingCategories.length === 0 && documents.length >= 5

  // Generate folder name in format: firstname_lastname_email_userid
  const generateFolderName = () => {
    const firstName = userProfile?.first_name || user?.user_metadata?.first_name || 'user'
    const lastName = userProfile?.last_name || user?.user_metadata?.last_name || 'unknown'
    const email = user?.email || 'noemail'
    const userId = user?.id || 'noid'
    
    // Clean and format the components
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const cleanEmail = email.toLowerCase().replace(/[^a-z0-9@.]/g, '')
    const cleanUserId = userId.replace(/[^a-z0-9]/g, '')
    
    return `${cleanFirstName}_${cleanLastName}_${cleanEmail}_${cleanUserId}`
  }

  const handleSubmitApplication = async () => {
    if (!user || !canSubmit) return

    setSubmitting(true)

    try {
      // Get current authenticated user to ensure we have the latest auth state
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentUser) {
        throw new Error('Authentication required. Please log in again.')
      }

      console.log('Submitting application for user:', currentUser.id)
      console.log('Document count:', documents.length)
      console.log('User profile:', userProfile)

      // Generate folder name
      const folderName = generateFolderName()
      console.log('Generated folder name:', folderName)

      // Prepare submission data
      const submissionData = {
        user_id: currentUser.id,
        email: currentUser.email,
        first_name: userProfile?.first_name || currentUser.user_metadata?.first_name || '',
        last_name: userProfile?.last_name || currentUser.user_metadata?.last_name || '',
        phone: userProfile?.phone || '',
        company: userProfile?.company || '',
        document_categories: uploadedCategories,
        total_documents: documents.length,
        submission_timestamp: new Date().toISOString()
      }

      console.log('Submission data:', submissionData)

      // Submit application using the new function
      const { data, error } = await supabase.rpc('submit_borrower_application', {
        p_user_id: currentUser.id,
        p_document_count: documents.length,
        p_folder_name: folderName,
        p_submission_data: submissionData
      })

      if (error) {
        console.error('Application submission error:', error)
        throw new Error(`Failed to submit application: ${error.message}`)
      }

      console.log('Application submitted successfully:', data)
      setSubmitted(true)
      
      // Show success for 3 seconds then redirect
      setTimeout(() => {
        onApplicationSubmitted()
      }, 3000)

    } catch (error) {
      console.error('Application submission error:', error)
      alert(`Failed to submit application: ${error.message}. Please try again or contact support.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200/50 shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your loan application has been submitted and is now under review. You'll receive updates on your progress.
          </p>
          <div className="bg-white rounded-xl p-4 text-left shadow-md">
            <h3 className="font-bold text-gray-900 mb-3">What's Next:</h3>
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Initial review by our loan team (1-2 business days)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Document verification and underwriting process</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Your loan officer will contact you with updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          Submit Your Application
        </h1>
        <p className="text-gray-600">
          Review your application and submit for processing
        </p>
      </div>

      {/* Application Summary */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Application Summary</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Applicant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-900">{userProfile?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <span className="ml-2 text-gray-900">{userProfile?.company || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Summary */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Documents Uploaded</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {uploadedCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{category}</span>
                    <span className="text-gray-500">
                      ({documents.filter(doc => doc.doc_name === category).length} file{documents.filter(doc => doc.doc_name === category).length > 1 ? 's' : ''})
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  Total Documents: <span className="text-gray-900">{documents.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Requirements */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Submission Requirements</h3>
        
        {missingCategories.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Missing Required Documents:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {missingCategories.map((category) => (
                    <li key={category}>• {category}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className={`w-5 h-5 ${canSubmit ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm ${canSubmit ? 'text-gray-700' : 'text-gray-500'}`}>
              All required documents uploaded
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle2 className={`w-5 h-5 ${documents.length >= 5 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm ${documents.length >= 5 ? 'text-gray-700' : 'text-gray-500'}`}>
              Minimum 5 documents uploaded ({documents.length}/5)
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmitApplication}
          disabled={!canSubmit || submitting}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Submit Application for Review</span>
            </>
          )}
        </button>
        
        {!canSubmit && (
          <p className="mt-3 text-sm text-gray-500">
            Please upload all required documents before submitting
          </p>
        )}
      </div>
    </div>
  )
}