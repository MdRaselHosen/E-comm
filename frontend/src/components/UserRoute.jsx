import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UserRoute({ children }) {
  const { isAuthenticated, isStaff } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isStaff) {
    return <Navigate to="/admin/orders" replace />
  }

  return children
}
