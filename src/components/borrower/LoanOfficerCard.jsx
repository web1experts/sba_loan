import React from 'react'
import { Phone, Mail, Calendar, Star, Award, TrendingUp, Users, Shield, Clock, CheckCircle } from 'lucide-react'

export default function LoanOfficerCard() {
  const handleScheduleMeeting = () => {
    // This would typically navigate to the schedule tab
    window.location.hash = '#schedule'
  }

  const handleSendMessage = () => {
    window.location.href = 'mailto:chris@fostercompany.com?subject=SBA Loan Inquiry'
  }

  const handleCall = () => {
    window.location.href = 'tel:+1234567890'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Profile Card - Compact and Professional */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-3">
              <Star className="w-5 h-5 text-yellow-300" />
              <h1 className="text-2xl font-bold text-white">Your Dedicated Loan Officer</h1>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Profile Content - Compact */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-6">
            {/* Avatar and Basic Info */}
            <div className="flex-shrink-0 text-center lg:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg mx-auto lg:mx-0 mb-4">
                <span className="text-3xl font-bold text-blue-600">CF</span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600 text-sm font-medium">(4.9/5)</span>
              </div>

              {/* Quick Contact Buttons */}
              <div className="flex flex-col space-y-2 w-full max-w-xs mx-auto lg:mx-0">
                <button
                  onClick={handleCall}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </button>
                
                <button
                  onClick={handleSendMessage}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </button>
                
                <button
                  onClick={handleScheduleMeeting}
                  className="flex items-center justify-center px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg font-medium bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </button>
              </div>
            </div>

            {/* Essential Contact Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Chris Foster</h2>
                <p className="text-lg text-blue-600 font-semibold mb-1">Senior Loan Officer & Partner</p>
                <p className="text-gray-500 mb-4">The Foster Company</p>

                {/* Essential Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Direct Line</p>
                      <a href="tel:+1234567890" className="font-bold text-blue-600 hover:text-blue-800">
                        (123) 456-7890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href="mailto:chris@fostercompany.com" className="font-bold text-blue-600 hover:text-blue-800">
                        chris@fostercompany.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <p className="font-bold text-gray-900">Mon-Fri, 9 AM - 5 PM EST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Bio */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">About Chris</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Chris Foster brings over 15 years of specialized experience in SBA lending. 
                  As a founding partner of The Foster Company, he has personally guided hundreds of business owners 
                  through the loan process, securing over $50M in funding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">$50M+</div>
          <div className="font-semibold text-green-800 mb-1">Loans Funded</div>
          <div className="text-xs text-gray-600">Successfully closed 300+ SBA loans</div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">500+</div>
          <div className="font-semibold text-blue-800 mb-1">Happy Clients</div>
          <div className="text-xs text-gray-600">Satisfied business owners nationwide</div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">15+</div>
          <div className="font-semibold text-purple-800 mb-1">Years Experience</div>
          <div className="text-xs text-gray-600">Specialized in SBA lending</div>
        </div>
      </div>

      {/* Service Commitments */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Service Commitments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Response within 4 business hours</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Dedicated support throughout process</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Transparent communication</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">No hidden fees or surprises</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Expert guidance at every step</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Post-funding relationship support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Guidelines - White Background */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Communication Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Best Times to Reach Me:</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Monday-Friday: 9:00 AM - 5:00 PM EST</li>
              <li>• Response time: Within 4 business hours</li>
              <li>• Emergency contact available for urgent matters</li>
              <li>• Weekend emails answered Monday morning</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Communication Preferences:</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Email for detailed questions and documents</li>
              <li>• Phone calls for urgent matters</li>
              <li>• Video meetings for complex discussions</li>
              <li>• Text updates for quick status changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}