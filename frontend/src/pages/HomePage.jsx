import { useEffect, useState } from 'react'
import { productsApi } from '../api'
import ProductCard from '../components/ProductCard'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi.list()
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="hero-section rounded mb-4">
        <div className="hero-content">
          <h1 className="display-5 fw-bold">Welcome to E-Shop</h1>
          <p className="lead mb-0">Browse products, add to cart, and checkout securely.</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Our Products</h2>
        <span className="text-muted">{products.length} items</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="alert alert-info">No products available.</div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {products.map((product) => (
            <div className="col" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
