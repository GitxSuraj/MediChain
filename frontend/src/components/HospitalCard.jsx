const bedLabels = {
  general: "General",
  icu: "ICU",
  oxygen: "Oxygen",
  emergency: "Emergency",
};

export default function HospitalCard({ hospital }) {
  console.log(hospital);
  return (
    <article className="patient-card">
      <div className="patient-card-header">
        <div>
          <h3>{hospital.name}</h3>
          <p>{hospital.city}</p>
        </div>
      </div>

      <div className="tag-row">
        {(hospital.facilities || []).map((facility) => (
  <span className="tag" key={facility}>
    {facility}
  </span>
))}
      </div>

      <div className="patient-bed-grid" aria-label={`${hospital.name} bed availability`}>
        {Object.entries(bedLabels).map(([category, label]) => {
          const bed = hospital.beds[category] || { total: 0, available: 0 };

          return (
            <div className="patient-bed-row" key={category}>
              <span>{label}</span>
              <strong>
                {bed.available} / {bed.total}
              </strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}
