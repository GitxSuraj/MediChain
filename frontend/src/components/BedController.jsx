const categoryLabels = {
  general: "General",
  icu: "ICU",
  oxygen: "Oxygen",
  emergency: "Emergency",
};

export default function BedController({
  category,
  beds,
  disabled,
  updating,
  onChangeCategory,
  onUpdateBeds,
}) {
  const selectedBed = beds?.[category];

  return (
    <section className="controller-panel" aria-labelledby="bed-controller-heading">
      <div>
        <p className="eyebrow">Bed Controller</p>
        <h3 id="bed-controller-heading">Adjust Availability</h3>
      </div>

      <label className="field">
        <span>Bed category</span>
        <select value={category} onChange={(event) => onChangeCategory(event.target.value)}>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="availability-readout">
        <span>Current availability</span>
        <strong>
          {selectedBed ? `${selectedBed.available} / ${selectedBed.total}` : "Not available"}
        </strong>
      </div>

      <div className="button-row">
        <button
          className="control-button decrease"
          type="button"
          disabled={disabled || updating}
          onClick={() => onUpdateBeds(-1)}
        >
          -
        </button>
        <button
          className="control-button increase"
          type="button"
          disabled={disabled || updating}
          onClick={() => onUpdateBeds(1)}
        >
          +
        </button>
      </div>
    </section>
  );
}
