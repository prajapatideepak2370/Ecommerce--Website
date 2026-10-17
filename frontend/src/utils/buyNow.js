import { addToCart } from "../store/cartSlice.js";

const PENDING_BUY_NOW_KEY = "tryvoxel-pending-buy-now";
let pendingBuyNowPromise = null;

export function savePendingBuyNow(product) {
  if (!product?._id || !product?.slug) {
    throw new Error("This product cannot be purchased right now.");
  }
  sessionStorage.setItem(PENDING_BUY_NOW_KEY, JSON.stringify(product));
}

export async function addProductToCartForCheckout(dispatch, product) {
  await dispatch(
    addToCart({
      product: product._id,
      quantity: 1,
      productMeta: product,
    }),
  ).unwrap();
}

export function completePendingBuyNow(dispatch) {
  if (pendingBuyNowPromise) return pendingBuyNowPromise;

  const rawProduct = sessionStorage.getItem(PENDING_BUY_NOW_KEY);
  if (!rawProduct) return Promise.resolve(false);

  pendingBuyNowPromise = (async () => {
    const product = JSON.parse(rawProduct);
    if (!product?._id || !product?.slug) {
      throw new Error("The selected product could not be restored.");
    }
    await addProductToCartForCheckout(dispatch, product);
    sessionStorage.removeItem(PENDING_BUY_NOW_KEY);
    return true;
  })().finally(() => {
    pendingBuyNowPromise = null;
  });

  return pendingBuyNowPromise;
}
