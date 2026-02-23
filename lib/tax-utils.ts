
export function calculateTax(product: { price: number; category: string }): number {
    const price = product.price
    const category = product.category.toLowerCase()

    // 0% (Nil Rated)
    if (['fresh food', 'vegetables', 'fruits', 'milk', 'newspapers', 'books'].some(c => category.includes(c))) {
        return 0
    }

    // 5% Rate
    if (['packaged food', 'medicine'].some(c => category.includes(c))) {
        return price * 0.05
    }
    if (category.includes('apparel') || category.includes('clothing')) {
        return price <= 1000 ? price * 0.05 : price * 0.12
    }
    if (category.includes('footwear') || category.includes('shoe')) {
        return price <= 500 ? price * 0.05 : price * 0.12
    }

    // 12% Rate
    if (category.includes('processed food')) {
        return price * 0.12
    }

    // 28% Rate
    if (['luxury', 'tobacco', 'aerated drinks', 'ac', 'washing machine'].some(c => category.includes(c))) {
        return price * 0.28
    }

    // Default to 18% (Consumer goods, electronics, etc.)
    return price * 0.18
}

export function getTaxRatePercent(product: { price: number; category: string }): string {
    const tax = calculateTax(product)
    const price = product.price
    if (price === 0) return '0%'
    const rate = Math.round((tax / price) * 100)
    return `${rate}%`
}
