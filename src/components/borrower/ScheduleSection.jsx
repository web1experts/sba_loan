import React, { useState } from 'react'
import { Calendar, Clock, Phone, MapPin, CheckCircle2, User, Send, Headphones } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function ScheduleSection() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('callback')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [loading, setLoading] = useState(false)

  const availableTimes = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
  ]

  const meetingPurposes = [
    'Initial Consultation',
    'Document Review',
    'Application Status Update',
    'Loan Terms Discussion',
    'Closing Preparation',
    'General Questions',
    'Other'
  ]

  const tabs = [
    { id: 'callback', label: 'Request Call Back', icon: Phone, desc: 'Schedule a callback from your loan officer' },
    { id: 'in-person', label: 'In-Person Meeting', icon: MapPin, desc: 'Schedule an office meeting' },
    { id: 'calendly', label: 'Book Meeting', icon: Calendar, desc: 'Use Calendly to book directly' }
  ]

  const handleSchedule = async (e) => {
    e.preventDefault()
    
    if (!user?.id) {
      alert('User not authenticated. Please refresh and try again.')
      return
    }

    setLoading(true)

    try {
      const meetingData = {
        user_id: user.id,
        meeting_date: activeTab === 'callback' ? new Date().toISOString().split('T')[0] : selectedDate || new Date().toISOString().split('T')[0],
        meeting_time: activeTab === 'callback' ? (preferredTime || 'ASAP') : selectedTime,
        meeting_type: activeTab === 'callback' ? 'callback' : 'in-person',
        purpose: purpose,
        notes: activeTab === 'callback' ? `${notes}\nPhone: ${phoneNumber}\nPreferred Time: ${preferredTime}`.trim() : notes,
        contact_info: activeTab === 'callback' ? phoneNumber : '',
        status: 'scheduled',
        created_at: new Date().toISOString()
      }

      console.log('Submitting meeting data:', meetingData) // Debug log

      const { error } = await supabase
        .from('meetings')
        .insert(meetingData)

      if (error) {
        console.error('Database error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('Meeting saved successfully') // Debug log
      setIsScheduled(true)
      
      setTimeout(() => {
        setIsScheduled(false)
        setSelectedDate('')
        setSelectedTime('')
        setPurpose('')
        setNotes('')
        setPhoneNumber('')
        setPreferredTime('')
      }, 5000)
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      alert(`Failed to schedule meeting: ${error.message}. Please try again or contact support.`)
    } finally {
      setLoading(false)
    }
  }

  if (isScheduled) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200/50 shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your {activeTab === 'callback' ? 'callback request' : 'meeting request'} has been submitted successfully. 
            You'll receive a confirmation email shortly.
          </p>
          <div className="bg-white rounded-xl p-4 text-left shadow-md">
            <h3 className="font-bold text-gray-900 mb-3">Request Details:</h3>
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{purpose}</span>
              </div>
              {activeTab === 'callback' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Preferred: {preferredTime}</span>
                  </div>
                </>
              )}
              {activeTab === 'in-person' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTime}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Loan Officer Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold">CF</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Chris Foster</h3>
            <p className="text-blue-100">Senior Loan Officer</p>
            <p className="text-sm text-blue-200">Available Monday - Friday, 9 AM - 5 PM EST</p>
          </div>
        </div>
      </div>

      {/* Meeting Type Tabs */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Communication</h2>
          <p className="text-gray-600">Choose how you'd like to connect with your loan officer</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    activeTab === tab.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-3 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-bold text-gray-900 mb-1">{tab.label}</div>
                  <div className="text-sm text-gray-500">{tab.desc}</div>
                </button>
              )
            })}
          </div>

          {/* Content Based on Selected Tab */}
          {activeTab === 'callback' && (
            <CallbackForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              preferredTime={preferredTime}
              setPreferredTime={setPreferredTime}
              purpose={purpose}
              setPurpose={setPurpose}
              notes={notes}
              setNotes={setNotes}
              loading={loading}
              handleSchedule={handleSchedule}
              meetingPurposes={meetingPurposes}
            />
          )}

          {activeTab === 'in-person' && (
            <InPersonForm
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              purpose={purpose}
              setPurpose={setPurpose}
              notes={notes}
              setNotes={setNotes}
              loading={loading}
              handleSchedule={handleSchedule}
              availableTimes={availableTimes}
              meetingPurposes={meetingPurposes}
            />
          )}

          {activeTab === 'calendly' && <CalendlySection />}
        </div>
      </div>
    </div>
  )
}

function CallbackForm({ 
  phoneNumber, setPhoneNumber, preferredTime, setPreferredTime,
  purpose, setPurpose, notes, setNotes, loading, handleSchedule, meetingPurposes 
}) {
  return (
    <form onSubmit={handleSchedule} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time</label>
          <input
            type="text"
            required
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Morning, 2-4 PM, etc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose of Call</label>
        <select
          required
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select purpose</option>
          {meetingPurposes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific topics you'd like to discuss..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Submitting Request...
          </>
        ) : (
          'Request Call Back'
        )}
      </button>
    </form>
  )
}

function InPersonForm({ 
  selectedDate, setSelectedDate, selectedTime, setSelectedTime,
  purpose, setPurpose, notes, setNotes, loading, handleSchedule,
  availableTimes, meetingPurposes 
}) {
  return (
    <form onSubmit={handleSchedule} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Time</label>
          <select
            required
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a time</option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Purpose</label>
        <select
          required
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select purpose</option>
          {meetingPurposes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific topics you'd like to discuss..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Scheduling Meeting...
          </>
        ) : (
          'Schedule In-Person Meeting'
        )}
      </button>
    </form>
  )
}

function CalendlySection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Meeting</h3>
        <p className="text-gray-600">
          Use our Calendly integration to book a meeting directly with Chris Foster
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <iframe
          src="https://calendly.com/php-web1experts/loan-applocation"
          width="100%"
          height="700"
          frameBorder="0"
          title="Schedule a meeting with Chris Foster"
          className="rounded-xl"
        />
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Meeting Information:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Meetings are typically 30-60 minutes</li>
          <li>• You'll receive a confirmation email with meeting details</li>
          <li>• Video call link will be provided before the meeting</li>
          <li>• Please prepare any questions or documents in advance</li>
        </ul>
      </div>
    </div>
  )
}