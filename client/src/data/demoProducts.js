export const demoProducts = [
  {
    _id: "demo-desk-lamp",
    slug: "desk-lamp",
    name: "Sculpted Desk Lamp",
    price: 1999,
    discountPrice: null,
    stock: 15,
    brand: "TRYVOXEL Studio",
    description:
      "A sculptural desk lamp with a compact footprint, designed to bring a warm focal point to your workspace.",
    material: "Printed polymer",
    dimensions: "Desktop size",
    rating: 0,
    numReviews: 0,
    images: [{ url: "/products/desk-lamp.png" }],
  },
  {
    _id: "demo-pen-stand",
    slug: "pen-stand",
    name: "Geometric Pen Stand",
    price: 799,
    discountPrice: null,
    stock: 24,
    brand: "TRYVOXEL Studio",
    description:
      "A geometric organizer that keeps pens and small desk tools together without crowding your workspace.",
    material: "Printed polymer",
    dimensions: "Compact desktop size",
    rating: 0,
    numReviews: 0,
    images: [{ url: "/products/pen-stand.jpeg" }],
  },
  {
    _id: "demo-utility-stand",
    slug: "utility-stand",
    name: "Utility Stand",
    price: 999,
    discountPrice: null,
    stock: 18,
    brand: "TRYVOXEL Studio",
    description:
      "A versatile stand for organizing everyday accessories on a desk, shelf, or counter.",
    material: "Printed polymer",
    dimensions: "Desktop size",
    rating: 0,
    numReviews: 0,
    images: [{ url: "/products/utility-stand.png" }],
  },
];

export const filterDemoProducts = (search = "") => {
  const normalizedSearch = search.trim().toLowerCase();
  return demoProducts.filter((product) =>
    product.name.toLowerCase().includes(normalizedSearch),
  );
};
