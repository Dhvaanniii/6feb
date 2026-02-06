import { useEffect, useMemo, useRef, useState } from 'react';

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  selectAllLabel?: string;
}

export function MultiSelectDropdown({
  label,
  placeholder = 'Select options',
  options,
  values,
  onChange,
  selectAllLabel = 'Select All',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const displayLabel = useMemo(() => {
    if (values.length === 0) return placeholder;
    if (values.length === options.length) return 'All selected';
    if (values.length === 1) {
      const selectedOption = options.find((opt) => opt.value === values[0]);
      return selectedOption?.label || placeholder;
    }
    return `${values.length} selected`;
  }, [values, options, placeholder]);

  const sortedOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return [...options].sort((a, b) => {
      const aText = a.label.toLowerCase();
      const bText = b.label.toLowerCase();
      const aStarts = aText.startsWith(q) ? 0 : 1;
      const bStarts = bText.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      const aIncludes = aText.includes(q) ? 0 : 1;
      const bIncludes = bText.includes(q) ? 0 : 1;
      if (aIncludes !== bIncludes) return aIncludes - bIncludes;
      return aText.localeCompare(bText);
    });
  }, [options, search]);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const toggleSelectAll = () => {
    if (values.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  return (
    <div className="multi-select-field" ref={containerRef}>
      <label>{label}</label>
      <button type="button" className="multi-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{displayLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="multi-select-dropdown">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="select-all-btn" onClick={toggleSelectAll}>
            {values.length === options.length ? 'Clear All' : selectAllLabel}
          </button>
          <div className="multi-select-options">
            {sortedOptions.map((option) => (
              <div key={option.value} className="multi-select-option checkbox-container">
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                <span className="checkbox-label">{option.label}</span>
              </div>
            ))}
            {sortedOptions.length === 0 && <div className="empty-state">No options</div>}
          </div>
        </div>
      )}
    </div>
  );
}


