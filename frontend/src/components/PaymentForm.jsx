import { useState } from 'react'
import { paymentsApi } from '../api'

export default function PaymentForm({ order, onPaymentComplete }) {
  const [provider, setProvider] = useState('stripe')
  const [paymentResult, setPaymentResult] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleInitialize = async () => {
    setError('')
    setMessage('')
    try {
      const { data } = await paymentsApi.initialize({
        order_id: order.id,
        provider,
        amount: order.total_amount,
        currency: 'bdt',
      })
      setPaymentResult(data)
      setMessage('Payment initialized. Complete payment then confirm.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment initialization failed')
    }
  }

  const handleConfirm = async () => {
    if (!paymentResult?.transaction_id) return
    setError('')
    setMessage('')
    try {
      await paymentsApi.confirm({
        transaction_id: paymentResult.transaction_id,
        provider,
      })
      setMessage('Payment confirmed successfully!')
      onPaymentComplete?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment confirmation failed')
    }
  }

  const handleCheckStatus = async () => {
    if (!paymentResult?.transaction_id) return
    setError('')
    try {
      const { data } = await paymentsApi.status({
        transaction_id: paymentResult.transaction_id,
        provider,
      })
      setMessage(`Payment status: ${data.status}`)
      onPaymentComplete?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check status')
    }
  }

  if (order.status !== 'pending') {
    return (
      <div className="alert alert-success mb-0">
        This order has been paid. Status: <strong>{order.status}</strong>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="mb-3">
        <label className="form-label">Payment Provider</label>
        <select
          className="form-select"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="stripe">Stripe</option>
          <option value="bkash">bKash</option>
        </select>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button className="btn btn-primary" onClick={handleInitialize}>
          Initialize Payment
        </button>
        {paymentResult && (
          <>
            <button className="btn btn-success" onClick={handleConfirm}>
              Confirm Payment
            </button>
            <button className="btn btn-outline-secondary" onClick={handleCheckStatus}>
              Check Status
            </button>
          </>
        )}
      </div>

      {paymentResult && (
        <div className="bg-light p-3 rounded">
          <p className="mb-1"><strong>Transaction ID:</strong> {paymentResult.transaction_id}</p>
          {paymentResult.client_secret && (
            <p className="mb-1"><strong>Client Secret:</strong> {paymentResult.client_secret}</p>
          )}
          {paymentResult.checkout_url && (
            <p className="mb-0">
              <strong>Checkout URL:</strong>{' '}
              <a href={paymentResult.checkout_url} target="_blank" rel="noreferrer">
                Open bKash Checkout
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
