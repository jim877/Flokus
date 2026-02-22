import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name || undefined)
        if (error) setMessage({ type: 'error', text: error.message })
        else setMessage({ type: 'success', text: 'Check your email to confirm your account.' })
      } else {
        const { error } = await signIn(email, password)
        if (error) setMessage({ type: 'error', text: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Fókusz</h1>
          <p className="text-neutral-gray mt-1">Sign in to your workspace</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-card bg-white dark:bg-slate-800 p-6 shadow-card">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[var(--text)]"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[var(--text)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[var(--text)]"
              placeholder="••••••••"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-success'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-teal-dark text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="w-full text-sm text-teal-dark hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </form>
      </div>
    </div>
  )
}
