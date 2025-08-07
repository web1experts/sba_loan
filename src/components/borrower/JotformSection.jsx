import React, { useState } from 'react'
import { FileText, ExternalLink, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function JotformSection() {
  const { user } = useAuth()
  const [completedForms, setCompletedForms] = useState(new Set())
  const [activeForm, setActiveForm] = useState(null)

  const forms = [
    {
      id: 'business-questionnaire',
      title: 'Business General Questionnaire',
      description: 'Provide general information about your business operations and structure',
      jotformId: '251413704591049',
      required: true
    },
    {
      id: 'business-history',
      title: 'Business History Form',
      description: 'Detailed business history and background information',
      jotformId: '251421935476056',
      required: true
    },
    {
      id: 'credit-authorization',
      title: 'Credit Report Authorization Form',
      description: 'Authorization for credit report and background checks',
      jotformId: '251422812143446',
      required: true
    },
    {
      id: 'personal-financial',
      title: 'Personal Financial Statement',
      description: 'Complete personal financial information and assets',
      jotformId: '251453959374468',
      required: true
    },
    {
      id: 'borrower-info',
      title: 'Borrower Information Form',
      description: 'Primary borrower details and contact information',
      jotformId: '251422751672455',
      required: true
    },
    {
      id: 'loan-application',
      title: 'Commercial Loan Application',
      description: 'Main SBA loan application with business details',
      jotformId: '251451224267452',
      required: true
    },
    {
      id: 'management-resume',
      title: 'Management Resume Form',
      description: 'Professional resume and management experience',
      jotformId: '251422370375452',
      required: false
    },
    {
      id: 'real-estate-schedule',
      title: 'Schedule of Real Estate',
      description: 'List all real estate owned personally and by business',
      jotformId: '251450786554463',
      required: false
    },
    {
      id: 'debt-schedule',
      title: 'Business Debt Schedule',
      description: 'Complete listing of all business debts and obligations',
      jotformId: '251450301433442',
      required: true
    }
  ]

  const generateJotformUrl = (jotformId) => {
    const userId = user?.id || '2'
    const email = encodeURIComponent(user?.email || 'php.web1experts@gmail.com')
    return `https://form.jotform.com/${jotformId}?wp_user_id=${userId}&wp_user_email=${email}`
  }

  const requiredForms = forms.filter(form => form.required)
  const optionalForms = forms.filter(form => !form.required)
  const completedRequiredCount = requiredForms.filter(form => completedForms.has(form.id)).length
  const totalRequiredCount = requiredForms.length

  // Auto-mark form as completed when iframe loads (simulated)
  const handleFormLoad = (formId) => {
    // In a real implementation, you'd listen for form submission events
    setTimeout(() => {
      setCompletedForms(prev => new Set([...prev, formId]))
    }, 3000) // Simulate form completion after 3 seconds
  }

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Loan Application Forms</h2>
          <div className="text-sm font-medium text-gray-600">
            {completedRequiredCount}/{totalRequiredCount} Required Forms Complete
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedRequiredCount / totalRequiredCount) * 100}%` }}
          />
        </div>
        
        {completedRequiredCount === totalRequiredCount && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <p className="text-green-800 font-medium">
              🎉 All required forms completed! You can now proceed with document uploads.
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {activeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{activeForm.title}</h3>
              <button
                onClick={() => setActiveForm(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                title={`JotForm - ${activeForm.title}`}
                src={generateJotformUrl(activeForm.jotformId)}
                width="100%"
                height="100%"
                frameBorder="0"
                allowTransparency="true"
                allowFullScreen
                onLoad={() => handleFormLoad(activeForm.id)}
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Required Forms */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Required Forms</h3>
          <p className="text-gray-600">These forms must be completed to proceed with your application</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4">
            {requiredForms.map((form) => (
              <FormCard 
                key={form.id}
                form={form}
                isCompleted={completedForms.has(form.id)}
                onOpenForm={() => setActiveForm(form)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Optional Forms */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Additional Forms</h3>
          <p className="text-gray-600">These forms may help strengthen your application</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4">
            {optionalForms.map((form) => (
              <FormCard 
                key={form.id}
                form={form}
                isCompleted={completedForms.has(form.id)}
                onOpenForm={() => setActiveForm(form)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FormCard({ form, isCompleted, onOpenForm }) {
  return (
    <div className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-md ${
      isCompleted 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`mt-1 p-2 rounded-xl ${
            isCompleted ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <FileText className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 mb-1">{form.title}</h4>
            <p className="text-gray-600 mb-4">{form.description}</p>
            
            <button
              onClick={onOpenForm}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
            >
              {isCompleted ? 'View Form' : 'Open Form'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
        
        {form.required && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Required
          </span>
        )}
      </div>
    </div>
  )
}