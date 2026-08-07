import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

/**
 * Reusable dropdown/select component
 */
export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error = false,
  helperText = '',
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder = 'Select an option',
  ...otherProps
}) {
  return (
    <FormControl fullWidth={fullWidth} error={error} required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        onChange={onChange}
        label={label}
        {...otherProps}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
