# SHOP.CO storefront and staff console

This Next.js App Router application serves the customer storefront and staff console for the [Laravel commerce API](https://github.com/medevjb/ecombackend).

## Architecture

- `app/(storefront)` provides the home page, search, product catalog, cart, wishlist, checkout, and customer account. `app/(auth)` provides shared sign-in and customer email verification. `app/(admin)` provides the staff console.
- Server components load catalog and storefront content from Laravel. Client components handle filters, variant selection, cart changes, and checkout.
- `app/api/catalog` and `app/api/commerce` proxy supported calls to Laravel. `context/cart-context.tsx` keeps server cart quotes current and merges a guest cart after sign-in.
- `app/api/staff` keeps the staff token in an HttpOnly cookie. The staff console uses permissions from the staff profile to display available tools, and Laravel enforces permissions and resource ownership.
- Laravel owns catalog, inventory, customer data, pricing, and order state. Currency amounts cross the API in integer cents.

## Local installation

1. Install Node.js 22 LTS and npm. Set up the Laravel repository and run it on port 8000 using its README.
2. Set the backend `STOREFRONT_ORIGIN` and `ADMIN_ORIGIN` to `http://localhost:3000` for this setup.
3. From this directory, run the following commands.

```sh
cp .env.example .env.local
npm ci
npm run dev -- --port 3000
```

Open `http://localhost:3000` for the storefront or `http://localhost:3000/admin` for the staff console. Both use shared sign-in. With the backend's local seed data, `customer@demo.test` opens the customer account and `admin@admin.com` opens the staff console. The local demo password is `password`.

`LARAVEL_API_URL` is the server-side Laravel API base and `NEXT_PUBLIC_API_URL` is the browser-accessible API base. Include `/api/v1` in both. Configure backend mail for customer verification codes. Run the backend queue worker for recovery mail and newsletter messages. For card testing, configure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and follow the backend Stripe Test Mode instructions.

Behind a trusted ingress, set `TRUSTED_CLIENT_IP_HEADER` to a dedicated header the ingress overwrites with the verified client IP. Restrict direct access to Next.js and configure Laravel's `TRUSTED_PROXY_ADDRESSES` for the upstream connection. See the backend operations guide for the full setup.

## Verification

Run `npm run lint` and `npm run build`. The production build includes the TypeScript check.

GitHub Actions runs the build, lint, and a Chromium smoke suite against a local API fixture. To run that suite locally after a build, install Playwright in a separate directory and run the tests.

```sh
browser_tools=$(mktemp -d)
npm install --prefix "$browser_tools" playwright@1.58.2
"$browser_tools/node_modules/.bin/playwright" install --only-shell chromium
PLAYWRIGHT_ROOT="$browser_tools" node --test tests/browser/smoke.test.mjs
```
