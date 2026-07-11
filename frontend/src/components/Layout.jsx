import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">E-Shop</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Shop</Link>
              </li>
              {isAuthenticated && (
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">My Orders</Link>
                </li>
              )}
            </ul>
            <ul className="navbar-nav align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <Link className="nav-link position-relative" to="/cart">
                  Cart
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-light-emphasis">{user.email}</span>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-primary btn-sm" to="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>

      <footer className="bg-light border-top py-4 mt-auto">
        <div className="container text-center text-muted">
          <small>&copy; 2026 E-Shop. All rights reserved.</small>
        </div>
      </footer>
    </>
  )
}
