import React, { useState, useEffect, useRef, memo } from "react";
import { Film, Loader2 } from "lucide-react";

interface VideoThumbnailProps {
  path: string;
  gridSize: "small" | "medium" | "large" | "xl";
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ path, gridSize }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 96,
    xl: 192,
  };

  const size = sizeMap[gridSize] || 48;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }, // Start loading when 100px away
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;

    // Safety timeout to stop loading spinner if video takes too long
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [path, isVisible]);

  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 1; // Capture frame at 1 second
    }
  };

  const handleSeeked = () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setThumbnail(canvas.toDataURL("image/jpeg", 0.7));
      }
    } catch (e) {
      console.error("Failed to capture video frame:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative group overflow-hidden rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
      style={{ width: size, height: size }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          className="w-full h-full object-cover"
          alt="Video preview"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400">
          {loading ? (
            <Loader2 size={size * 0.4} className="animate-spin opacity-50" />
          ) : (
            <Film
              size={size * 0.5}
              className="text-primary-500 fill-primary-500/10"
            />
          )}
        </div>
      )}

      {/* Hidden video element used for extraction */}
      {!thumbnail && loading && isVisible && (
        <video
          ref={videoRef}
          src={`local-resource://media/?path=${encodeURIComponent(path)}`}
          onLoadedMetadata={handleMetadataLoaded}
          onSeeked={handleSeeked}
          onError={handleError}
          className="hidden"
          muted
          preload="metadata"
        />
      )}

      {/* Play indicator */}
      {!loading && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
          <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-sm">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-primary-500 border-b-[4px] border-b-transparent ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(VideoThumbnail);
