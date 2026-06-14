"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

interface ReviewHistoryProps {
  reviews: Review[];
}

export function ReviewHistory({ reviews }: ReviewHistoryProps) {
  const [selected, setSelected] = useState<Review | null>(null);

  if (reviews.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-100">
        {reviews.map((review) => (
          <button
            key={review.id}
            type="button"
            onClick={() => setSelected(selected?.id === review.id ? null : review)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left"
          >
            <span className="text-sm text-slate-600">
              {new Date(review.created_at).toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              {review.complexity_score !== null && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    review.complexity_score <= 4
                      ? "bg-emerald-100 text-emerald-700"
                      : review.complexity_score <= 7
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {review.complexity_score}/10
                </span>
              )}
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  selected?.id === review.id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border-t border-slate-200 px-5 py-4 bg-slate-50">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {selected.review_text}
          </pre>
        </div>
      )}
    </div>
  );
}
