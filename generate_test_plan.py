import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Set inner cell padding in twips (1 pt = 20 twips)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def format_row(row, bg_hex, text_color, bold=False, font_size=9.5):
    for cell in row.cells:
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Calibri'
                run.font.size = Pt(font_size)
                run.font.bold = bold
                run.font.color.rgb = text_color

def build_test_plan_docx(filename):
    doc = Document()

    # Page Margins: 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Add Header and Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Pizza Palace STLC Project | Confidential - Academic Use Only | Page ")
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(120, 120, 120)

    # Color Palette: Brown & Amber Theme
    DARK_BROWN = RGBColor(0x3E, 0x22, 0x14)  # #3E2214
    GOLD_AMBER = RGBColor(0xC8, 0x8A, 0x35)  # #C88A35
    MUTED_TEXT = RGBColor(0x5A, 0x48, 0x3E)  # #5A483E
    BLACK_TEXT = RGBColor(0x22, 0x22, 0x22)
    WHITE_TEXT = RGBColor(0xFF, 0xFF, 0xFF)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = BLACK_TEXT

    # =========================================================================
    # COVER / TITLE BLOCK
    # =========================================================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(20)
    title_p.paragraph_format.space_after = Pt(4)
    run_sub = title_p.add_run("IEEE 829 STANDARD DELIVERABLE\n")
    run_sub.font.size = Pt(10)
    run_sub.font.bold = True
    run_sub.font.color.rgb = GOLD_AMBER
    
    run_title = title_p.add_run("FORMAL SOFTWARE TEST PLAN & TEST CASE SPECIFICATION")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = DARK_BROWN

    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_after = Pt(20)
    run_sub2 = subtitle_p.add_run("Project: Pizza Palace — Full-Stack Web Ordering System\nCoursework: Software Testing Life Cycle (STLC) & Quality Assurance Engineering")
    run_sub2.font.size = Pt(12)
    run_sub2.font.italic = True
    run_sub2.font.color.rgb = MUTED_TEXT

    # Metadata Table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Document Identifier", "STLC-TP-PIZZA-2026-V1.0"),
        ("Author / QA Lead", "Senior Software Engineer & QA Automation Lead"),
        ("Testing Methodologies", "Unit (Jest), Integration (Postman), E2E UI (Playwright), Performance (JMeter)"),
        ("Date of Publication", "Academic Term 2026"),
        ("Approval Status", "Approved for Baseline Execution (STLC Phase 2)")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        c0.text = k
        c1.text = v
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.5)
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.color.rgb = DARK_BROWN

    doc.add_page_break()

    # =========================================================================
    # REVISION HISTORY TABLE
    # =========================================================================
    h1 = doc.add_heading("Document Control & Revision History", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(8)
    for run in h1.runs:
        run.font.color.rgb = DARK_BROWN

    rev_table = doc.add_table(rows=3, cols=5)
    rev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Version", "Release Date", "Author", "Change Description", "Approver"]
    for j, h in enumerate(headers):
        rev_table.rows[0].cells[j].text = h
    format_row(rev_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.5)

    rev_rows = [
        ("0.1", "08/10/2026", "QA Team", "Initial Draft: Scope definition & test architecture", "QA Lead"),
        ("1.0", "08/10/2026", "QA Automation Lead", "Formal Baseline: Added EP/BVA matrices & 30+ manual test cases", "Course Instructor")
    ]
    for i, rdata in enumerate(rev_rows):
        row = rev_table.rows[i+1]
        for j, val in enumerate(rdata):
            row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # TABLE OF CONTENTS / SUMMARY
    # =========================================================================
    toc_p = doc.add_paragraph()
    toc_p.add_run("Executive Summary\n").bold = True
    toc_p.runs[0].font.color.rgb = DARK_BROWN
    toc_p.runs[0].font.size = Pt(13)
    toc_p.add_run(
        "This formal Software Test Plan (STP) defines the comprehensive verification and validation strategy "
        "for the Pizza Palace Web Application. Developed in accordance with IEEE 829 standards, this document establishes "
        "the testing hierarchy, scope boundaries, test design mathematics (Equivalence Partitioning and Boundary Value Analysis), "
        "and concrete test case specifications spanning Unit, Integration, UI, and Performance testing tiers."
    )

    # =========================================================================
    # SECTION 1: INTRODUCTION & PURPOSE
    # =========================================================================
    h1 = doc.add_heading("1.0 Introduction & System Architecture", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN
    
    p = doc.add_paragraph(
        "The Pizza Palace application is a client-server web system designed to facilitate smooth pizza customization, "
        "promotional discount calculation, delivery address tracking, and order placement. "
        "The system architecture comprises:"
    )
    doc.add_paragraph("• Presentation Layer: Vanilla Semantic HTML5, CSS3 with Woodfire Brown Artisanal Theme, and JavaScript ES6+.", style='List Bullet')
    doc.add_paragraph("• API & Application Layer: Node.js with Express.js RESTful routes (/api/menu, /api/orders, /api/coupons, /api/support).", style='List Bullet')
    doc.add_paragraph("• Business Engine: Pure mathematical utilities (pricing.js) handling cart calculations, rounding, and coupons.", style='List Bullet')
    doc.add_paragraph("• Persistence Layer: Embedded SQLite (sql.js / WASM) with auto-persistence and relational schema integrity.", style='List Bullet')

    # =========================================================================
    # SECTION 2: SCOPE OF TESTING
    # =========================================================================
    h1 = doc.add_heading("2.0 Scope of Testing", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    p = doc.add_paragraph("2.1 Features In-Scope for Testing:", style='Normal')
    p.runs[0].bold = True
    doc.add_paragraph("1. Authentication & Onboarding: Student demo credentials, field validation, session persistence in localStorage.", style='List Bullet')
    doc.add_paragraph("2. Address Management: Mandatory delivery fields (Name, Phone, Street, City), pre-population at checkout.", style='List Bullet')
    doc.add_paragraph("3. Menu Catalog & Categorization: Dynamic rendering of 10 food items, category filtering (All, Pizzas, Sides, Drinks).", style='List Bullet')
    doc.add_paragraph("4. Shopping Cart Operations: Add, quantity increment/decrement, remove item, subtotal recomputation.", style='List Bullet')
    doc.add_paragraph("5. Pricing Engine & Coupon Validation: Discount percentage calculations, floating-point cent rounding, uppercase normalization.", style='List Bullet')
    doc.add_paragraph("6. Order Checkout & Transaction Processing: Payload assembly, order insertion, receipt confirmation modal.", style='List Bullet')
    doc.add_paragraph("7. Order Tracking (My Orders): Querying historical orders by customer email, live 4-step status visual stepper.", style='List Bullet')
    doc.add_paragraph("8. Customer Care & Support: Direct tel:/mailto: integration and asynchronous support inquiry ticket dispatch.", style='List Bullet')

    p2 = doc.add_paragraph("2.2 Features Out-of-Scope:", style='Normal')
    p2.runs[0].bold = True
    doc.add_paragraph("• Live credit card payment gateway integration (Stripe / 3D-Secure bank redirects - simulated via order confirmation).", style='List Bullet')
    doc.add_paragraph("• Multi-tenant kitchen printer IoT hardware interfaces.", style='List Bullet')

    # =========================================================================
    # SECTION 3: TEST STRATEGY & STLC PHASES
    # =========================================================================
    h1 = doc.add_heading("3.0 Test Strategy & STLC Alignment", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    strat_table = doc.add_table(rows=6, cols=4)
    strat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_headers = ["STLC Phase", "Test Level / Focus", "Testing Tool", "Objective & Quality Gate"]
    for j, h in enumerate(s_headers):
        strat_table.rows[0].cells[j].text = h
    format_row(strat_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.5)

    strat_data = [
        ("Phase 1", "Application Foundation", "Manual & Code Review", "Scaffold DB schema, Express API, Vanilla HTML/CSS/JS frontend."),
        ("Phase 2", "Unit Testing", "Jest 29+", "Verify pure business functions (pricing.js), 100% statement & branch coverage."),
        ("Phase 3", "API / Integration Testing", "Postman / Newman", "Validate REST HTTP responses, schemas, status codes (200, 201, 400, 404)."),
        ("Phase 4", "End-to-End UI Automation", "Playwright", "Automate complete user journey: Login -> Address -> Cart -> Checkout in headless browsers."),
        ("Phase 5", "Performance & CI/CD", "Apache JMeter + GitHub Actions", "Stress-test orders API under concurrent load and establish automated build gates.")
    ]
    for i, rdata in enumerate(strat_data):
        row = strat_table.rows[i+1]
        for j, val in enumerate(rdata):
            row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.0)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 4: TEST DESIGN TECHNIQUES (EP & BVA MATHEMATICS)
    # =========================================================================
    h1 = doc.add_heading("4.0 Formal Test Design Techniques", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    doc.add_paragraph(
        "To ensure comprehensive coverage without combinatorial explosion, test cases are designed using "
        "two foundational black-box testing techniques:"
    )

    doc.add_heading("4.1 Equivalence Partitioning (EP)", level=2)
    doc.add_paragraph(
        "Equivalence Partitioning divides the input domain into valid and invalid classes where the software is expected "
        "to exhibit identical behavior for any representative value in that partition."
    )
    
    ep_table = doc.add_table(rows=5, cols=4)
    ep_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ep_headers = ["Parameter Under Test", "Valid Equivalence Partition", "Invalid Partition 1", "Invalid Partition 2"]
    for j, h in enumerate(ep_headers): ep_table.rows[0].cells[j].text = h
    format_row(ep_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.0)
    
    ep_rows = [
        ("Item Quantity", "Positive Integers [1, 2, ..., 99]", "Zero & Negative Integers (<= 0)", "Non-integers / Floats (1.5, 'two')"),
        ("Item Price ($)", "Positive Real Numbers (> 0.00)", "Zero / Negative Numbers (< 0.00)", "Non-numeric strings, NaN, null"),
        ("Discount Percent (%)", "Valid range [0.00, 100.00]", "Negative Percent (< 0.00)", "Excessive Percent (> 100.00)"),
        ("Coupon Code", "Configured Codes (WELCOME10, etc.)", "Unknown Strings (INVALID50)", "Empty / Null / Whitespace ('')")
    ]
    for i, rdata in enumerate(ep_rows):
        row = ep_table.rows[i+1]
        for j, val in enumerate(rdata): row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.0)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    doc.add_heading("4.2 Boundary Value Analysis (BVA)", level=2)
    doc.add_paragraph(
        "Boundary Value Analysis focuses on the extremes of input equivalence classes. Errors congregate predominantly "
        "at boundaries rather than in the center. We implement both 2-value (Boundary, Boundary±1) and 3-value testing."
    )

    bva_table = doc.add_table(rows=5, cols=4)
    bva_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    bva_headers = ["Feature / Function", "Boundary Condition", "Test Values Selected", "Expected System Action"]
    for j, h in enumerate(bva_headers): bva_table.rows[0].cells[j].text = h
    format_row(bva_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.0)

    bva_rows = [
        ("Discount Percent", "Lower Boundary: 0%", "-1% (Error), 0% ($0 Discount), +1% (Valid)", "Reject negative; Accept 0% and 1%"),
        ("Discount Percent", "Upper Boundary: 100%", "99% (Valid), 100% (Free Order), 101% (Error)", "Accept 100%; Throw RangeError for 101%"),
        ("Item Quantity", "Minimum Unit: 1", "0 (Throw Error), 1 (Accept), 2 (Accept)", "Reject 0 items; process 1 item"),
        ("Currency Rounding", "Fractional cents ($0.005)", "$11.49 * 15% = $1.7235 -> $1.72", "Standard mathematical half-up rounding")
    ]
    for i, rdata in enumerate(bva_rows):
        row = bva_table.rows[i+1]
        for j, val in enumerate(rdata): row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.0)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    # =========================================================================
    # SECTION 5: ENTRY, SUSPENSION & EXIT CRITERIA
    # =========================================================================
    h1 = doc.add_heading("5.0 Entry, Suspension, and Exit Criteria", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    doc.add_paragraph("• Entry Criteria: Phase 1 application active on http://localhost:3000; clean SQLite seed data; API responding to /api/health with status 'ok'.", style='List Bullet')
    doc.add_paragraph("• Suspension Criteria: Server crash or unhandled fatal exception in pricing logic; inability to connect to database.", style='List Bullet')
    doc.add_paragraph("• Exit Criteria: 100% of defined Unit tests passing; zero unresolved Critical (P1) or High (P2) defects; 100% statement and branch coverage on business logic.", style='List Bullet')

    # =========================================================================
    # SECTION 6: DEFECT SEVERITY & PRIORITY MATRIX
    # =========================================================================
    h1 = doc.add_heading("6.0 Defect Severity & Priority Matrix", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    sev_table = doc.add_table(rows=5, cols=3)
    sev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_headers = ["Severity Level", "Definition & Impact", "Resolution SLA"]
    for j, h in enumerate(s_headers): sev_table.rows[0].cells[j].text = h
    format_row(sev_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.0)

    sev_data = [
        ("S1 - Blocker / Critical", "Server crash, total pricing calculation failure, inability to checkout.", "Immediate hotfix within 2 hours"),
        ("S2 - Major", "Coupon discount percentage computed incorrectly, address fails to save.", "Resolve within 24 hours"),
        ("S3 - Moderate", "Status badge styling glitch, category filter doesn't update count label.", "Resolve before next release"),
        ("S4 - Minor / Cosmetic", "Minor alignment or font spacing on mobile screens.", "Low priority backlog")
    ]
    for i, rdata in enumerate(sev_data):
        row = sev_table.rows[i+1]
        for j, val in enumerate(rdata): row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.0)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # =========================================================================
    # SECTION 7: EXTENSIVE TEST CASE REPOSITORY (32 DETAILED TEST CASES)
    # =========================================================================
    h1 = doc.add_heading("7.0 Detailed Test Case Repository", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN
    doc.add_paragraph(
        "Below is the complete inventory of 32 formal test cases covering manual functional verification, "
        "Equivalence Partitioning, Boundary Value Analysis, and error-handling conditions."
    )

    test_cases = [
        # --- Authentication & Onboarding ---
        {
            "id": "TC-AUTH-001", "module": "Authentication",
            "desc": "Verify standard login with valid demo credentials",
            "tech": "EP (Valid)", "prio": "P1 - Critical",
            "pre": "Application loaded on Screen 1 (Login)",
            "steps": "1. Enter 'student@univ.edu' in Email.\n2. Enter 'pizza123' in Password.\n3. Click 'Sign In & Continue'.",
            "data": "Email: student@univ.edu, Pwd: pizza123",
            "expected": "User session stored in localStorage; Screen 2 (Address Setup) is displayed."
        },
        {
            "id": "TC-AUTH-002", "module": "Authentication",
            "desc": "Verify login rejection with blank email",
            "tech": "Negative / BVA", "prio": "P2 - High",
            "pre": "Screen 1 active",
            "steps": "1. Clear email input.\n2. Click 'Sign In & Continue'.",
            "data": "Email: '' (Empty)",
            "expected": "HTML5 required validation triggers; Toast notification displays error message."
        },
        {
            "id": "TC-ADDR-003", "module": "Address Onboarding",
            "desc": "Verify complete delivery address submission",
            "tech": "EP (Valid)", "prio": "P1 - Critical",
            "pre": "User logged in; Screen 2 displayed",
            "steps": "1. Fill Name, Phone, Street, City, Notes.\n2. Click 'Save & View Menu'.",
            "data": "Name: Alex Morgan, Phone: 555-234-5678, Street: 742 Evergreen Terr",
            "expected": "Address object saved to localStorage; Main Store (Screen 3) is loaded."
        },
        {
            "id": "TC-ADDR-004", "module": "Address Onboarding",
            "desc": "Verify address submission with missing street address",
            "tech": "Negative / EP", "prio": "P2 - High",
            "pre": "Screen 2 displayed",
            "steps": "1. Leave Street Address empty.\n2. Click 'Save & View Menu'.",
            "data": "Street: ''",
            "expected": "Form blocks submission; user remains on Screen 2."
        },
        
        # --- Menu & Filtering ---
        {
            "id": "TC-MENU-005", "module": "Menu Catalog",
            "desc": "Verify initial loading of all 10 menu items with photos",
            "tech": "Manual Functional", "prio": "P1 - Critical",
            "pre": "Screen 3 (Main Store) loaded",
            "steps": "1. Observe menu grid cards.\n2. Verify images, titles, descriptions, prices.",
            "data": "GET /api/menu",
            "expected": "10 cards displayed; all images load with object-fit 16:10; counter displays 'Showing 10 items'."
        },
        {
            "id": "TC-MENU-006", "module": "Menu Catalog",
            "desc": "Verify category filtering by 'Pizzas'",
            "tech": "EP (Valid)", "prio": "P2 - High",
            "pre": "Menu loaded with 'All Items' active",
            "steps": "1. Click '🍕 Classic Pizzas' filter pill.\n2. Count rendered cards.",
            "data": "Category: 'pizza'",
            "expected": "Exactly 5 pizza cards displayed; non-pizza items hidden; counter updates to 'Showing 5 items'."
        },
        {
            "id": "TC-MENU-007", "module": "Menu Catalog",
            "desc": "Verify category filtering by 'Sides' and 'Drinks'",
            "tech": "EP (Valid)", "prio": "P3 - Medium",
            "pre": "Main store loaded",
            "steps": "1. Click 'Fresh Sides'.\n2. Click 'Chilled Drinks'.",
            "data": "Categories: 'sides', 'drinks'",
            "expected": "Shows 3 sides (Garlic Bread, Wings, Salad); Shows 2 drinks (Cola, Lemonade)."
        },
        {
            "id": "TC-MENU-008", "module": "Menu Catalog",
            "desc": "Verify image fallback on broken image URL",
            "tech": "Negative / Error Guessing", "prio": "P3 - Medium",
            "pre": "Menu card rendered with invalid src",
            "steps": "1. Trigger image onerror event.",
            "data": "Invalid image URL",
            "expected": "Gracefully falls back to default pizza image without breaking card layout."
        },

        # --- Cart Management ---
        {
            "id": "TC-CART-009", "module": "Cart Operations",
            "desc": "Verify adding single item to empty cart",
            "tech": "EP (Valid)", "prio": "P1 - Critical",
            "pre": "Cart empty (count = 0)",
            "steps": "1. Click '+ Add to Cart' on Margherita Pizza ($8.99).",
            "data": "Item: Margherita, Price: $8.99",
            "expected": "Cart badge updates to '1'; button shows 'Added ✓' feedback; subtotal = $8.99."
        },
        {
            "id": "TC-CART-010", "module": "Cart Operations",
            "desc": "Verify quantity increment on existing cart item",
            "tech": "BVA (Count > 1)", "prio": "P2 - High",
            "pre": "Margherita in cart (qty = 1)",
            "steps": "1. Open cart drawer.\n2. Click '+' on Margherita item.",
            "data": "Delta: +1",
            "expected": "Quantity increments to 2; subtotal updates to $17.98 ($8.99 * 2)."
        },
        {
            "id": "TC-CART-011", "module": "Cart Operations",
            "desc": "Verify quantity decrement reducing count to 1",
            "tech": "BVA (Count -> 1)", "prio": "P2 - High",
            "pre": "Margherita in cart (qty = 2)",
            "steps": "1. Click '−' on Margherita item.",
            "data": "Delta: -1",
            "expected": "Quantity decrements to 1; subtotal updates to $8.99."
        },
        {
            "id": "TC-CART-012", "module": "Cart Operations",
            "desc": "Verify item removal when quantity decrements past 1",
            "tech": "BVA (Lower Bound = 0)", "prio": "P2 - High",
            "pre": "Margherita in cart (qty = 1)",
            "steps": "1. Click '−' on Margherita item.",
            "data": "Delta: -1 (resulting in 0)",
            "expected": "Item removed from cart; cart displays 'Your cart is currently empty'; Checkout disabled."
        },
        {
            "id": "TC-CART-013", "module": "Cart Operations",
            "desc": "Verify explicit trash bin removal button",
            "tech": "Manual Functional", "prio": "P3 - Medium",
            "pre": "Multiple items in cart",
            "steps": "1. Click trash icon '🗑️' on Garlic Bread.",
            "data": "Item ID: 6",
            "expected": "Garlic Bread completely removed; cart totals recalculated immediately."
        },

        # --- Pricing & Pure Logic (Jest Unit Tier) ---
        {
            "id": "TC-CALC-014", "module": "Pricing Engine",
            "desc": "Calculate subtotal for multiple items with integer quantities",
            "tech": "EP (Valid Partition)", "prio": "P1 - Critical",
            "pre": "Pure function calculateSubtotal() invoked",
            "steps": "1. Pass array with Margherita ($8.99 x 2) and Wings ($7.99 x 1).",
            "data": "[{price: 8.99, qty: 2}, {price: 7.99, qty: 1}]",
            "expected": "Returns exactly 25.97."
        },
        {
            "id": "TC-CALC-015", "module": "Pricing Engine",
            "desc": "Calculate subtotal with floating point precision check (avoid 0.30000004 bug)",
            "tech": "BVA (Precision)", "prio": "P1 - Critical",
            "pre": "Pure function calculateSubtotal() invoked",
            "steps": "1. Pass items with prices [8.99, 10.99, 11.49, 1.99].",
            "data": "Items ending in .99 / .49",
            "expected": "Returns strictly rounded 2 decimal float: 33.46."
        },
        {
            "id": "TC-CALC-016", "module": "Pricing Engine",
            "desc": "Reject empty array cart input",
            "tech": "Negative / BVA", "prio": "P2 - High",
            "pre": "calculateSubtotal([]) invoked",
            "steps": "1. Pass empty array [].",
            "data": "items = []",
            "expected": "Throws Error: 'Items must be a non-empty array'."
        },
        {
            "id": "TC-CALC-017", "module": "Pricing Engine",
            "desc": "Reject item with negative price",
            "tech": "Negative / EP", "prio": "P2 - High",
            "pre": "calculateSubtotal() invoked",
            "steps": "1. Pass item with price = -5.00.",
            "data": "[{price: -5.00, quantity: 1}]",
            "expected": "Throws Error: 'Each item must have a valid non-negative price'."
        },
        {
            "id": "TC-CALC-018", "module": "Pricing Engine",
            "desc": "Reject item with non-integer or negative quantity",
            "tech": "Negative / BVA", "prio": "P2 - High",
            "pre": "calculateSubtotal() invoked",
            "steps": "1. Pass quantity = 0, -1, and 1.5.",
            "data": "quantity: 0 / 1.5",
            "expected": "Throws Error: 'Each item must have a valid positive integer quantity'."
        },

        # --- Coupon Validation Engine ---
        {
            "id": "TC-CPN-019", "module": "Coupon Engine",
            "desc": "Validate coupon code 'WELCOME10' (10% off)",
            "tech": "EP (Valid)", "prio": "P1 - Critical",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass code 'WELCOME10'.",
            "data": "code = 'WELCOME10'",
            "expected": "{ valid: true, discount_percent: 10, description: '10% off your first order' }."
        },
        {
            "id": "TC-CPN-020", "module": "Coupon Engine",
            "desc": "Validate coupon code 'STUDENT15' (15% off)",
            "tech": "EP (Valid)", "prio": "P2 - High",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass code 'STUDENT15'.",
            "data": "code = 'STUDENT15'",
            "expected": "{ valid: true, discount_percent: 15, description: '15% student discount' }."
        },
        {
            "id": "TC-CPN-021", "module": "Coupon Engine",
            "desc": "Case-insensitivity test for coupon code ('welcome10')",
            "tech": "EP (Format)", "prio": "P2 - High",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass code in lowercase: 'welcome10'.",
            "data": "code = 'welcome10'",
            "expected": "Normalizes to uppercase; returns valid: true with 10% discount."
        },
        {
            "id": "TC-CPN-022", "module": "Coupon Engine",
            "desc": "Whitespace trimming on coupon code input",
            "tech": "BVA (Whitespace)", "prio": "P2 - High",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass code with leading and trailing spaces: '  PIZZA20  '.",
            "data": "code = '  PIZZA20  '",
            "expected": "Trims whitespace; returns valid: true with 20% discount."
        },
        {
            "id": "TC-CPN-023", "module": "Coupon Engine",
            "desc": "Reject unregistered coupon code",
            "tech": "Negative / EP", "prio": "P2 - High",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass code 'FAKE999'.",
            "data": "code = 'FAKE999'",
            "expected": "{ valid: false, discount_percent: 0, description: 'Coupon not found' }."
        },
        {
            "id": "TC-CPN-024", "module": "Coupon Engine",
            "desc": "Reject empty or non-string coupon inputs",
            "tech": "Negative / BVA", "prio": "P2 - High",
            "pre": "validateCoupon() invoked",
            "steps": "1. Pass '', null, undefined, and 12345.",
            "data": "code = null / ''",
            "expected": "Returns { valid: false, discount_percent: 0, description: 'Invalid coupon code' } without crashing."
        },

        # --- Total Calculation with Discounts ---
        {
            "id": "TC-DISC-025", "module": "Discount Engine",
            "desc": "Calculate total with standard 10% discount on $20.00",
            "tech": "EP (Valid)", "prio": "P1 - Critical",
            "pre": "calculateTotal(20.00, 10) invoked",
            "steps": "1. Pass subtotal = 20.00, discountPercent = 10.",
            "data": "subtotal: 20.00, discount: 10",
            "expected": "{ discount: 2.00, final_price: 18.00 }."
        },
        {
            "id": "TC-DISC-026", "module": "Discount Engine",
            "desc": "Boundary check: 0% discount on $35.00",
            "tech": "BVA (Lower Bound)", "prio": "P2 - High",
            "pre": "calculateTotal(35.00, 0) invoked",
            "steps": "1. Pass discountPercent = 0.",
            "data": "subtotal: 35.00, discount: 0",
            "expected": "{ discount: 0.00, final_price: 35.00 }."
        },
        {
            "id": "TC-DISC-027", "module": "Discount Engine",
            "desc": "Boundary check: 100% discount (free promotion)",
            "tech": "BVA (Upper Bound)", "prio": "P2 - High",
            "pre": "calculateTotal(50.00, 100) invoked",
            "steps": "1. Pass discountPercent = 100.",
            "data": "subtotal: 50.00, discount: 100",
            "expected": "{ discount: 50.00, final_price: 0.00 }."
        },
        {
            "id": "TC-DISC-028", "module": "Discount Engine",
            "desc": "Reject discount percentage outside [0, 100] range",
            "tech": "Negative / BVA", "prio": "P2 - High",
            "pre": "calculateTotal() invoked",
            "steps": "1. Pass discountPercent = -5.\n2. Pass discountPercent = 105.",
            "data": "discount: -5 / 105",
            "expected": "Throws Error: 'Discount percent must be a number between 0 and 100'."
        },

        # --- Checkout & Order Placement ---
        {
            "id": "TC-ORD-029", "module": "Checkout & Orders",
            "desc": "Complete order placement with coupon and pre-filled address",
            "tech": "E2E Integration", "prio": "P1 - Critical",
            "pre": "Cart has items; Checkout modal opened",
            "steps": "1. Verify Name, Phone, Address are pre-filled.\n2. Click 'Confirm & Place Order'.",
            "data": "POST /api/orders with items & coupon",
            "expected": "HTTP 201 Created; Confirmation modal shows Order ID; DB row inserted."
        },
        {
            "id": "TC-ORD-030", "module": "Checkout & Orders",
            "desc": "Reject order placement with missing customer phone number",
            "tech": "Negative / Integration", "prio": "P2 - High",
            "pre": "Checkout modal opened",
            "steps": "1. Clear phone number field.\n2. Submit form.",
            "data": "phone: ''",
            "expected": "Form blocks submission; API returns HTTP 400 Bad Request."
        },

        # --- Order Status & Tracking ---
        {
            "id": "TC-STAT-031", "module": "Order Status",
            "desc": "Verify real-time status tracking and stepper for placed order",
            "tech": "State Transition", "prio": "P1 - Critical",
            "pre": "Order #1 created with status 'pending'",
            "steps": "1. Navigate to '📦 My Orders' tab.\n2. Inspect Order #1 card.",
            "data": "Order #1 (status: 'pending')",
            "expected": "Badge displays '● PENDING' (amber); Stepper shows Step 1 (Placed) & Step 2 (In Oven) active."
        },

        # --- Customer Support ---
        {
            "id": "TC-SUP-032", "module": "Customer Support",
            "desc": "Submit customer support inquiry ticket",
            "tech": "Manual & Integration", "prio": "P2 - High",
            "pre": "Customer Support tab active",
            "steps": "1. Select Inquiry Reason.\n2. Type message: 'Need delivery update'.\n3. Click 'Submit Support Inquiry'.",
            "data": "POST /api/support with subject & message",
            "expected": "HTTP 200 OK; Ticket box displays '#TICK-XXXXXX' with 15-minute response SLA confirmation."
        }
    ]

    for tc in test_cases:
        tc_box = doc.add_table(rows=7, cols=2)
        tc_box.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Header Row
        h_cell = tc_box.rows[0].cells[0]
        h_cell.merge(tc_box.rows[0].cells[1])
        h_cell.text = f"{tc['id']}: {tc['desc']}"
        format_row(tc_box.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=10.0)

        rows_info = [
            ("Module / Feature", tc['module']),
            ("Test Design Technique", f"{tc['tech']}   |   Priority: {tc['prio']}"),
            ("Preconditions", tc['pre']),
            ("Execution Steps", tc['steps']),
            ("Input Test Data", tc['data']),
            ("Expected Result", tc['expected']),
        ]

        for idx, (label, val) in enumerate(rows_info):
            row = tc_box.rows[idx + 1]
            c0, c1 = row.cells[0], row.cells[1]
            c0.width = Inches(2.0)
            c1.width = Inches(4.5)
            c0.text = label
            c1.text = val
            format_row(row, "FBF6F0" if idx % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.0)
            c0.paragraphs[0].runs[0].font.bold = True
            c0.paragraphs[0].runs[0].font.color.rgb = DARK_BROWN

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # SECTION 8: CONCLUSION & STLC DELIVERABLES SIGN-OFF
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("8.0 STLC Deliverables & Sign-Off Authorization", level=1)
    for r in h1.runs: r.font.color.rgb = DARK_BROWN

    doc.add_paragraph(
        "By signing below, the QA Lead and Academic Supervisor confirm that the test strategies, equivalence partitions, "
        "and boundary test cases outlined in this document conform to university evaluation standards and "
        "are approved for execution across Phase 2 (Jest Unit), Phase 3 (Postman API), Phase 4 (Playwright E2E), "
        "and Phase 5 (JMeter Performance & CI/CD)."
    )

    sign_table = doc.add_table(rows=3, cols=3)
    sign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_headers = ["Role", "Signatory Name", "Signature & Date"]
    for j, h in enumerate(s_headers): sign_table.rows[0].cells[j].text = h
    format_row(sign_table.rows[0], "3E2214", WHITE_TEXT, bold=True, font_size=9.5)

    sign_data = [
        ("QA Lead & Test Engineer", "University Student / QA Lead", "____________________   ___/___/2026"),
        ("Coursework Supervisor / Professor", "Faculty Reviewer", "____________________   ___/___/2026")
    ]
    for i, rdata in enumerate(sign_data):
        row = sign_table.rows[i+1]
        for j, val in enumerate(rdata): row.cells[j].text = val
        format_row(row, "F4EBE1" if i % 2 == 0 else "FFFFFF", BLACK_TEXT, font_size=9.5)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.save(filename)
    print(f"Document successfully created: {filename}")

if __name__ == "__main__":
    out_file = r"c:\Users\Acer\Desktop\PIZZA_ORDER\Pizza_Ordering_System_Formal_Test_Plan.docx"
    build_test_plan_docx(out_file)
