import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { logout } from "./authSlice.js";

const CART_STORAGE_KEY = "tryvoxel-demo-cart";

const emptyCart = () => ({
  items: [],
  subtotal: 0,
  tax: 0,
  shippingFee: 0,
  totalAmount: 0,
});

const getProductId = (item) =>
  String(item?.product?._id || item?.product || item?._id || "");

const getUnitPrice = (product) => {
  const regularPrice = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  return discountPrice > 0 && discountPrice < regularPrice
    ? discountPrice
    : regularPrice;
};

const buildCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    const price = Number(
      item.unitPrice ?? getUnitPrice(item.productMeta),
    );
    return sum + price * Number(item.quantity || 1);
  }, 0);
  const tax = 0;
  const shippingFee = 0;
  return {
    subtotal,
    tax,
    shippingFee,
    totalAmount: subtotal,
  };
};

const applyCartPayload = (state, payload) => {
  state.items = payload?.items || [];
  Object.assign(state, buildCartTotals(state.items));
};

const readLocalCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : null;
    if (!cart || !Array.isArray(cart.items)) return emptyCart();
    const items = cart.items.filter((item) => getProductId(item));
    return { ...cart, items, ...buildCartTotals(items) };
  } catch {
    return emptyCart();
  }
};

const writeLocalCart = (items) => {
  const cart = { items, ...buildCartTotals(items) };
  if (items.length) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return cart;
};

const removeMergedGuestItem = (productId, quantity) => {
  const guestCart = readLocalCart();
  const items = guestCart.items.filter(
    (item) =>
      getProductId(item) !== productId ||
      Number(item.quantity || 1) !== quantity,
  );
  writeLocalCart(items);
};

let guestCartMergePromise = null;

const getAuthenticatedCart = () => {
  if (guestCartMergePromise) return guestCartMergePromise;

  guestCartMergePromise = (async () => {
    let cart = await cartApi.get();
    const guestItems = readLocalCart().items;

    for (const item of guestItems) {
      const product = getProductId(item);
      const quantity = Number(item.quantity || 1);
      cart = await cartApi.addItem({ product, quantity });
      removeMergedGuestItem(product, quantity);
    }

    return cart;
  })().finally(() => {
    guestCartMergePromise = null;
  });

  return guestCartMergePromise;
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    if (!getState().auth.user) return readLocalCart();
    try {
      return await getAuthenticatedCart();
    } catch (err) {
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
    if (!getState().auth.user) {
      const productId = String(product?._id || product || "");
      const qty = Number(quantity);
      if (!productId || !Number.isInteger(qty) || qty < 1) {
        return rejectWithValue("This product cannot be added to your cart.");
      }

      const cart = readLocalCart();
      const existing = cart.items.find(
        (item) => getProductId(item) === productId,
      );
      const nextQuantity = Number(existing?.quantity || 0) + qty;
      const stock = Number(productMeta?.stock);
      if (Number.isFinite(stock) && nextQuantity > stock) {
        return rejectWithValue(`Only ${stock} item(s) left in stock.`);
      }

      const item = {
        ...(existing || {}),
        _id: productId,
        product: productId,
        quantity: nextQuantity,
        unitPrice: getUnitPrice(productMeta || existing?.productMeta),
        productMeta: productMeta || existing?.productMeta || null,
      };
      return writeLocalCart([
        ...cart.items.filter((cartItem) => getProductId(cartItem) !== productId),
        item,
      ]);
    }

    try {
      await cartApi.addItem({ product, quantity });
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add to cart"));
    }
  },
);

export const updateQty = createAsyncThunk(
  "cart/updateQty",
  async ({ itemId, quantity }, { rejectWithValue, dispatch, getState }) => {
    if (!getState().auth.user) {
      const cart = readLocalCart();
      const item = cart.items.find(
        (entry) => String(entry._id || getProductId(entry)) === String(itemId),
      );
      const qty = Number(quantity);
      if (!item || !Number.isInteger(qty) || qty < 1) {
        return rejectWithValue("Could not update cart");
      }
      const stock = Number(item.productMeta?.stock);
      if (Number.isFinite(stock) && qty > stock) {
        return rejectWithValue(`Only ${stock} item(s) left in stock.`);
      }
      return writeLocalCart(
        cart.items.map((entry) =>
          entry === item ? { ...entry, quantity: qty } : entry,
        ),
      );
    }

    try {
      await cartApi.updateQty(itemId, quantity);
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update cart"));
    }
  },
);

export const removeItem = createAsyncThunk(
  "cart/removeItem",
  async (itemId, { rejectWithValue, dispatch, getState }) => {
    if (!getState().auth.user) {
      const cart = readLocalCart();
      const items = cart.items.filter(
        (entry) => String(entry._id || getProductId(entry)) !== String(itemId),
      );
      if (items.length === cart.items.length) {
        return rejectWithValue("Cart item not found.");
      }
      return writeLocalCart(items);
    }

    try {
      await cartApi.removeItem(itemId);
      return await dispatch(fetchCart()).unwrap();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove item"));
    }
  },
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue, getState }) => {
    if (!getState().auth.user) return writeLocalCart([]);

    try {
      await cartApi.clear();
      return emptyCart();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not clear cart"));
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
        applyCartPayload(s, payload);
        s.loading = false;
      })
      .addCase(fetchCart.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })
      .addCase(addToCart.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          applyCartPayload(s, payload);
          s.error = null;
        }
      })
      .addCase(addToCart.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(updateQty.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          applyCartPayload(s, payload);
        }
      })
      .addCase(updateQty.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(removeItem.fulfilled, (s, { payload }) => {
        if (payload?.items) {
          applyCartPayload(s, payload);
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
      applyCartPayload(state, readLocalCart());
      state.error = null;
    });
  },
});

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
export const selectCartItems = (state) => state.cart.items;

export default cartSlice.reducer;
