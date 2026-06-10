import Sticker from './Sticker.jsx';
import { decorations } from '../data/decorations.js';

export default function DecorationLayer({ pageId }) {
  const stickers = decorations[pageId] || [];
  return (
    <div className="deco-layer" aria-hidden="true">
      {stickers.map((s, i) => (
        <Sticker key={i} {...s} />
      ))}
    </div>
  );
}
