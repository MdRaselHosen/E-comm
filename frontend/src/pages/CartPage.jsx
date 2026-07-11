import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <h2>Your Cart is Empty</h2>
        <p className="text-muted mb-4">Add some products to get started.</p>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Shopping Cart</h2>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '140px' }}>Price</th>
                    <th style={{ width: '160px' }}>Quantity</th>
                    <th style={{ width: '100px' }}>Subtotal</th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <strong>{item.name}</strong>
                        <br />
                        <small className="text-muted">Max stock: {item.stock}</small>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <div className="input-group input-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="form-control text-center"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, e.target.value)}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Link to="/" className="btn btn-link ps-0 mt-3">&larr; Continue Shopping</Link>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">Order Summary</div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong className="text-primary">${cartTotal.toFixed(2)}</strong>
              </div>
              <button className="btn btn-primary w-100 btn-lg" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
              {!isAuthenticated && (
                <p className="text-muted small mt-2 mb-0 text-center">
                  You will be asked to login before checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
