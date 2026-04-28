import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.ts";

const app = new Hono();

type ServiceStatus = "pending" | "in_progress" | "completed";

const STOCK_PREFIX = "stock";
const SERVICE_PREFIX = "service";
const CLIENT_PREFIX = "client";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizePlate(value: unknown) {
  return normalizeText(value).toUpperCase();
}

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
}

function normalizeServiceStatus(value: unknown): ServiceStatus {
  if (value === "in_progress") return "in_progress";
  if (value === "completed") return "completed";
  return "pending";
}

function sortByUpdatedAt<T extends { updatedAt?: string; createdAt?: string }>(
  items: T[],
) {
  return [...items].sort((a, b) => {
    const left = a.updatedAt || a.createdAt || "";
    const right = b.updatedAt || b.createdAt || "";
    return right.localeCompare(left);
  });
}

function stockKey(userId: string, stockId: string) {
  return `user:${userId}:${STOCK_PREFIX}:${stockId}`;
}

function stockPrefix(userId: string) {
  return `user:${userId}:${STOCK_PREFIX}:`;
}

function clientKey(userId: string, clientId: string) {
  return `user:${userId}:${CLIENT_PREFIX}:${clientId}`;
}

function clientPrefix(userId: string) {
  return `user:${userId}:${CLIENT_PREFIX}:`;
}

function serviceKey(userId: string, serviceId: string) {
  return `user:${userId}:${SERVICE_PREFIX}:${serviceId}`;
}

function servicePrefix(userId: string) {
  return `user:${userId}:${SERVICE_PREFIX}:`;
}

async function listStocks(userId: string) {
  const stocks = await kv.getByPrefix(stockPrefix(userId));
  return sortByUpdatedAt(stocks || []);
}

async function listClients(userId: string) {
  const clients = await kv.getByPrefix(clientPrefix(userId));
  return [...(clients || [])].sort((a: any, b: any) =>
    normalizeText(a?.name).localeCompare(normalizeText(b?.name)),
  );
}

async function listServices(userId: string) {
  const services = await kv.getByPrefix(servicePrefix(userId));
  return sortByUpdatedAt(services || []);
}

async function ensureUniquePartCode(
  userId: string,
  partCode: string,
  currentStockId?: string,
) {
  const stocks = await listStocks(userId);
  return !stocks.some(
    (item: any) =>
      normalizeText(item?.partCode).toLowerCase() === partCode.toLowerCase() &&
      item?.id !== currentStockId,
  );
}

async function ensureClientExists(userId: string, clientId: string) {
  const client = await kv.get(clientKey(userId, clientId));
  return client || null;
}

async function getNextOrderNumber(userId: string) {
  const services = await listServices(userId);
  const maxNumber = services.reduce((currentMax: number, service: any) => {
    const match = String(service?.orderNumber || "").match(/(\d+)/);
    const orderNumber = match ? Number(match[1]) : 0;
    return Math.max(currentMax, Number.isFinite(orderNumber) ? orderNumber : 0);
  }, 0);

  return `OS-${String(maxNumber + 1).padStart(4, "0")}`;
}

app.use("*", logger(console.log));

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];

  if (!accessToken) {
    return c.json({ error: "Unauthorized: Missing access token" }, 401);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.id) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }

  c.set("userId", user.id);
  c.set("userEmail", user.email);
  await next();
}

app.get("/make-server-8db4781d/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-8db4781d/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeText(name);

    if (!normalizedEmail || !password || !normalizedName) {
      return c.json({ error: "Name, email and password are required" }, 400);
    }

    if (password.length < 6) {
      return c.json(
        { error: "Password must be at least 6 characters long" },
        400,
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { name: normalizedName },
      email_confirm: true,
    });

    if (error) {
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

app.get("/make-server-8db4781d/stock", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    return c.json({ items: await listStocks(userId) });
  } catch (error) {
    console.log("Error fetching stock:", error);
    return c.json({ error: "Failed to fetch stock items" }, 500);
  }
});

