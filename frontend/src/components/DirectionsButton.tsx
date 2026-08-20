interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

export default function DirectionsButton({ latitude, longitude, label = 'Get Directions', className = '' }: DirectionsButtonProps) {
  const href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`btn btn-primary directions-btn ${className}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
      {label}
    </a>
  );
}
