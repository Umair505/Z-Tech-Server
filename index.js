require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// -------------------- JWT VERIFY --------------------
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

// -------------------- DATABASE --------------------
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true }
});

async function start() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("ztechDb");

    const users = db.collection("users");
    const products = db.collection("products");
    const carts = db.collection("carts");
    const orders = db.collection("orders");
    const wishlist = db.collection("wishlist");

  // -------------------- ROLE CHECK --------------------
  const verifyAdmin = async (req, res, next) => {
    const email = req.user.email;
    const user = await users.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "Admin only" });
    }
    next();
  };

  // -------------------- AUTH --------------------
  app.post("/auth/jwt", (req, res) => {
    const payload = req.body;
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "365d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict"
    }).send({ success: true });
  });

  app.get("/auth/logout", (req, res) => {
    res.clearCookie("token").send({ success: true });
  });

  // -------------------- USER --------------------
  app.post("/users", async (req, res) => {
    const user = req.body;

    const exists = await users.findOne({ email: user.email });
    if (exists) {
      return res.send({ message: "User exists" });
    }

    user.role = "user";
    user.createdAt = new Date();
    await users.insertOne(user);

    res.send({ success: true });
  });

  app.get("/user/role/:email", async (req, res) => {
    const result = await users.findOne({ email: req.params.email });
    res.send({ role: result?.role || "user" });
  });

  // -------------------- PRODUCT CRUD --------------------
  // Create Product (Admin)
  app.post("/products", verifyToken, verifyAdmin, async (req, res) => {
    const data = req.body;
    data.createdAt = new Date();
    data.status = "active";
    const result = await products.insertOne(data);
    res.send(result);
  });

  // Get All Products
  app.get("/products", async (req, res) => {
    const result = await products.find().sort({ createdAt: -1 }).toArray();
    res.send(result);
  });

  // Get Single Product
  app.get("/products/:id", async (req, res) => {
    const result = await products.findOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  });

  // Update Product (Admin)
  app.put("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
    const result = await products.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(result);
  });

  // Delete Product (Admin)
  app.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
    const result = await products.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  });

  // -------------------- CART --------------------
  app.post("/cart", verifyToken, async (req, res) => {
    const item = req.body;
    item.email = req.user.email;
    item.createdAt = new Date();

    const exists = await carts.findOne({
      email: item.email,
      productId: item.productId
    });

    if (exists)
      return res.status(400).send({ message: "Already added to cart" });

    await carts.insertOne(item);
    res.send({ success: true });
  });

  app.get("/cart", verifyToken, async (req, res) => {
    const result = await carts.find({ email: req.user.email }).toArray();
    res.send(result);
  });

  app.delete("/cart/:id", verifyToken, async (req, res) => {
    const result = await carts.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  });

  // -------------------- WISHLIST --------------------
  app.post("/wishlist", verifyToken, async (req, res) => {
    const item = req.body;
    item.email = req.user.email;

    const exists = await wishlist.findOne({
      email: item.email,
      productId: item.productId
    });

    if (exists)
      return res.status(400).send({ message: "Already in wishlist" });

    await wishlist.insertOne(item);
    res.send({ success: true });
  });

  app.get("/wishlist", verifyToken, async (req, res) => {
    const result = await wishlist.find({ email: req.user.email }).toArray();
    res.send(result);
  });

  app.delete("/wishlist/:id", verifyToken, async (req, res) => {
    const result = await wishlist.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  });

  // -------------------- ORDERS --------------------
  app.post("/order", verifyToken, async (req, res) => {
    const order = req.body;
    order.email = req.user.email;
    order.createdAt = new Date();
    order.status = "pending";

    const result = await orders.insertOne(order);
    res.send(result);
  });

  app.get("/orders", verifyToken, async (req, res) => {
    const result = await orders.find({ email: req.user.email }).toArray();
    res.send(result);
  });

  //Admin - get all orders
  app.get("/admin/orders", verifyToken, verifyAdmin, async (req, res) => {
    const result = await orders.find().toArray();
    res.send(result);
  });

  app.patch("/orders/:id/status", verifyToken, verifyAdmin, async (req, res) => {
    const result = await orders.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );
    res.send(result);
  });

  // -------------------- ROOT --------------------
  app.get("/", (req, res) => {
    res.send("Z-TECH Backend Running...");
  });

    // -------------------- START SERVER --------------------
    app.listen(PORT, () => console.log(`Z-TECH server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
