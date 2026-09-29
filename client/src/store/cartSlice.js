import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { logout } from "./authSlice.js";
import { demoProducts } from "../data/demoProducts.js";

const CART_STORAGE_KEY = "tryvoxel-demo-cart";
const DEMO_PRODUCT_IDS = new Set(demoProducts.map((product) => product._id));

const buildCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    const price = Number(
      item.unitPrice ||
        item.productMeta?.discountPrice ||
        item.productMeta?.price ||
        0,
    );
    return sum + price * Number(item.quantity || 1);
  }, 0);
  const tax = subtotal * 0.18;
  const shippingFee = subtotal > 1999 ? 0 : 199;
  return {
    subtotal,
    tax,
    shippingFee,
    totalAmount: subtotal + tax + shippingFee,
  };
};

const readLocalCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : null;
    if (!cart || !Array.isArray(cart.items)) {
      return { items: [], subtotal: 0, tax: 0, shippingFee: 0, totalAmount: 0 };
    }

    const items = cart.items.filter((item) => {
      const productId = String(item.product || item._id || "");
      return !productId.startsWith("demo-") || DEMO_PRODUCT_IDS.has(productId);
    });
    const currentCart = { ...cart, items, ...buildCartTotals(items) };
    if (items.length !== cart.items.length) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
    }
    return currentCart;
  } catch {
    return { items: [], subtotal: 0, tax: 0, shippingFee: 0, totalAmount: 0 };
  }
};

const writeLocalCart = (payload) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors for demo mode
  }
};

const storeLocalItems = (items) => {
  const payload = { items, ...buildCartTotals(items) };
  writeLocalCart(payload);
  return payload;
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    const localCart = readLocalCart();
    const hasDemoItems = localCart.items.some((item) =>
      String(item.product || item._id || "").startsWith("demo-"),
    );
    if (hasDemoItems) return localCart;

    try {
      return await cartApi.get();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        return readLocalCart();
      }
      return rejectWithValue(getErrorMessage(err, "Could not load cart"));
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    { product, quantity = 1, productMeta },
    { rejectWithValue, dispatch, getState },
  ) => {
    const productId = String(product || "");
    const addLocalItem = () => {
      const current = getState().cart.items || [];
      const unitPrice = Number(
        productMeta?.discountPrice && productMeta.discountPrice > 0
          ? productMeta.discountPrice
          : productMeta?.price || 0,
      );
      const itemKey = productMeta?.slug || productId;
      const existingIndex = current.findIndex(
        (item) =>
          item.product === productId ||
          item.productMeta?.slug === itemKey ||
          item._id === productId,
      );
      const nextItems = [...current];

      if (existingIndex >= 0) {
        const nextQuantity =
          Number(nextItems[existingIndex].quantity || 0) +
          Number(quantity || 1);
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextQuantity,
          unitPrice,
          lineTotal: unitPrice * nextQuantity,
          productMeta: {
            ...(nextItems[existingIndex].productMeta || {}),
            ...(productMeta || {}),
          },
        };
      } else {
        nextItems.push({
          _id: productId,
          product: productId,
          quantity: Number(quantity || 1),
          unitPrice,
          lineTotal: unitPrice * Number(quantity || 1),
          productMeta: productMeta || { name: "Demo product", slug: itemKey },
        });
      }

      return storeLocalItems(nextItems);
    };

    if (DEMO_PRODUCT_IDS.has(productId)) return addLocalItem();

    try {
      await cartApi.addItem({ product, quantity });
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      if (
        !!productMeta ||
        err?.response?.status === 401 ||
        err?.response?.status === 404
      ) {
        return addLocalItem();
      }

      return rejectWithValue(getErrorMessage(err, "Could not add to cart"));
    }
  },
);

