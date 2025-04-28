import React from 'react';

interface Indicator {
  id: string;
  name: string;
  color: string;
  dashed?: boolean;
  disabled?: boolean;
}

interface IndicatorDropdownProps {
  indicators: Indicator[];
  selected: string[];
  onChange: (selected: string[]) => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
}

const IndicatorDropdown: React.FC<IndicatorDropdownProps> = ({
  indicators,
  selected,
  onChange,
  menuOpen,
  onMenuToggle,
}) => {
  return (
    <div className="relative">
      <button
        className="indicator-menu-button theme-button-secondary px-4 py-2 rounded-lg flex items-center gap-2"
        onClick={onMenuToggle}
        type="button"
      >
        Indicators ({selected.length})
        <span>{menuOpen ? '▲' : '▼'}</span>
      </button>
      {menuOpen && (
        <div className="indicator-dropdown absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-[9999] border border-gray-200 dark:border-gray-700">
          <div className="indicator-dropdown p-2 grid grid-cols-3 gap-x-4 divide-x divide-gray-200 dark:divide-gray-700 w-96">
            {indicators.map((indicator, idx) => {
              const isChecked = selected.includes(indicator.id);
              const isDisabled = indicator.disabled;
              return (
                <div
                  key={indicator.id}
                  className={`flex items-center gap-2 p-2 select-none text-xs ${isChecked ? 'bg-purple-50 dark:bg-purple-900/30' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}
                  style={{ borderRight: (idx % 3 !== 2) ? '1px solid var(--tw-divide-gray-200, #e5e7eb)' : undefined }}
                  onClick={isDisabled ? undefined : () => {
                    if (isChecked) {
                      onChange(selected.filter(id => id !== indicator.id));
                    } else {
                      onChange([...selected, indicator.id]);
                    }
                  }}
                  tabIndex={isDisabled ? -1 : 0}
                  onKeyDown={isDisabled ? undefined : e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      if (isChecked) {
                        onChange(selected.filter(id => id !== indicator.id));
                      } else {
                        onChange([...selected, indicator.id]);
                      }
                    }
                  }}
                  role="checkbox"
                  aria-checked={isChecked}
                  title={isDisabled ? 'This indicator is temporarily disabled.' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={isDisabled ? undefined : e => {
                        e.stopPropagation();
                        if (isChecked) {
                          onChange(selected.filter(id => id !== indicator.id));
                        } else {
                          onChange([...selected, indicator.id]);
                        }
                      }}
                      className="form-checkbox text-purple-600 dark:text-purple-400"
                      tabIndex={-1}
                      style={{ marginRight: 8 }}
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color }}></div>
                    <span className="text-gray-900 dark:text-white flex items-center gap-1 text-xs">
                      {indicator.id === 'andy' && (
                        <span
                          className="ml-1 cursor-pointer"
                          title="Andy-cator 5% strategy: BUY if above +5%, SELL if below -5%. Temporarily disabled."
                          style={{ fontSize: 16 }}
                          role="img"
                          aria-label="Andy-cator info"
                        >🌈</span>
                      )}
                      {indicator.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorDropdown;
