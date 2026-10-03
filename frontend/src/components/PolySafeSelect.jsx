// src/components/PolySafeSelect.jsx — shim to new Input.jsx Select
import React, { forwardRef } from 'react';
import { Select } from './Input';
export default forwardRef(function PolySafeSelect(props, ref) {
  return <Select ref={ref} {...props} />;
});
