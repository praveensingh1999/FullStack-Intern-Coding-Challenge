export default function StarRating({ value, onChange, disabled }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars">
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={() => !disabled && onChange && onChange(s)}
          title={`${s} star${s > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}
