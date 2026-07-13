import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import UserRoute from './components/UserRoute'
import AdminRoute from './components/AdminRoute'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminProductFormPage from './pages/AdminProductFormPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import BkashCallback from './pages/BkashCallback';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={
                <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              } />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="/payment/bkash/callback" element={<BkashCallback />} />
              <Route path="orders" element={
                <UserRoute><OrdersPage /></UserRoute>
              } />
              <Route path="orders/:id" element={
                <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
              } />
              <Route path="admin/products" element={
                <AdminRoute requireSuperuser><AdminProductsPage /></AdminRoute>
              } />
              <Route path="admin/products/new" element={
                <AdminRoute requireSuperuser><AdminProductFormPage /></AdminRoute>
              } />
              <Route path="admin/products/:id/edit" element={
                <AdminRoute requireSuperuser><AdminProductFormPage /></AdminRoute>
              } />
              <Route path="admin/orders" element={
                <AdminRoute><AdminOrdersPage /></AdminRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
