import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ImagePlus,
  Pencil,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { reviewApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { selectIsAuthenticated, selectUser } from "../store/authSlice.js";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const emptySummary = {
  averageRating: 0,
  totalReviews: 0,
  distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
};

const formatReviewDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

function ImagePreview({ file, onRemove }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-ink-700 bg-ink-800">
      {src && (
        <img src={src} alt={file.name} className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-ink-950/85 text-white hover:bg-rose-600"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function ProductReviews({ productId, onSummaryChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [viewer, setViewer] = useState({ authenticated: false, canReview: false });
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await reviewApi.list(productId, { sort });
      setReviews(Array.isArray(result?.items) ? result.items : []);
      const nextSummary = result?.summary || emptySummary;
      setSummary(nextSummary);
      setViewer(result?.viewer || { authenticated: false, canReview: false });
      onSummaryChange?.(nextSummary);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Reviews could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [onSummaryChange, productId, sort]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingReview(null);
    setSelectedFiles([]);
    setRating(5);
    setTitle("");
    setComment("");
  };

  const openNewReview = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setEditingReview(null);
    setSelectedFiles([]);
    setRating(5);
    setTitle("");
    setComment("");
    setFormOpen(true);
  };

  const openEditReview = (review) => {
    setEditingReview(review);
    setSelectedFiles([]);
    setRating(review.rating);
    setTitle(review.title || "");
    setComment(review.comment || "");
    setFormOpen(true);
  };

  const addImages = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const existingCount = editingReview?.images?.length || 0;
    const availableSlots =
      MAX_IMAGES - existingCount - selectedFiles.length;
    const accepted = [];

    for (const file of files) {
      if (!IMAGE_TYPES.has(file.type)) {
        toast.error(`${file.name}: choose a JPG, PNG, or WEBP image.`);
      } else if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name}: images must be 5 MB or smaller.`);
      } else if (accepted.length >= availableSlots) {
        toast.error(`A review can include up to ${MAX_IMAGES} images.`);
        break;
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length) {
      setSelectedFiles((current) => [...current, ...accepted]);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append("rating", String(rating));
    formData.append("title", title.trim());
    formData.append("comment", comment.trim());
    selectedFiles.forEach((file) => formData.append("images", file));

    try {
      if (editingReview) {
        await reviewApi.update(productId, editingReview._id, formData);
        toast.success("Your review was updated.");
      } else {
        await reviewApi.create(productId, formData);
        toast.success("Thanks for sharing your review.");
      }
      closeForm();
      await loadReviews();
    } catch (error) {
      toast.error(getErrorMessage(error, "Your review could not be saved."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      await reviewApi.remove(productId, review._id);
      toast.success("Your review was deleted.");
      await loadReviews();
    } catch (error) {
      toast.error(getErrorMessage(error, "Your review could not be deleted."));
    }
  };

  const isOwnReview = (review) => {
    const reviewUserId = review.user?._id || review.user;
    const currentUserId = user?._id || user?.id;
    return (
      isAuthenticated &&
      currentUserId != null &&
      reviewUserId != null &&
      String(reviewUserId) === String(currentUserId)
    );
  };

  const reviewImagesRemaining =
    MAX_IMAGES - (editingReview?.images?.length || 0) - selectedFiles.length;

  return (
    <section
      id="product-reviews"
      className="card scroll-mt-24 p-4 sm:p-5 md:p-7"
      aria-labelledby="reviews-title"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="reviews-title" className="font-display text-xl font-semibold">
            Customer reviews
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            Ratings and feedback from customers who purchased this product.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="review-sort">
            Sort reviews
          </label>
          <select
            id="review-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="max-w-40 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rated</option>
          </select>
        </div>
      </div>

      <div className="mb-6 grid gap-5 rounded-xl border border-ink-800 bg-ink-800/30 p-4 sm:grid-cols-[minmax(160px,0.8fr)_1fr] sm:p-5">
        <div className="flex items-center gap-3">
          <div>
            <div
              role="img"
              className="flex text-amber-300"
              aria-label={`${summary.averageRating.toFixed(1)} out of 5 stars`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={18}
                  fill={index < Math.round(summary.averageRating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold leading-none">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-ink-400">
                {summary.totalReviews}{" "}
                {summary.totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2" aria-label="Rating distribution">
          {summary.distribution.map(({ rating: starRating, count }) => {
            const percentage = summary.totalReviews
              ? (count / summary.totalReviews) * 100
              : 0;
            return (
              <div
                key={starRating}
                className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-xs"
              >
                <span className="flex items-center gap-1">
                  {starRating} <Star size={12} className="text-amber-300" />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-ink-700">
                  <span
                    className="block h-full rounded-full bg-amber-300"
                    style={{ width: `${percentage}%` }}
                  />
                </span>
                <span className="text-right text-ink-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-400">
          {viewer.canReview
            ? "Purchased this product? Share your experience."
            : viewer.authenticated && !reviews.some(isOwnReview)
              ? "A paid order is required to leave a review."
              : ""}
        </p>
        {viewer.canReview && (
          <button type="button" onClick={openNewReview} className="btn-primary">
            Write a review
          </button>
        )}
        {!isAuthenticated && (
          <button type="button" onClick={openNewReview} className="btn-outline">
            Sign in to review
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={submitReview}
          className="mb-6 space-y-4 rounded-xl border border-ink-700 bg-ink-800/30 p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">
                {editingReview ? "Edit your review" : "Write a review"}
              </h3>
              <p className="mt-1 text-xs text-ink-400">
                Reviews are available to customers with a paid order.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close review form"
              className="btn-ghost !h-9 !w-9 !p-0"
            >
              <X size={16} />
            </button>
          </div>

          <fieldset>
            <legend className="input-label">Your rating</legend>
            <div className="flex gap-1" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                  className="rounded-md p-1 text-amber-300 hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400"
                >
                  <Star
                    size={25}
                    fill={value <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="input-label">Review title</span>
            <input
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full"
              placeholder="Sum up your experience"
            />
          </label>

          <label className="block">
            <span className="input-label">Your review</span>
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full resize-y"
              placeholder="What did you like or what should other customers know?"
            />
          </label>

          <div>
            <label className="input-label" htmlFor="review-images">
              Product photos (optional, up to 5; 5 MB each)
            </label>
            <label
              htmlFor="review-images"
              className={`btn-ghost inline-flex cursor-pointer ${
                reviewImagesRemaining <= 0 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <ImagePlus size={16} />
              Choose images
            </label>
            <input
              id="review-images"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              disabled={reviewImagesRemaining <= 0}
              onChange={addImages}
              className="sr-only"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {selectedFiles.map((file, index) => (
                  <ImagePreview
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() =>
                      setSelectedFiles((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:cursor-wait"
            >
              {submitting
                ? "Saving..."
                : editingReview
                  ? "Save changes"
                  : "Submit review"}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-4 text-sm text-ink-400" aria-live="polite">
          Loading reviews...
        </p>
      ) : loadError ? (
        <p className="py-4 text-sm text-rose-300" role="alert">
          {loadError}
        </p>
      ) : reviews.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="rounded-xl border border-ink-800 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                {review.user?.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-700 text-ink-200">
                    <UserRound size={19} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="truncate font-medium">
                      {review.user?.name ||
                        review.user?.username ||
                        "Customer"}
                    </h3>
                    <time
                      className="text-xs text-ink-500"
                      dateTime={review.createdAt}
                    >
                      {formatReviewDate(review.createdAt)}
                    </time>
                  </div>
                  <div
                    className="mt-1 flex text-amber-300"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={14}
                        fill={index < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  {review.verifiedPurchase && (
                    <span className="mt-1 inline-block text-xs text-emerald-400">
                      Verified purchase
                    </span>
                  )}
                </div>
              </div>
              <h4 className="mt-4 font-semibold">
                {review.title || "Customer review"}
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-300">
                {review.comment}
              </p>
              {review.images?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.images.map((image, index) => (
                    <button
                      key={image.publicId || image.url}
                      type="button"
                      onClick={() =>
                        setActiveImage({
                          url: image.url,
                          alt: `${review.title || "Review"} photo ${index + 1}`,
                        })
                      }
                      className="h-20 w-20 overflow-hidden rounded-lg border border-ink-700 sm:h-24 sm:w-24"
                      aria-label={`View review photo ${index + 1}`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="h-full w-full object-cover transition hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
              {isOwnReview(review) && (
                <div className="mt-4 flex gap-2 border-t border-ink-800 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditReview(review)}
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review)}
                    className="btn-ghost !px-3 !py-1.5 text-xs text-rose-300 hover:text-rose-200"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ink-700 py-8 text-center">
          <Star size={25} className="mx-auto mb-2 text-ink-500" />
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-ink-400">
            Be the first to share your experience after purchasing this product.
          </p>
        </div>
      )}

      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review image preview"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveImage(null);
          }}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            aria-label="Close image preview"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={activeImage.url}
            alt={activeImage.alt}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}
