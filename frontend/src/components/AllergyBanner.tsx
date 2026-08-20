import './AllergyBanner.css';

interface AllergyBannerProps {
  allergies: string[];
  medicalConditions: string[];
  bloodGroup: string;
}

export default function AllergyBanner({ allergies, medicalConditions, bloodGroup }: AllergyBannerProps) {
  return (
    <div className="allergy-banner">
      <div className="allergy-banner__group">
        <span className="allergy-banner__label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          Allergies
        </span>
        <div className="allergy-banner__chips">
          {allergies.length === 0 ? (
            <span className="allergy-banner__none">None recorded</span>
          ) : (
            allergies.map((a) => <span key={a} className="allergy-banner__chip allergy-banner__chip--coral">{a}</span>)
          )}
        </div>
      </div>

      <div className="allergy-banner__divider" />

      <div className="allergy-banner__group">
        <span className="allergy-banner__label">Ongoing Conditions</span>
        <div className="allergy-banner__chips">
          {medicalConditions.length === 0 ? (
            <span className="allergy-banner__none">None recorded</span>
          ) : (
            medicalConditions.map((c) => <span key={c} className="allergy-banner__chip allergy-banner__chip--violet">{c}</span>)
          )}
        </div>
      </div>

      <div className="allergy-banner__divider" />

      <div className="allergy-banner__blood">
        <span className="allergy-banner__blood-value mono">{bloodGroup}</span>
        <span className="allergy-banner__label">Blood Group</span>
      </div>
    </div>
  );
}