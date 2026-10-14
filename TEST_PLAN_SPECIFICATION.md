# IEEE 829 Formal Software Test Plan & Test Case Specification
**Project:** Pizza Palace — Full-Stack Web Ordering System  
**Document ID:** `STLC-TP-PIZZA-2026-V1.0`  
**Classification:** Formal Coursework Quality Assurance Deliverable  
**Author:** Senior Software Engineer & QA Automation Lead  

---

## 1.0 Document Overview & Executive Summary
This document establishes the formal **Software Test Plan (STP)** and **Test Case Specification** for the Pizza Ordering System in accordance with **IEEE 829** standards. It documents the end-to-end verification and validation process across the Software Testing Life Cycle (STLC), encompassing:
- Architectural decomposition and scope definition.
- Formal black-box test design techniques: **Equivalence Partitioning (EP)** and **Boundary Value Analysis (BVA)**.
- Entry, Suspension, and Exit criteria.
- Defect severity and priority classifications with SLAs.
- **32 Extensive Test Cases** covering Authentication, Address Onboarding, Menu Browsing, Cart Management, Business Logic & Pricing Engine, Coupon Normalization, Checkout, Order Tracking, and Customer Care.

*(A fully styled Microsoft Word version has been generated at [`Pizza_Ordering_System_Formal_Test_Plan.docx`](file:///c:/Users/Acer/Desktop/PIZZA_ORDER/Pizza_Ordering_System_Formal_Test_Plan.docx) with executive header formatting, custom tables, and sign-off blocks).*

---

## 2.0 Scope of Testing

### 2.1 In-Scope Features
1. **User Authentication & Session Management**: Client-side demo credential verification (`student@univ.edu` / `pizza123`), session persistence in `localStorage`, and sign-out logic.
2. **Delivery Address Onboarding**: Mandatory fields validation (Full Name, Phone Number, Street, City), optional delivery instructions, and auto-population in checkout.
3. **Menu Catalog & Categorization**: Data fetching from `GET /api/menu`, dynamic rendering of 10 items with real photography, fixed aspect-ratio containers, and category filtering (`all`, `pizza`, `sides`, `drinks`).
4. **Cart Operations**: Add-to-cart feedback, quantity adjustments (`+` / `−`), edge-condition item removal when quantity reaches 0, and explicit item deletion (`🗑️`).
5. **Business Logic & Pricing Engine**: Subtotal calculations, floating-point cent rounding (preventing IEEE 754 precision bugs), discount percentage logic, and negative/out-of-bound rejection.
6. **Coupon Normalization Engine**: Case-insensitive matching (`WELCOME10`, `welcome10`), whitespace trimming (`  WELCOME10  `), invalid code rejection, and discount application.
7. **Order Checkout & Database Persistence**: Form submission, total calculation, SQLite transaction insertion, and confirmation receipt.
8. **Real-Time Order Tracking ("My Orders")**: Querying historical orders by customer email, status badges (`PENDING`, `CONFIRMED`, `DELIVERED`), and 4-step progress stepper.
9. **Customer Support**: Tel (`tel:`) and mailto (`mailto:`) quick actions, and asynchronous support ticket submission with unique ticket reference IDs.

### 2.2 Out-of-Scope Features
- External 3D-Secure payment gateway redirects (Stripe/PayPal live processing).
- Physical kitchen receipt thermal printer drivers.

---

## 3.0 Test Strategy & STLC Phases Alignment

| STLC Phase | Focus & Level | Testing Tool | Quality Gate / Exit Target |
| :--- | :--- | :--- | :--- |
| **Phase 1** | App Foundation | Manual & Code Review | Complete schema, seed data, API routes, and responsive UI. |
| **Phase 2** | Unit Testing | **Jest 29+** | 100% Statement, Branch, and Function coverage on `pricing.js`. |
| **Phase 3** | API Integration | **Postman / Newman** | 100% pass rate on status codes (200, 201, 400, 404) & schemas. |
| **Phase 4** | E2E UI Automation | **Playwright** | Full browser automation (Login ➔ Address ➔ Cart ➔ Checkout). |
| **Phase 5** | Performance & CI/CD | **JMeter + GitHub Actions** | Concurrent load verification & automated CI build gate. |

---

## 4.0 Formal Test Design Techniques

### 4.1 Equivalence Partitioning (EP) Matrix
| Parameter Under Test | Valid Partition | Invalid Partition 1 | Invalid Partition 2 |
| :--- | :--- | :--- | :--- |
| **Item Quantity** | Positive Integers $[1, 2, \dots, 99]$ | Zero & Negative $(\le 0)$ | Non-integers / Floats ($1.5$, strings) |
| **Item Price ($)** | Positive Real Numbers $(> 0.00)$ | Negative Numbers $(< 0.00)$ | Non-numeric / NaN / null |
| **Discount Percent (%)** | Valid Range $[0.00, 100.00]$ | Negative Numbers $(< 0.00)$ | Excessive Numbers $(> 100.00)$ |
| **Coupon Code** | Configured Strings (`WELCOME10`, etc.) | Unregistered Strings (`FAKE50`) | Empty / Null / Whitespace (`""`) |

### 4.2 Boundary Value Analysis (BVA) Matrix
| Function / Boundary | Boundary Condition | Test Values Selected | Expected Result |
| :--- | :--- | :--- | :--- |
| **Discount Percent (Min)** | Lower Boundary: 0% | $-1\%$ (Invalid), $0\%$ (Boundary), $+1\%$ (Valid) | Reject $-1\%$; $0\%$ yields $\$0$ discount. |
| **Discount Percent (Max)** | Upper Boundary: 100% | $99\%$ (Valid), $100\%$ (Boundary), $101\%$ (Invalid) | $100\%$ yields free order; $101\%$ throws error. |
| **Item Quantity (Min)** | Minimum Unit: 1 | $0$ (Invalid), $1$ (Boundary), $2$ (Valid) | Reject $0$; process $1$. |
| **Currency Rounding** | Half-cent ($0.005$) | $\$11.49 \times 15\% = \$1.7235 \rightarrow \$1.72$ | Strictly round to 2 decimal places. |

---

## 5.0 Defect Severity & Priority Classification

| Severity Level | Definition | Example Scenario | SLA |
| :--- | :--- | :--- | :--- |
| **S1 - Blocker** | System crash, inability to place orders, pricing arithmetic breakdown. | Subtotal returns `NaN` or crashes server. | Immediate (< 2h) |
| **S2 - Major** | Core feature impaired without workaround. | Valid coupon code fails to apply discount. | < 24 hours |
| **S3 - Moderate** | Minor feature failure with available workaround. | Status badge displays incorrect color. | Next build |
| **S4 - Minor** | Cosmetic, formatting, or styling irregularity. | Spacing glitch on small mobile screens. | Backlog |

---

## 6.0 Master Test Case Inventory (Summary of 32 Test Cases)

| Test ID | Module | Technique | Description | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-001` | Auth | EP (Valid) | Standard login with valid demo credentials | P1 - Critical |
| `TC-AUTH-002` | Auth | Negative / BVA | Login form submission with empty email | P2 - High |
| `TC-ADDR-003` | Address | EP (Valid) | Complete delivery address entry and saving | P1 - Critical |
| `TC-ADDR-004` | Address | Negative / EP | Missing street address submission rejection | P2 - High |
| `TC-MENU-005` | Menu | Manual | Verify initial loading of 10 items with photos | P1 - Critical |
| `TC-MENU-006` | Menu | EP (Valid) | Filter menu by 'Classic Pizzas' (shows 5 items) | P2 - High |
| `TC-MENU-007` | Menu | EP (Valid) | Filter menu by 'Sides' (3 items) and 'Drinks' (2 items) | P3 - Medium |
| `TC-MENU-008` | Menu | Error Guessing | Image onerror fallback gracefully triggers | P3 - Medium |
| `TC-CART-009` | Cart | EP (Valid) | Add single item to empty cart | P1 - Critical |
| `TC-CART-010` | Cart | BVA (Count > 1) | Quantity increment on existing cart item | P2 - High |
| `TC-CART-011` | Cart | BVA (Count $\rightarrow$ 1) | Quantity decrement reducing item count to 1 | P2 - High |
| `TC-CART-012` | Cart | BVA (Bound = 0) | Quantity decrement past 1 removes item from cart | P2 - High |
| `TC-CART-013` | Cart | Manual | Explicit trash button item deletion | P3 - Medium |
| `TC-CALC-014` | Pricing Logic | EP (Valid) | Subtotal calculation for multiple items & quantities | P1 - Critical |
| `TC-CALC-015` | Pricing Logic | BVA (Precision) | Cent rounding check (prevents 0.30000004 IEEE bug) | P1 - Critical |
| `TC-CALC-016` | Pricing Logic | Negative / BVA | Reject empty cart array `[]` with Error | P2 - High |
| `TC-CALC-017` | Pricing Logic | Negative / EP | Reject negative price ($ -5.00) with Error | P2 - High |
| `TC-CALC-018` | Pricing Logic | Negative / BVA | Reject 0 or non-integer quantity with Error | P2 - High |
| `TC-CPN-019` | Coupons | EP (Valid) | Validate 'WELCOME10' (10% discount) | P1 - Critical |
| `TC-CPN-020` | Coupons | EP (Valid) | Validate 'STUDENT15' (15% discount) | P2 - High |
| `TC-CPN-021` | Coupons | EP (Format) | Case-insensitivity test ('welcome10' $\rightarrow$ 10%) | P2 - High |
| `TC-CPN-022` | Coupons | BVA (Whitespace) | Trimming leading/trailing whitespace (`  PIZZA20  `) | P2 - High |
| `TC-CPN-023` | Coupons | Negative / EP | Rejection of unregistered coupon code ('FAKE999') | P2 - High |
| `TC-CPN-024` | Coupons | Negative / BVA | Rejection of empty/null/non-string inputs | P2 - High |
| `TC-DISC-025` | Discounts | EP (Valid) | Standard 10% discount calculation on $20.00 | P1 - Critical |
| `TC-DISC-026` | Discounts | BVA (Min = 0%) | 0% discount boundary check ($0 discount) | P2 - High |
| `TC-DISC-027` | Discounts | BVA (Max = 100%) | 100% discount boundary check ($0 final price) | P2 - High |
| `TC-DISC-028` | Discounts | Negative / BVA | Reject discount percentages outside [0, 100] | P2 - High |
| `TC-ORD-029` | Orders | Integration | Complete order checkout with pre-filled address & coupon | P1 - Critical |
| `TC-ORD-030` | Orders | Negative | Reject order placement with empty phone number | P2 - High |
| `TC-STAT-031` | Tracking | State Transition | Real-time order tracking and 4-step stepper | P1 - Critical |
| `TC-SUP-032` | Support | Integration | Submit support inquiry and receive ticket ID | P2 - High |

---

## 7.0 Document Approvals & Sign-Off
- **QA Lead & Test Automation Engineer:** _________________________ (Date: ___/___/2026)
- **Academic Project Supervisor:** _________________________ (Date: ___/___/2026)
