import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children, requireSuperuser = false }) {
  const { isAuthenticated, isStaff, isSuperuser } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireSuperuser && !isSuperuser) {
    return <Navigate to="/" replace />
  }

  if (!requireSuperuser && !isStaff) {
    return <Navigate to="/" replace />
  }

  return children
}
