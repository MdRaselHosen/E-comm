import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../api'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProducts = () => {
    setLoading(true)
    productsApi.list()
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete product ${id}?`)) return

    try {
      await productsApi.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Failed to delete product')
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Manage Products</h2>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          Add Product
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {products.length === 0 ? (
        <div className="alert alert-info">No products found.</div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="btn btn-sm btn-outline-primary me-1"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
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
