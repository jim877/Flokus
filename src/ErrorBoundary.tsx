import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TaskFlow error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#0F172A', marginBottom: 8 }}>Something went wrong</h1>
          <pre style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: '#6B7280', marginTop: 16 }}>
            Check the browser console (F12 → Console) for details.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
