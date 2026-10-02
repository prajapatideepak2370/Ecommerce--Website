require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const DB_URL = process.env.ATLASDB_URL;

if (!DB_URL) {
  console.error("FATAL: ATLASDB_URL is not set. Check your .env file.");
  process.exit(1);
}

async function connectDB() {
  await mongoose.connect(DB_URL, {
    tls: DB_URL.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
  });
  console.log("Connected to MongoDB");
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@tryvoxel.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin user already exists:", email);
    if (existing.role !== "admin") {
      existing.role = "admin";
      existing.isBlocked = false;
      await existing.save();
      console.log("Promoted existing user to admin");
    }
    return existing;
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required to create the initial admin.");
  }

  const admin = new User({
    name: process.env.ADMIN_NAME || "TRYVOXEL Admin",
    email,
    role: "admin",
    isBlocked: false,
    phone: process.env.ADMIN_PHONE || "",
    username: email,
  });
  await User.register(admin, password);
  console.log(
    "Created admin:",
    email,
    "/ password set from ADMIN_PASSWORD env",
  );
  return admin;
}

const CATEGORY_SEEDS = [
  {
    name: "3D-Desk",
    description: "Voxel-powered desk accessories and organizers.",
  },
  {
    name: "Lighting",
    description: "Experimental lighting with parametric forms.",
  },
  {
    name: "Home Decor",
    description: "Statement pieces for your living space.",
  },
  { name: "Wearables", description: "Limited-run designer accessories." },
  {
    name: "Digital Goods",
    description: "STL / glTF files for at-home printing or AR.",
  },
];

