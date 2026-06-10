import { useRef, useState, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import CoverPage from './pages/CoverPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import WorkContactPage from './pages/WorkContactPage.jsx';
import BackCoverPage from './pages/BackCoverPage.jsx';

export default function Book() {
  const bookRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(5);

  const flip = (dir) => {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    dir === 'next' ? api.flipNext() : api.flipPrev();
  };

  const onFlip = useCallback((e) => setPage(e.data), []);
  const onInit = useCallback((e) => {
    setPageCount(e.object.getPageCount());
  }, []);

  return (
    <div className="book-stage">
      <HTMLFlipBook
        ref={bookRef}
        width={620}
        height={800}
        minWidth={360}
        maxWidth={760}
        minHeight={480}
        maxHeight={980}
        size="stretch"
        showCover={true}
        usePortrait={false}
        drawShadow={true}
        maxShadowOpacity={0.4}
        flippingTime={780}
        mobileScrollSupport={true}
        useMouseEvents={true}
        className="flip-book"
        onFlip={onFlip}
        onInit={onInit}
      >
        <CoverPage />
        <AboutPage pageNumber={1} />
        <ProjectsPage pageNumber={2} />
        <WorkContactPage pageNumber={3} />
        <BackCoverPage />
      </HTMLFlipBook>

      <div className="book-nav">
        <button
          className="book-nav__btn"
          onClick={() => flip('prev')}
          disabled={page === 0}
        >
          ← back
        </button>
        <span className="book-nav__count">
          page {page + 1} / {pageCount}
        </span>
        <button
          className="book-nav__btn"
          onClick={() => flip('next')}
          disabled={page >= pageCount - 1}
        >
          next →
        </button>
      </div>
    </div>
  );
}
