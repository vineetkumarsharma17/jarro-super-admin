import React from 'react';
import { TextField } from '@mui/material';

/**
 * Reusable form input component with consistent styling
 */
export default function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 1,
  disabled = false,
  fullWidth = true,
  ...otherProps
}) {
  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      required={required}
      type={type}
      placeholder={placeholder}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      variant="outlined"
      size="medium"
      {...otherProps}
    />
  );
}
