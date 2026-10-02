export const demoProducts = [
  {
    _id: "demo-desk-lamp",
    slug: "desk-lamp",
    name: "Sculpted Desk Lamp",
    category: { name: "Lighting", slug: "lighting" },
    price: 1999,
    discountPrice: null,
    stock: 15,
    isDemo: true,
    brand: "TRYVOXEL Studio",
    description:
      "A sculptural desk lamp with a compact footprint, designed to bring a warm focal point to your workspace.",
    material: "Printed polymer",
    dimensions: "Desktop size",
    rating: 4.6,
    numReviews: 12,
    images: [{ url: "/products/desk-lamp.png" }],
  },
  {
    _id: "demo-pen-stand",
    slug: "pen-stand",
    name: "Geometric Pen Stand",
    category: { name: "3D-Desk", slug: "3d-desk" },
    price: 799,
    discountPrice: null,
    stock: 24,
    isDemo: true,
    brand: "TRYVOXEL Studio",
    description:
      "A geometric organizer that keeps pens and small desk tools together without crowding your workspace.",
    material: "Printed polymer",
    dimensions: "Compact desktop size",
    rating: 4.2,
    numReviews: 8,
    images: [{ url: "/products/pen-stand.jpeg" }],
  },
  {
    _id: "demo-utility-stand",
    slug: "utility-stand",
    name: "Utility Stand",
    category: { name: "3D-Desk", slug: "3d-desk" },
    price: 999,
    discountPrice: null,
    stock: 18,
    isDemo: true,
    brand: "TRYVOXEL Studio",
    description:
      "A versatile stand for organizing everyday accessories on a desk, shelf, or counter.",
    material: "Printed polymer",
    dimensions: "Desktop size",
    rating: 3.8,
    numReviews: 5,
    images: [{ url: "/products/utility-stand.png" }],
  },
];

export const filterDemoProducts = ({
  search = "",
  category = "",
  minPrice = "",
  maxPrice = "",
  minRating = "",
  inStock = false,
  sort = "newest",
} = {}) => {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = demoProducts.filter((product) => {
    const searchableText =
      `${product.name} ${product.description} ${product.brand}`.toLowerCase();
    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!category || product.category.slug === category) &&
      (minPrice === "" || product.price >= Number(minPrice)) &&
      (maxPrice === "" || product.price <= Number(maxPrice)) &&
      (minRating === "" || product.rating >= Number(minRating)) &&
      (!inStock || product.stock > 0)
    );
  });

  switch (sort) {
    case "price-asc":
      return filtered.sort((a, b) => a.price - b.price);
    case "price-desc":
      return filtered.sort((a, b) => b.price - a.price);
    case "rating-desc":
      return filtered.sort((a, b) => b.rating - a.rating);
    case "name-asc":
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return filtered;
  }
};