app.post("/make-server-8db4781d/stock", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const partCode = normalizeText(body.partCode);
    const name = normalizeText(body.name);
    const imageUrl = normalizeText(body.imageUrl);
    const quantity = parseInteger(body.quantity);
    const price = parseNumber(body.price);

    if (!partCode || !name || Number.isNaN(quantity) || Number.isNaN(price)) {
      return c.json(
        { error: "Part code, name, quantity and price are required" },
        400,
      );
    }

    if (quantity < 0 || price < 0) {
      return c.json(
        { error: "Quantity and price must be zero or greater" },
        400,
      );
    }

    const isUnique = await ensureUniquePartCode(userId, partCode);
    if (!isUnique) {
      return c.json({ error: "This part code is already registered" }, 400);
    }

    const stockId = crypto.randomUUID();
    const stockItem = {
      id: stockId,
      partCode,
      name,
      quantity,
      price,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(stockKey(userId, stockId), stockItem);
    return c.json({ success: true, item: stockItem });
  } catch (error) {
    console.log("Error creating stock item:", error);
    return c.json({ error: "Failed to create stock item" }, 500);
  }
});

app.put("/make-server-8db4781d/stock/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const stockId = c.req.param("id");
    const body = await c.req.json();
    const existingItem = await kv.get(stockKey(userId, stockId));

    if (!existingItem) {
      return c.json({ error: "Stock item not found" }, 404);
    }

    const partCode = normalizeText(body.partCode ?? existingItem.partCode);
    const name = normalizeText(body.name ?? existingItem.name);
    const imageUrl = normalizeText(body.imageUrl ?? existingItem.imageUrl);
    const quantity =
      body.quantity !== undefined
        ? parseInteger(body.quantity)
        : Number(existingItem.quantity || 0);
    const price =
      body.price !== undefined
        ? parseNumber(body.price)
        : Number(existingItem.price || 0);

    if (!partCode || !name || Number.isNaN(quantity) || Number.isNaN(price)) {
      return c.json(
        { error: "Part code, name, quantity and price are required" },
        400,
      );
    }

    if (quantity < 0 || price < 0) {
      return c.json(
        { error: "Quantity and price must be zero or greater" },
        400,
      );
    }

    const isUnique = await ensureUniquePartCode(userId, partCode, stockId);
    if (!isUnique) {
      return c.json({ error: "This part code is already registered" }, 400);
    }

    const updatedItem = {
      ...existingItem,
      id: stockId,
      partCode,
      name,
      quantity,
      price,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(stockKey(userId, stockId), updatedItem);
    return c.json({ success: true, item: updatedItem });
  } catch (error) {
    console.log("Error updating stock item:", error);
    return c.json({ error: "Failed to update stock item" }, 500);
  }
});

app.delete("/make-server-8db4781d/stock/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const stockId = c.req.param("id");
    const existingItem = await kv.get(stockKey(userId, stockId));

    if (!existingItem) {
      return c.json({ error: "Stock item not found" }, 404);
    }

    await kv.del(stockKey(userId, stockId));
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting stock item:", error);
    return c.json({ error: "Failed to delete stock item" }, 500);
  }
});

app.get("/make-server-8db4781d/clients", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    return c.json({ clients: await listClients(userId) });
  } catch (error) {
    console.log("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

app.get("/make-server-8db4781d/clients/:id/history", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const clientId = c.req.param("id");
    const client = await kv.get(clientKey(userId, clientId));

    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const services = await listServices(userId);
    const history = services.filter(
      (service: any) => normalizeText(service?.clientId) === clientId,
    );

    return c.json({ history });
  } catch (error) {
    console.log("Error fetching client history:", error);
    return c.json({ error: "Failed to fetch client history" }, 500);
  }
});

app.post("/make-server-8db4781d/clients", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const name = normalizeText(body.name);
    const email = normalizeEmail(body.email);
    const phone = normalizeText(body.phone);
    const document = normalizeText(body.document);
    const vehicle = normalizeText(body.vehicle);
    const licensePlate = normalizePlate(body.licensePlate);
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

    await kv.set(clientKey(userId, clientId), client);
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
    const existingClient = await kv.get(clientKey(userId, clientId));

    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const updatedClient = {
      ...existingClient,
      id: clientId,
      name: normalizeText(body.name ?? existingClient.name),
      email: normalizeEmail(body.email ?? existingClient.email),
      phone: normalizeText(body.phone ?? existingClient.phone),
      document: normalizeText(body.document ?? existingClient.document),
      vehicle: normalizeText(body.vehicle ?? existingClient.vehicle),
      licensePlate: normalizePlate(
        body.licensePlate ?? existingClient.licensePlate,
      ),
      notes: normalizeText(body.notes ?? existingClient.notes),
      updatedAt: new Date().toISOString(),
    };

    if (!updatedClient.name) {
      return c.json({ error: "Client name is required" }, 400);
    }

    await kv.set(clientKey(userId, clientId), updatedClient);
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
    const existingClient = await kv.get(clientKey(userId, clientId));

    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const services = await listServices(userId);
    const hasLinkedServices = services.some(
      (service: any) => normalizeText(service?.clientId) === clientId,
    );

    if (hasLinkedServices) {
      return c.json(
        { error: "This client still has linked service orders" },
        400,
      );
    }

    await kv.del(clientKey(userId, clientId));
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

app.get("/make-server-8db4781d/services", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    return c.json({ services: await listServices(userId) });
  } catch (error) {
    console.log("Error fetching services:", error);
    return c.json({ error: "Failed to fetch service orders" }, 500);
  }
});

