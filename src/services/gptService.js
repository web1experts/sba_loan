const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

class GPTService {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1/chat/completions'
    this.retryCount = 0
    this.maxRetries = 2
  }

  async sendMessage(message, userContext = {}) {
    if (!OPENAI_API_KEY) {
      return {
        role: 'assistant',
        content: 'Hello! I\'m your SBA loan assistant. While I\'m currently experiencing some technical difficulties, I\'d be happy to help you get started. For immediate assistance, please contact Chris Foster directly at chris@fostercompany.com or (123) 456-7890. You can also use the forms and document upload features while I get back online.'
      }
    }

    const systemPrompt = `You are a helpful onboarding assistant for The Foster Company SBA Loan Dashboard. 

User Context:
- Email: ${userContext.email || 'Unknown'}
- User ID: ${userContext.id || 'Unknown'}
- Role: ${userContext.role || 'borrower'}

Instructions:
- Speak clearly and professionally
- Tailor answers based on user role (borrower, referral, or admin)
- Provide timelines, document upload help, and form guidance
- Direct users to Chris Foster for complex loan questions
- Be helpful with dashboard navigation and SBA loan processes
- Keep responses concise but informative`

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        timeout: 10000 // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        this.retryCount = 0 // Reset retry count on success
        return data.choices[0].message
      } else {
        throw new Error('Invalid response format from OpenAI API')
      }
    } catch (error) {
      console.error('GPT Service Error:', error)
      
      // Retry logic for network errors
      if (this.retryCount < this.maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        this.retryCount++
        console.log(`Retrying GPT request (attempt ${this.retryCount}/${this.maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount)) // Exponential backoff
        return this.sendMessage(message, userContext)
      }
      
      this.retryCount = 0 // Reset retry count
      
      // Provide helpful fallback message based on error type
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return {
          role: 'assistant',
          content: 'I\'m currently experiencing authentication issues. While I work on reconnecting, please feel free to use the application features or contact Chris Foster directly at chris@fostercompany.com for immediate assistance.'
        }
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        return {
          role: 'assistant',
          content: 'I\'m experiencing high demand right now. Please try again in a moment, or contact Chris Foster at chris@fostercompany.com for immediate assistance with your SBA loan questions.'
        }
      } else {
        return {
          role: 'assistant',
          content: 'I\'m temporarily unavailable, but don\'t worry! You can still complete your loan application using the forms and document upload features. For immediate assistance, please contact Chris Foster at chris@fostercompany.com or (123) 456-7890.'
        }
      }
    }
  }
}

export const gptService = new GPTService()