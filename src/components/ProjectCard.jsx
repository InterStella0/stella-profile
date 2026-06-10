import { useState, useCallback } from 'react';

function ProjectCardImage({ src, alt, height }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={height ? { height } : undefined}
    />
  );
}

function Carousel({ images, title, height }) {
  const [idx, setIdx] = useState(0);

  const prev = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  }, [images.length]);

  return (
    <div className="project-carousel" style={height ? { height } : undefined}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${title} ${i + 1}`}
          loading="lazy"
          className={`project-carousel__img${i === idx ? ' project-carousel__img--active' : ''}`}
        />
      ))}
      {images.length > 1 && (
        <>
          <button className="project-carousel__btn project-carousel__btn--prev" onClick={prev} aria-label="Previous image">‹</button>
          <button className="project-carousel__btn project-carousel__btn--next" onClick={next} aria-label="Next image">›</button>
          <div className="project-carousel__dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`project-carousel__dot${i === idx ? ' project-carousel__dot--active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectCard({
  title,
  image,
  images,
  blurb,
  link,
  rotate = 0,
  mini = false,
}) {
  const imgHeight = mini ? '64px' : '90px';
  const allImages = images ?? (image ? [image] : []);

  return (
    <a
      className={`project-card${mini ? ' project-card--mini' : ''}`}
      href={link || '#'}
      target={link && link !== '#' ? '_blank' : undefined}
      rel="noreferrer"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {allImages.length > 1 ? (
        <Carousel images={allImages} title={title} height={imgHeight} />
      ) : allImages.length === 1 ? (
        <ProjectCardImage src={allImages[0]} alt={title} />
      ) : null}
      <div className="project-card__title">{title}</div>
      {!mini && blurb && <div className="project-card__blurb">{blurb}</div>}
    </a>
  );
}
