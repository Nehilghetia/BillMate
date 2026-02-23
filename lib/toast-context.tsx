'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (message: string, type: ToastType) => void
    removeToast: (id: string) => void
    toast: {
        success: (message: string) => void
        error: (message: string) => void
        info: (message: string) => void
        warning: (message: string) => void
        loading: (message: string) => string
        dismiss: (id: string) => void
    }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, message, type }
        setToasts((prev) => [...prev, newToast])

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id)
        }, 3000)
        return id
    }

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    const toastHelpers = {
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        info: (msg: string) => addToast(msg, 'info'),
        warning: (msg: string) => addToast(msg, 'warning'),
        loading: (msg: string) => addToast(msg, 'info'), // Map loading to info for simplicity
        dismiss: (id: string) => removeToast(id)
    }

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastHelpers }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
                            min-w-[300px] p-4 rounded-lg shadow-lg border flex items-center justify-between animate-in slide-in-from-right-full fade-in duration-300
                            ${t.type === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
                            ${t.type === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
                            ${t.type === 'info' ? 'bg-white border-blue-200 text-blue-800' : ''}
                            ${t.type === 'warning' ? 'bg-white border-yellow-200 text-yellow-800' : ''}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                            <span className="text-sm font-medium">{t.message}</span>
                        </div>
                        <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