function buildProducts(categories) {
  const categoryMap = new Map(categories.map((c) => [c.name, c._id]));
  const products = [];
  const templates = [
    {
      name: "Voxel Pen Stand",
      category: "3D-Desk",
      price: 1499,
      discountPrice: 1299,
      brand: "TRYVOXEL",
      stock: 42,
      description:
        "A parametric pen stand CNC-milled from recycled acrylic. Slots for 8 pens, card holder, and a phone rest.",
      specifications: {
        Material: "Recycled acrylic",
        Weight: "320 g",
        Finish: "Matte",
      },
      colorOptions: ["Ink", "Frost", "Violet"],
      dimensions: "120 × 80 × 95 mm",
      material: "Acrylic",
      featured: true,
    },
    {
      name: "Glow Lamp Mini",
      category: "Lighting",
      price: 4999,
      discountPrice: null,
      brand: "TRYVOXEL",
      stock: 18,
      description:
        "Touch-dimmable ambient lamp with a hand-blown glass top. Three warmth presets, USB-C.",
      specifications: {
        Wattage: "8 W",
        "Color Temp": "2700K–4500K",
        Battery: "3000 mAh",
      },
      colorOptions: ["Sand", "Steel"],
      dimensions: "Ø 120 × 180 mm",
      material: "Glass + aluminum",
      featured: true,
    },
    {
      name: "Utilitè Shelf Module",
      category: "Home Decor",
      price: 7999,
      discountPrice: 6499,
      brand: "Shruti × Jasvinder",
      stock: 12,
      description:
        "Modular shelf unit with magnetic sub-components. Sold as a single module — stack up to 4.",
      specifications: {
        "Load per shelf": "5 kg",
        Mount: "Wall / freestanding",
      },
      colorOptions: ["Charcoal", "Off-white"],
      dimensions: "420 × 220 × 220 mm",
      material: "Powder-coated steel",
      featured: true,
    },
    {
      name: "Helix Cuff",
      category: "Wearables",
      price: 2199,
      discountPrice: null,
      brand: "Vishal Studio",
      stock: 60,
      description:
        "A torqued, brushed brass cuff. One size — gently adjustable.",
      specifications: {
        "Base Metal": "Brass",
        "Hypoallergenic coating": "Yes",
      },
      colorOptions: ["Brass", "Black Rhodium"],
      material: "Brass",
      featured: false,
    },
    {
      name: "Founders Desk Mat",
      category: "3D-Desk",
      price: 1299,
      discountPrice: 999,
      brand: "TRYVOXEL",
      stock: 120,
      description:
        "900 × 400 mm vegan leather desk mat. Laser-engraved voxel grid, edge-stitched.",
      specifications: { Thickness: "2 mm", Surface: "Microfibre suede" },
      colorOptions: ["Ink", "Storm"],
      dimensions: "900 × 400 mm",
      material: "Vegan leather",
      featured: false,
    },
    {
      name: "Aurora Sconce",
      category: "Lighting",
      price: 6499,
      discountPrice: 5499,
      brand: "TRYVOXEL",
      stock: 24,
      description:
        "Wall-mounted sconce with a gradient diffuser. Casts a 120° aurora wash.",
      specifications: { Wattage: "6 W", CRI: "90+", Mount: "Hardwire" },
      colorOptions: ["Opal"],
      dimensions: "240 × 110 × 90 mm",
      material: "Polycarbonate + aluminum",
      featured: true,
    },
    {
      name: "Prism Mirror",
      category: "Home Decor",
      price: 11499,
      discountPrice: null,
      brand: "Shruti × Vishal",
      stock: 8,
      description:
        "Asymmetric faceted mirror. Low-iron glass, solid oak back-plate.",
      specifications: { "Glass thickness": "6 mm" },
      dimensions: "560 × 780 × 40 mm",
      material: "Low-iron glass + oak",
      featured: false,
    },
    {
      name: "Tessellate Ring",
      category: "Wearables",
      price: 2799,
      discountPrice: 2499,
      brand: "Vishal Studio",
      stock: 48,
      description:
        "A repeating tessellation pattern, cast in recycled sterling silver.",
      specifications: { Hallmark: "925 silver", Finish: "Brushed" },
      material: "925 Sterling Silver",
      featured: false,
    },
    {
      name: "Voxel Cable Tidy (3-pack)",
      category: "3D-Desk",
      price: 599,
      discountPrice: null,
      brand: "TRYVOXEL",
      stock: 200,
      description: "Clip-on cable managers. Three sizes, silicone-lined jaws.",
      specifications: { Count: "3 pcs (S/M/L)" },
      colorOptions: ["Ink", "Blush"],
      material: "ABS + silicone",
      featured: false,
    },
    {
      name: "Pendant Lamp Halo",
      category: "Lighting",
      price: 12999,
      discountPrice: 10999,
      brand: "TRYVOXEL",
      stock: 5,
      description:
        "An annular LED pendant with a frosted ring. Height adjustable at install.",
      specifications: { Wattage: "22 W", CRI: "95", Diameter: "420 mm" },
      colorOptions: ["Brushed nickel", "Black"],
      dimensions: "Ø 420 mm (adjustable drop)",
      material: "Aluminum + acrylic",
      featured: true,
    },
    {
      name: "Terrazzo Coaster Set (4)",
      category: "Home Decor",
      price: 1499,
      discountPrice: 1199,
      brand: "Jasvinder Works",
      stock: 60,
      description:
        "Hand-cast terrazzo coasters with brass inclusions. Cork-backed.",
      specifications: { Count: "4", Diameter: "100 mm" },
      material: "Terrazzo + cork",
      featured: false,
    },
    {
      name: "Arc Necklace",
      category: "Wearables",
      price: 3499,
      discountPrice: null,
      brand: "Vishal Studio",
      stock: 32,
      description:
        "A continuous solid arc on a fine sterling chain. 40 cm + 5 cm extender.",
      specifications: { Length: "40 + 5 cm", "Chain type": "Cable" },
      material: "925 Sterling Silver",
      featured: false,
    },
    {
      name: "Parametric Mouse Pad",
      category: "3D-Desk",
      price: 899,
      discountPrice: 749,
      brand: "TRYVOXEL",
      stock: 140,
      description: "Low-friction gaming-grade surface. Anti-slip rubber base.",
      specifications: { Size: "450 × 400 mm", Thickness: "4 mm" },
      colorOptions: ["Ink", "Storm"],
      dimensions: "450 × 400 mm",
      material: "Polyester + rubber",
      featured: false,
    },
    {
      name: "LED Strip Kit (2 m)",
      category: "Lighting",
      price: 2999,
      discountPrice: 2599,
      brand: "TRYVOXEL",
      stock: 80,
      description:
        "Addressable 2 m RGBIC strip with Wi-Fi controller and 10 preset scenes.",
      specifications: { "LED count": 60, Voltage: "12 V" },
      dimensions: "2 m",
      material: "PCB + silicone jacket",
      featured: false,
    },
    {
      name: "Volume Vase",
      category: "Home Decor",
      price: 2499,
      discountPrice: null,
      brand: "Shruti × Jasvinder",
      stock: 26,
      description:
        "A twisted, near-impossible form, slip-cast stoneware. Matte glaze.",
      specifications: { "Water safe": "Yes" },
      dimensions: "240 × 130 mm",
      material: "Stoneware",
      featured: true,
    },
    {
      name: "Orbit Earring Pair",
      category: "Wearables",
      price: 1899,
      discountPrice: null,
      brand: "Vishal Studio",
      stock: 56,
      description:
        "A tiny orbit loop. Sterling silver posts, safe for sensitive ears.",
      specifications: { "Post material": "Titanium" },
      material: "925 Silver + titanium post",
      featured: false,
    },
    {
      name: "STL: Desk Organizer (Digital)",
      category: "Digital Goods",
      price: 299,
      discountPrice: null,
      brand: "TRYVOXEL Digital",
      stock: 9999,
      description:
        "A 3D-printable STL file — printable on any FDM 0.4 mm nozzle. Commercial license included.",
      specifications: { Format: "STL", "Layer height rec.": "0.2 mm" },
      featured: false,
    },
    {
      name: "glTF: Voxel Cube (Digital)",
      category: "Digital Goods",
      price: 499,
      discountPrice: 399,
      brand: "TRYVOXEL Digital",
      stock: 9999,
      description:
        "A 6-face glTF + glb model for AR/AR previews. PBR-textured, LOD ready.",
      specifications: { Format: "glTF + .glb", Tris: "1.2k" },
      featured: false,
    },
    {
      name: "Mono Desk Organizer",
      category: "3D-Desk",
      price: 2199,
      discountPrice: 1899,
      brand: "TRYVOXEL",
      stock: 4,
      description:
        "Single-piece CNC organizer for desk. Stash bin, letter slot, pen bank.",
      specifications: { Material: "Walnut veneer" },
      colorOptions: ["Walnut"],
      dimensions: "280 × 160 × 110 mm",
      material: "Walnut",
      featured: false,
    },
    {
      name: "Nebula Table Lamp",
      category: "Lighting",
      price: 3999,
      discountPrice: 3499,
      brand: "TRYVOXEL",
      stock: 3,
      description:
        "A blown-glass nebula-effect table lamp. Each piece is unique.",
      specifications: { Wattage: "9 W", "Color Temp": "3000K" },
      colorOptions: ["Cobalt", "Emerald"],
      dimensions: "Ø 180 × 260 mm",
      material: "Blown glass",
      featured: true,
    },
    {
      name: "Frame 01 (Poster size)",
      category: "Home Decor",
      price: 3299,
      discountPrice: 2799,
      brand: "TRYVOXEL",
      stock: 22,
      description:
        "A minimal aluminum poster frame, museum-glass front. 50 × 70 cm.",
      specifications: { Size: "50 × 70 cm", Glass: "Anti-glare museum" },
      dimensions: "520 × 720 mm (outer)",
      material: "Anodized aluminum",
      featured: false,
    },
    {
      name: "Spectrum Band",
      category: "Wearables",
      price: 1599,
      discountPrice: 1299,
      brand: "Vishal Studio",
      stock: 38,
      description:
        "A thin anodized band with a hidden brushed gradient. Stackable.",
      specifications: { Width: "3 mm" },
      colorOptions: ["Spectrum", "Black"],
      material: "Anodized steel",
      featured: false,
    },
    {
      name: "Voxel Bloom Planter",
      category: "Home Decor",
      price: 2699,
      discountPrice: 2299,
      brand: "TRYVOXEL",
      stock: 27,
      description:
        "A sculptural planter with drainage and a soft matte finish that complements indoor greenery.",
      specifications: { Capacity: "2.5 L", Material: "Stoneware" },
      colorOptions: ["Clay", "Sand"],
      dimensions: "180 × 180 × 180 mm",
      material: "Stoneware",
      featured: true,
    },
    {
      name: "Arc Work Light",
      category: "Lighting",
      price: 3499,
      discountPrice: 2999,
      brand: "TRYVOXEL",
      stock: 18,
      description:
        "A slim task lamp with directional lighting, soft-touch dimming, and USB-C power delivery.",
      specifications: { Wattage: "12 W", "Color Temp": "3000K–5000K" },
      colorOptions: ["Graphite", "Ivory"],
      dimensions: "260 × 120 × 90 mm",
      material: "Aluminum + polycarbonate",
      featured: false,
    },
    {
      name: "Rail Desk Organizer",
      category: "3D-Desk",
      price: 1799,
      discountPrice: 1499,
      brand: "TRYVOXEL",
      stock: 35,
      description:
        "A modular desktop rail for notebooks, pens, and small accessories with magnetic attachment points.",
      specifications: { Length: "360 mm", Material: "Powder-coated steel" },
      colorOptions: ["Charcoal", "White"],
      dimensions: "360 × 70 × 40 mm",
      material: "Steel",
      featured: false,
    },
    {
      name: "Loop Wristband",
      category: "Wearables",
      price: 1299,
      discountPrice: null,
      brand: "Vishal Studio",
      stock: 44,
      description:
        "A lightweight, flexible wristband with a hidden clasp and subtle geometric texture.",
      specifications: { Width: "18 mm", Material: "Silicone + metal" },
      colorOptions: ["Slate", "Rose", "Black"],
      material: "Silicone + metal",
      featured: false,
    },
  ];

  templates.forEach((t, idx) => {
    products.push({
      ...t,
      category: categoryMap.get(t.category),
      sku: undefined,
    });
  });
  return products;
}

async function seedCategories() {
  const created = [];
  for (const c of CATEGORY_SEEDS) {
    let cat = await Category.findOne({ name: c.name });
    if (!cat) {
      cat = new Category({ ...c, isActive: true });
      await cat.save();
      console.log("Created category:", c.name);
    } else {
      console.log("Category already exists:", c.name);
    }
    created.push(cat);
  }
  return created;
}

async function seedProducts(categories) {
  const count = await Product.estimatedDocumentCount();
  if (count >= 20) {
    console.log(
      `Product collection has ${count} docs — skipping product seed (≥20 already present)`,
    );
    return;
  }
  const items = buildProducts(categories);
  for (const p of items) {
    try {
      const doc = new Product(p);
      await doc.save();
    } catch (err) {
      console.warn("Skip product:", p.name, err.message);
    }
  }
  console.log(`Seeded ${items.length} products`);
}

module.exports = {
  connectDB,
  seedAdmin,
  seedCategories,
  seedProducts,
  buildProducts,
  CATEGORY_SEEDS,
};

async function main() {
  try {
    await connectDB();
    await seedAdmin();
    const cats = await seedCategories();
    await seedProducts(cats);
    console.log("Seed complete ✨");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

if (require.main === module) {
  main();
}
