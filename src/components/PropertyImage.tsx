import { useState } from 'react';
import { Building2, Home, Landmark, Trees } from 'lucide-react';
import { PropertyCategory } from '../types/immo';

interface PropertyImageProps {
  src: string;
  alt: string;
  category: PropertyCategory;
  className?: string;
}

export function PropertyImage({ src, alt, category, className = '' }: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  const CategoryIcon =
    category === 'Villa'
      ? Home
      : category === 'Appartement'
        ? Building2
        : category === 'Studio'
          ? Landmark
          : Trees;

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#132F54] to-[#1D4375] text-white/90 ${className}`}
        role="img"
        aria-label={alt}
      >
        <CategoryIcon className="h-8 w-8 text-[#C9A24D] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-slate-200 px-3 text-center">
          {category} · ImmoLuxe
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
