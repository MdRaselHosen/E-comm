import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const CART_KEY = 'cart'

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const wasAuthenticated = useRef(isAuthenticated)
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setItems([])
      localStorage.removeItem(CART_KEY)
    }
    wasAuthenticated.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } else {
      localStorage.removeItem(CART_KEY)
    }
  }, [items])

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        const quantity = Math.min(existing.quantity + 1, product.stock)
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity, stock: product.stock } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          stock: product.stock,
          quantity: 1,
        },
      ]
    })
  }

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    const qty = parseInt(quantity, 10)
    if (Number.isNaN(qty) || qty <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i
      )
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
