const SizeSelector = ({ stockPerSize, selectedSize, onSelect }) => {
  if (!stockPerSize) return null;

  return (
    <div className="size-selector">
      {Object.entries(stockPerSize).map(([size, stock]) => {
        const disabled = stock <= 0;
        const isActive = selectedSize === size;

        return (
          <button
            key={size}
            disabled={disabled}
            className={`size-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(size)}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
};

export default SizeSelector;
