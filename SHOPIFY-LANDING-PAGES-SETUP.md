# DEEDAP Shopify landing pages: required setup

Uploading a Shopify theme installs its layouts and page templates. Shopify does not create the store's Page or Collection records when a theme is uploaded. The landing templates therefore need matching Pages in Shopify Admin, and collection destinations need matching Collections that are available on the Online Store sales channel.

## Create the four custom landing pages

In Shopify Admin, open **Online Store → Pages → Add page**. Create each page with the exact handle, then set its theme template in the page's **Theme template** control:

| Page title | URL handle | Theme template |
| --- | --- | --- |
| Textiles | `textiles` | `page.textiles` |
| Electronics | `electronics` | `page.electronics` |
| Jewelry | `jewelry` | `page.jewelry` |
| Accessories | `accessories` | `page.accessories` |

Save each page and make sure it is available to the Online Store. The homepage cards then open `/pages/textiles`, `/pages/electronics`, `/pages/jewelry`, and `/pages/accessories`.

## Set up the collection destinations

These cards open Shopify collection URLs. Create or confirm each collection exists, is active on the Online Store, and uses the matching handle:

| Department | Collection handle |
| --- | --- |
| Organic and Natural Products | `raw-honey` |
| Global Collections | `imported` |
| Home and Everyday Essentials | `essentials` |
| Cookware and Kitchenware | `cookware` |
| Gift Hampers | `gift-hampers` |
| Carryout Bags | `carryout-bags` |

If a collection already exists with a different handle, open **Online Store → Themes → Customize → Home page → DEEDAP Sourcing Mosaic**, select that department card, and change **Custom Link Override** to the collection's actual URL. These six cards previously linked to anchors on their own cards; the theme now sends them to collection destinations instead.

## Configure landing page collections

In the theme editor, open each custom landing page and choose its collections in the DEEDAP section settings:

- Textiles: Men, Women, Kids
- Electronics: Audio, Mobiles, Wearables, Smart Home, Laptops, Accessories
- Accessories: Men, Women, Everyday
- Jewelry: the page is a curated landing page and does not need collection settings

For theme navigation, add the desired department links to the Shopify **Main menu** and point them to the same page or collection URLs above.
## Populate the real product cards and filters

The Discover catalog reads real products from the selected collection (or Shopify's All collection when no collection is selected). Product photos, titles, prices, stock state, variants, and quick-add behavior come from Shopify product records. The department chips classify products from their product type or tags:

- `textiles`, `clothing`, `apparel`, `fashion`
- `electronics`, `technology`, `tech`
- `honey`, `organic`, `natural`
- `imported`, `global`
- `home`, `essentials`, `living`
- `jewelry`, `jewellery`
- `cookware`, `kitchenware`
- `gift`, `gifting`, `hamper`
- `carryout`, `bags`
- `accessories`, `accessory`

If a product does not have a matching type or tag, it still appears under **All**. Add the appropriate type or tag if it should appear under a department filter.