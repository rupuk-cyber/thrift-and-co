"use client";

import { ReactNode, useId } from "react";

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

function FieldLabel({ label, required, htmlFor }: { label: string; required?: boolean; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor}>
      {label}{" "}
      {required && (
        <>
          <span className="required" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids: string[] = [];
  if (error) ids.push(`${id}-error`);
  if (hint) ids.push(`${id}-hint`);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  name?: string;
}

export function TextField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  min,
  max,
  step,
  maxLength,
  name,
}: TextFieldProps) {
  const id = useId();
  return (
    <div className="form-group">
      <FieldLabel label={label} required={required} htmlFor={id} />
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  name?: string;
  renderOption?: (value: string) => ReactNode;
}

export function SelectField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  options,
  name,
  renderOption,
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className="form-group">
      <FieldLabel label={label} required={required} htmlFor={id} />
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  name?: string;
}

export function TextareaField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  name,
}: TextareaFieldProps) {
  const id = useId();
  return (
    <div className="form-group">
      <FieldLabel label={label} required={required} htmlFor={id} />
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
