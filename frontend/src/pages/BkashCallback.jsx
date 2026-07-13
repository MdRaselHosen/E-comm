import { useEffect, useState, useRef } from 'react'; // 1. Import useRef
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../api';

export default function BkashCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Verifying payment with bKash...');
  const [error, setError] = useState('');
  
  const hasExecuted = useRef(false);

  useEffect(() => {
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (status === 'success' && paymentID) {
      if (hasExecuted.current) return;
      hasExecuted.current = true;

      paymentsApi.confirm({
        transaction_id: paymentID,
        provider: 'bkash'
      })
      .then(() => {
        setStatusMessage('Payment verified successfully! Redirecting...');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'bKash verification failed.');
      });
    } else {
      setError('Payment was cancelled or failed at the gateway.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="container text-center py-5">
      <div className="card shadow p-4 max-w-md mx-auto">
        {error ? (
          <div>
            <div className="alert alert-danger mb-4">{error}</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
          </div>
        ) : (
          <div>
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <h4>{statusMessage}</h4>
          </div>
        )}
      </div>
    </div>
  );
}