app.post("/make-server-8db4781d/services", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const clientId = normalizeText(body.clientId);
    const title = normalizeText(body.title);
    const details = normalizeText(body.details);
    const status = normalizeServiceStatus(body.status);

    if (!clientId || !title || !details) {
      return c.json(
        { error: "Client, title and service details are required" },
        400,
      );
    }

    const client = await ensureClientExists(userId, clientId);
    if (!client) {
      return c.json({ error: "Client not found" }, 400);
    }

    const serviceId = crypto.randomUUID();
    const now = new Date().toISOString();
    const service = {
      id: serviceId,
      orderNumber: await getNextOrderNumber(userId),
      clientId,
      title,
      details,
      status,
      createdAt: now,
      updatedAt: now,
      completedAt: status === "completed" ? now : "",
    };

    await kv.set(serviceKey(userId, serviceId), service);
    return c.json({ success: true, service });
  } catch (error) {
    console.log("Error creating service order:", error);
    return c.json({ error: "Failed to create service order" }, 500);
  }
});

app.put("/make-server-8db4781d/services/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const serviceId = c.req.param("id");
    const body = await c.req.json();
    const existingService = await kv.get(serviceKey(userId, serviceId));

    if (!existingService) {
      return c.json({ error: "Service order not found" }, 404);
    }

    const clientId = normalizeText(body.clientId ?? existingService.clientId);
    const title = normalizeText(body.title ?? existingService.title);
    const details = normalizeText(body.details ?? existingService.details);
    const status = normalizeServiceStatus(body.status ?? existingService.status);

    if (!clientId || !title || !details) {
      return c.json(
        { error: "Client, title and service details are required" },
        400,
      );
    }

    const client = await ensureClientExists(userId, clientId);
    if (!client) {
      return c.json({ error: "Client not found" }, 400);
    }

    const updatedService = {
      ...existingService,
      id: serviceId,
      clientId,
      title,
      details,
      status,
      updatedAt: new Date().toISOString(),
      completedAt:
        status === "completed"
          ? existingService.completedAt || new Date().toISOString()
          : "",
    };

    await kv.set(serviceKey(userId, serviceId), updatedService);
    return c.json({ success: true, service: updatedService });
  } catch (error) {
    console.log("Error updating service order:", error);
    return c.json({ error: "Failed to update service order" }, 500);
  }
});

app.delete("/make-server-8db4781d/services/:id", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const serviceId = c.req.param("id");
    const existingService = await kv.get(serviceKey(userId, serviceId));

    if (!existingService) {
      return c.json({ error: "Service order not found" }, 404);
    }

    await kv.del(serviceKey(userId, serviceId));
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting service order:", error);
    return c.json({ error: "Failed to delete service order" }, 500);
  }
});

app.get("/make-server-8db4781d/stats", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const stockItems = await listStocks(userId);
    const clients = await listClients(userId);
    const services = await listServices(userId);

    const activeServices = services.filter(
      (service: any) => service.status !== "completed",
    );
    const completedServices = services.filter(
      (service: any) => service.status === "completed",
    );
    const stockValue = stockItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item?.price || 0) * Number(item?.quantity || 0),
      0,
    );
    const lowStockCount = stockItems.filter(
      (item: any) => Number(item?.quantity || 0) <= 3,
    ).length;

    return c.json({
      totalStockItems: stockItems.length,
      totalClients: clients.length,
      activeServices: activeServices.length,
      completedServices: completedServices.length,
      stockValue,
      lowStockCount,
    });
  } catch (error) {
    console.log("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch statistics" }, 500);
  }
});

Deno.serve(app.fetch);
