# SHOP.CO storefront and staff admin

This Next.js application uses the Laravel e-commerce backend for the catalog, checkout, customer accounts, and staff operations.

## Local setup

1. In the backend repository, prepare the local database and application key, then run `php artisan migrate --seed --no-interaction`. Start the backend on port 8000.
2. Copy `.env.example` to `.env.local` and set the API URLs if the backend runs elsewhere. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your Stripe Test Mode publishable key for card checkout.
3. Run `npm ci` and `npm run dev -- --port 3001`.
4. Open the storefront at `http://localhost:3001` or the staff workspace at `/admin`. Both use the shared sign-in page.

The backend seeder creates the local Super Admin and customer demo accounts and populates the storefront catalog. The backend queue worker and Stripe Test Mode webhook are required for order settlement. Set the backend browser origin to the frontend origin for direct customer and cart API requests.

Run `npm run build` to verify the production build. Admin API requests go through the Next.js server and use an HttpOnly staff session cookie.
