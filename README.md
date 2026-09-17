# Krishna Sarees And Readymade

Next.js 15 App Router + TypeScript storefront, protected administration, Supabase persistence, Cloudinary uploads, and a Groq-powered shopping assistant. Design follows the supplied wine / cream / gold reference.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build` followed by `npm start`.

The provided credentials are configured in `.env.local`, which is ignored by Git. `.env.example` contains only variable names. Never expose `GROQ_API_KEY`, `SUPABASE_SECRET_KEY`, or `CLOUDINARY_API_SECRET` through `NEXT_PUBLIC_` variables.

## Required Supabase setup

1. Open the SQL Editor for your Supabase project and run `supabase/schema.sql`.
2. Run `supabase/002_categories.sql` to add editable clothing departments. Optionally run `supabase/seed.sql`. It adds eight archived sample products. Review prices/stock, replace their reference images, then activate them in admin. No sample inventory is represented as live inventory.
3. Create an email/password user under Authentication → Users. Disable public account registration for this admin-only application.
4. Grant that user access with this SQL, replacing the example email:

```sql
insert into public.admin_profiles (id, full_name)
select id, 'Store administrator' from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (id) do nothing;
```

5. Sign in at `/admin/login`; upload real product photos, add products, and enter store contact details, opening hours, social links and policies in `/admin/settings`.

Schema includes RLS on every table. Public visitors can read active products and store settings, and submit enquiries / analytics events. Admin writes require an authenticated user with an explicit `admin_profiles` membership. There is no public signup UI. The service key is imported only from server modules. Protected API routes independently verify administrator membership in addition to middleware checks.

## Storefront

- `/`: asymmetric reference-inspired portrait hero, scroll-linked drape overlay, floating fabric card, marquee, collections, featured products, story and footer.
- `/shop`: search, fabric/colour/style/occasion/price filters, sorting and saved favourites (`?saved=true`).
- `/collections`, `/collections/[slug]`, `/product/[slug]`: collection and detail pages with gallery zoom and enquiry form.
- `/cart`, `/checkout`: browser-local shopping bag and enquiry-based order request. Server rechecks current stock and prices. This does not reserve inventory, take payment or create a confirmed sale.
- `/about`, `/contact`, `/blog`, `/blog/[slug]`, `/policies/[slug]`.
- Chat available throughout public pages, dynamically loaded with Groq requests proxied through `/api/chat`.

The original reference image is used as a positioned image source to preserve its model portraits without downloading unrelated images. These are preview visuals, not production product photography. Upload original store-owned images through Cloudinary for the live catalogue. If Supabase tables are unavailable or no products are active, the storefront explicitly shows a preview catalogue; forms report a service error rather than pretending to save.

## Administration

- `/admin`: real recorded product views, weekly enquiries, enquiry/view ratio and Recharts visualisations. Charts and metrics describe the latest 1,000 events, not unique visitor analytics.
- `/admin/products`: list/search, create/edit, soft archive. Product editor supports multi-image selection, drop upload, drag ordering, primary image and editable alt text.
- `/admin/categories`: create/edit/hide and order clothing departments; new categories appear in the homepage, navigation and shop.
- `/admin/enquiries`: website / chatbot / checkout / newsletter leads and status updates.
- `/admin/chat-logs`: saved conversations.
- `/admin/settings`: business details, hours, social links, policy text and PDF uploads.

Cloudinary uploads are signed server-side and restricted to administrators, approved MIME types, and 10 MB per file. Configure `CLOUDINARY_CLOUD_NAME` in `.env.local`.

## Groq chatbot

Uses the OpenAI-compatible Groq Chat Completions endpoint with `openai/gpt-oss-120b`, configurable through `GROQ_MODEL`. It retrieves active products and store settings per request, asks qualifying questions and links to product pages. The system prompt prohibits fabricated price / stock / policy claims. When contact details are supplied, a chatbot lead is saved and the response only confirms this if the database write succeeds. Messages are stored for admin review when the schema is available.

Policy PDFs are downloadable from the footer. Add their policy text to the corresponding settings fields for chatbot retrieval; arbitrary PDF text extraction is not implemented.

Public APIs have process-local abuse limits. A multi-instance public deployment should use a shared rate-limit store or platform firewall. Direct public Supabase insert policies match the requested schema; configure platform abuse protection for production traffic.

## Deployment

Deploy as a Node.js Next.js app (for example, Vercel or a Node host). Set the variables from `.env.example` in the host's environment, including `NEXT_PUBLIC_SITE_URL` with the real origin. Configure the matching Supabase Auth site URL. Do not use static export because authentication, chat, signed uploads and enquiries require a server.

No payment gateway, invented testimonials, team identities, store address or delivery promises have been added. The request uses the basic request-to-order checkout option.

## Verification

```bash
npm run typecheck
npm run build
node scripts/check-services.cjs
node scripts/smoke.cjs
```

`check-services.cjs` performs read-only credential checks without printing secrets. `smoke.cjs` expects the app running at localhost:3000 and checks public routes, protected endpoints and validation failures. Optional `SMOKE_CHAT=1` sends one real Groq request and persists its non-personal test conversation when the database is connected.

Private keys shared in chat should be rotated before public launch and replaced in `.env.local` and the hosting environment.
