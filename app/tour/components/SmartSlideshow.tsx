import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseUrl } from '@/lib/media-resolver';
import { ChevronRightIcon } from '@heroicons/react/24/outline'; // Or similar

interface SmartSlideshowProps {
  basePath: string; // e.g. "Open Tours/MADRID TO LISBOA"
  className?: string;
  daySpecificMedia?: Array<{ type: 'image' | 'video', src: string }>; // For Itinerary mode
  disableZoom?: boolean; // Disable Ken Burns effect
}

// Hardcoded for demo/MVP - in production this could come from a listBucket call if available publicly or pre-fetched
// For Madrid-Lisbon, we know some structure. 
// Since we don't have a "list bucket" API accessible from client anonymously easily without a function, 
// we might rely on a known list or just the day media if in Itinerary mode.
// 
// For "Summary" mode (overview), the user asked to show photos from "Open Tours/MADRID TO LISBOA".
// We will use a predefined list of high-quality assets or a prop.
// 
// Since we can't list files client-side easily without an API route, I will create a basic API route or helper.
// For now, let's assume we pass a list of images or fetch them.

const SmartSlideshow: React.FC<SmartSlideshowProps> = ({ basePath, className, daySpecificMedia, disableZoom }) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If we have specific media (Itinerary mode), use it
    if (daySpecificMedia && daySpecificMedia.length > 0) {
      setImages(daySpecificMedia.map(m => m.src));
      return;
    }

    // Otherwise load "Open Tours" overview set.
    // Since we don't have a file lister, I will use the "media/list" API endpoint if it exists,
    // or fallback to a set of known images for the Ken Burns effect.
    // Let's try to fetch from a new API endpoint we'll create: /api/media/list
    
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/media/list?path=${encodeURIComponent(basePath)}`);
        if (res.ok) {
          const json = await res.json();
          const files = json.files || [];
          
          // Filter for images: use f.filename for checking ext, f.path for src
          const imgs = files
             .filter((f: any) => {
                const name = f.filename || f.path || '';
                return /\.(jpg|jpeg|png|webp|avif)$/i.test(name);
             })
             .map((f: any) => f.path); // path contains the public URL in route.ts logic
          
          if (imgs.length > 0) setImages(imgs);
          else {
             // Fallback
             setImages([]); 
          }
        }
      } catch (e) {
         // Fallback
      }
    };
    fetchImages();
  }, [basePath, daySpecificMedia]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) return <div className={`bg-gray-900 ${className}`} />;

  const currentImage = images[currentIndex] || images[0];
  if (!currentImage) return <div className={`bg-gray-900 ${className}`} />;

  // Check if extension
  // Simpler logic: if path includes "Extensions" (case insensitive)
  const isExtension = currentImage.toLowerCase().includes('extension');

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <AnimatePresence>
        <motion.img
          key={currentImage}
          src={currentImage}
          alt="Slideshow"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: disableZoom ? 1 : 1.1, opacity: 0 }}
          animate={{ 
            scale: 1.0, 
            opacity: 1, 
            transition: { 
              scale: { duration: disableZoom ? 0 : 8, ease: "linear" }, 
              opacity: { duration: 1.2 } 
            } 
          }}
          exit={{ opacity: 0, transition: { duration: 1.2 } }}
        />
      </AnimatePresence>
      
      {isExtension && (
        <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-lg">
          Extension
        </div>
      )}
    </div>
  );
};

export default SmartSlideshow;
