export default function BrandLogo({ className = "" }) {
  return (
    <img
      src="/tryvoxel-logo.png"
      alt="TRYVOXEL 3D"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
