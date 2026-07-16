const categoryLabels = {
  general: "General",
  icu: "ICU",
  oxygen: "Oxygen",
  emergency: "Emergency",
};

export default function BedCategorySummary({ beds = {}, selectedCategory, onSelectCategory }) {
  return (
    <div className="bed-grid" aria-label="Bed availability summary">
      {Object.entries(categoryLabels).map(([category, label]) => {
        const bed = beds[category] || { total: 0, available: 0 };

        return (
          <button
            key={category}
            className={selectedCategory === category ? "bed-tile selected" : "bed-tile"}
            type="button"
            onClick={() => onSelectCategory(category)}
          >
            <span>{label}</span>
            <strong>
              {bed.available} / {bed.total}
            </strong>
          </button>
        );
      })}
    </div>
  );
}
