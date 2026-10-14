/**
 * ============================================================================
 * UNIT TEST SUITE: Core Business Logic (Pricing & Coupon Engine)
 * STLC Phase: 2 — Component / Unit Testing
 * Framework: Jest 29+
 * Target Module: src/utils/pricing.js
 * Test Design Techniques: Equivalence Partitioning (EP),
 *                         Boundary Value Analysis (BVA),
 *                         Error Guessing & Negative Testing
 * ============================================================================
 */

const {
    calculateSubtotal,
    validateCoupon,
    calculateTotal,
    COUPONS,
} = require('../../src/utils/pricing');

describe('Suite 1: calculateSubtotal(items)', () => {

    // --- Equivalence Partitioning (Valid Partition) ---
    test('TC-UNIT-001 [EP - Valid]: Calculates subtotal for multiple valid items with integer quantities', () => {
        const cart = [
            { id: 1, name: 'Margherita', price: 8.99, quantity: 2 },
            { id: 7, name: 'Chicken Wings', price: 7.99, quantity: 1 },
            { id: 9, name: 'Cola', price: 1.99, quantity: 3 },
        ];
        // 8.99*2 (17.98) + 7.99*1 (7.99) + 1.99*3 (5.97) = 31.94
        const subtotal = calculateSubtotal(cart);
        expect(subtotal).toBe(31.94);
    });

    test('TC-UNIT-002 [EP - Single Item]: Calculates subtotal for a single item of quantity 1', () => {
        const cart = [{ id: 2, name: 'Pepperoni', price: 10.99, quantity: 1 }];
        expect(calculateSubtotal(cart)).toBe(10.99);
    });

    // --- Boundary Value Analysis ---
    test('TC-UNIT-003 [BVA - Precision]: Accurately rounds fractional cents to avoid IEEE 754 precision bugs', () => {
        const cart = [
            { price: 8.99, quantity: 1 },
            { price: 10.99, quantity: 1 },
            { price: 11.49, quantity: 1 },
            { price: 1.99, quantity: 1 },
        ];
        // 8.99 + 10.99 + 11.49 + 1.99 = 33.46 (floating point test)
        expect(calculateSubtotal(cart)).toBe(33.46);
    });

    test('TC-UNIT-004 [BVA - Zero Price]: Allows complimentary promotion items with price $0.00', () => {
        const cart = [
            { price: 12.99, quantity: 1 },
            { price: 0.00, quantity: 2 }, // Free dip or sauce promo
        ];
        expect(calculateSubtotal(cart)).toBe(12.99);
    });

    // --- Negative / Error Handling Tests ---
    test('TC-UNIT-005 [Negative - Empty Array]: Throws an error when passed an empty cart array', () => {
        expect(() => calculateSubtotal([])).toThrow('Items must be a non-empty array');
    });

    test('TC-UNIT-006 [Negative - Non-Array]: Throws an error when passed null, undefined, or non-array types', () => {
        expect(() => calculateSubtotal(null)).toThrow('Items must be a non-empty array');
        expect(() => calculateSubtotal(undefined)).toThrow('Items must be a non-empty array');
        expect(() => calculateSubtotal('not-an-array')).toThrow('Items must be a non-empty array');
        expect(() => calculateSubtotal({ price: 10, quantity: 1 })).toThrow('Items must be a non-empty array');
    });

    test('TC-UNIT-007 [Negative - Negative Price]: Throws an error when an item has a negative price', () => {
        const invalidCart = [{ price: -5.99, quantity: 1 }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid non-negative price');
    });

    test('TC-UNIT-008 [Negative - Non-Numeric Price]: Throws an error when price is non-numeric or string', () => {
        const invalidCart = [{ price: '10.99', quantity: 1 }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid non-negative price');
    });

    test('TC-UNIT-009 [Negative - Zero Quantity]: Throws an error when quantity is 0', () => {
        const invalidCart = [{ price: 9.99, quantity: 0 }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid positive integer quantity');
    });

    test('TC-UNIT-010 [Negative - Negative Quantity]: Throws an error when quantity is negative', () => {
        const invalidCart = [{ price: 9.99, quantity: -2 }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid positive integer quantity');
    });

    test('TC-UNIT-011 [Negative - Float Quantity]: Throws an error when quantity is a fractional float', () => {
        const invalidCart = [{ price: 9.99, quantity: 1.5 }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid positive integer quantity');
    });

    test('TC-UNIT-012 [Negative - String Quantity]: Throws an error when quantity is a non-number', () => {
        const invalidCart = [{ price: 9.99, quantity: 'two' }];
        expect(() => calculateSubtotal(invalidCart)).toThrow('Each item must have a valid positive integer quantity');
    });
});

describe('Suite 2: validateCoupon(code)', () => {

    // --- Equivalence Partitioning (Valid Codes) ---
    test('TC-UNIT-013 [EP - Valid Coupon]: Validates all active promotional coupons correctly', () => {
        const expectedCoupons = [
            { code: 'WELCOME10', percent: 10, desc: '10% off your first order' },
            { code: 'PIZZA20',   percent: 20, desc: '20% off any pizza order' },
            { code: 'STUDENT15', percent: 15, desc: '15% student discount' },
            { code: 'FEAST25',   percent: 25, desc: '25% off orders over $30' },
        ];

        expectedCoupons.forEach(({ code, percent, desc }) => {
            const result = validateCoupon(code);
            expect(result.valid).toBe(true);
            expect(result.discount_percent).toBe(percent);
            expect(result.description).toBe(desc);
        });
    });

    test('TC-UNIT-014 [EP - Case Insensitivity]: Normalizes lowercase and mixed-case coupon strings', () => {
        expect(validateCoupon('welcome10')).toEqual({
            valid: true,
            discount_percent: 10,
            description: '10% off your first order',
        });
        expect(validateCoupon('StUdEnT15')).toEqual({
            valid: true,
            discount_percent: 15,
            description: '15% student discount',
        });
    });

    // --- Boundary Value Analysis (Whitespace Trimming) ---
    test('TC-UNIT-015 [BVA - Whitespace Trimming]: Trims leading and trailing spaces around valid codes', () => {
        expect(validateCoupon('   PIZZA20   ')).toEqual({
            valid: true,
            discount_percent: 20,
            description: '20% off any pizza order',
        });
        expect(validateCoupon('\tFEAST25\n')).toEqual({
            valid: true,
            discount_percent: 25,
            description: '25% off orders over $30',
        });
    });

    // --- Negative / Invalid Partitions ---
    test('TC-UNIT-016 [Negative - Unknown Code]: Returns valid: false for unrecognized coupon code', () => {
        const result = validateCoupon('EXPIRED99');
        expect(result.valid).toBe(false);
        expect(result.discount_percent).toBe(0);
        expect(result.description).toBe('Coupon not found');
    });

    test('TC-UNIT-017 [Negative - Empty & Blank String]: Rejects empty string or whitespace-only code', () => {
        expect(validateCoupon('')).toEqual({
            valid: false,
            discount_percent: 0,
            description: 'Invalid coupon code',
        });
        expect(validateCoupon('     ')).toEqual({
            valid: false,
            discount_percent: 0,
            description: 'Invalid coupon code',
        });
    });

    test('TC-UNIT-018 [Negative - Non-String Types]: Gracefully handles null, undefined, numbers, and objects', () => {
        const nonStrings = [null, undefined, 12345, {}, [], true];
        nonStrings.forEach(input => {
            const result = validateCoupon(input);
            expect(result.valid).toBe(false);
            expect(result.discount_percent).toBe(0);
            expect(result.description).toBe('Invalid coupon code');
        });
    });
});

describe('Suite 3: calculateTotal(subtotal, discountPercent)', () => {

    // --- Equivalence Partitioning (Valid Partition) ---
    test('TC-UNIT-019 [EP - Standard Discount]: Applies standard 10% discount on $20.00 correctly', () => {
        const result = calculateTotal(20.00, 10);
        expect(result).toEqual({
            discount: 2.00,
            final_price: 18.00,
        });
    });

    test('TC-UNIT-020 [EP - 25% Discount]: Applies 25% discount on $40.00 subtotal', () => {
        const result = calculateTotal(40.00, 25);
        expect(result).toEqual({
            discount: 10.00,
            final_price: 30.00,
        });
    });

    // --- Boundary Value Analysis ---
    test('TC-UNIT-021 [BVA - Lower Bound: 0%]: 0% discount yields $0.00 discount and unchanged final price', () => {
        const result = calculateTotal(35.50, 0);
        expect(result).toEqual({
            discount: 0.00,
            final_price: 35.50,
        });
    });

    test('TC-UNIT-022 [BVA - Upper Bound: 100%]: 100% discount yields 100% discount and $0.00 final price', () => {
        const result = calculateTotal(50.00, 100);
        expect(result).toEqual({
            discount: 50.00,
            final_price: 0.00,
        });
    });

    test('TC-UNIT-023 [BVA - Cent Rounding]: Accurately rounds fractional cents (half-up rounding)', () => {
        // 11.49 * 15% = 1.7235 -> discount = 1.72, final_price = 11.49 - 1.72 = 9.77
        const result = calculateTotal(11.49, 15);
        expect(result).toEqual({
            discount: 1.72,
            final_price: 9.77,
        });
    });

    test('TC-UNIT-024 [BVA - Zero Subtotal]: 0 subtotal yields 0 discount and 0 final price', () => {
        const result = calculateTotal(0, 20);
        expect(result).toEqual({
            discount: 0.00,
            final_price: 0.00,
        });
    });

    // --- Negative / Out-of-Bounds Tests ---
    test('TC-UNIT-025 [Negative - Negative Subtotal]: Throws an error for negative subtotal', () => {
        expect(() => calculateTotal(-10.00, 10)).toThrow('Subtotal must be a non-negative number');
    });

    test('TC-UNIT-026 [Negative - Non-Numeric Subtotal]: Throws an error for non-number subtotal', () => {
        expect(() => calculateTotal('20.00', 10)).toThrow('Subtotal must be a non-negative number');
        expect(() => calculateTotal(null, 10)).toThrow('Subtotal must be a non-negative number');
    });

    test('TC-UNIT-027 [Negative - Negative Discount]: Throws an error for discountPercent < 0', () => {
        expect(() => calculateTotal(50.00, -1)).toThrow('Discount percent must be a number between 0 and 100');
    });

    test('TC-UNIT-028 [Negative - Excessive Discount]: Throws an error for discountPercent > 100', () => {
        expect(() => calculateTotal(50.00, 101)).toThrow('Discount percent must be a number between 0 and 100');
        expect(() => calculateTotal(50.00, 150)).toThrow('Discount percent must be a number between 0 and 100');
    });

    test('TC-UNIT-029 [Negative - Non-Numeric Discount]: Throws an error for non-number discount percent', () => {
        expect(() => calculateTotal(50.00, '10%')).toThrow('Discount percent must be a number between 0 and 100');
        expect(() => calculateTotal(50.00, undefined)).toThrow('Discount percent must be a number between 0 and 100');
    });
});
