import React from 'react';

export interface CryptoOption {
  symbol: string;
  name: string;
  imageUrl?: string;
}

interface CryptoDropdownProps {
  options: CryptoOption[];
  value: string;
  onChange: (symbol: string) => void;
}

import { useTheme } from '@mui/material/styles';

const CryptoDropdown: React.FC<CryptoDropdownProps> = ({ options, value, onChange }) => {
  const theme = useTheme();
  return (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none rounded-lg pl-10 pr-10 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : theme.palette.divider}`
      }}
    >
      {options.map(crypto => (
        <option
          key={crypto.symbol}
          value={crypto.symbol}
          style={{
            background: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
            color: theme.palette.text.primary
          }}
        >
          {crypto.name} ({crypto.symbol})
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      {options.find(c => c.symbol === value)?.imageUrl && (
        <img
          src={options.find(c => c.symbol === value)?.imageUrl}
          alt={value}
          className="w-5 h-5 rounded-full"
        />
      )}
    </div>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
  );
};

export default CryptoDropdown;
