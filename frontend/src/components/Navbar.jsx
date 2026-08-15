import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Pill, 
  PlusCircle, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Stethoscope, 
  UserCheck, 
  FileText,
  LogIn
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/home', label: 'Home', icon: Pill },
    { path: '/add-medicine', label: 'Add Med', icon: PlusCircle },
    { path: '/timeline', label: 'Timeline', icon: Clock },
    { path: '/log-symptom', label: 'Symptoms', icon: Activity },
    { path: '/connected-people', label: 'Connected', icon: UserCheck },
    { path: '/doctor-dashboard', label: 'Doctor', icon: Stethoscope },
    { path: '/caregiver-view', label: 'Caregiver', icon: ShieldAlert },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FBF8F2]/90 backdrop-blur-md border-b-2 border-[#E7E1D3] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/home" className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#2B6E5E] text-white rounded-xl shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#2B6E5E] font-serif-heading">
              PolySafe
            </span>
            <span className="text-[10px] block text-[#6B726C] font-semibold tracking-wide">
              AI Polypharmacy Risk Platform
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path.startsWith('/risk') && location.pathname.startsWith('/risk'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-[#2B6E5E] text-white shadow-sm' 
                    : 'text-[#6B726C] hover:text-[#232724] hover:bg-[#EFEBE0]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/onboarding"
            className="px-3 py-1.5 text-xs font-bold text-[#2B6E5E] bg-[#ffffff] hover:bg-[#F4FAF8] rounded-xl border-2 border-[#E7E1D3] transition-colors flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Onboarding</span>
          </Link>
          <Link
            to="/login"
            className="btn-primary text-xs py-1.5 px-3.5 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
