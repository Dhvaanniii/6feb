import { useEffect, useMemo, useRef, useState } from 'react';

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, search]);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="searchable-select-field" ref={containerRef}>
      <label>
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <div className={`searchable-select-input ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
        <button
          type="button"
          className="searchable-select-trigger"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
            setSearch('');
          }}
        >
          <span className={`searchable-select-value ${!selectedOption ? 'placeholder' : ''}`}>
            {selectedOption?.label || placeholder}
          </span>
        </button>
        <button
          type="button"
          className="searchable-select-toggle"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
          }}
          aria-label="Toggle options"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {isOpen && !disabled && (
        <div className="searchable-select-dropdown">
          <input
            type="text"
            value={search}
            placeholder="Search..."
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredOptions.length === 0 ? (
            <div className="dropdown-empty">No matches</div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                type="button"
                key={opt.value || opt.label}
                className={`dropdown-option ${opt.value === value ? 'active' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


