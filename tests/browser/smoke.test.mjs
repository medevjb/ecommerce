import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { after, before, test } from "node:test";

const browserTools = process.env.PLAYWRIGHT_ROOT;
if (!browserTools) throw new Error("Set PLAYWRIGHT_ROOT to the separate Playwright installation directory.");
const { chromium } = createRequire(resolve(browserTools, "package.json"))("playwright");
const port = Number(process.env.BROWSER_TEST_PORT || 3161);
const origin = "http://127.0.0.1:" + port;
const product = {
  id: "demo-shirt", slug: "demo-shirt", name: "Demo Shirt", description: "A cotton shirt",
  current_amount: 3000, regular_amount: 3000, sale_amount: null, discount_percent: 0,
  in_stock: true, rating_count: 0, rating_average: null,
  variants: [{id:"demo-variant", sku:"DEMO-SHIRT", is_default:true, in_stock:true, price_override_amount:null, options:[]}],
};
const blocked = {id:"blocked", number:"ORD-2026-900001", status:"paid", payment_status:"succeeded", captured_amount:3000, total_amount:3000, cancellation_refund_pending:true, created_at:"2026-11-20T12:00:00Z"};
const eligible = {...blocked, id:"eligible", number:"ORD-2026-900002", cancellation_refund_pending:false};
let cart = {items:[], subtotal_amount:0, discount_amount:0, total_amount:0, conflicts:[]};
let sentVariant;
let staffTransition;
let browser;
let serverProcess;

const fixture = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname.replace(/^\/api\/v1/, "");
  const send = (data, status = 200) => {
    response.writeHead(status, {"Content-Type":"application/json"});
    response.end(JSON.stringify({data, meta:null}));
  };
  if (path === "/products/demo-shirt") return send(product);
  if (path === "/products/demo-shirt/related" || path === "/products/demo-shirt/reviews" || path === "/attributes") return send([]);
  if (path === "/storefront/settings") return send({name:"Demo Shop"});
  if (path === "/storefront/navigation") return send({header:[],footer:[],social:[]});
  if (path === "/storefront/home") return send({announcements:[],hero_slides:[],sections:[],promotions:[],testimonials:[]});
  if (path === "/cart" && request.method === "GET") return send(cart);
  if (path === "/cart/items" || path === "/admin/orders/eligible/transitions") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString());
    if (path === "/cart/items") {
      sentVariant = payload.variant_id;
      cart = {...cart, subtotal_amount:3000, total_amount:3000, items:[{id:"demo-line", variant_id:sentVariant, sku:"DEMO-SHIRT", product_id:product.id, name:product.name, slug:product.slug, quantity:1, unit_amount:3000, line_amount:3000}]};
      return send(cart);
    }
    staffTransition = payload;
    return send({...eligible, status:payload.status});
  }
  if (path === "/admin/me" && request.headers.authorization === "Bearer smoke-staff") {
    return send({id:"staff", name:"Order Manager", email:"staff@example.test", roles:["order-manager"], permissions:["orders.view","orders.update_status"]});
  }
  if (path === "/admin/orders") return send([blocked, eligible]);
  if (path === "/admin/orders/eligible") return send(eligible);
  return send(null, 404);
});

before(async () => {
  fixture.listen(0, "127.0.0.1");
  await once(fixture, "listening");
  const backend = "http://127.0.0.1:" + fixture.address().port + "/api/v1";
  serverProcess = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env:{...process.env, LARAVEL_API_URL:backend},
    stdio:"inherit",
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (serverProcess.exitCode !== null) throw new Error("Next.js exited before starting.");
    const ready = await fetch(origin + "/api/catalog/products/demo-shirt").catch(() => null);
    if (ready?.ok) {
      browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
      return;
    }
    await sleep(300);
  }
  throw new Error("Next.js did not become ready.");
});

after(async () => {
  await browser?.close();
  if (serverProcess && serverProcess.exitCode === null) {
    const exited = once(serverProcess, "exit");
    serverProcess.kill();
    await exited;
  }
  if (fixture.listening) await new Promise((resolve) => fixture.close(resolve));
});

test("a shopper can add the displayed variant to the cart", {timeout:30_000}, async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin + "/products/demo-shirt");
    await page.getByRole("button", {name:"Add to Cart", exact:true}).click();
    await page.getByRole("link", {name:"View cart", exact:true}).waitFor();
    assert.equal(sentVariant, "demo-variant");
    assert.equal(cart.items[0].quantity, 1);
  } finally {
    await page.close();
  }
});

test("staff can advance eligible orders while cancellation refunds pause fulfilment", {timeout:30_000}, async () => {
  const page = await browser.newPage();
  try {
    await page.context().addCookies([{name:"ecommerce_staff", value:"smoke-staff", domain:"127.0.0.1", path:"/api/staff", httpOnly:true}]);
    await page.goto(origin + "/admin/orders");
    const paused = page.getByRole("row", {name:/ORD-2026-900001/});
    await paused.getByText("Cancellation refund pending").waitFor();
    assert.equal(await paused.locator('option[value="transitionOrder"]').count(), 0);
    const active = page.getByRole("row", {name:/ORD-2026-900002/});
    await active.getByLabel("Record action").selectOption("transitionOrder");
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", {name:"Save changes"}).click();
    await page.getByText("Advance fulfillment completed.").waitFor();
    assert.deepEqual(staffTransition, {status:"processing"});
  } finally {
    await page.close();
  }
});
