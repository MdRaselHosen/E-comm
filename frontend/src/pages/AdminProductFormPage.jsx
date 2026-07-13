import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsApi } from '../api'

const emptyForm = {
  id: '',
  name: '',
  sku: '',
  description: '',
  price: '',
  stock: '',
  status: 'active',
}

export default function AdminProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return

    productsApi.get(id)
      .then(({ data }) => setForm({
        id: data.id,
        name: data.name,
        sku: data.sku,
        description: data.description || '',
        price: data.price,
        stock: data.stock,
        status: data.status,
      }))
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      ...form,
      price: form.price,
      stock: Number(form.stock),
    }

    try {
      if (isEdit) {
        await productsApi.update(id, payload)
      } else {
        await productsApi.create(payload)
      }
      navigate('/admin/products')
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object' && data !== null) {
        const messages = Object.entries(data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ')
        setError(messages || 'Failed to save product')
      } else {
        setError('Failed to save product')
      }
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
      <Link to="/admin/products" className="btn btn-link ps-0">
        &larr; Back to Products
      </Link>
      <h2 className="mb-4">{isEdit ? 'Edit Product' : 'Add Product'}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Product ID</label>
              <input
                type="text"
                className="form-control"
                name="id"
                value={form.id}
                onChange={handleChange}
                required
                disabled={isEdit}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">SKU</label>
              <input
                type="text"
                className="form-control"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
