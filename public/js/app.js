/**
 * ============================================================================
 * PIZZA PALACE — CLIENT APPLICATION LOGIC
 * Manages:
 * 1. Multi-screen navigation (Login -> Address -> Main Store)
 * 2. Menu fetching, category filtering & card rendering with real photos
 * 3. Cart management, coupons, and pricing calculations
 * 4. Checkout and order submission
 * 5. "My Orders" real-time status tracking with visual stepper
 * 6. Customer support form submission, direct call & email actions
 * ============================================================================
 */

// Global State
let menuItems = [];
let cart = [];
let appliedDiscount = { percent: 0, code: null };
let currentActiveTab = 'menu';

// User & Address State (persisted in localStorage for clean Playwright automation)
let currentUser = JSON.parse(localStorage.getItem('pizza_user')) || null;
let currentAddress = JSON.parse(localStorage.getItem('pizza_address')) || null;

// ============================================================================
// 1. INITIALIZATION & SCREEN ROUTING
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initAppRouting();
    fetchMenu();
});

function initAppRouting() {
    if (!currentUser) {
        navigateToScreen('login');
    } else if (!currentAddress) {
        navigateToScreen('address');
    } else {
        navigateToScreen('main');
        updateUserHeaderDisplay();
        fetchUserOrders();
    }
}

/**
 * Switch top-level application screens
 * @param {'login' | 'address' | 'main'} screenId
 */
function navigateToScreen(screenId) {
    const screens = {
        login: document.getElementById('screen-login'),
        address: document.getElementById('screen-address'),
        main: document.getElementById('screen-main'),
    };

    Object.keys(screens).forEach(id => {
        if (screens[id]) {
            if (id === screenId) {
                screens[id].classList.remove('screen-hidden');
                screens[id].classList.add('screen-active');
            } else {
                screens[id].classList.remove('screen-active');
                screens[id].classList.add('screen-hidden');
            }
        }
    });

    if (screenId === 'main') {
        updateUserHeaderDisplay();
        fetchUserOrders();
    }
}

// ============================================================================
// 2. AUTHENTICATION & ONBOARDING (SCREENS 1 & 2)
// ============================================================================

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
        showToast('Please enter a valid email address');
        return;
    }

    currentUser = {
        email: email,
        name: email.split('@')[0],
        loginAt: new Date().toISOString(),
    };

    localStorage.setItem('pizza_user', JSON.stringify(currentUser));
    showToast(`Welcome, ${currentUser.name}!`);

    // Check if address already exists
    if (!currentAddress) {
        navigateToScreen('address');
    } else {
        navigateToScreen('main');
    }
}

function handleSaveAddress(event) {
    event.preventDefault();
    const name = document.getElementById('addr-name').value.trim();
    const phone = document.getElementById('addr-phone').value.trim();
    const street = document.getElementById('addr-street').value.trim();
    const city = document.getElementById('addr-city').value.trim();
    const notes = document.getElementById('addr-notes').value.trim();

    if (!name || !phone || !street || !city) {
        showToast('Please fill in all required address fields');
        return;
    }

    currentAddress = {
        name,
        phone,
        street,
        city,
        notes,
        fullAddress: `${street}, ${city}${notes ? ` (${notes})` : ''}`,
    };

    localStorage.setItem('pizza_address', JSON.stringify(currentAddress));
    showToast('Delivery address saved successfully!');
    navigateToScreen('main');
}

function handleLogout() {
    localStorage.removeItem('pizza_user');
    currentUser = null;
    cart = [];
    updateCart();
    navigateToScreen('login');
    showToast('Signed out successfully.');
}

function updateUserHeaderDisplay() {
    if (currentUser) {
        const emailEl = document.getElementById('user-display-email');
        if (emailEl) emailEl.textContent = currentUser.email;

        // Auto-fill support form email if available
        const supEmail = document.getElementById('sup-email');
        if (supEmail) supEmail.value = currentUser.email;
    }
    if (currentAddress) {
        const addrEl = document.getElementById('user-display-addr');
        if (addrEl) addrEl.textContent = `${currentAddress.street.substring(0, 18)}...`;

        const supName = document.getElementById('sup-name');
        if (supName) supName.value = currentAddress.name;
    }
}

