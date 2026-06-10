export default function ContactNote({ kind, label, value, href, rotate = 0 }) {
  return (
    <a
      className={`sticky sticky--${kind}`}
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="sticky__label">{label}</div>
      <div className="sticky__value">{value}</div>
    </a>
  );
}
