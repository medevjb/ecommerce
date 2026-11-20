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
let savedAddresses = [];
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
  if (path === "/storefront/home") return send({
    announcements:[], hero_slides:[], promotions:[], testimonials:[],
    sections:[{id:"styles",key:"dress-styles",data:{title:"Browse by Dress Style",strategy:"tiles"},entries:[{title:"Casual",link_url:"#"}]}],
  });
  if (path === "/categories") return send([{id:"styles",slug:"dress-styles",name:"Dress Styles",children:[{id:"casual",slug:"casual",name:"Casual",children:[]}]}]);
  if (path === "/brands") return send([]);
  if (path === "/products") return send([product]);
  if (path === "/me" && request.headers.authorization === "Bearer smoke-customer") {
    return send({id:"customer",name:"Demo Customer",email:"customer@example.test"});
  }
  if (path === "/me/addresses" && request.method === "GET") return send(savedAddresses);
  if (path === "/me/addresses" && request.method === "POST") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const address = {...JSON.parse(Buffer.concat(chunks).toString()),id:"saved-address",is_default:true};
    savedAddresses = [...savedAddresses,address];
    return send(address,201);
  }
  if (path === "/checkout/preview") {
    return send({subtotal_amount:3000,discount_amount:0,shipping_amount:500,tax_amount:0,total_amount:3500,can_checkout:true,conflicts:[]});
  }
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

test("dress-style tiles and shop checkboxes request the selected style", {timeout:30_000}, async () => {
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  try {
    await page.goto(origin);
    const tile = page.getByRole("link", {name:"Casual",exact:true});
    assert.equal(await tile.getAttribute("href"), "/products?style=casual");
    const filtered = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/catalog/products" && url.searchParams.getAll("styles[]").includes("casual");
    });
    await tile.click();
    await filtered;
    const style = page.getByRole("checkbox", {name:"Filter by Casual"});
    await style.waitFor();
    assert.equal(await style.isChecked(), true);
    const unfiltered = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/catalog/products" && !url.searchParams.has("styles[]");
    });
    await style.uncheck();
    await unfiltered;
    assert.equal(await style.isChecked(), false);
  } finally {
    await page.close();
  }
});

test("checkout accepts a one-time address or lets the customer save it", {timeout:30_000}, async () => {
  const page = await browser.newPage();
  try {
    await page.addInitScript(() => localStorage.setItem("auth_token", "smoke-customer"));
    await page.goto(origin + "/checkout");
    await page.getByLabel("Customer profile").click();
    await page.getByRole("navigation", {name:"Profile shortcuts"}).getByRole("link", {name:"Account overview"}).waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", {name:"Pay by card"}).isDisabled(), true);
    await page.getByLabel("Street address").fill("12 Test Lane");
    await page.getByLabel("City", {exact:true}).fill("Austin");
    await page.getByLabel("Postal code").fill("78701");
    const preview = () => page.waitForRequest((request) => new URL(request.url()).pathname === "/api/commerce/checkout/preview");
    const newAddress = preview();
    await page.getByRole("button", {name:"Use this address"}).click();
    assert.equal((await newAddress).postDataJSON().address.line1, "12 Test Lane");
    await page.getByText("Use for this order only").waitFor();
    await page.getByRole("button", {name:"Pay $35.00"}).waitFor();
    assert.equal(savedAddresses.length, 0);

    await page.getByRole("button", {name:"Edit one-time address"}).click();
    await page.getByLabel("Save to my address book").check();
    const savedAddress = preview();
    await page.getByRole("button", {name:"Use this address"}).click();
    assert.deepEqual((await savedAddress).postDataJSON(), {address_id:"saved-address"});
    assert.equal(await page.getByRole("radio").isChecked(), true);
    assert.equal(savedAddresses.length, 1);
  } finally {
    await page.close();
  }
});
