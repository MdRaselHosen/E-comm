import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../api'

const statusBadge = {
  pending: 'bg-warning text-dark',
  paid: 'bg-success',
  canceled: 'bg-secondary',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.list()
      .then(({ data }) => setOrders(data))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId, status) => {
    try {
      const { data } = await ordersApi.update(orderId, { status })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? data : order)))
    } catch {
      setError('Failed to update order status')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">All Orders</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 ? (
        <div className="alert alert-info">No orders found.</div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order #</th>
                  <th>User ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user}</td>
                    <td>${order.total_amount}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="canceled">canceled</option>
                      </select>
                    </td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
