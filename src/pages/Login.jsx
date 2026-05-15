import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-grid" aria-hidden="true" />
      <div className="login-box">
        <div className="login-sheen" aria-hidden="true" />
        <div className="login-brand">
          <span className="login-logo" aria-hidden="true">
            <span className="login-logo-inner">LM</span>
          </span>
          <div>
            <h1>License Manager Console</h1>
            <p className="login-tagline">Secure access for license operations</p>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="login-console-note">
          Manage customer entitlements, hardware bindings, expiration policies, and license revocation from a controlled administrator workspace.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footnote">
          <p>Default credentials</p>
          <p>
            <strong>admin</strong> / <strong>admin123</strong>
          </p>
          <p className="login-warning">Change the password after first login.</p>
        </div>
      </div>
    </div>
  )
}
