import React, { useState } from 'react'
import { Upload, File, CheckCircle2, AlertCircle, X, FolderOpen } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function DocumentUploadSection({ documents, onDocumentUploaded }) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState({})

  const documentCategories = [
    'Business Bank Statements (3 Months)',
    'Business Tax Returns (3 Years)',
    'Commitment Letter',
    'Mortgage Statement (if Refi)',
    'Credit Report',
    'Deal Summary',
    'Debt Schedule',
    'Identification',
    'Insurance Docs',
    'Invoices',
    'LOIs',
    'Personal Bank Statements (3 Months)',
    'Personal Tax Returns (3 Years)',
    'Purchase Contract',
    'Year-To-Date Financials',
    'Other Documents'
  ]

  const totalRequired = documentCategories.length
  const totalUploaded = documents.length

  const uploadDocument = async (file, category) => {
    if (!user || !file) return

    setUploading(prev => ({ ...prev, [category]: true }))

    try {
      // Get current authenticated user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentUser) {
        throw new Error('Please log in again to upload files.')
      }

      // Upload to user-specific folder (required for RLS policy)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${currentUser.id}/${fileName}` // This matches RLS policy: auth.uid() || '/%'

      console.log('Uploading to user folder:', { filePath, userId: currentUser.id })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('borrower-docs')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        if (uploadError.message.includes('row-level security policy')) {
          throw new Error('Upload permission denied. Please ensure storage policies are configured correctly.')
        }
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('File uploaded successfully to user folder')

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: currentUser.id,
          doc_name: category,
          file_name: file.name,
          file_path: filePath,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // If database save fails, clean up the uploaded file
        try {
          await supabase.storage.from('borrower-docs').remove([filePath])
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError)
        }
        throw new Error(`Failed to save file information: ${dbError.message}`)
      }

      onDocumentUploaded()
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.message)
    } finally {
      setUploading(prev => ({ ...prev, [category]: false }))
    }
  }

  const handleFileSelect = (event, category) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, DOC, DOCX, JPG, or PNG files.')
        return
      }
      
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.')
        return
      }
      
      uploadDocument(file, category)
    }
  }

  const getDocumentsByCategory = (category) => {
    return documents.filter(doc => doc.doc_name === category)
  }

  const deleteDocument = async (docId, filePath) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('borrower-docs')
        .remove([filePath])

      // Delete from database
      await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      onDocumentUploaded()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Document Upload Center Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Upload Center</h2>
            <p className="text-gray-600">Upload your documents for faster processing</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {totalRequired}
            </div>
            <div className="text-sm font-medium text-blue-800">Total Documents Required</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {totalUploaded}
            </div>
            <div className="text-sm font-medium text-green-800">Documents Uploaded</div>
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Document Categories</h3>
          <p className="text-gray-600">Upload your documents by category</p>
        </div>

        <div className="p-6 space-y-4">
          {documentCategories.map((category) => {
            const categoryDocs = getDocumentsByCategory(category)
            const isUploading = uploading[category]

            return (
              <div key={category} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{category}</h4>
                  <div className="flex items-center space-x-2">
                    {categoryDocs.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {categoryDocs.length} file{categoryDocs.length > 1 ? 's' : ''}
                      </span>
                    )}
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, category)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        disabled={isUploading}
                      />
                      <div className={`inline-flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-all duration-200 ${
                        isUploading
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                          : 'border-blue-300 text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 shadow-sm hover:shadow-md'
                      }`}>
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1.5" />
                            Upload
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Uploaded Files */}
                {categoryDocs.length > 0 && (
                  <div className="space-y-2">
                    {categoryDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{doc.file_name}</span>
                          <StatusBadge status={doc.status} />
                        </div>
                        
                        <button
                          onClick={() => deleteDocument(doc.id, doc.file_path)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete document"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Upload Guidelines</h4>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-2">
              <li>Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</li>
              <li>Maximum file size: 10MB per file</li>
              <li>Ensure documents are clear and readable</li>
              <li>You can upload multiple files per category</li>
              <li>All documents are automatically saved to your secure folder</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const statusConfig = {
    uploaded: { color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200', label: 'Under Review' },
    approved: { color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200', label: 'Approved' },
    rejected: { color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200', label: 'Needs Revision' }
  }

  const config = statusConfig[status] || statusConfig.uploaded

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}