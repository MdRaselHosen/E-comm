import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const inStock = product.stock > 0 && product.status === 'active'

  return (
    <div className="card h-100 product-card">
      <div className="card-img-top product-placeholder">
        {product.name.charAt(0).toUpperCase()}
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text text-muted small flex-grow-1">
          {product.description || 'No description available.'}
        </p>
        <p className="text-muted small mb-1">SKU: {product.sku}</p>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="h5 mb-0 text-primary">${product.price}</span>
          <span className={`badge ${inStock ? 'bg-success' : 'bg-secondary'}`}>
            {inStock ? `in stock` : 'Out of stock'}
          </span>
        </div>
        <button
          className="btn btn-primary w-100"
          disabled={!inStock}
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
