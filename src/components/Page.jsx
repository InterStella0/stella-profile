import { forwardRef } from 'react';
import DecorationLayer from './DecorationLayer.jsx';

// One physical page of the book. `variant` switches the paper style:
//   'cover'  — solid coloured cover (no ruled lines)
//   'ruled'  — normal notebook page (default)
const Page = forwardRef(function Page(
  { pageId, variant = 'ruled', pageNumber, children },
  ref
) {
  return (
    <div className={`book-page book-page--${variant}`} ref={ref}>
      <div className="book-page__inner">
        {pageId && <DecorationLayer pageId={pageId} />}
        <div className="book-page__content">{children}</div>
        {pageNumber != null && (
          <span className="book-page__number">{pageNumber}</span>
        )}
      </div>
    </div>
  );
});

export default Page;
