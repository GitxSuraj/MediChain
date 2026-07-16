import { useState } from 'react';
import type { MedicalHistoryEntry } from '../services/patient';
import './MedicalTimelineItem.css';

const TYPE_ICON: Record<MedicalHistoryEntry['type'], JSX.Element> = {
  Consultation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 10h8M8 14h5" /><rect x="3" y="4" width="18" height="16" rx="2" />
    </svg>
  ),
  'Lab Report': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 2v6L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 8V2" /><path d="M9 2h6" />
    </svg>
  ),
  Prescription: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4v16M5 9l7-5 7 5" /><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
    </svg>
  ),
  Procedure: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-7-4.35-9.5-8.5C.8 9 2 5.5 5.5 4.7 8 4.1 10 5 12 7c2-2 4-2.9 6.5-2.3C22 5.5 23.2 9 21.5 12.5 19 16.65 12 21 12 21z" />
    </svg>
  ),
};

const TYPE_COLOR: Record<MedicalHistoryEntry['type'], string> = {
  Consultation: 'teal',
  'Lab Report': 'violet',
  Prescription: 'amber',
  Procedure: 'coral',
};

interface MedicalTimelineItemProps {
  entry: MedicalHistoryEntry;
  isLast: boolean;
}

export default function MedicalTimelineItem({ entry, isLast }: MedicalTimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(entry.labValues?.length || entry.prescriptionItems?.length);
  const color = TYPE_COLOR[entry.type];

  const dateLabel = new Date(entry.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="medical-timeline-item">
      <div className="medical-timeline-item__rail">
        <span className={`medical-timeline-item__dot medical-timeline-item__dot--${color}`}>
          {TYPE_ICON[entry.type]}
        </span>
        {!isLast && <span className="medical-timeline-item__line" />}
      </div>

      <div className="medical-timeline-item__card card-surface">
        <div className="medical-timeline-item__header">
          <div>
            <span className={`medical-timeline-item__type-tag medical-timeline-item__type-tag--${color}`}>
              {entry.type}
            </span>
            <h4>{entry.title}</h4>
          </div>
          <span className="medical-timeline-item__date mono">{dateLabel}</span>
        </div>

        <p className="medical-timeline-item__meta text-secondary">{entry.doctor} · {entry.hospital}</p>
        <p className="medical-timeline-item__summary">{entry.summary}</p>

        {hasDetails && (
          <>
            <button className="medical-timeline-item__toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide details' : entry.labValues ? 'View lab values' : 'View prescription'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {expanded && entry.labValues && (
              <div className="medical-timeline-item__lab-table fade-in-up">
                <div className="lab-row lab-row--head">
                  <span>Parameter</span><span>Value</span><span>Reference</span>
                </div>
                {entry.labValues.map((lv) => (
                  <div key={lv.parameter} className={`lab-row lab-row--${lv.flag}`}>
                    <span>{lv.parameter}</span>
                    <span className="mono">{lv.value}</span>
                    <span className="mono text-tertiary">{lv.referenceRange}</span>
                  </div>
                ))}
              </div>
            )}

            {expanded && entry.prescriptionItems && (
              <div className="medical-timeline-item__rx-list fade-in-up">
                {entry.prescriptionItems.map((item) => (
                  <div key={item.medicine} className="rx-row">
                    <span className="rx-row__medicine">{item.medicine}</span>
                    <span className="rx-row__dosage text-secondary">{item.dosage}</span>
                    <span className="rx-row__duration mono">{item.duration}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}