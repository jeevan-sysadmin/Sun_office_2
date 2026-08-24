import React from 'react';

interface BatteryStatusBadgeProps {
  condition: string;
  getConditionColor: (condition: string) => string;
}

const BatteryStatusBadge: React.FC<BatteryStatusBadgeProps> = ({
  condition,
  getConditionColor
}) => {
  const getDisplayText = (cond: string) => {
    switch (cond) {
      case 'new': return 'New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      case 'defective': return 'Defective';
      case 'needs_replacement': return 'Needs Replacement';
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'resolved': return 'Resolved';
      case 'completed': return 'Completed';
      default: return cond;
    }
  };

  return (
    <span 
      className="status-badge" 
      style={{ 
        backgroundColor: getConditionColor(condition),
        color: 'white'
      }}
    >
      {getDisplayText(condition)}
    </span>
  );
};

export default BatteryStatusBadge;