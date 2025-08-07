import React from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'

export default function ProgressTracker({ documents, applicationStatus }) {
  const steps = [
    {
      id: 'application',
      title: 'Application Forms',
      description: 'Complete all required loan application forms',
      status: getFormStatus(documents),
      icon: CheckCircle2
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload all required supporting documents',
      status: getDocumentStatus(documents),
      icon: CheckCircle2
    },
    {
      id: 'review',
      title: 'Initial Review',
      description: 'Our team reviews your application and documents',
      status: getReviewStatus(applicationStatus),
      icon: Clock
    },
    {
      id: 'underwriting',
      title: 'Underwriting',
      description: 'Detailed analysis and verification process',
      status: getUnderwritingStatus(applicationStatus),
      icon: Circle
    },
    {
      id: 'approval',
      title: 'Final Approval',
      description: 'Loan approval and closing preparation',
      status: 'pending',
      icon: Circle
    },
    {
      id: 'funding',
      title: 'Funding',
      description: 'Loan funds disbursed to your account',
      status: 'pending',
      icon: Circle
    }
  ]

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Application Progress</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = getStatusIcon(step.status)
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.id} className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isLast && (
                    <div className={`absolute top-10 left-5 w-0.5 h-8 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(step.status)}`}>
                      {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getFormStatus(documents) {
  // Simplified: if user has uploaded documents, assume forms are completed
  return documents.length > 0 ? 'completed' : 'pending'
}

function getDocumentStatus(documents) {
  if (documents.length === 0) return 'pending'
  if (documents.length < 5) return 'in-progress'
  return 'completed'
}

function getReviewStatus(applicationStatus) {
  if (!applicationStatus) return 'pending'
  if (applicationStatus.status === 'under_review') return 'in-progress'
  if (['approved', 'funded'].includes(applicationStatus.status)) return 'completed'
  return 'pending'
}

function getUnderwritingStatus(applicationStatus) {
  if (!applicationStatus) return 'pending'
  if (applicationStatus.stage === 'underwriting') return 'in-progress'
  if (['closing', 'funded', 'complete'].includes(applicationStatus.stage)) return 'completed'
  return 'pending'
}

function getStatusIcon(status) {
  switch (status) {
    case 'completed':
      return CheckCircle2
    case 'in-progress':
      return Clock
    case 'warning':
      return AlertCircle
    default:
      return Circle
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-600'
    case 'in-progress':
      return 'bg-blue-100 text-blue-600'
    case 'warning':
      return 'bg-yellow-100 text-yellow-600'
    default:
      return 'bg-gray-100 text-gray-400'
  }
}

function getStatusBadgeColor(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}