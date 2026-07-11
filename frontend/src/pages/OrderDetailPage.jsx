import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '../api'
import PaymentForm from '../components/PaymentForm'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadOrder = () => {
    ordersApi.get(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!order) return <p>Order not found.</p>

  return (
    <div>
      <Link to="/orders" className="btn btn-link ps-0">&larr; Back to Orders</Link>
      <h2 className="mb-4">Order #{order.id}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-header">Order Items</div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                      <td className="text-end">${item.sub_total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="3">Total</th>
                    <th className="text-end">${order.total_amount}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.status === 'pending' && (
            <div className="card">
              <div className="card-header">Payment</div>
              <div className="card-body">
                <PaymentForm order={order} onPaymentComplete={loadOrder} />
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">Order Info</div>
            <div className="card-body">
              <p><strong>Status:</strong>{' '}
                <span className={`badge ${order.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {order.status}
                </span>
              </p>
              <p><strong>Total:</strong> ${order.total_amount}</p>
              <p className="mb-0"><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
