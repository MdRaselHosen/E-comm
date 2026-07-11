import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ordersApi } from '../api'
import { useCart } from '../context/CartContext'
import PaymentForm from '../components/PaymentForm'

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (items.length === 0 && !order) {
    return (
      <div className="text-center py-5">
        <h2>Nothing to Checkout</h2>
        <p className="text-muted mb-4">Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">Go to Shop</Link>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const orderItems = items.map((i) => ({ product: i.productId, quantity: i.quantity }))
      const { data } = await ordersApi.create({ items: orderItems, status: 'pending' })
      clearCart()
      setOrder(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const reloadOrder = async () => {
    if (!order) return
    const { data } = await ordersApi.get(order.id)
    setOrder(data)
  }

  if (order) {
    return (
      <div>
        <div className="alert alert-success">
          Order <strong>#{order.id}</strong> placed successfully! Complete payment below.
        </div>

        <div className="row">
          <div className="col-lg-7">
            <div className="card mb-4">
              <div className="card-header">Payment</div>
              <div className="card-body">
                <PaymentForm order={order} onPaymentComplete={reloadOrder} />
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card">
              <div className="card-header">Order #{order.id}</div>
              <div className="card-body">
                <table className="table table-sm">
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product} x {item.quantity}</td>
                        <td className="text-end">${item.sub_total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>Total</th>
                      <th className="text-end">${order.total_amount}</th>
                    </tr>
                  </tfoot>
                </table>
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  View Order Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-header">Cart Items</div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Link to="/cart" className="btn btn-link ps-0">&larr; Back to Cart</Link>
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">Order Summary</div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <strong className="text-primary fs-5">${cartTotal.toFixed(2)}</strong>
              </div>
              <button
                className="btn btn-primary w-100 btn-lg"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
