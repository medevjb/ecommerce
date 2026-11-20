import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  showText?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  showText = true,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5 text-[#FFC633]">
        {Array.from({ length: maxStars }).map((_, index) => {
          const fillLevel = Math.max(0, Math.min(1, rating - index));

          if (fillLevel >= 0.8) {
            // Full star
            return (
              <Star
                key={index}
                className="h-4 w-4 fill-[#FFC633] text-[#FFC633]"
              />
            );
          } else if (fillLevel >= 0.3) {
            // Half star representation
            return (
              <div key={index} className="relative h-4 w-4">
                <Star className="absolute inset-0 h-4 w-4 text-[#FFC633]" />
                <div className="absolute inset-0 overflow-hidden w-[50%]">
                  <Star className="h-4 w-4 fill-[#FFC633] text-[#FFC633]" />
                </div>
              </div>
            );
          } else {
            // Empty star
            return (
              <Star
                key={index}
                className="h-4 w-4 text-zinc-300"
              />
            );
          }
        })}
      </div>

      {showText && (
        <span className="text-xs font-medium text-black">
          {rating.toFixed(1)}/
          <span className="text-zinc-400">5</span>
        </span>
      )}
    </div>
  );
}
