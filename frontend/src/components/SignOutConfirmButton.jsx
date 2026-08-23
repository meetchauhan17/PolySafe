import React, { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/toast';

export default function SignOutConfirmButton({
 className = '',
 buttonText = 'Sign Out',
 guestText = 'Exit Demo',
 size = 'normal',
}) {
 const { isGuest, logout } = useAuth();
 const [showConfirm, setShowConfirm] = useState(false);
 const containerRef = useRef(null);
 const timerRef = useRef(null);

 const displayLabel = isGuest ? guestText : buttonText;

 // Auto-collapse after 6 seconds
 useEffect(() => {
 if (showConfirm) {
 timerRef.current = setTimeout(() => {
 setShowConfirm(false);
 }, 6000);
 } else {
 clearTimeout(timerRef.current);
 }
 return () => clearTimeout(timerRef.current);
 }, [showConfirm]);

 // Click outside to collapse
 useEffect(() => {
 if (!showConfirm) return;
 const handleClickOutside = (e) => {
 if (containerRef.current && !containerRef.current.contains(e.target)) {
 setShowConfirm(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [showConfirm]);

 const handleConfirm = () => {
 setShowConfirm(false);
 logout();
 notify.info(isGuest ? 'Demo Ended' : 'Signed Out', 'You have been safely signed out of PolySafe.');
 };

 if (showConfirm) {
 return (
 <div
 ref={containerRef}
 className="inline-flex items-center gap-1.5 p-1 bg-[var(--chassis)] border border-[var(--led-critical)]/40 rounded-xl shadow-md animate-fadeIn z-20"
 >
 <span className="text-[11px] font-bold text-[var(--led-critical)] px-1.5 whitespace-nowrap">
 {isGuest ? 'Exit demo?' : 'Sign out?'}
 </span>
 <button
 type="button"
 onClick={handleConfirm}
 className="px-2.5 py-1 text-[11px] font-bold bg-[var(--led-critical)] text-white rounded-lg hover:bg-[#8F2E1B] active:scale-95 transition-all cursor-pointer shadow-xs whitespace-nowrap"
 >
 Yes
 </button>
 <button
 type="button"
 onClick={() => setShowConfirm(false)}
 className="px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:bg-[var(--chassis)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
 >
 Cancel
 </button>
 </div>
 );
 }

 return (
 <button
 type="button"
 onClick={() => setShowConfirm(true)}
 className={
 className ||
 `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--led-critical)] hover:bg-[var(--chassis)]/50 rounded-xl border border-[var(--brand-border-subtle)] transition-colors cursor-pointer`
 }
 title={isGuest ? 'Exit Guest Mode' : 'Sign Out of PolySafe'}
 >
 <LogOut className="w-3.5 h-3.5" />
 <span>{displayLabel}</span>
 </button>
 );
}
