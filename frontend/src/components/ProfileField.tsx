import type { ChangeEvent } from 'react';
import './ProfileField.css';

interface BaseProps {
  label: string;
  name: string;
  mono?: boolean;
}

interface TextFieldProps extends BaseProps {
  type?: 'text' | 'email' | 'tel' | 'date';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  options?: never;
}

interface SelectFieldProps extends BaseProps {
  type: 'select';
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

type ProfileFieldProps = TextFieldProps | SelectFieldProps;

export default function ProfileField(props: ProfileFieldProps) {
  const { label, name, mono } = props;

  return (
    <label className="profile-field">
      <span className="profile-field__label">{label}</span>
      {props.type === 'select' ? (
        <select name={name} value={props.value} onChange={props.onChange} className={mono ? 'mono' : ''}>
          {props.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={props.type ?? 'text'}
          name={name}
          value={props.value}
          onChange={props.onChange}
          className={mono ? 'mono' : ''}
        />
      )}
    </label>
  );
}