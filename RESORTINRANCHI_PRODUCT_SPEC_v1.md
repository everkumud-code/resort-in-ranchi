# ResortInRanchi.com — Product & Technical Specification v1.0

## Product
Ranchi-focused hospitality, dining, weddings, events and experiences discovery platform.

**Positioning:** Ranchi's Hospitality, Dining & Events Discovery Platform  
**Tagline:** Discover. Compare. Experience Ranchi.

Launch scope: Ranchi + approximately 30–50 km surrounding area, starting with the existing 400-record research dataset. Scale to 1,000+ listings later.

## Core categories
- Resorts
- Hotels
- Restaurants
- Cafés
- Banquet Halls
- Wedding Venues
- Marriage Halls
- Wedding Lawns
- Farmhouses
- Party Halls
- Corporate/Conference Venues
- Picnic & Day Outing
- Adventure & Camping
- Weekend Getaways
- Homestays/Farm Stays

## Priority locations
Ranchi, Ormanjhi, Kanke, Morabadi, Lalpur, Bariatu, Hatia, Doranda, Namkum, Tatisilwai, Ratu, Mesra, Daladali, Hinoo, Kantatoli, Ring Road, Patratu, Ramgarh, Khunti and nearby localities.

## Technology
- Next.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Server-rendered/indexable pages
- Cloud image storage/CDN
- Vercel or Render
- GitHub

Avoid unnecessary frameworks/plugins.

## Database entities

### Property
id, slug, name, category, subcategory, short_description, full_description, address, locality, city, state, pincode, latitude, longitude, phone, whatsapp, email, website, google_maps_url, google_rating, review_count, price_min, price_max, price_label, rooms, event_capacity_min, event_capacity_max, status, verification_status, claimed, owner_verified, created_at, updated_at, last_verified_at.

### Facility
id, name, slug. Many-to-many with Property.

Examples: Swimming Pool, Restaurant, Parking, Lawn, Banquet, AC, Wi-Fi, Kids Area, Adventure, Camping, Pet Friendly, Day Outing, Wedding, Corporate Events, Conference, Outdoor Dining.

### Category
id, name, slug, parent_id, description, seo_title, seo_description.

### Location
id, name, slug, parent_id, description, seo_title, seo_description.

### PropertyImage
id, property_id, url, alt_text, caption, sort_order.

### Enquiry
id, property_id, name, phone, email, event_date, guests, requirement, budget, source_page, status, created_at.

### ClaimRequest
id, property_id, owner_name, phone, email, proof_reference, status, created_at.

### Guide
id, title, slug, excerpt, content, cover_image, seo_title, seo_description, status, published_at.

### VenueSpace
id, property_id, name, type, capacity_min, capacity_max, description.

## Verification states
DISCOVERED, VERIFIED, OWNER_CLAIMED, OWNER_VERIFIED, CLOSED, NEEDS_REVIEW.

Never invent missing business information. Verification-queue records from the research spreadsheet must not be public.

## URL architecture
Category:
- /resorts-in-ranchi/
- /hotels-in-ranchi/
- /restaurants-in-ranchi/
- /cafes-in-ranchi/
- /banquet-halls-in-ranchi/
- /wedding-venues-in-ranchi/

Locations:
- /resorts-in-ormanji/
- /resorts-in-kanke/
- /hotels-in-morabadi/
- /restaurants-in-lalpur/
- /banquet-halls-in-namkum/

Intent:
- /resorts-for-day-outing-ranchi/
- /family-resorts-near-ranchi/
- /corporate-outing-resorts-ranchi/
- /wedding-resorts-near-ranchi/

Property:
- /property/{slug}/

Guides:
- /guides/{slug}/

One canonical URL per piece of content. Do not create duplicate URL patterns.

## Homepage
Hero: **Find the Best Places to Stay, Eat & Celebrate in Ranchi**

Search: “Search resorts, hotels, restaurants, venues…”

Category cards, popular locations, featured/verified properties, popular guides and “List Your Business” CTA.

## Search
Search property name, category, locality, cuisine, facility and purpose.

Filters: category, locality, rating, price, capacity, facilities, purpose, verified only.

Sort: recommended, rating, most reviewed, recently verified, alphabetical.

Ranking must be configurable and should not falsely claim that a property is objectively “best”.

