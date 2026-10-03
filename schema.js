const Joi = require("joi");

module.exports.authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().min(3).max(50).alphanum().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string().min(8).max(128).required(),
    phone: Joi.string()
      .allow("", null)
      .pattern(/^\+?[1-9][\d\s-]{7,14}$/),
  }),

  login: Joi.object({
    username: Joi.string().min(1).max(254),
    email: Joi.string().email({ tlds: { allow: false } }),
    password: Joi.string().required(),
  })
    .xor("username", "email")
    .messages({ "object.missing": "Provide either username or email." }),

  profile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email({ tlds: { allow: false } }),
    phone: Joi.string()
      .allow("", null)
      .pattern(/^\+?[1-9][\d\s-]{7,14}$/),
  }).min(1),

  address: Joi.object({
    label: Joi.string().trim().min(1).max(50).default("Home"),
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9][\d\s-]{7,14}$/)
      .required(),
    line1: Joi.string().min(3).max(255).required(),
    line2: Joi.string().allow("", null).max(255),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    postalCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(100).required(),
    isDefault: Joi.boolean().default(false),
  }),
};

module.exports.categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow("", null).max(1000),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow("", null).max(1000),
    isActive: Joi.boolean(),
  }).min(1),
};

module.exports.productSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    slug: Joi.string().min(1).max(255),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    discountPrice: Joi.number().min(0).optional(),
    category: Joi.string().required(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().required(),
      }),
    ),
    model3D: Joi.object({
      url: Joi.string().uri().required(),
      format: Joi.string().valid("glb", "gltf").required(),
    }),
    stock: Joi.number().integer().min(0).required(),
    brand: Joi.string().allow("", null).max(100),
    sku: Joi.string().max(100),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()),
    ),
    colorOptions: Joi.array().items(Joi.string()),
    dimensions: Joi.string().allow("", null).max(255),
    material: Joi.string().allow("", null).max(255),
    featured: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255),
    slug: Joi.string().min(1).max(255),
    description: Joi.string().min(10),
    price: Joi.number().positive(),
    discountPrice: Joi.number().min(0),
    category: Joi.string(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().required(),
      }),
    ),
    model3D: Joi.object({
      url: Joi.string().uri().required(),
      format: Joi.string().valid("glb", "gltf").required(),
    }),
    stock: Joi.number().integer().min(0),
    brand: Joi.string().allow("", null).max(100),
    sku: Joi.string().max(100),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()),
    ),
    colorOptions: Joi.array().items(Joi.string()),
    dimensions: Joi.string().allow("", null).max(255),
    material: Joi.string().allow("", null).max(255),
    featured: Joi.boolean(),
    isActive: Joi.boolean(),
  }).min(1),

  query: Joi.object({
    search: Joi.string().allow("", null),
    category: Joi.string().allow("", null),
    brand: Joi.string().allow("", null),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    inStock: Joi.boolean(),
    featured: Joi.boolean(),
    minRating: Joi.number().min(1).max(5),
    sort: Joi.string()
      .valid("newest", "price-asc", "price-desc", "rating-desc", "name-asc")
      .default("newest"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
  }),
};

module.exports.cartSchemas = {
  addItem: Joi.object({
    product: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
  }),

  updateQuantity: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),
};

module.exports.orderSchemas = {
  create: Joi.object({
    addressId: Joi.string(),
    shippingAddress: Joi.object({
      label: Joi.string(),
      fullName: Joi.string().required(),
      phone: Joi.string().required(),
      line1: Joi.string().required(),
      line2: Joi.string().allow("", null),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
    }),
    paymentMethod: Joi.string().valid("COD", "UPI").default("COD"),
    paymentReference: Joi.string().allow("", null).default(""),
    paymentStatus: Joi.string()
      .valid("Pending", "Paid", "Failed", "Refunded")
      .default("Pending"),
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        name: Joi.string().required(),
        image: Joi.string().allow("", null).default(""),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
        productMeta: Joi.object({
          slug: Joi.string().allow("", null),
        }).unknown(true),
      }),
    ),
  })
    .xor("addressId", "shippingAddress")
    .messages({
      "object.missing": "Provide either addressId or shippingAddress.",
    }),

  status: Joi.object({
    orderStatus: Joi.string()
      .valid(
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
      )
      .required(),
  }),
};

module.exports.reviewSchemas = {
  create: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow("", null).max(2000),
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().allow("", null).max(2000),
  }).min(1),
};

module.exports.adminSchemas = {
  blockUser: Joi.object({
    isBlocked: Joi.boolean().required(),
  }),

  stockUpdate: Joi.object({
    stock: Joi.number().integer().min(0).required(),
  }),
};

module.exports.adminAuthSchemas = {
  login: Joi.object({
    username: Joi.string().min(1).max(254),
    email: Joi.string().email({ tlds: { allow: false } }),
    password: Joi.string().required(),
  })
    .xor("username", "email")
    .messages({ "object.missing": "Provide either username or email." }),
};

module.exports.adminCatalogSchemas = {
  productCreate: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    slug: Joi.string().min(1).max(255),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    discountPrice: Joi.number().min(0),
    category: Joi.string().required(),
    stock: Joi.number().integer().min(0).required(),
    brand: Joi.string().allow("", null).max(100),
    sku: Joi.string().max(100),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()),
    ),
    colorOptions: Joi.array().items(Joi.string().max(100)),
    dimensions: Joi.string().allow("", null).max(255),
    material: Joi.string().allow("", null).max(255),
    featured: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
  }),

  productUpdate: Joi.object({
    name: Joi.string().min(2).max(255),
    slug: Joi.string().min(1).max(255),
    description: Joi.string().min(10),
    price: Joi.number().positive(),
    discountPrice: Joi.number().min(0),
    category: Joi.string(),
    stock: Joi.number().integer().min(0),
    brand: Joi.string().allow("", null).max(100),
    sku: Joi.string().max(100),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()),
    ),
    colorOptions: Joi.array().items(Joi.string().max(100)),
    dimensions: Joi.string().allow("", null).max(255),
    material: Joi.string().allow("", null).max(255),
    featured: Joi.boolean(),
    isActive: Joi.boolean(),
  }).min(1),

  productStatus: Joi.object({
    isActive: Joi.boolean(),
  }),

  productStock: Joi.object({
    stock: Joi.number().integer().min(0),
    delta: Joi.number().integer(),
    reason: Joi.string().allow("", null).max(500),
  })
    .xor("stock", "delta")
    .messages({ "object.missing": "Provide either `stock` or `delta`." }),

  productImageReorder: Joi.object({
    order: Joi.array().items(Joi.string().min(1)).min(1).required(),
    primaryPublicId: Joi.string().min(1),
  }),

  productBulk: Joi.object({
    ids: Joi.array().items(Joi.string().min(1)).min(1).required(),
    action: Joi.string()
      .valid("activate", "deactivate", "softDelete", "stockAdd")
      .required(),
    payload: Joi.object().pattern(Joi.string(), Joi.any()),
  }),

  categoryCreate: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    slug: Joi.string().min(1).max(100),
    description: Joi.string().allow("", null).max(1000),
    isActive: Joi.boolean().default(true),
  }),

  categoryUpdate: Joi.object({
    name: Joi.string().min(2).max(100),
    slug: Joi.string().min(1).max(100),
    description: Joi.string().allow("", null).max(1000),
    isActive: Joi.boolean(),
  }).min(1),

  categoryDelete: Joi.object({
    reassignTo: Joi.string().min(1),
  }).default({}),
};
