const { test, expect } = require('@playwright/test');

/**
 * ============================================================================
 * PLAYWRIGHT E2E UI TEST SUITE — Pizza Palace
 * STLC Phase: 4 — End-to-End System & UI Acceptance Testing
 * Target Environment: http://localhost:3000
 * ============================================================================
 */

test.describe('Pizza Palace — End-to-End Browser Automation Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure a clean state before each test scenario
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  /**
   * TC-E2E-001: The Complete Happy Path User Journey
   * Login ➔ Address Setup ➔ Menu Filter ➔ Add to Cart ➔ Coupon Discount ➔ Checkout ➔ Order Confirmation
   */
  test('TC-E2E-001: Complete Happy Path Ordering Journey from Login to Confirmation', async ({ page }) => {
    // 1. Verify Screen 1 (Login Screen) is displayed
    const loginScreen = page.getByTestId('screen-login');
    await expect(loginScreen).toBeVisible();

    const emailInput = page.getByTestId('login-email-input');
    const passwordInput = page.getByTestId('login-password-input');
    const loginSubmitBtn = page.getByTestId('login-submit-btn');

    await expect(emailInput).toHaveValue('student@univ.edu');
    await expect(passwordInput).toHaveValue('pizza123');

    // Submit login
    await loginSubmitBtn.click();

    // 2. Verify Screen 2 (Address Setup) is displayed
    const addressScreen = page.getByTestId('screen-address');
    await expect(addressScreen).toBeVisible();

    const nameInput = page.getByTestId('addr-name-input');
    const streetInput = page.getByTestId('addr-street-input');
    const saveAddrBtn = page.getByTestId('save-address-btn');

    await expect(nameInput).toHaveValue('Alex Morgan');
    await expect(streetInput).toHaveValue('742 Evergreen Terrace, Apt 4B');

    // Save address and proceed
    await saveAddrBtn.click();

    // 3. Verify Screen 3 (Main Store) loads
    const mainScreen = page.getByTestId('screen-main');
    await expect(mainScreen).toBeVisible();

    // Verify navbar displays user session
    await expect(page.getByTestId('user-pill')).toContainText('student@univ.edu');

    // 4. Test Category Filter (Classic Pizzas)
    const pizzaFilterBtn = page.locator('button[data-category="pizza"]');
    await pizzaFilterBtn.click();

    // Verify exactly 5 pizzas are shown
    const visibleCards = page.locator('.menu-card');
    await expect(visibleCards).toHaveCount(5);

    // 5. Add Items to Cart: Margherita ($8.99) and Pepperoni ($10.99)
    const addMargheritaBtn = page.getByTestId('add-to-cart-1');
    const addPepperoniBtn = page.getByTestId('add-to-cart-2');

    await addMargheritaBtn.click();
    await addPepperoniBtn.click();

    // Verify cart count badge displays 2
    const cartCount = page.getByTestId('cart-count');
    await expect(cartCount).toHaveText('2');

    // 6. Open Cart Drawer & Verify Subtotal
    const cartToggle = page.getByTestId('cart-toggle');
    await cartToggle.click();

    const cartSidebar = page.getByTestId('cart-sidebar');
    await expect(cartSidebar).toHaveClass(/open/);

    const subtotalEl = page.getByTestId('subtotal');
    // 8.99 + 10.99 = 19.98
    await expect(subtotalEl).toHaveText('$19.98');

    // 7. Apply Promo Code 'WELCOME10' (10% Discount)
    const couponInput = page.getByTestId('coupon-input');
    const applyCouponBtn = page.getByTestId('apply-coupon-btn');

    await couponInput.fill('WELCOME10');
    await applyCouponBtn.click();

    // Verify coupon feedback message
    const couponMsg = page.getByTestId('coupon-message');
    await expect(couponMsg).toHaveText(/10% off your first order/);

    // Verify discount row is visible (-$2.00)
    const discountRow = page.getByTestId('discount-row');
    await expect(discountRow).toBeVisible();
    await expect(page.getByTestId('discount-amount')).toHaveText('-$2.00');

    // Verify final total: 19.98 - 2.00 = 17.98
    const finalTotal = page.getByTestId('final-total');
    await expect(finalTotal).toHaveText('$17.98');

    // 8. Proceed to Checkout
    const checkoutBtn = page.getByTestId('checkout-btn');
    await checkoutBtn.click();

    const checkoutModal = page.getByTestId('checkout-modal');
    await expect(checkoutModal).toBeVisible();

    // Verify customer info was pre-filled from address onboarding step
    await expect(page.getByTestId('input-name')).toHaveValue('Alex Morgan');
    await expect(page.getByTestId('input-address')).toContainText('742 Evergreen Terrace');
    await expect(page.getByTestId('checkout-total-price')).toHaveText('$17.98');

    // 9. Confirm & Place Order
    const placeOrderBtn = page.getByTestId('place-order-btn');
    await placeOrderBtn.click();

    // 10. Verify Order Confirmation Modal
    const confirmationModal = page.getByTestId('confirmation-modal');
    await expect(confirmationModal).toBeVisible();

    const confirmationDetails = page.getByTestId('confirmation-details');
    await expect(confirmationDetails).toContainText('Order Number: #');
    await expect(confirmationDetails).toContainText('Alex Morgan');
    await expect(confirmationDetails).toContainText('PENDING');
    await expect(confirmationDetails).toContainText('$17.98');
  });

  /**
   * TC-E2E-002: Real-Time Order Tracking & Stepper Verification
   */
  test('TC-E2E-002: Verify Order Status Tracking & Visual Stepper in My Orders', async ({ page }) => {
    // Fast onboarding
    await page.getByTestId('login-submit-btn').click();
    await page.getByTestId('save-address-btn').click();

    // Place an order first
    await page.getByTestId('add-to-cart-1').click();
    await page.getByTestId('cart-toggle').click();
    await page.getByTestId('checkout-btn').click();
    await page.getByTestId('place-order-btn').click();

    // Click "Track in My Orders" from confirmation modal
    const trackOrderBtn = page.getByTestId('track-order-btn');
    await expect(trackOrderBtn).toBeVisible();
    await trackOrderBtn.click();

    // Verify Orders tab is active
    const ordersTab = page.getByTestId('orders-tab');
    await expect(ordersTab).toBeVisible();

    // Verify the placed order card exists
    const ordersList = page.getByTestId('orders-list');
    await expect(ordersList).toContainText('Order #');
    await expect(ordersList).toContainText('● PENDING');
    await expect(ordersList).toContainText('Margherita');

    // Verify stepper elements are rendered
    const stepper = ordersList.locator('.order-stepper').first();
    await expect(stepper).toBeVisible();
    await expect(stepper.locator('.step-node').first()).toHaveText(/Placed/);
  });

  /**
   * TC-E2E-003: Cart Quantity Interactivity & Item Removal
   */
  test('TC-E2E-003: Verify Cart Quantity Increment, Decrement, and Item Deletion', async ({ page }) => {
    // Fast onboarding
    await page.getByTestId('login-submit-btn').click();
    await page.getByTestId('save-address-btn').click();

    // Add item (Garlic Bread $4.49)
    await page.getByTestId('add-to-cart-6').click();

    // Open Cart
    await page.getByTestId('cart-toggle').click();
    const qtyDisplay = page.getByTestId('qty-display-6');
    await expect(qtyDisplay).toHaveText('1');
    await expect(page.getByTestId('subtotal')).toHaveText('$4.49');

    // Increment quantity (+)
    const qtyIncBtn = page.getByTestId('qty-increase-6');
    await qtyIncBtn.click();
    await expect(qtyDisplay).toHaveText('2');
    await expect(page.getByTestId('subtotal')).toHaveText('$8.98');

    // Decrement quantity (−)
    const qtyDecBtn = page.getByTestId('qty-decrease-6');
    await qtyDecBtn.click();
    await expect(qtyDisplay).toHaveText('1');
    await expect(page.getByTestId('subtotal')).toHaveText('$4.49');

    // Remove item completely
    const removeBtn = page.getByTestId('remove-item-6');
    await removeBtn.click();

    // Verify empty cart state
    await expect(page.getByTestId('empty-cart-message')).toBeVisible();
    await expect(page.getByTestId('checkout-btn')).toBeDisabled();
  });

  /**
   * TC-E2E-004: Customer Support Contact Channels & Inquiry Form Submission
   */
  test('TC-E2E-004: Verify Customer Support Contact Links & Ticket Form Dispatch', async ({ page }) => {
    // Fast onboarding
    await page.getByTestId('login-submit-btn').click();
    await page.getByTestId('save-address-btn').click();

    // Switch to Customer Support tab
    const navSupportBtn = page.getByTestId('nav-support-btn');
    await navSupportBtn.click();

    const supportTab = page.getByTestId('support-tab');
    await expect(supportTab).toBeVisible();

    // Verify direct telephone and email links
    const callLink = page.getByTestId('support-call-link');
    await expect(callLink).toHaveAttribute('href', 'tel:+18005557499');

    const emailLink = page.getByTestId('support-email-link');
    await expect(emailLink).toHaveAttribute('href', /mailto:support@pizzapalace\.com/);

    // Fill in and submit the support contact form
    const subjectSelect = page.getByTestId('sup-subject-select');
    const messageInput = page.getByTestId('sup-message-input');
    const submitBtn = page.getByTestId('support-submit-btn');

    await subjectSelect.selectOption('Delivery Delay Assistance');
    await messageInput.fill('Checking estimated courier arrival time.');
    await submitBtn.click();

    // Verify success ticket box appears
    const successBox = page.getByTestId('support-success-box');
    await expect(successBox).toBeVisible();
    await expect(successBox).toContainText('Support Ticket Created: #TICK-');
    await expect(successBox).toContainText('Within 15 minutes');
  });

  /**
   * TC-E2E-005: Negative Testing (Invalid Coupon & Error Handling)
   */
  test('TC-E2E-005: Reject Invalid Coupon Code and Display Error Feedback', async ({ page }) => {
    // Fast onboarding
    await page.getByTestId('login-submit-btn').click();
    await page.getByTestId('save-address-btn').click();

    // Add item and open cart
    await page.getByTestId('add-to-cart-1').click();
    await page.getByTestId('cart-toggle').click();

    // Apply fake coupon
    const couponInput = page.getByTestId('coupon-input');
    await couponInput.fill('INVALID999');
    await page.getByTestId('apply-coupon-btn').click();

    // Verify error feedback
    const couponMsg = page.getByTestId('coupon-message');
    await expect(couponMsg).toHaveText(/Invalid coupon code/);

    // Verify discount row is hidden and full price is retained
    await expect(page.getByTestId('discount-row')).toBeHidden();
    await expect(page.getByTestId('final-total')).toHaveText('$8.99');
  });

});