// ============================================================================
// 3. MAIN STORE TABS (MENU / MY ORDERS / CUSTOMER SUPPORT)
// ============================================================================

function switchMainTab(tabId) {
    currentActiveTab = tabId;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Toggle tab panels
    const tabs = {
        menu: document.getElementById('tab-menu'),
        orders: document.getElementById('tab-orders'),
        support: document.getElementById('tab-support'),
    };

    Object.keys(tabs).forEach(id => {
        if (tabs[id]) {
            if (id === tabId) {
                tabs[id].classList.remove('tab-hidden');
                tabs[id].classList.add('tab-active');
            } else {
                tabs[id].classList.remove('tab-active');
                tabs[id].classList.add('tab-hidden');
            }
        }
    });

    if (tabId === 'orders') {
        fetchUserOrders();
    }
}

// ============================================================================
// 4. MENU BROWSING & RENDERING
// ============================================================================

async function fetchMenu() {
    try {
        const response = await fetch('/api/menu');
        const result = await response.json();

        if (result.success) {
            menuItems = result.data;
            renderMenu(menuItems);
        } else {
            showToast('Unable to load menu data.');
        }
    } catch (error) {
        console.error('Menu load error:', error);
        showToast('Server connection error. Is Express running?');
    }
}

function renderMenu(items) {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const counter = document.getElementById('item-counter');
    if (counter) counter.textContent = `Showing ${items.length} delicious item${items.length === 1 ? '' : 's'}`;

    if (items.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #D3C3B7;">
                <h3>No items found in this category.</h3>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.setAttribute('data-testid', `menu-item-${item.id}`);

        // Image with container ensuring fixed aspect ratio
        card.innerHTML = `
            <div class="card-image-wrap">
                <img class="card-img" 
                     src="${item.image_url}" 
                     alt="${item.name}" 
                     loading="lazy" 
                     onerror="this.onerror=null; this.src='/images/margherita.jpg';">
                <span class="card-badge-cat">${item.category}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.description}</p>
                <div class="card-footer">
                    <span class="card-price">$${item.price.toFixed(2)}</span>
                    <button class="btn-add-cart" 
                            data-testid="add-to-cart-${item.id}" 
                            onclick="addToCart(${item.id})">
                        + Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterMenu(category) {
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    if (category === 'all') {
        renderMenu(menuItems);
    } else {
        renderMenu(menuItems.filter(i => i.category === category));
    }
}

// ============================================================================
// 5. CART OPERATIONS & COUPONS
// ============================================================================

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            quantity: 1,
        });
    }

    // Button visual feedback
    const btn = document.querySelector(`[data-testid="add-to-cart-${itemId}"]`);
    if (btn) {
        btn.classList.add('added');
        btn.textContent = 'Added ✓';
        setTimeout(() => {
            btn.classList.remove('added');
            btn.textContent = '+ Add to Cart';
        }, 500);
    }

    updateCart();
    showToast(`Added ${item.name} to cart`);
}

function updateQuantity(itemId, delta) {
    const item = cart.find(c => c.id === itemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    updateCart();
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    updateCart();
}

function updateCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartSubtitleEl = document.getElementById('cart-item-count-label');
    const subtotalEl = document.getElementById('subtotal');
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');
    const finalTotalEl = document.getElementById('final-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartSubtitleEl) cartSubtitleEl.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

    if (!cartItemsEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="cart-empty-msg" data-testid="empty-cart-message">
                <p>🛒 Your cart is currently empty.</p>
                <p style="font-size:0.8rem; margin-top:4px;">Add a pizza from the menu to start!</p>
            </div>
        `;
        if (checkoutBtn) checkoutBtn.disabled = true;
        clearDiscount();
    } else {
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item" data-testid="cart-item-${item.id}">
                <div class="cart-thumb-wrap">
                    <img class="cart-thumb" src="${item.image_url}" alt="${item.name}" onerror="this.src='/images/margherita.jpg'">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-circle-btn" data-testid="qty-decrease-${item.id}" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span class="cart-item-qty" data-testid="qty-display-${item.id}">${item.quantity}</span>
                    <button class="qty-circle-btn" data-testid="qty-increase-${item.id}" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="btn-remove-item" data-testid="remove-item-${item.id}" onclick="removeFromCart(${item.id})" title="Remove item">🗑️</button>
                </div>
            </div>
        `).join('');
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    // Pricing calculation
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    if (subtotalEl) subtotalEl.textContent = `$${roundedSubtotal.toFixed(2)}`;

    if (appliedDiscount.percent > 0) {
        const discountAmt = Math.round((roundedSubtotal * appliedDiscount.percent / 100) * 100) / 100;
        const finalPrice = Math.round((roundedSubtotal - discountAmt) * 100) / 100;

        if (discountRow) discountRow.style.display = 'flex';
        if (discountAmountEl) discountAmountEl.textContent = `-$${discountAmt.toFixed(2)}`;
        if (finalTotalEl) finalTotalEl.textContent = `$${finalPrice.toFixed(2)}`;
    } else {
        if (discountRow) discountRow.style.display = 'none';
        if (finalTotalEl) finalTotalEl.textContent = `$${roundedSubtotal.toFixed(2)}`;
    }
}

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const backdrop = document.getElementById('cart-backdrop');
    if (sidebar) sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
}

async function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const msg = document.getElementById('coupon-message');
    const code = input ? input.value.trim() : '';

    if (!code) {
        if (msg) {
            msg.textContent = 'Please enter a promo code';
            msg.className = 'coupon-message error';
        }
        return;
    }

    try {
        const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        const result = await response.json();

        if (result.success && result.data.valid) {
            appliedDiscount = {
                percent: result.data.discount_percent,
                code: code.toUpperCase(),
            };
            if (msg) {
                msg.textContent = `✓ ${result.data.description}`;
                msg.className = 'coupon-message success';
            }
            showToast(`Coupon Applied: ${result.data.discount_percent}% off!`);
        } else {
            clearDiscount();
            if (msg) {
                msg.textContent = '✗ Invalid coupon code';
                msg.className = 'coupon-message error';
            }
        }
        updateCart();
    } catch (error) {
        console.error('Coupon validation error:', error);
        if (msg) {
            msg.textContent = 'Error checking coupon';
            msg.className = 'coupon-message error';
        }
    }
}

function quickApplyCoupon(code) {
    const input = document.getElementById('coupon-input');
    if (input) {
        input.value = code;
        applyCoupon();
    }
}

function clearDiscount() {
    appliedDiscount = { percent: 0, code: null };
    const row = document.getElementById('discount-row');
    if (row) row.style.display = 'none';
}

// ============================================================================
// 6. CHECKOUT FLOW & MODALS
// ============================================================================

function showCheckout() {
    if (cart.length === 0) return;

    const modal = document.getElementById('checkout-modal');
    const summaryEl = document.getElementById('checkout-summary');
    const totalPriceEl = document.getElementById('checkout-total-price');

    // Pre-populate fields from saved user profile / address
    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const addressField = document.getElementById('customer-address');

    if (currentAddress) {
        if (nameField) nameField.value = currentAddress.name || '';
        if (phoneField) phoneField.value = currentAddress.phone || '';
        if (addressField) addressField.value = currentAddress.fullAddress || currentAddress.street || '';
    } else if (currentUser) {
        if (nameField) nameField.value = currentUser.name || '';
    }

    // Render cart items preview inside checkout modal
    if (summaryEl) {
        summaryEl.innerHTML = cart.map(item => `
            <div class="checkout-summary-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        if (appliedDiscount.percent > 0) {
            summaryEl.innerHTML += `
                <div class="checkout-summary-item" style="color: #2E7D32; font-weight: 600;">
                    <span>Promo (${appliedDiscount.code})</span>
                    <span>-${appliedDiscount.percent}%</span>
                </div>
            `;
        }
    }

    // Compute final checkout total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    let finalAmount = roundedSubtotal;

    if (appliedDiscount.percent > 0) {
        const discountAmt = Math.round((roundedSubtotal * appliedDiscount.percent / 100) * 100) / 100;
        finalAmount = Math.round((roundedSubtotal - discountAmt) * 100) / 100;
    }

    if (totalPriceEl) totalPriceEl.textContent = `$${finalAmount.toFixed(2)}`;

    // Close cart drawer if open and show modal
    const sidebar = document.getElementById('cart-sidebar');
    const backdrop = document.getElementById('cart-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');

    if (modal) modal.style.display = 'flex';
}

function hideCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
}

async function placeOrder(event) {
    event.preventDefault();

    const customerName = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!customerName || !phone || !address) {
        showToast('Please fill in all delivery details.');
        return;
    }

    const orderPayload = {
        customer_name: customerName,
        customer_email: currentUser ? currentUser.email : 'guest@univ.edu',
        phone: phone,
        address: address,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
        coupon_code: appliedDiscount.code,
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });

        const result = await response.json();

        if (result.success) {
            hideCheckout();
            showConfirmation(result.data);
            fetchUserOrders(); // Refresh orders list in background
        } else {
            showToast(`Order failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Order creation error:', error);
        showToast('Failed to place order. Check server connection.');
    }
}

function showConfirmation(order) {
    const modal = document.getElementById('confirmation-modal');
    const details = document.getElementById('confirmation-details');

    if (details) {
        details.innerHTML = `
            <div class="conf-row">
                <span class="conf-label">Order Number:</span>
                <span class="conf-val">#${order.id}</span>
            </div>
            <div class="conf-row">
                <span class="conf-label">Customer Name:</span>
                <span class="conf-val">${order.customer_name}</span>
            </div>
            <div class="conf-row">
                <span class="conf-label">Delivery To:</span>
                <span class="conf-val">${order.address}</span>
            </div>
            <div class="conf-row">
                <span class="conf-label">Current Status:</span>
                <span class="conf-val" style="color: #C88A35;">📋 ${order.status.toUpperCase()}</span>
            </div>
            <div class="conf-row">
                <span class="conf-label">Items Count:</span>
                <span class="conf-val">${order.items.length} items</span>
            </div>
            <div class="conf-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(189,155,126,0.3); font-size: 1.05rem;">
                <span class="conf-label" style="font-weight: 700;">Total Amount Paid:</span>
                <span class="conf-val" style="color: #4E2714; font-size: 1.15rem;">$${order.final_price.toFixed(2)}</span>
            </div>
        `;
    }

    if (modal) modal.style.display = 'flex';
}

function viewMyOrdersAfterConfirmation() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.style.display = 'none';

    // Clear cart
    cart = [];
    clearDiscount();
    updateCart();

    // Switch to Orders Tab
    switchMainTab('orders');
}

function resetApp() {
    cart = [];
    clearDiscount();
    updateCart();

    const confModal = document.getElementById('confirmation-modal');
    if (confModal) confModal.style.display = 'none';

    switchMainTab('menu');
    showToast('Ready for your next pizza order! 🍕');
}

// ============================================================================
// 7. TAB 2: "MY ORDERS" STATUS TRACKING (OPTION A)
// ============================================================================

async function fetchUserOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    try {
        const emailParam = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : '';
        const response = await fetch(`/api/orders${emailParam}`);
        const result = await response.json();

        if (result.success) {
            renderOrdersList(result.data);
        } else {
            ordersList.innerHTML = `<p class="order-empty-state">Unable to load orders.</p>`;
        }
    } catch (error) {
        console.error('Orders fetching error:', error);
        ordersList.innerHTML = `<p class="order-empty-state">Error connecting to orders database.</p>`;
    }
}

function renderOrdersList(orders) {
    const list = document.getElementById('orders-list');
    if (!list) return;

    if (!orders || orders.length === 0) {
        list.innerHTML = `
            <div class="order-empty-state" data-testid="orders-empty-state">
                <div class="order-empty-icon">📦</div>
                <h3>No orders placed yet.</h3>
                <p>When you place an order, live oven tracking and dispatch status will show here.</p>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="switchMainTab('menu')">
                    Browse Pizza Menu →
                </button>
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(order => {
        const statusClass = `status-${order.status}`;
        const stepperState = getStepperState(order.status);

        return `
            <div class="order-card" data-testid="order-card-${order.id}">
                <div class="order-card-header">
                    <div class="order-id-group">
                        <span class="order-number">Order #${order.id}</span>
                        <span class="order-time">🕒 ${order.created_at || 'Just now'}</span>
                    </div>
                    <span class="status-badge ${statusClass}" data-testid="order-status-badge-${order.id}">
                        ● ${order.status.toUpperCase()}
                    </span>
                </div>

                <!-- Visual Progress Stepper -->
                <div class="order-stepper">
                    <div class="stepper-line">
                        <div class="stepper-progress" style="width: ${stepperState.progressPercent}%;"></div>
                    </div>
                    <div class="step-node ${stepperState.placed ? 'completed' : ''}">
                        <div class="step-circle">1</div>
                        <span class="step-label">Placed</span>
                    </div>
                    <div class="step-node ${stepperState.baking ? 'completed' : (order.status === 'pending' ? 'active' : '')}">
                        <div class="step-circle">2</div>
                        <span class="step-label">In Oven</span>
                    </div>
                    <div class="step-node ${stepperState.delivery ? 'completed' : (order.status === 'confirmed' ? 'active' : '')}">
                        <div class="step-circle">3</div>
                        <span class="step-label">On the Way</span>
                    </div>
                    <div class="step-node ${stepperState.delivered ? 'completed active' : ''}">
                        <div class="step-circle">4</div>
                        <span class="step-label">Delivered</span>
                    </div>
                </div>

                <!-- Items breakdown -->
                <div class="order-items-table">
                    ${order.items.map(it => `
                        <div class="order-item-row">
                            <span>🍕 ${it.name} × ${it.quantity}</span>
                            <span>$${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="order-footer-details">
                    <div class="order-address-box">
                        📍 Delivered to: <strong>${order.address}</strong>
                    </div>
                    <div>
                        ${order.discount > 0 ? `<span style="color:#2E7D32; margin-right: 12px;">Saved $${order.discount.toFixed(2)} (${order.coupon_code})</span>` : ''}
                        <span>Total: <strong class="order-total-val">$${order.final_price.toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStepperState(status) {
    if (status === 'delivered') {
        return { placed: true, baking: true, delivery: true, delivered: true, progressPercent: 100 };
    } else if (status === 'confirmed') {
        return { placed: true, baking: true, delivery: true, delivered: false, progressPercent: 66 };
    } else {
        // 'pending'
        return { placed: true, baking: true, delivery: false, delivered: false, progressPercent: 33 };
    }
}

// ============================================================================
// 8. TAB 3: CUSTOMER SUPPORT FORM
// ============================================================================

async function handleSupportSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('sup-name').value.trim();
    const email = document.getElementById('sup-email').value.trim();
    const subject = document.getElementById('sup-subject').value;
    const message = document.getElementById('sup-message').value.trim();

    if (!name || !email || !message) {
        showToast('Please fill in all support form fields.');
        return;
    }

    try {
        const response = await fetch('/api/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message }),
        });

        const result = await response.json();

        if (result.success) {
            const form = document.getElementById('support-form');
            const successBox = document.getElementById('support-success-box');

            if (form) form.style.display = 'none';
            if (successBox) {
                successBox.style.display = 'block';
                successBox.innerHTML = `
                    <h4>✅ Support Ticket Created: #${result.data.ticket_id}</h4>
                    <p style="margin-top: 6px;">Thank you, <strong>${result.data.name}</strong>. Our kitchen & dispatch team has received your inquiry regarding <em>"${result.data.subject}"</em>.</p>
                    <p style="font-size: 0.85rem; margin-top: 4px; color: #1B5E20;">We will contact you back at <strong>${result.data.email}</strong> within ${result.data.response_estimate}.</p>
                    <button class="btn btn-sm btn-outline" style="margin-top: 12px;" onclick="resetSupportForm()">Send Another Message</button>
                `;
            }

            showToast(`Support Ticket #${result.data.ticket_id} submitted!`);
        } else {
            showToast(`Submission failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Support submission error:', error);
        showToast('Failed to reach customer care server.');
    }
}

function resetSupportForm() {
    const form = document.getElementById('support-form');
    const successBox = document.getElementById('support-success-box');

    if (form) {
        form.reset();
        form.style.display = 'block';
        updateUserHeaderDisplay();
    }
    if (successBox) successBox.style.display = 'none';
}

// ============================================================================
// 9. TOAST NOTIFICATION UTILITY
// ============================================================================

function showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}
