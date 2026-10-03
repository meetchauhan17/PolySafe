// src/components/PolySafeInput.jsx — delegates to new Input.jsx
import React, { forwardRef } from 'react';
import Input, { Textarea, Select } from './Input';
export default forwardRef(function PolySafeInput(props, ref) {
  return <Input ref={ref} {...props} />;
});
export { Textarea as PolySafeTextarea, Select as PolySafeSelect };
