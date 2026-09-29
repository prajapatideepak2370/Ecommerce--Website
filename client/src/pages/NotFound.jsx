import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Box } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-container min-h-[70vh] grid place-items-center py-20">
      <div className="text-center max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto mb-8 h-40 w-40"
        >
          <div className="absolute inset-0 rounded-3xl bg-brand-500/30 blur-3xl" />
          <div className="relative h-full rounded-3xl bg-gradient-to-br from-brand-600/30 to-accent/20 border border-ink-700 grid place-items-center">
            <Box size={60} className="text-white animate-float-slow" />
          </div>
        </motion.div>
        <div className="font-display text-8xl font-bold gradient-text mb-2">404</div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">This voxel is lost in space</h1>
        <p className="text-ink-300 mb-8">
          The page you're looking for doesn't exist, got moved, or was deleted by one of our three founders. (Probably Vishal.)
        </p>
        <Link to="/" className="btn-primary inline-flex"><ArrowLeft size={18} /> Back home</Link>
      </div>
    </div>
  );
}
