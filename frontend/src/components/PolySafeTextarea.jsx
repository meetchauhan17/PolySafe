// src/components/PolySafeTextarea.jsx — shim to new Input.jsx Textarea
import React, { forwardRef } from 'react';
import { Textarea } from './Input';
export default forwardRef(function PolySafeTextarea(props, ref) {
  return <Textarea ref={ref} {...props} />;
});
