import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function TestUserSetup() {
  const { signUp } = useAuth()
  const [creating, setCreating] = useState(false)
  const [results, setResults] = useState([])

  const testUsers = [
    {
      email: 'borrower@test.com',
      password: 'password123',
      role: 'borrower',
      name: 'Test Borrower'
    },
    {
      email: 'referral@test.com',
      password: 'password123',
      role: 'referral',
      name: 'Test Referral Partner'
    },
    {
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      name: 'Admin User'
    },
    {
      email: 'chris@fostercompany.com',
      password: 'admin2024',
      role: 'admin',
      name: 'Chris Foster'
    }
  ]

  const createTestUsers = async () => {
    setCreating(true)
    setResults([])
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i]
      
      // Add intermediate result to show progress
      setResults(prev => [...prev, {
        ...user,
        success: null,
        message: 'Creating user...'
      }])
      
      try {
        const { data, error } = await signUp(
          user.email, 
          user.password, 
          {
            role: user.role,
            first_name: user.name.split(' ')[0] || '',
            last_name: user.name.split(' ')[1] || ''
          }
        )
        
        if (error) {
          // Update the existing result
          setResults(prev => prev.map((result, index) => 
            index === i ? {
              ...user,
              success: false,
              message: error.message
            } : result
          ))
        } else {
          // Update the existing result
          setResults(prev => prev.map((result, index) => 
            index === i ? {
              ...user,
              success: true,
              message: 'User created successfully - ready to login'
            } : result
          ))
        }
      } catch (err) {
        // Update the existing result
        setResults(prev => prev.map((result, index) => 
          index === i ? {
            ...user,
            success: false,
            message: err.message || 'Unknown error'
          } : result
        ))
      }
      
      // Small delay between user creations
      if (i < testUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    setCreating(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Test Users</h2>
            <p className="text-gray-600">Set up test accounts for each role</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {testUsers.map((user) => (
            <div key={user.email} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-sm text-gray-600">Password: {user.password}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'borrower' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'referral' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                {results.find(r => r.email === user.email) && (
                  <div className="flex items-center space-x-2">
                    {results.find(r => r.email === user.email)?.success === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : results.find(r => r.email === user.email)?.success === false ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                  </div>
                )}
              </div>
              
              {results.find(r => r.email === user.email) && (
                <div className="mt-2">
                  <p className={`text-sm ${
                    results.find(r => r.email === user.email)?.success === true
                      ? 'text-green-600' 
                      : results.find(r => r.email === user.email)?.success === false
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {results.find(r => r.email === user.email)?.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={createTestUsers}
          disabled={creating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {creating && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{creating ? 'Creating Users...' : 'Create All Test Users'}</span>
        </button>

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Results Summary</h3>
            <p className="text-sm text-gray-600">
              {results.filter(r => r.success === true).length} of {results.length} users created successfully
            </p>
            {results.filter(r => r.success === true).length === results.length && results.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-sm">
                ✅ All users created! You can now login with the credentials above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}