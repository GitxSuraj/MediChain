import { useState, type KeyboardEvent } from 'react';
import './TagInput.css';

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  tone?: 'coral' | 'violet';
}

export default function TagInput({ label, tags, onChange, placeholder, tone = 'violet' }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const value = draft.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="tag-input">
      <span className="tag-input__label">{label}</span>
      <div className={`tag-input__field tag-input__field--${tone}`}>
        {tags.map((tag) => (
          <span key={tag} className="tag-input__chip">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>✕</button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>
      <span className="tag-input__hint">Press Enter or comma to add</span>
    </div>
  );
}