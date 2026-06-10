export default function Sticker({ src, x = 50, y = 50, rotate = 0, scale = 1 }) {
  return (
    <img
      className="sticker"
      src={src}
      alt=""
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
      }}
    />
  );
}