export const updateQty = createAsyncThunk(
  "cart/updateQty",
  async ({ itemId, quantity }, { rejectWithValue, dispatch, getState }) => {
    if (DEMO_PRODUCT_IDS.has(String(itemId))) {
      const current = getState().cart.items || [];
      const updated = current.map((item) =>
        item._id === itemId
          ? {
              ...item,
              quantity: Math.max(1, Number(quantity || 1)),
              lineTotal:
                Number(item.unitPrice || item.productMeta?.price || 0) *
                Math.max(1, Number(quantity || 1)),
            }
          : item,
      );
      return storeLocalItems(updated);
    }

    try {
      await cartApi.updateQty(itemId, quantity);
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      if (String(itemId).startsWith("demo-")) {
        const current = getState().cart.items || [];
        const updated = current
          .map((item) =>
            item._id === itemId
              ? {
                  ...item,
                  quantity: Math.max(1, Number(quantity || 1)),
                  lineTotal:
                    Number(item.unitPrice || item.productMeta?.price || 0) *
                    Math.max(1, Number(quantity || 1)),
                }
              : item,
          )
          .filter((item) => Number(item.quantity || 0) > 0);
        const payload = { items: updated, ...buildCartTotals(updated) };
        writeLocalCart(payload);
        return payload;
      }
      return rejectWithValue(getErrorMessage(err, "Could not update cart"));
    }
  },
);

export const removeItem = createAsyncThunk(
  "cart/removeItem",
  async (itemId, { rejectWithValue, dispatch, getState }) => {
    if (DEMO_PRODUCT_IDS.has(String(itemId))) {
      const current = getState().cart.items || [];
      return storeLocalItems(current.filter((item) => item._id !== itemId));
    }

    try {
      await cartApi.removeItem(itemId);
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      if (String(itemId).startsWith("demo-")) {
        const current = getState().cart.items || [];
        const updated = current.filter(
          (item) => item._id !== itemId && item.product !== itemId,
        );
        const payload = { items: updated, ...buildCartTotals(updated) };
        writeLocalCart(payload);
        return payload;
      }
      return rejectWithValue(getErrorMessage(err, "Could not remove item"));
    }
  },
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await cartApi.clear();
      localStorage.removeItem(CART_STORAGE_KEY);
      return { items: [] };
    } catch (err) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return { items: [], subtotal: 0, tax: 0, shippingFee: 0, totalAmount: 0 };
    }
  },
);

const initialState = {
  ...readLocalCart(),
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchCart.fulfilled, (s, { payload }) => {
        s.items = payload?.items || [];
        s.subtotal = payload?.subtotal || 0;
        s.tax = payload?.tax || 0;
        s.shippingFee = payload?.shippingFee || 0;
        s.totalAmount = payload?.totalAmount || 0;
        s.loading = false;
      })
      .addCase(fetchCart.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })
      .addCase(addToCart.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          s.items = payload.items;
          s.subtotal = payload.subtotal || 0;
          s.tax = payload.tax || 0;
          s.shippingFee = payload.shippingFee || 0;
          s.totalAmount = payload.totalAmount || 0;
          s.error = null;
        }
      })
      .addCase(addToCart.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(updateQty.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          s.items = payload.items;
          s.subtotal = payload.subtotal || 0;
          s.tax = payload.tax || 0;
          s.shippingFee = payload.shippingFee || 0;
          s.totalAmount = payload.totalAmount || 0;
        }
      })
      .addCase(updateQty.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(removeItem.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          s.items = payload.items;
          s.subtotal = payload.subtotal || 0;
          s.tax = payload.tax || 0;
          s.shippingFee = payload.shippingFee || 0;
          s.totalAmount = payload.totalAmount || 0;
        }
      })
      .addCase(removeItem.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(clearCart.fulfilled, (s) => {
        s.items = [];
        s.subtotal = 0;
        s.tax = 0;
        s.shippingFee = 0;
        s.totalAmount = 0;
      });
    builder.addCase(logout.fulfilled, (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.shippingFee = 0;
      state.totalAmount = 0;
      state.error = null;
      localStorage.removeItem(CART_STORAGE_KEY);
    });
  },
});

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
export const selectCartItems = (state) => state.cart.items;

export default cartSlice.reducer;
