import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.ts";

const app = new Hono();

type ItemKind = "stock" | "service";
const SERVICE_MARKER = "[service]";

function normalizeKind(value: unknown): ItemKind {
  return value === "service" ? "service" : "stock";
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function parsePrice(value: unknown) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function parseStock(value: unknown) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : NaN;
}

function inferStoredKind(item: any): ItemKind {
  if (item?.kind === "service") {
    return "service";
  }

  const description =
    typeof item?.description === "string" ? item.description.trimStart() : "";

  if (description.startsWith(SERVICE_MARKER)) {
    return "service";
  }

  return "stock";
}

function normalizeProductResponse(product: any) {
  const kind = inferStoredKind(product);

  return {
    ...product,
    kind,
    clientId: kind === "service" ? normalizeText(product?.clientId) : "",
    price: Number(product?.price || 0),
    stock: kind === "service" ? 0 : Number(product?.stock || 0),
  };
}

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Supabase client for auth
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Auth middleware
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) {
    return c.json({ error: "Unauthorized: Missing access token" }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    console.log("Authorization error:", error?.message || "No user found");
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }

  c.set("userId", user.id);
  c.set("userEmail", user.email);
  await next();
}

app.get("/make-server-8db4781d/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/make-server-8db4781d/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const normalizedEmail = normalizeText(email).toLowerCase();
    const normalizedName = normalizeText(name);

    if (!normalizedEmail || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    if (!normalizedName) {
      return c.json({ error: "Name is required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { name: normalizedName },
      email_confirm: true,
    });

    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (error) {
    console.log("Signup error:", error);
    return c.json({ error: "Failed to create user account" }, 500);
  }
});

app.get("/make-server-8db4781d/products", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const products = await kv.getByPrefix(`user:${userId}:product:`);
    const normalizedProducts = (products || []).map((product: any) =>
      normalizeProductResponse(product),
    );
    return c.json({ products: normalizedProducts });
  } catch (error) {
    console.log("Error fetching products:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

app.get("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const productId = c.req.param("id");
    const product = await kv.get(`user:${userId}:product:${productId}`);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ product: normalizeProductResponse(product) });
  } catch (error) {
    console.log("Error fetching product:", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

app.post("/make-server-8db4781d/products", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const normalizedKind = normalizeKind(body.kind);
    const normalizedName = normalizeText(body.name);
    const normalizedDescription = normalizeText(body.description);
    const normalizedCategory = normalizeText(body.category);
    const normalizedImage = normalizeText(body.image);
    const normalizedClientId =
      normalizedKind === "service" ? normalizeText(body.clientId) : "";
    const normalizedPrice = parsePrice(body.price);
    const normalizedStock =
      normalizedKind === "service" ? 0 : parseStock(body.stock);

    if (!normalizedName || !normalizedCategory || Number.isNaN(normalizedPrice)) {
      return c.json({ error: "Name, category, and price are required" }, 400);
    }

    if (normalizedPrice < 0) {
      return c.json({ error: "Price must be zero or greater" }, 400);
    }

    if (normalizedKind === "stock" && Number.isNaN(normalizedStock)) {
      return c.json({ error: "Stock quantity is required for stock items" }, 400);
    }

    if (normalizedKind === "stock" && normalizedStock < 0) {
      return c.json({ error: "Stock quantity must be zero or greater" }, 400);
    }

    if (normalizedKind === "service" && !normalizedClientId) {
      return c.json({ error: "Client is required for services" }, 400);
    }

    if (normalizedKind === "service") {
      const existingClient = await kv.get(`user:${userId}:client:${normalizedClientId}`);
      if (!existingClient) {
        return c.json({ error: "Client not found" }, 400);
      }
    }

    const productId = crypto.randomUUID();
    const product = {
      id: productId,
      kind: normalizedKind,
      name: normalizedName,
      description: normalizedDescription,
      category: normalizedCategory,
      clientId: normalizedClientId,
      price: normalizedPrice,
      stock: normalizedStock,
      image: normalizedImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:product:${productId}`, product);
    return c.json({ success: true, product });
  } catch (error) {
    console.log("Error creating product:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.put("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const productId = c.req.param("id");
    const body = await c.req.json();

    const existingProduct = await kv.get(`user:${userId}:product:${productId}`);
    if (!existingProduct) {
      return c.json({ error: "Product not found" }, 404);
    }

    const normalizedKind = normalizeKind(body.kind ?? existingProduct.kind);
    const normalizedName = normalizeText(body.name ?? existingProduct.name);
    const normalizedDescription = normalizeText(
      body.description ?? existingProduct.description,
    );
    const normalizedCategory = normalizeText(
      body.category ?? existingProduct.category,
    );
    const normalizedImage = normalizeText(body.image ?? existingProduct.image);
    const normalizedClientId =
      normalizedKind === "service"
        ? normalizeText(body.clientId ?? existingProduct.clientId)
        : "";
    const normalizedPrice =
      body.price !== undefined ? parsePrice(body.price) : Number(existingProduct.price || 0);
    const normalizedStock =
      normalizedKind === "service"
        ? 0
        : body.stock !== undefined
          ? parseStock(body.stock)
          : Number(existingProduct.stock || 0);

    if (!normalizedName || !normalizedCategory || Number.isNaN(normalizedPrice)) {
      return c.json({ error: "Name, category, and price are required" }, 400);
    }

    if (normalizedPrice < 0) {
      return c.json({ error: "Price must be zero or greater" }, 400);
    }

    if (normalizedKind === "stock" && Number.isNaN(normalizedStock)) {
      return c.json({ error: "Stock quantity is required for stock items" }, 400);
    }

    if (normalizedKind === "stock" && normalizedStock < 0) {
      return c.json({ error: "Stock quantity must be zero or greater" }, 400);
    }

    if (normalizedKind === "service" && !normalizedClientId) {
      return c.json({ error: "Client is required for services" }, 400);
    }

    if (normalizedKind === "service") {
      const existingClient = await kv.get(`user:${userId}:client:${normalizedClientId}`);
      if (!existingClient) {
        return c.json({ error: "Client not found" }, 400);
      }
    }

    const updatedProduct = {
      ...existingProduct,
      id: productId,
      kind: normalizedKind,
      name: normalizedName,
      description: normalizedDescription,
      category: normalizedCategory,
      clientId: normalizedClientId,
      price: normalizedPrice,
      stock: normalizedStock,
      image: normalizedImage,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:product:${productId}`, updatedProduct);
    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.log("Error updating product:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

app.delete("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const productId = c.req.param("id");

    const existingProduct = await kv.get(`user:${userId}:product:${productId}`);
    if (!existingProduct) {
      return c.json({ error: "Product not found" }, 404);
    }

    await kv.del(`user:${userId}:product:${productId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

app.get("/make-server-8db4781d/clients", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const clients = await kv.getByPrefix(`user:${userId}:client:`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.log("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

app.post("/make-server-8db4781d/clients", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const name = normalizeText(body.name);
    const email = normalizeText(body.email).toLowerCase();
    const phone = normalizeText(body.phone);
    const document = normalizeText(body.document);
    const vehicle = normalizeText(body.vehicle);
    const licensePlate = normalizeText(body.licensePlate).toUpperCase();
    const notes = normalizeText(body.notes);

    if (!name) {
      return c.json({ error: "Client name is required" }, 400);
    }

    const clientId = crypto.randomUUID();
    const client = {
      id: clientId,
      name,
      email,
      phone,
      document,
      vehicle,
      licensePlate,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:client:${clientId}`, client);
    return c.json({ success: true, client });
  } catch (error) {
    console.log("Error creating client:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

app.put("/make-server-8db4781d/clients/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const clientId = c.req.param("id");
    const body = await c.req.json();

    const existingClient = await kv.get(`user:${userId}:client:${clientId}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const updatedClient = {
      ...existingClient,
      id: clientId,
      name: normalizeText(body.name ?? existingClient.name),
      email: normalizeText(body.email ?? existingClient.email).toLowerCase(),
      phone: normalizeText(body.phone ?? existingClient.phone),
      document: normalizeText(body.document ?? existingClient.document),
      vehicle: normalizeText(body.vehicle ?? existingClient.vehicle),
      licensePlate: normalizeText(
        body.licensePlate ?? existingClient.licensePlate,
      ).toUpperCase(),
      notes: normalizeText(body.notes ?? existingClient.notes),
      updatedAt: new Date().toISOString(),
    };

    if (!updatedClient.name) {
      return c.json({ error: "Client name is required" }, 400);
    }

    await kv.set(`user:${userId}:client:${clientId}`, updatedClient);
    return c.json({ success: true, client: updatedClient });
  } catch (error) {
    console.log("Error updating client:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

app.delete("/make-server-8db4781d/clients/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const clientId = c.req.param("id");
    const existingClient = await kv.get(`user:${userId}:client:${clientId}`);

    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const products = await kv.getByPrefix(`user:${userId}:product:`);
    const hasLinkedServices = (products || []).some(
      (product: any) =>
        inferStoredKind(product) === "service" &&
        normalizeText(product?.clientId) === clientId,
    );

    if (hasLinkedServices) {
      return c.json(
        { error: "Client is still linked to registered services" },
        400,
      );
    }

    await kv.del(`user:${userId}:client:${clientId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

app.get("/make-server-8db4781d/categories", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const categories = await kv.getByPrefix(`user:${userId}:category:`);
    return c.json({ categories: categories || [] });
  } catch (error) {
    console.log("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

app.post("/make-server-8db4781d/categories", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { name, color } = await c.req.json();
    const normalizedName = normalizeText(name);

    if (!normalizedName) {
      return c.json({ error: "Category name is required" }, 400);
    }

    const categoryId = crypto.randomUUID();
    const category = {
      id: categoryId,
      name: normalizedName,
      color: color || "#6366f1",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:category:${categoryId}`, category);
    return c.json({ success: true, category });
  } catch (error) {
    console.log("Error creating category:", error);
    return c.json({ error: "Failed to create category" }, 500);
  }
});

app.delete("/make-server-8db4781d/categories/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const categoryId = c.req.param("id");
    const existingCategory = await kv.get(`user:${userId}:category:${categoryId}`);

    if (!existingCategory) {
      return c.json({ error: "Category not found" }, 404);
    }

    const products = await kv.getByPrefix(`user:${userId}:product:`);
    const hasLinkedProducts = (products || []).some(
      (product: any) => product?.category === categoryId,
    );

    if (hasLinkedProducts) {
      return c.json(
        { error: "Category is still linked to stock items or services" },
        400,
      );
    }

    await kv.del(`user:${userId}:category:${categoryId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting category:", error);
    return c.json({ error: "Failed to delete category" }, 500);
  }
});

app.get("/make-server-8db4781d/stats", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const rawProducts = await kv.getByPrefix(`user:${userId}:product:`);
    const categories = await kv.getByPrefix(`user:${userId}:category:`);
    const clients = await kv.getByPrefix(`user:${userId}:client:`);
    const products = (rawProducts || []).map((product: any) =>
      normalizeProductResponse(product),
    );

    const stockItems = products.filter((product: any) => product.kind === "stock");
    const services = products.filter((product: any) => product.kind === "service");

    const totalProducts = products.length;
    const totalStockItems = stockItems.length;
    const totalServices = services.length;
    const totalValue = stockItems.reduce(
      (sum: number, product: any) => sum + product.price * product.stock,
      0,
    );
    const totalStock = stockItems.reduce(
      (sum: number, product: any) => sum + product.stock,
      0,
    );
    const lowStockCount = stockItems.filter(
      (product: any) => product.stock < 10,
    ).length;

    return c.json({
      totalProducts,
      totalStockItems,
      totalServices,
      totalCategories: categories?.length || 0,
      totalClients: clients?.length || 0,
      totalValue,
      totalStock,
      lowStockCount,
    });
  } catch (error) {
    console.log("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch statistics" }, 500);
  }
});

Deno.serve(app.fetch);
