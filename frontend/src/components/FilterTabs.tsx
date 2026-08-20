import './FilterTabs.css';

interface FilterTabsProps<T extends string> {
  options: { label: string; value: T; count?: number }[];
  active: T;
  onChange: (value: T) => void;
}

export default function FilterTabs<T extends string>({ options, active, onChange }: FilterTabsProps<T>) {
  return (
    <div className="filter-tabs">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`filter-tabs__item ${active === opt.value ? 'filter-tabs__item--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {typeof opt.count === 'number' && <span className="filter-tabs__count">{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}