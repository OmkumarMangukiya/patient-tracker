import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  dropdownClassName = '',
  size = 'md',
  disabled = false,
  align = 'left',
  icon: LeadingIcon,
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format options: accept array of objects { value, label } or strings
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label !== undefined ? opt.label : String(opt.value),
        sublabel: opt.sublabel,
        icon: opt.icon
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs min-h-[30px] rounded-lg',
    md: 'px-3.5 py-2 text-xs md:text-sm min-h-[38px] rounded-xl',
    lg: 'px-4 py-2.5 text-sm min-h-[44px] rounded-xl'
  };

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full text-left" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface-lowest border border-outline-variant/60 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-primary-container flex items-center justify-between cursor-pointer shadow-xs ${sizeClasses[size] || sizeClasses.md
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-container-low/50' : ''} ${className}`}
      >
        <div className="flex items-center space-x-2 truncate">
          {LeadingIcon && <LeadingIcon className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />}
          {selectedOption ? (
            <span className="truncate">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-[11px] text-on-surface-variant/70 ml-1.5 font-normal">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-on-surface-variant/70 font-normal truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-on-surface-variant shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 bg-surface-lowest border border-outline-variant/60 rounded-xl shadow-[0_12px_32px_rgba(19,27,46,0.12)] z-50 p-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${align === 'right' ? 'right-0' : 'left-0'
            } min-w-35 w-full ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="p-2.5 text-center text-xs text-on-surface-variant font-medium">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-all ${isSelected
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'text-primary-container hover:bg-surface-container-low font-medium'
                    }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-on-surface-variant/70'}`}>
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2 text-white" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
