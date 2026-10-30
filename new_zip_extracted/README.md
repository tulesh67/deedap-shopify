# Deedap — Shopify sections

Home-page sections built from the Deedap design. Online Store 2.0 (JSON templates) required.

## What's inside
| File | Purpose |
|---|---|
| sections/deedap-announcement.liquid | Scrolling announcement bar (messages are blocks) |
| sections/deedap-header.liquid | Logo, search, account, wishlist, bag count + category menu grid |
| sections/deedap-hero.liquid | "Discover more / Shop Deedap" heading + trust points |
| sections/deedap-festival.liquid | Festival banner. Theme: Diwali, Christmas, Eid, Holi, Everyday |
| sections/deedap-new-arrivals.liquid | Auto-rotating New Arrivals (one block per collection) |
| sections/deedap-category-row.liquid | One category row; add one per collection |
| snippets/deedap-assets / -tile / -ornaments | Shared code (fonts+CSS+JS loader, product tile, festival decorations) |
| assets/deedap.css, assets/deedap.js | Styles, add-to-bag, live bag count, rotation |
| templates/index.json | Example home page using all of the above |

## Install (do this on a DUPLICATE of your theme first)
1. Online Store > Themes > ... > Duplicate. Work on the copy.
2. Upload/copy the files into the same folders in the copy (Edit code, or Shopify CLI / GitHub).
   - **If your theme already has templates/index.json, don't overwrite it.** Add the sections in
     the theme editor instead: Home page > Add section > pick the "Deedap ·" ones.
3. Header: the Deedap header is a normal section. To use it site-wide, add it in the
   Header group and remove the theme's own header. Otherwise keep the theme header and skip it.
4. Create collections whose handles match templates/index.json (or pick collections in the editor):
   clothing-textiles, information-technology, organic-natural, global-collections, essentials,
   jewellery, cookware, gift-hampers, carryout-bags, accessories.
5. For "newest first", set each collection's sort order to **Date, new to old**.

## Festival banner
Theme editor > Festival banner > **Festival theme**. Leave the text fields empty to use that
festival's default wording. Set "Show from / until" dates (YYYY-MM-DD) to auto-hide it after the sale.

## Notes
- Fonts load from Google Fonts (Syne, Manrope, Cormorant Garamond).
- Adding to bag uses /cart/add.js and updates the number in the header. Products with several
  variants link to the product page instead of adding directly.
- Not tested on a live store: please preview the duplicate theme and check each section.
