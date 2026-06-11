import React, { useState, useEffect, useCallback } from 'react';
import { LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export default function Lightbox({ images, title, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [isLoading, setIsLoading] = useState(true);
  const count = images.length;

  const prev = useCallback(() => setIdx(i => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx(i => (i + 1) % count), [count]);

  useEffect(() => { setIsLoading(true); }, [idx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Close gallery">
        <LuX size={26} strokeWidth={1.5} />
      </button>

      <div className="lightbox__stage" onClick={e => e.stopPropagation()}>
        {isLoading && <div className="lightbox__spinner" />}
        <img
          key={idx}
          className="lightbox__img"
          src={images[idx]}
          alt={`${title} ${idx + 1}`}
          onLoad={() => setIsLoading(false)}
          style={isLoading ? { opacity: 0 } : undefined}
        />

        {count > 1 && (
          <>
            <button
              className="lightbox__btn lightbox__btn--prev"
              onClick={prev}
              aria-label="Previous image"
            >
              <LuChevronLeft size={30} strokeWidth={1.5} />
            </button>
            <button
              className="lightbox__btn lightbox__btn--next"
              onClick={next}
              aria-label="Next image"
            >
              <LuChevronRight size={30} strokeWidth={1.5} />
            </button>
            <div className="lightbox__counter">{idx + 1} / {count}</div>
          </>
        )}
      </div>
    </div>
  );
}
