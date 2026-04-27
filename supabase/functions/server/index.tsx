import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

type ItemKind = "stock" | "service";

function normalizeKind(value: unknown): ItemKind {
  return value === "service" ? "service" : "stock";
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Auth middleware
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized: Missing access token' }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    console.log('Authorization error:', error?.message || 'No user found');
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
}

app.get("/make-server-8db4781d/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/make-server-8db4781d/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();

    if (!normalizedEmail || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters long' }, 400);
    }

    if (!normalizedName) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { name: normalizedName },
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error.message);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to create user account' }, 500);
  }
});

app.get("/make-server-8db4781d/products", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const products = await kv.getByPrefix(`user:${userId}:product:`);
    const normalizedProducts = (products || []).map((product: any) => ({
      ...product,
      kind: normalizeKind(product?.kind),
      stock: normalizeKind(product?.kind) === "service" ? 0 : Number(product?.stock || 0),
    }));
    return c.json({ products: normalizedProducts });
  } catch (error) {
    console.log('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = c.req.param('id');
    const product = await kv.get(`user:${userId}:product:${productId}`);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({
      product: {
        ...product,
        kind: normalizeKind(product.kind),
        stock: normalizeKind(product.kind) === "service" ? 0 : Number(product.stock || 0),
      }
    });
  } catch (error) {
    console.log('Error fetching product:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

app.post("/make-server-8db4781d/products", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, description, category, price, stock, image, kind } = body;
    const normalizedKind = normalizeKind(kind);

    if (!name || !category || price === undefined) {
      return c.json({ error: 'Name, category, and price are required' }, 400);
    }

    if (normalizedKind === "stock" && stock === undefined) {
      return c.json({ error: 'Stock quantity is required for stock items' }, 400);
    }

    const productId = crypto.randomUUID();
    const product = {
      id: productId,
      kind: normalizedKind,
      name,
      description: description || '',
      category,
      price: parseFloat(price),
      stock: normalizedKind === "service" ? 0 : parseInt(stock),
      image: image || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:product:${productId}`, product);
    return c.json({ success: true, product });
  } catch (error) {
    console.log('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = c.req.param('id');
    const body = await c.req.json();

    const existingProduct = await kv.get(`user:${userId}:product:${productId}`);
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const normalizedKind = normalizeKind(body.kind ?? existingProduct.kind);

    const updatedProduct = {
      ...existingProduct,
      ...body,
      id: productId,
      kind: normalizedKind,
      price: body.price !== undefined ? parseFloat(body.price) : parseFloat(existingProduct.price),
      stock:
        normalizedKind === "service"
          ? 0
          : body.stock !== undefined
            ? parseInt(body.stock)
            : parseInt(existingProduct.stock || 0),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:product:${productId}`, updatedProduct);
    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.log('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete("/make-server-8db4781d/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = c.req.param('id');

    const existingProduct = await kv.get(`user:${userId}:product:${productId}`);
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    await kv.del(`user:${userId}:product:${productId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

app.get("/make-server-8db4781d/categories", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const categories = await kv.getByPrefix(`user:${userId}:category:`);
    return c.json({ categories: categories || [] });
  } catch (error) {
    console.log('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

app.post("/make-server-8db4781d/categories", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, color } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Category name is required' }, 400);
    }

    const categoryId = crypto.randomUUID();
    const category = {
      id: categoryId,
      name,
      color: color || '#6366f1',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:category:${categoryId}`, category);
    return c.json({ success: true, category });
  } catch (error) {
    console.log('Error creating category:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

app.delete("/make-server-8db4781d/categories/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const existingCategory = await kv.get(`user:${userId}:category:${categoryId}`);

    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const products = await kv.getByPrefix(`user:${userId}:product:`);
    const hasLinkedProducts = (products || []).some(
      (product: any) => product?.category === categoryId,
    );

    if (hasLinkedProducts) {
      return c.json(
        { error: 'Category is still linked to stock items or services' },
        400,
      );
    }

    await kv.del(`user:${userId}:category:${categoryId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting category:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

app.get("/make-server-8db4781d/stats", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const rawProducts = await kv.getByPrefix(`user:${userId}:product:`);
    const categories = await kv.getByPrefix(`user:${userId}:category:`);
    const products = (rawProducts || []).map((product: any) => ({
      ...product,
      kind: normalizeKind(product?.kind),
      stock: normalizeKind(product?.kind) === "service" ? 0 : Number(product?.stock || 0),
      price: Number(product?.price || 0),
    }));

    const stockItems = products.filter((product: any) => product.kind === "stock");
    const services = products.filter((product: any) => product.kind === "service");

    const totalProducts = products.length;
    const totalStockItems = stockItems.length;
    const totalServices = services.length;
    const totalValue = stockItems.reduce((sum: number, product: any) => sum + (product.price * product.stock), 0);
    const totalStock = stockItems.reduce((sum: number, product: any) => sum + product.stock, 0);
    const lowStockCount = stockItems.filter((product: any) => product.stock < 10).length;

    return c.json({
      totalProducts,
      totalStockItems,
      totalServices,
      totalCategories: categories?.length || 0,
      totalValue,
      totalStock,
      lowStockCount,
    });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

Deno.serve(app.fetch);
