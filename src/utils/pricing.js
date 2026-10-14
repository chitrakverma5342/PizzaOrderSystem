/**
 * pricing.js — Pure business logic functions
 *
 * These functions are intentionally kept free of Express req/res objects
 * so they can be imported and unit-tested directly with Jest.
 */

// Hardcoded coupon directory — in a real app this would live in the DB
const COUPONS = {
    'WELCOME10': { discount_percent: 10, description: '10% off your first order' },
    'PIZZA20':   { discount_percent: 20, description: '20% off any pizza order' },
    'STUDENT15': { discount_percent: 15, description: '15% student discount' },
    'FEAST25':   { discount_percent: 25, description: '25% off orders over $30' },
};

/**
 * Calculates the subtotal for an array of cart items.
 * Each item must have `price` (number) and `quantity` (positive integer).
 *
 * @param {Array<{price: number, quantity: number}>} items
 * @returns {number} The subtotal rounded to 2 decimal places.
 * @throws {Error} If items is not a non-empty array or contains invalid entries.
 */
function calculateSubtotal(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Items must be a non-empty array');
    }

    for (const item of items) {
        if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error('Each item must have a valid non-negative price');
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error('Each item must have a valid positive integer quantity');
        }
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.round(subtotal * 100) / 100;
}

/**
 * Validates a coupon code.
 *
 * @param {string} code — The coupon code to validate (case-insensitive).
 * @returns {{ valid: boolean, discount_percent: number, description: string }}
 */
function validateCoupon(code) {
    if (typeof code !== 'string' || code.trim() === '') {
        return { valid: false, discount_percent: 0, description: 'Invalid coupon code' };
    }

    const coupon = COUPONS[code.trim().toUpperCase()];

    if (!coupon) {
        return { valid: false, discount_percent: 0, description: 'Coupon not found' };
    }

    return {
        valid: true,
        discount_percent: coupon.discount_percent,
        description: coupon.description,
    };
}

/**
 * Calculates the final price after applying a discount percentage.
 *
 * @param {number} subtotal — The cart subtotal (must be >= 0).
 * @param {number} discountPercent — The discount percentage (0–100).
 * @returns {{ discount: number, final_price: number }}
 * @throws {Error} If inputs are out of valid range.
 */
function calculateTotal(subtotal, discountPercent) {
    if (typeof subtotal !== 'number' || subtotal < 0) {
        throw new Error('Subtotal must be a non-negative number');
    }

    if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
        throw new Error('Discount percent must be a number between 0 and 100');
    }

    const discount = Math.round((subtotal * discountPercent / 100) * 100) / 100;
    const final_price = Math.round((subtotal - discount) * 100) / 100;

    return { discount, final_price };
}

module.exports = {
    calculateSubtotal,
    validateCoupon,
    calculateTotal,
    COUPONS,
};
