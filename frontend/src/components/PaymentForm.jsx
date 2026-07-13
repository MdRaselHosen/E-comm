import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { paymentsApi } from '../api'
import { useNavigate } from 'react-router-dom';

export default function PaymentForm({ order, onPaymentComplete }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [provider, setProvider] = useState('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { data } = await paymentsApi.initialize({
        order_id: order.id,
        provider,
        amount: order.total_amount,
        currency: provider === 'bkash' ? 'BDT' : 'bdt',
      })

      if (provider === 'stripe') {
        if (!stripe || !elements) {
          setError('Stripe has not loaded properly.')
          setLoading(false)
          return
        }

        const cardElement = elements.getElement(CardElement)
        const stripeResult = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: {
            card: cardElement,
          },
        })

        if (stripeResult.error) {
          setError(stripeResult.error.message)
          setLoading(false)
          return
        }

        if (stripeResult.paymentIntent.status === 'succeeded' || stripeResult.paymentIntent.status === 'processing') {
          await paymentsApi.confirm({
            transaction_id: stripeResult.paymentIntent.id,
            provider,
          })
          setMessage('Payment confirmed successfully!')
          onPaymentComplete?.()
          navigate('/');
        }
      } else if (provider === 'bkash') {
        if (data.checkout_url) {
          window.location.href = data.checkout_url
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment processing failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmitPayment}>
        <div className="mb-3">
          <label className="form-label">Payment Provider</label>
          <select
            className="form-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading}
          >
            <option value="stripe">Stripe</option>
            <option value="bkash">bKash</option>
          </select>
        </div>

        {provider === 'stripe' && (
          <div className="mb-4 p-3 border rounded bg-white">
            <label className="form-label">Credit or Debit Card</label>
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Processing...' : `Pay $${order.total_amount} via ${provider === 'stripe' ? 'Stripe' : 'bKash'}`}
        </button>
      </form>
    </div>
  )
}