## Property page
Breadcrumb; name/category; rating/review count when available; location; gallery; about; facilities; rooms; event spaces/capacity; restaurant/cuisine; best-for; Call; WhatsApp; Directions; Website; enquiry; related properties; genuine FAQs; claim listing.

## Compare
Phase 2: compare up to four properties with category-specific attributes.

## Owner claiming
“Is this your business? Claim this listing.” Capture owner name, phone, email and proof. Admin approval. Show verification badge only after approval.

## Admin
Dashboard; Properties; Categories; Locations; Facilities; Venue Spaces; Images; Enquiries; Claim Requests; Guides; SEO; Featured Listings; Admin Users.

Property actions: create, edit, archive, verify, feature, mark closed, approve claim.

Bulk CSV/XLSX import with preview, validation, duplicate detection, slug generation and import report.

## Import rules
Treat the existing 400-record spreadsheet as research data.
- Preserve blank values.
- Never fabricate phone, website, rating, price, facilities or reviews.
- Preserve source and last-checked fields.
- Verification Queue records stay private.
- Flag duplicates.
- Link venue spaces to parent properties where possible.
- Maintain source record ID.

## SEO
Every indexable page needs unique title, meta description, canonical, H1, breadcrumbs, Open Graph, relevant JSON-LD, internal links and descriptive image alt text.

Use appropriate structured data only: Hotel, Restaurant, LocalBusiness, EventVenue where applicable, BreadcrumbList, and FAQPage only when visible genuine FAQs exist.

Never create fake reviews or ratings.

## Sitemap/robots
Programmatically generate XML sitemap(s). Include only published, indexable, canonical pages. Exclude admin, private/search/filter pages not intentionally indexable, drafts, closed/unpublished records and verification queue.

Block admin/private routes in robots.txt.

## Internal linking
Property → category, locality, relevant purpose pages, related properties, relevant guides.
Category → locations, subcategories, featured properties, guides.
Guides → relevant property/category pages.
Avoid repetitive exact-match anchors.

## Performance
Fast first load, responsive optimized images, lazy-load below fold, minimal client JS, server rendering where useful, crawl-safe pagination, never ship the entire database to the browser.

## Mobile
Mobile-first. Keep Search, Call, WhatsApp, Directions and Enquiry easy to access.

## Security
Server-side validation, rate limiting, spam protection, sanitized input, secure admin auth, environment variables, backups and audit trail for important admin actions.

## Analytics
Track searches, category views, property views, filter usage, compare clicks, phone clicks, WhatsApp clicks, website clicks, directions, enquiries and claim submissions.

## Monetization roadmap
Phase 1: free listings and traffic.
Phase 2: verified listings, featured listings, sponsored placement, leads.
Phase 3: owner dashboard, subscriptions, lead packages, advertising and premium business tools.

Do not force payment at launch.

## Aangan strategy
Aangan Resort receives a complete accurate listing and can be verified/claimed. The directory must remain genuinely useful for competing businesses too. Do not create deceptive pages solely to manipulate SEO. Relevant contextual links to Aangan are acceptable.

## MVP acceptance criteria
- Safe import of 400-record dataset
- Searchable public listings
- Category pages
- Location pages
- Individual property pages
- Filters
- Enquiry forms
- Admin CRUD/verify/archive
- Dynamic SEO metadata
- Sitemap and robots
- Mobile-friendly UI
- Analytics events
- Verification queue excluded from public index
- No fabricated business data

## Development sequence
1. Project setup + schema + Prisma + authentication + import pipeline.
2. Admin dashboard + property management.
3. Homepage + categories + locations.
4. Property pages + gallery + contact actions.
5. Search + filters + pagination.
6. SEO + structured data + sitemap + internal linking.
7. Enquiries + claim listing.
8. Performance, security, QA and deployment.

## Phase 2
Compare, owner dashboard, reviews, offers, advanced search, saved properties, lead routing, premium listings, business analytics.

## Phase 3
Ranchi city guide, wider Jharkhand expansion, ResortInJharkhand.com ecosystem, PWA/mobile consideration and booking integrations if justified.

## Product principle
**Useful directory first. SEO engine second. Marketplace third.**

Never sacrifice accuracy or usefulness for page-count or keyword volume.
