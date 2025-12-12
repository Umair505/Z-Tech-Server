require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- DEPLOYMENT CONFIG --------------------
// আপনার ফ্রন্টএন্ড ডিপ্লয় করার পর যে লিংক পাবেন, সেটা এখানে যোগ করবেন
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://z-tech-gadget.vercel.app", // আপনার ফ্রন্টএন্ড লাইভ লিংক ১
  "https://your-frontend-domain.com"  // আপনার ফ্রন্টএন্ড লাইভ লিংক ২ (যদি থাকে)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// কুকি সেটিংস (খুবই গুরুত্বপূর্ণ ডিপ্লয়মেন্টের জন্য)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// -------------------- CLOUDINARY CONFIG --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- JWT MIDDLEWARE --------------------
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

// -------------------- MONGODB CONNECTION --------------------
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true }
});

async function run() {
  try {
    // Vercel এ কানেকশন বার বার যাতে না হয়, তাই বাইরে কানেক্ট করা ভালো, 
    // তবে এই প্যাটার্নটি স্ট্যান্ডার্ড:
    // await client.connect(); 
    // console.log("Connected to MongoDB");

    const db = client.db("ztechDb");
    const users = db.collection("users");
    const products = db.collection("products");
    const carts = db.collection("carts");
    const orders = db.collection("orders");
    const wishlist = db.collection("wishlist");

    // -------------------- ADMIN CHECK --------------------
    const verifyAdmin = async (req, res, next) => {
      const email = req.user.email;
      const user = await users.findOne({ email });
      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "Admin only" });
      }
      next();
    };

    // -------------------- AUTH ROUTES --------------------
    app.post("/jwt", (req, res) => {
      const payload = req.body;
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "365d" });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    app.get("/logout", (req, res) => {
      res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({ success: true });
    });

    // -------------------- USER ROUTES --------------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const exists = await users.findOne({ email: user.email });
      if (exists) return res.send({ message: "User exists" });
      
      user.role = "user";
      user.createdAt = new Date();
      await users.insertOne(user);
      res.send({ success: true });
    });

    app.get("/user/role/:email", async (req, res) => {
      const result = await users.findOne({ email: req.params.email });
      res.send({ role: result?.role || "user" });
    });

    // Admin: Get All Users
    app.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
      const allUsers = await users.find().sort({ createdAt: -1 }).toArray();
      res.send(allUsers);
    });

    // Admin: Make Admin
    app.patch("/users/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = { $set: { role: "admin" } };
      const result = await users.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Admin: Delete User
    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // -------------------- PRODUCT ROUTES --------------------
    app.post("/products", verifyToken, verifyAdmin, async (req, res) => {
      const data = req.body;
      data.createdAt = new Date();
      data.status = "available";
      const result = await products.insertOne(data);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const result = await products.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const result = await products.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    app.put("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
      const { _id, ...updatedData } = req.body; // _id বাদ দিয়ে আপডেট করুন
      const result = await products.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
      const result = await products.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // -------------------- UPLOAD ROUTE --------------------
    app.post("/upload", verifyToken, verifyAdmin, upload.array("files", 10), async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) return res.status(400).send({ error: "No files" });
        const uploadPromises = req.files.map(file => new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: "ztech" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            streamifier.createReadStream(file.buffer).pipe(stream);
        }));
        const uploaded = await Promise.all(uploadPromises);
        const files = uploaded.map(file => ({
          public_id: file.public_id,
          url: file.secure_url,
          width: file.width,
          height: file.height,
          format: file.format
        }));
        res.send({ success: true, files });
      } catch (err) {
        res.status(500).send({ error: "Upload Failed" });
      }
    });

    // -------------------- CART & WISHLIST --------------------
    app.post("/cart", verifyToken, async (req, res) => {
      const item = req.body;
      const exists = await carts.findOne({ email: req.user.email, productId: item.productId });
      if (exists) return res.status(400).send({ message: "Already in cart" });
      
      item.email = req.user.email; // Ensure email from token
      const result = await carts.insertOne(item);
      res.send(result);
    });

    app.get("/cart", verifyToken, async (req, res) => {
      const result = await carts.find({ email: req.user.email }).toArray();
      res.send(result);
    });

    app.patch("/cart/:id", verifyToken, async (req, res) => {
      const { quantity } = req.body;
      const result = await carts.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { quantity: parseInt(quantity) } }
      );
      res.send(result);
    });

    app.delete("/cart/:id", verifyToken, async (req, res) => {
      const result = await carts.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // Wishlist (Same Logic)
    app.post("/wishlist", verifyToken, async (req, res) => {
      const item = req.body;
      const exists = await wishlist.findOne({ email: req.user.email, productId: item.productId });
      if (exists) return res.status(400).send({ message: "Already in wishlist" });
      
      item.email = req.user.email;
      const result = await wishlist.insertOne(item);
      res.send(result);
    });

    app.get("/wishlist", verifyToken, async (req, res) => {
      const result = await wishlist.find({ email: req.user.email }).toArray();
      res.send(result);
    });

    app.delete("/wishlist/:id", verifyToken, async (req, res) => {
      const result = await wishlist.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // -------------------- ORDERS & STATS --------------------
    app.post("/order", verifyToken, async (req, res) => {
      const order = req.body;
      order.email = req.user.email;
      order.createdAt = new Date();
      order.status = "pending";

      const result = await orders.insertOne(order);
      
      // Clear Cart & Update Stock
      await carts.deleteMany({ email: req.user.email });
      if (order.products) {
        for (const item of order.products) {
          await products.updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { stock: -item.quantity } }
          );
        }
      }
      res.send(result);
    });

    app.get("/orders", verifyToken, async (req, res) => {
      const result = await orders.find({ email: req.user.email }).sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    app.get("/admin/orders", verifyToken, verifyAdmin, async (req, res) => {
      const result = await orders.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

     app.get("/admin/orders/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orders.findOne(query);
      res.send(result);
    });

    app.patch("/admin/orders/:id", verifyToken, verifyAdmin, async (req, res) => {
        const { status } = req.body;
        const result = await orders.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status } }
        );
        res.send(result);
    });

    app.get("/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
      const totalUsers = await users.estimatedDocumentCount();
      const totalProducts = await products.estimatedDocumentCount();
      const totalOrders = await orders.estimatedDocumentCount();
      const payments = await orders.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }]).toArray();
      const revenue = payments.length > 0 ? payments[0].totalRevenue : 0;
      res.send({ totalUsers, totalProducts, totalOrders, revenue });
    });

    // -------------------- ROOT --------------------
    app.get("/", (req, res) => {
      res.send("Z-TECH Server is Running");
    });

  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

// -------------------- FOR VERCEL DEPLOYMENT --------------------
// Vercel serverless function এর জন্য app এক্সপোর্ট করতে হয়
module.exports = app;

// লোকাল ডেভেলপমেন্টের জন্য
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}