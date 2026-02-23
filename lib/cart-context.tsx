'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Product {
    id: string
    name: string
    description: string
    price: number
    category: string
    images?: string[]
}

export interface CartItem {
    productId: string
    quantity: number
    product: Product
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (product: Product) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    // Load Cart from LocalStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('billmate_cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart')
            }
        }
    }, [])

    // Save Cart to LocalStorage
    useEffect(() => {
        localStorage.setItem('billmate_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.productId === product.id)
            if (existingItem) {
                return prevCart.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prevCart, { productId: product.id, quantity: 1, product }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.productId !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
        } else {
            setCart((prevCart) =>
                prevCart.map((item) =>
                    item.productId === productId ? { ...item, quantity } : item
                )
            )
        }
    }

    const clearCart = () => {
        setCart([])
    }

    const cartTotal = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    )

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
