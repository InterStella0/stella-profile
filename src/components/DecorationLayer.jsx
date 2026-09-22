import Sticker from './Sticker.jsx';
import { useContent } from '../data/ContentContext.jsx';

export default function DecorationLayer({ pageId }) {
  const { decorations } = useContent();
  const stickers = decorations[pageId] || [];
  return (
    <div className="deco-layer" aria-hidden="true">
      {stickers.map((s, i) => (
        <Sticker key={i} {...s} />
      ))}
    </div>
  );
}
