import React from 'react';
import { BadgeCheck, Clock, ShieldAlert, ShieldQuestion, XCircle } from 'lucide-react';
import Badge from './Badge';

const CONFIG = {
  VERIFIED: { variant: 'success', label: 'Verified company', icon: BadgeCheck },
  PENDING: { variant: 'warning', label: 'Verification pending', icon: Clock },
  UNDER_REVIEW: { variant: 'warning', label: 'Under review', icon: ShieldQuestion },
  REJECTED: { variant: 'danger', label: 'Verification rejected', icon: XCircle },
  EXPIRED: { variant: 'danger', label: 'Verification expired', icon: ShieldAlert },
  UNVERIFIED: { variant: 'default', label: 'Not verified', icon: ShieldQuestion },
};

const VerificationBadge = ({ status, className = '', showIcon = true }) => {
  const config = CONFIG[String(status || 'UNVERIFIED').toUpperCase()] || CONFIG.UNVERIFIED;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={`gap-1.5 normal-case tracking-normal ${className}`}>
      {showIcon && <Icon size={12} aria-hidden="true" />}
      {config.label}
    </Badge>
  );
};

export default VerificationBadge;
