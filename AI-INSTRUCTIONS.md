# DEEDAP Complete Shopify Theme — Developer & AI System Guide

> **Store Domain:** `deedap.com` / `yc5gk0-yn.myshopify.com`  
> **Brand Slogan:** *"Discover More. Shop Deedap."*  
> **Theme Foundation:** Shopify Online Store 2.0 (Synthesized Dawn/Horizon with Truus & Vercel Commerce performance principles)

---

## 1. Project Overview & Directory Architecture

This zip package contains the entire, production-ready, fully synthesized DEEDAP Shopify theme from A to Z. All assets, images, liquid sections, snippets, templates, styles, and configurations are self-contained.

```
/
├── assets/                  # 248+ stylesheets, JS drivers, SVG icons, and high-res photography
│   ├── deedap-theme.css     # Global theme design system, typography, colors, and responsive layouts
│   ├── deedap-header.css    # Header & 10-category 2-row sticky navigation styling
│   ├── new-arrivals.css     # New arrivals animated showcase & progress bar
│   ├── new-arrivals.js      # AJAX add-to-bag driver with direct /cart redirect
│   ├── textiles-style.css   # Full-bleed styling for Clothing & Textiles landing page
│   ├── jewelry-style.css    # Full-bleed luxury dark aesthetic for Fine Jewellery landing page
│   ├── electronics-style.css# Cyberpunk/clean tech aesthetic for Electronics landing page
│   ├── accessories-style.css# Bespoke accessory hub styling
│   └── [images]             # High-res photography (textiles, jewelry, tech, lifestyle)
├── config/
│   ├── settings_data.json   # Active store configuration, colors, and typography settings
│   └── settings_schema.json # Theme customizer controls schema
├── layout/
│   ├── theme.liquid         # Primary master layout, global meta tags, scripts, header & footer groups
│   └── password.liquid      # Storefront lock/password page
├── locales/                 # 50+ language translations (en.default.json, etc.)
├── sections/                # 66 Liquid modular sections
│   ├── deedap-header.liquid             # Sticky header with 10-category navigation rail
│   ├── deedap-announcement-bar.liquid   # Live kinetic ticker bar
│   ├── deedap-hero.liquid               # Hero banner with luxury typography & quick jump pills
│   ├── new-arrivals.liquid              # Auto-rotating 5-item category arrivals
│   ├── deedap-categories.liquid         # Curated Departments (4 cards/row desktop, 0 image fade)
│   ├── deedap-category-row.liquid       # Horizontal category showcase rows (10 departments)
│   ├── deedap-featured-products.liquid  # Product spotlight & interactive tab selector
│   ├── deedap-textile-hub.liquid        # Textiles Department Landing Page
│   ├── deedap-jewelry-hub.liquid        # Fine Jewellery Landing Page
│   ├── deedap-electronics-hub.liquid    # Electronics & Tech Landing Page
│   ├── deedap-accessories-hub.liquid    # Accessories Landing Page
│   ├── deedap-festival-offer.liquid     # Promotional banner & countdown
│   └── deedap-trust.liquid              # Sourcing assurance & trust badges
├── snippets/                # 47 Reusable Liquid components & icons
│   ├── new-arrivals-card.liquid         # Dynamic product card with round Add to Bag floating button
│   ├── new-arrivals-card-fallback.liquid# Demo fallback card with live add-to-cart & /cart redirect
│   ├── deedap-assets.liquid             # Global font preloading & CSS variables
│   └── [icons, drawers, etc.]
├── templates/               # JSON & Liquid OS 2.0 templates
│   ├── index.json           # Complete homepage block configuration
│   ├── page.textiles.json   # /pages/textiles template
│   ├── page.jewelry.json    # /pages/jewelry template
│   ├── page.electronics.json# /pages/electronics template
│   ├── page.accessories.json# /pages/accessories template
│   ├── product.json         # PDP layout
│   ├── collection.json      # Collection browsing layout
│   └── cart.json            # Shopping cart layout
└── AI-INSTRUCTIONS.md       # This file
```

---

## 2. Key Theme Innovations & Behavior Rules

### A. Add to Bag / Cart Behavior
- The round floating `+` button in `new-arrivals-card.liquid` and `new-arrivals-card-fallback.liquid`:
  - When clicked, it dispatches an AJAX request to `/cart/add.js` with the item's variant ID.
  - Upon adding, it immediately redirects the user to the cart page (`/cart`) so customers see their updated bag and total right away.
  - Handled by `assets/new-arrivals.js`.

### B. Curated Departments (Sections & CSS)
- Configured in `sections/deedap-categories.liquid` and `assets/deedap-theme.css`:
  - **Desktop (1024px+):** Exactly 4 cards in a single row (`grid-template-columns: repeat(4, 1fr)`).
  - **Tablet (641px–1023px):** 2 cards per row (`repeat(2, 1fr)`).
  - **Mobile (<640px):** 1 card per row (`1fr`).
  - **Images:** Crisp, sharp, 220px dedicated media frames with **zero gradient mask, zero white overlays, zero blur, and 100% opacity**.

### C. Dedicated Department Hub Landing Pages
1. **Clothing & Textiles:** `/pages/textiles` (`page.textiles.json` & `deedap-textile-hub.liquid`)
2. **Fine Jewellery:** `/pages/jewelry` (`page.jewelry.json` & `deedap-jewelry-hub.liquid`)
3. **Information & Technology:** `/pages/electronics` (`page.electronics.json` & `deedap-electronics-hub.liquid`)
4. **Accessories:** `/pages/accessories` (`page.accessories.json` & `deedap-accessories-hub.liquid`)

*Note:* `layout/theme.liquid` includes full-bleed layout resets for these hub pages (`body:has(.deedap-*-page)`), ensuring no horizontal overflow or unwanted white gaps.

---

## 3. Shopify CLI Commands

If you need to push changes to the live store or pull remote updates:

```bash
# Push directly to the Live Theme (Horizon #131550904453)
shopify theme push --store yc5gk0-yn.myshopify.com --theme 131550904453 --allow-live

# Push to the Unpublished Draft Theme (deedap-complete-shopify-theme #131817144453)
shopify theme push --store yc5gk0-yn.myshopify.com --theme 131817144453

# Start local development server
shopify theme dev --store yc5gk0-yn.myshopify.com
```

---
*Created for DEEDAP E-Commerce System by Antigravity AI.*
