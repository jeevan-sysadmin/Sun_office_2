// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\components\CardTab.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCalendar,
  FiEye,
  FiRefreshCw,
  FiBattery,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiSave,
  FiX,
  FiList,
  FiPlus,
  FiDownload,
  FiPrinter,
  FiMenu,
  FiCheckSquare,
  FiSquare,
  FiDroplet,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiEdit,
  FiTrash2
} from "react-icons/fi";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, ServiceOrder } from "./types";
import { WATER_SERVICES_URL } from "../config/api";

// Create motion components properly
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionTr = motion.tr;

const getBatteryNames = (service: ServiceOrder): string => {
  const batteries = Array.isArray((service as any).batteries) ? (service as any).batteries : [];
  if (batteries.length > 0) {
    return batteries.map((b: any) => b?.battery_model || `Battery #${b?.id}`).join(', ');
  }
  return service.battery_model || '-';
};

interface WaterServicePayment {
  id: number;
  service_id: number;
  customer_id: number;
  battery_id?: number | null;
  battery_name?: string | null;
  service_staff_id?: number | null;
  service_staff_name?: string | null;
  amount: number;
  service_date: string;
  notes: string;
  created_by: number;
  created_at: string;
  customer_name?: string;
}

interface ServiceStaff {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

interface StaffMonthlySummaryItem {
  service_staff_id: number | null;
  service_staff_name: string;
  service_count: number | string;
  total_amount: number | string;
}

interface ResolvedPaymentStaff {
  staffId: number | null;
  staffName: string;
}

interface CardTabProps {
  services: ServiceOrder[];
  customers: Customer[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onViewService: (service: ServiceOrder) => void;
  drilldownFilter?: {
    staffName: string;
    serviceDate: string;
    requestKey: number;
  } | null;
  filterStatus?: string;
  filterPriority?: string;
  filterClaimType?: string;
  filterWarrantyStatus?: string;
  filterAmcStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  onFilterPriorityChange?: (priority: string) => void;
  onFilterClaimTypeChange?: (claim: string) => void;
  onFilterWarrantyStatusChange?: (status: string) => void;
  onFilterAmcStatusChange?: (status: string) => void;
  onPaymentSuccess?: () => void;
}

// Success Toast Notification Component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getTypeStyles = () => {
    switch(type) {
      case 'success':
        return {
          bg: '#10b981',
          icon: <FiCheckCircle size={20} />,
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        };
      case 'error':
        return {
          bg: '#ef4444',
          icon: <FiXCircle size={20} />,
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        };
      case 'info':
        return {
          bg: '#3b82f6',
          icon: <FiAlertCircle size={20} />,
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            maxWidth: '400px',
            width: 'calc(100% - 48px)',
            backgroundColor: '#fff',
            borderRadius: '14px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '100%'
          }}>
            {/* Left Accent Bar */}
            <div style={{
              width: '6px',
              background: styles.gradient
            }} />
            
            {/* Content */}
            <div style={{
              flex: 1,
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {/* Icon */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: styles.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                {styles.icon}
              </div>
              
              {/* Message */}
              <div style={{
                flex: 1,
                paddingTop: '2px'
              }}>
                <h4 style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {type === 'success' ? 'Success!' : 
                   type === 'error' ? 'Error' : 'Information'}
                </h4>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message}
                </p>
              </div>
              
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <FiX size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add/Edit Payment Modal Component
interface PaymentModalProps {
  payment?: WaterServicePayment | null;
  service: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: any) => Promise<void>;
  onPaymentSuccess?: () => void;
  mode: 'add' | 'edit';
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  payment,
  service,
  isOpen,
  onClose,
  onSave,
  onPaymentSuccess,
  mode
}) => {
  const [amount, setAmount] = React.useState<string>("");
  const [batteryId, setBatteryId] = React.useState<string>("");
  const [serviceDate, setServiceDate] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [serviceStaffId, setServiceStaffId] = React.useState<string>("");
  const [serviceStaffList, setServiceStaffList] = React.useState<ServiceStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    if (!isOpen) return;
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const response = await fetch(`${WATER_SERVICES_URL}?action=staff_list`);
        const result = await response.json();
        if (response.ok && result.success) {
          setServiceStaffList(result.records || []);
        } else {
          setServiceStaffList([]);
        }
      } catch (_err) {
        setServiceStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [isOpen]);

  React.useEffect(() => {
    const batteries = Array.isArray((service as any)?.batteries) ? (service as any).batteries : [];
    const defaultBatteryId =
      batteries.length > 0
        ? String(batteries[0]?.id || '')
        : (service?.battery_id ? String(service.battery_id) : '');

    if (mode === 'edit' && payment) {
      setAmount(payment.amount.toString());
      setServiceDate(payment.service_date);
      setNotes(payment.notes || "");
      setBatteryId(payment.battery_id ? String(payment.battery_id) : defaultBatteryId);
      setServiceStaffId(payment.service_staff_id ? String(payment.service_staff_id) : "");
    } else if (service) {
      setAmount("");
      setServiceDate(new Date().toISOString().split('T')[0]);
      setNotes(`Water service payment for service #${service.service_code} - ${service.customer_name}`);
      setBatteryId(defaultBatteryId);
      setServiceStaffId((service as any).service_staff_id ? String((service as any).service_staff_id) : "");
    }
    setError("");
  }, [payment, service, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const hasValidAmount = amount !== "" && !Number.isNaN(parsedAmount) && parsedAmount >= 0;

    if (service && hasValidAmount && serviceDate) {
      setIsSubmitting(true);
      setError("");
      try {
        const paymentData: {
          service_id: number;
          customer_id: number;
          battery_id?: number | null;
          amount: number;
          service_date: string;
          notes: string;
          created_by: number;
          service_staff_id?: number | null;
          id?: number;
        } = {
          service_id: service.id,
          customer_id: service.customer_id,
          battery_id: batteryId ? parseInt(batteryId, 10) : null,
          amount: parsedAmount,
          service_date: serviceDate,
          notes: notes || `Water service payment for service #${service.service_code}`,
          created_by: 1,
          service_staff_id: serviceStaffId ? parseInt(serviceStaffId, 10) : null
        };
        
        if (mode === 'edit' && payment) {
          paymentData.id = payment.id;
        }
        
        await onSave(paymentData);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        onClose();
      } catch (err: any) {
        setError(err.message || `Failed to ${mode} payment. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (Number.isNaN(numAmount)) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  if (!isOpen || !service) return null;

  const parsedAmount = parseFloat(amount);
  const hasValidAmount = amount !== "" && !Number.isNaN(parsedAmount) && parsedAmount >= 0;
  const isSubmitDisabled = !hasValidAmount || !serviceDate || !batteryId || !serviceStaffId || isSubmitting;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #fff, #fafafa)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: mode === 'edit' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px'
              }}>
                {mode === 'edit' ? <FiEdit /> : <FiDollarSign />}
              </div>
              <div>
                <h2 style={{
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827'
                }}>{mode === 'edit' ? 'Edit Payment' : 'Add Payment'}</h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Service Code: {service.service_code}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
            >
              <FiX />
            </motion.button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px' }}>
              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#b91c1c',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiAlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Customer Info */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {service.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 style={{
                      margin: '0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>{service.customer_name}</h3>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '13px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FiPhone size={12} /> {service.customer_phone}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#4b5563'
                }}>
                  <span><strong>Batteries:</strong> {
                    Array.isArray((service as any).batteries) && (service as any).batteries.length > 0
                      ? (service as any).batteries.map((b: any) => b?.battery_model || `#${b?.id}`).join(', ')
                      : (service.battery_model || '-')
                  }</span>
                  <span><strong>Warranty:</strong> {service.warranty_status}</span>
                </div>
              </div>

              {/* Battery Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Battery *
                </label>
                <select
                  value={batteryId}
                  onChange={(e) => setBatteryId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {Array.isArray((service as any).batteries) && (service as any).batteries.length > 0 ? (
                    (service as any).batteries.map((b: any) => (
                      <option key={b?.id} value={String(b?.id || '')}>
                        {(b?.battery_model || 'Battery')} {b?.battery_serial ? `(${b.battery_serial})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={service.battery_id ? String(service.battery_id) : ''}>
                      {service.battery_model || 'Battery'}
                    </option>
                  )}
                </select>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Service Staff *
                </label>
                <select
                  value={serviceStaffId}
                  onChange={(e) => setServiceStaffId(e.target.value)}
                  required
                  disabled={loadingStaff}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">{loadingStaff ? 'Loading staff...' : 'Select staff'}</option>
                  {serviceStaffList.map((staff) => (
                    <option key={staff.id} value={String(staff.id)}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Payment Amount (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 32px',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      color: '#111827',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      borderColor: hasValidAmount ? '#10b981' : '#d1d5db',
                      boxShadow: hasValidAmount ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none'
                    }}
                  />
                </div>
                {hasValidAmount && (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Amount in words: {formatCurrency(amount)}
                  </p>
                )}
              </div>

              {/* Service Date Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Service Date *
                </label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    borderColor: serviceDate ? '#10b981' : '#d1d5db',
                    boxShadow: serviceDate ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none'
                  }}
                />
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  This date will be used for income/expense calculations
                </p>
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes or comments..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f9fafb'
            }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiX size={16} />
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitDisabled}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSubmitDisabled ? '#9ca3af' : (mode === 'edit' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isSubmitDisabled ? 0.6 : 1
                }}
              >
                <FiSave size={16} />
                {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update Payment' : 'Save Payment')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment?: WaterServicePayment | null;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444',
              fontSize: '32px'
            }}>
              <FiAlertCircle />
            </div>
            
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827'
            }}>Confirm Delete</h3>
            
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Are you sure you want to delete this payment?
            </p>

            {payment && (
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px' }}>
                  <strong>Amount:</strong> {formatCurrency(payment.amount)}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px' }}>
                  <strong>Date:</strong> {formatDate(payment.service_date)}
                </div>
                {payment.notes && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    <strong>Notes:</strong> {payment.notes}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    Delete Payment
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Payment History Modal Component (Updated with Edit/Delete)
interface PaymentHistoryModalProps {
  service: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: () => void;
  onEditPayment: (payment: WaterServicePayment) => void;
  onDeletePayment: (paymentId: number) => Promise<void>;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  service,
  isOpen,
  onClose,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}) => {
  const [payments, setPayments] = React.useState<WaterServicePayment[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [exportLoading, setExportLoading] = React.useState<boolean>(false);
  const [deletePaymentId, setDeletePaymentId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen && service) {
      fetchPaymentHistory();
    }
  }, [isOpen, service]);

  const fetchPaymentHistory = async () => {
    if (!service) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${WATER_SERVICES_URL}?service_id=${service.id}`);
      const result = await response.json();
      
      if (response.ok) {
        // Filter payments for this specific service
        const servicePayments = result.records?.filter(
          (p: WaterServicePayment) => p.service_id === service.id
        ) || [];
        
        // Sort by service_date descending (newest first)
        servicePayments.sort((a: WaterServicePayment, b: WaterServicePayment) => 
          new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
        );
        
        setPayments(servicePayments);
      } else {
        setError(result.message || "Failed to fetch payment history");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch payment history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (paymentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletePaymentId(paymentId);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePaymentId) return;
    
    setIsDeleting(true);
    try {
      await onDeletePayment(deletePaymentId);
      // Refresh payment list
      await fetchPaymentHistory();
      setDeletePaymentId(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (payment: WaterServicePayment, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditPayment(payment);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Export to CSV
  const exportToCSV = () => {
    if (!service || payments.length === 0) return;
    
    setExportLoading(true);
    try {
      // Create CSV content
      let csvContent = "";
      
      // Add headers
      const headers = [
        'Payment ID',
        'Service ID',
        'Battery ID',
        'Battery Name',
        'Service Code',
        'Customer Name',
        'Customer Phone',
        'Amount',
        'Service Date',
        'Notes',
        'Created At'
      ];
      
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      payments.forEach(payment => {
        const row = [
          payment.id,
          payment.service_id,
          payment.battery_id || '',
          `"${(payment.battery_name || '').replace(/"/g, '""')}"`,
          `"${service.service_code}"`,
          `"${service.customer_name || ''}"`,
          `"${service.customer_phone || ''}"`,
          payment.amount,
          `"${formatDate(payment.service_date)}"`,
          `"${(payment.notes || '').replace(/"/g, '""')}"`,
          `"${formatDateTime(payment.created_at)}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      // Add summary row
      csvContent += '\n';
      csvContent += `"Total Payments","","","","","",${totalAmount},"","",""\n`;

      // Create download link
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `payment_history_${service.service_code}_${formatDateForFilename()}.csv`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!service || payments.length === 0) return;
    
    setExportLoading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment History Report', 14, 13);

      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Water Service Payment History', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
      // Add service information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 35;
      
      doc.text(`Service Code: ${service.service_code}`, 14, yPos);
      yPos += 6;
      doc.text(`Customer Name: ${service.customer_name || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Customer Phone: ${service.customer_phone || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Batteries: ${Array.isArray((service as any).batteries) && (service as any).batteries.length > 0 ? (service as any).batteries.map((b: any) => b?.battery_model || `#${b?.id}`).join(', ') : (service.battery_model || 'N/A')}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Payments: ${formatCurrency(totalAmount)}`, 14, yPos);
      yPos += 6;
      doc.text(`Number of Payments: ${payments.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);

      // Prepare table data
      const tableColumn = ['Date', 'Battery', 'Amount', 'Notes', 'Created At'];
      const tableRows = payments.map(payment => [
        formatDate(payment.service_date),
        payment.battery_name || (payment.battery_id ? `Battery #${payment.battery_id}` : '-'),
        formatCurrency(payment.amount),
        payment.notes || '-',
        formatDateTime(payment.created_at)
      ]);

      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos + 10,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          1: { halign: 'right' }
        },
        didDrawPage: () => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} of ${pageCount}`,
              doc.internal.pageSize.getWidth() - 20,
              doc.internal.pageSize.getHeight() - 10
            );
          }
        }
      });

      // Add summary
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;

      doc.setFillColor(240, 249, 255);
      doc.rect(14, finalY + 10, doc.internal.pageSize.getWidth() - 28, 20, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Summary', 20, finalY + 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, finalY + 30);
      doc.text(`Total Payments: ${payments.length}`, 100, finalY + 30);

      // Add footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This is a computer generated document - valid without signature',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `payment_history_${service.service_code}_${formatDateForFilename()}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Print function
  const handlePrint = () => {
    if (!service || payments.length === 0) return;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Generate print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment History - ${service.service_code}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #fff; }
          h1 { color: #10b981; font-size: 24px; margin-bottom: 5px; }
          h2 { color: #374151; font-size: 18px; margin-bottom: 20px; }
          .header { margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .service-info { 
            background: #f9fafb; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            border: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
          }
          .info-item { margin-bottom: 5px; }
          .info-label { 
            font-size: 11px; 
            color: #6b7280; 
            margin-bottom: 2px; 
            text-transform: uppercase;
          }
          .info-value { 
            font-size: 14px; 
            font-weight: 600; 
            color: #111827; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            font-size: 12px; 
          }
          th { 
            background-color: #10b981; 
            color: white; 
            padding: 10px; 
            text-align: left; 
            font-size: 12px;
          }
          td { 
            padding: 8px 10px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          tr:nth-child(even) { background-color: #f9fafb; }
          .amount { font-weight: 600; color: #059669; }
          .summary { 
            margin-top: 30px; 
            padding: 20px; 
            background-color: #f0f9ff; 
            border-radius: 8px; 
            border: 1px solid #bae6fd; 
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
          }
          .summary-item { 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #e5e7eb; 
          }
          .summary-label { 
            font-size: 11px; 
            color: #6b7280; 
            margin-bottom: 5px; 
            text-transform: uppercase;
          }
          .summary-value { 
            font-size: 20px; 
            font-weight: bold; 
            color: #111827; 
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 11px; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 20px; 
          }
          @media print { 
            body { padding: 10px; } 
            .no-print { display: none; } 
          }
          @media (max-width: 768px) { 
            body { margin: 10px; } 
            table { font-size: 11px; } 
          }
          .print-button {
            padding: 10px 20px;
            background-color: #10b981;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
          }
          .close-button {
            padding: 10px 20px;
            background-color: #6B7280;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sun Water Service</h1>
          <h2>Water Service Payment History</h2>
          <p style="color: #6b7280; font-size: 12px;">
            Generated: ${new Date().toLocaleString()}
          </p>
        </div>

        <div class="service-info">
          <div class="info-item">
            <div class="info-label">Service Code</div>
            <div class="info-value">${service.service_code}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${service.customer_name || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Customer Phone</div>
            <div class="info-value">${service.customer_phone || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Battery Model</div>
            <div class="info-value">${service.battery_model || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Battery Serial</div>
            <div class="info-value">${service.battery_serial || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">${service.status || 'N/A'}</div>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => `
                <tr>
                  <td>${formatDate(payment.service_date)}</td>
                  <td class="amount">${formatCurrency(payment.amount)}</td>
                  <td>${payment.notes || '-'}</td>
                  <td>${formatDateTime(payment.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <h3 style="margin: 0 0 15px 0; color: #0369a1;">Payment Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">${formatCurrency(totalAmount)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Number of Payments</div>
              <div class="summary-value">${payments.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Average Payment</div>
              <div class="summary-value">${formatCurrency(totalAmount / payments.length)}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer generated document - valid without signature</p>
          <p>Sun Water Service - All rights reserved</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button class="print-button" onclick="window.print()">Print</button>
          <button class="close-button" onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!isOpen || !service) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #fff, #fafafa)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '24px'
                }}>
                  <FiList />
                </div>
                <div>
                  <h2 style={{
                    margin: '0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Payment History</h2>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Service Code: {service.service_code}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Export Buttons - Only show if there are payments */}
                {payments.length > 0 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportToCSV}
                      disabled={exportLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #10b981',
                        backgroundColor: '#fff',
                        color: '#10b981',
                        cursor: exportLoading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: exportLoading ? 0.5 : 1
                      }}
                    >
                      <FiDownload size={14} />
                      CSV
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportToPDF}
                      disabled={exportLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #ef4444',
                        backgroundColor: '#fff',
                        color: '#ef4444',
                        cursor: exportLoading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: exportLoading ? 0.5 : 1
                      }}
                    >
                      <FiDownload size={14} />
                      PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      disabled={exportLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #8b5cf6',
                        backgroundColor: '#fff',
                        color: '#8b5cf6',
                        cursor: exportLoading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: exportLoading ? 0.5 : 1
                      }}
                    >
                      <FiPrinter size={14} />
                      Print
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiX />
                </motion.button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Customer Info Summary */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    {service.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>{service.customer_name}</h3>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiPhone size={12} /> {service.customer_phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiBattery size={12} /> {getBatteryNames(service)}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>Total Payments</span>
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Payment Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '20px'
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAddPayment}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiPlus size={16} />
                  Add Payment
                </motion.button>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                  color: '#b91c1c',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiAlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }}></div>
                  <p style={{ fontSize: '14px' }}>Loading payment history...</p>
                </div>
              )}

              {/* Payment History Table */}
              {!loading && !error && (
                <>
                  {payments.length > 0 ? (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px'
                      }}>
                        <thead>
                          <tr style={{
                            backgroundColor: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Battery</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Amount</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Staff</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Notes</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Created At</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', color: '#374151', fontWeight: '600' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment, index) => (
                            <motion.tr
                              key={payment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              style={{
                                borderBottom: index < payments.length - 1 ? '1px solid #f3f4f6' : 'none',
                                backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                              }}
                            >
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontWeight: '500', color: '#111827' }}>
                                  {formatDate(payment.service_date)}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ color: '#4b5563' }}>
                                  {payment.battery_name || (payment.battery_id ? `Battery #${payment.battery_id}` : '-')}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontWeight: '700',
                                  color: '#059669'
                                }}>
                                  {formatCurrency(payment.amount)}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ color: '#065f46', fontWeight: '500' }}>
                                  {payment.service_staff_name || 'Unassigned'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ color: '#4b5563' }}>
                                  {payment.notes || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>
                                  {formatDateTime(payment.created_at)}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => handleEditClick(payment, e)}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '6px',
                                      border: '1px solid #f59e0b',
                                      backgroundColor: '#fff',
                                      color: '#f59e0b',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Edit Payment"
                                  >
                                    <FiEdit size={14} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => handleDeleteClick(payment.id, e)}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '6px',
                                      border: '1px solid #ef4444',
                                      backgroundColor: '#fff',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Delete Payment"
                                  >
                                    <FiTrash2 size={14} />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px dashed #d1d5db'
                    }}>
                      <FiDollarSign style={{
                        fontSize: '48px',
                        color: '#9ca3af',
                        marginBottom: '16px'
                      }} />
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>No Payment History</h3>
                      <p style={{
                        margin: '0 0 20px 0',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        No water service payments have been recorded for this service order yet.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAddPayment}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: '1px solid #10b981',
                          backgroundColor: '#fff',
                          color: '#10b981',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FiPlus size={14} />
                        Add First Payment
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f9fafb'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletePaymentId !== null}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={handleDeleteConfirm}
        payment={payments.find(p => p.id === deletePaymentId)}
        isDeleting={isDeleting}
      />
    </>
  );
};

const CardTab: React.FC<CardTabProps> = ({
  services,
  customers,
  loading,
  error,
  onRefresh,
  drilldownFilter = null,
  filterStatus = "all",
  filterPriority = "all",
  filterClaimType = "all",
  filterWarrantyStatus = "all",
  filterAmcStatus = "all",
  onFilterStatusChange = () => {},
  onFilterPriorityChange = () => {},
  onFilterClaimTypeChange = () => {},
  onFilterWarrantyStatusChange = () => {},
  onFilterAmcStatusChange = () => {},
  onPaymentSuccess = () => {}
}) => {
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = React.useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Mobile menu state
  const [showMobileActions, setShowMobileActions] = React.useState<boolean>(false);
  
  // Date filter states - using service_date for filtering
  const [dateFilterType, setDateFilterType] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");
  const [showDatePicker, setShowDatePicker] = React.useState<boolean>(false);

  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortBy] = React.useState<string>("newest");
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState<boolean>(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());

  const getAlternatePhone = React.useCallback((service: ServiceOrder) => {
    const matchedCustomer = customers.find((customer) =>
      (service.customer_id && customer.id === service.customer_id) ||
      (service.customer_name && customer.full_name === service.customer_name) ||
      (service.customer_phone && customer.phone === service.customer_phone)
    );

    return service.customer_alternate_phone || matchedCustomer?.alternate_phone || '';
  }, [customers]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(20);
  
  // Modal state
  const [selectedService, setSelectedService] = React.useState<ServiceOrder | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<WaterServicePayment | null>(null);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = React.useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState<boolean>(false);
  const [paymentModalMode, setPaymentModalMode] = React.useState<'add' | 'edit'>('add');
  const [staffSummaryMonth, setStaffSummaryMonth] = React.useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [staffMonthlySummary, setStaffMonthlySummary] = React.useState<StaffMonthlySummaryItem[]>([]);
  const [, setStaffMonthlyPayments] = React.useState<WaterServicePayment[]>([]);
  const [staffSummaryLoading, setStaffSummaryLoading] = React.useState<boolean>(false);
  const [allPaymentRecords, setAllPaymentRecords] = React.useState<WaterServicePayment[]>([]);
  
  // Toast notification state
  const [toast, setToast] = React.useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // Format currency helper function
  const formatCurrency = (amount: string | number) => {
    if (!amount) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if mobile view
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Update last refreshed when data changes
  React.useEffect(() => {
    if (services.length > 0) {
      setLastRefreshed(new Date());
    }
  }, [services]);

  const fetchStaffMonthlySummary = React.useCallback(async (month: string) => {
    setStaffSummaryLoading(true);
    try {
      const response = await fetch(`${WATER_SERVICES_URL}?action=staff_monthly_summary&month=${month}`);
      const result = await response.json();
      if (response.ok && result.success) {
        const payments: WaterServicePayment[] = Array.isArray(result.payments) ? result.payments : [];

        const resolvePaymentStaff = (payment: WaterServicePayment): ResolvedPaymentStaff => {
          if (payment.service_staff_id) {
            return {
              staffId: payment.service_staff_id,
              staffName: payment.service_staff_name || `Staff #${payment.service_staff_id}`,
            };
          }

          const linkedService = services.find((service) => service.id === Number(payment.service_id));
          const fallbackName =
            linkedService?.service_staff_name ||
            linkedService?.staff_name ||
            linkedService?.assigned_staff ||
            linkedService?.technician ||
            payment.service_staff_name ||
            'Unassigned';

          return {
            staffId: linkedService?.service_staff_id || null,
            staffName: fallbackName,
          };
        };

        const summaryMap = new Map<string, { service_staff_id: number | null; service_staff_name: string; service_count: number; total_amount: number }>();

        payments.forEach((payment) => {
          const resolved = resolvePaymentStaff(payment);
          const key = `${resolved.staffId ?? 'none'}::${resolved.staffName}`;
          const existing = summaryMap.get(key) || {
            service_staff_id: resolved.staffId,
            service_staff_name: resolved.staffName,
            service_count: 0,
            total_amount: 0,
          };

          existing.service_count += 1;
          existing.total_amount += Number(payment.amount || 0);
          summaryMap.set(key, existing);
        });

        const normalizedSummary = Array.from(summaryMap.values()).sort((a, b) =>
          a.service_staff_name.localeCompare(b.service_staff_name)
        );

        setStaffMonthlySummary(normalizedSummary);
        setStaffMonthlyPayments(payments);
      } else {
        setStaffMonthlySummary([]);
        setStaffMonthlyPayments([]);
      }
    } catch (_err) {
      setStaffMonthlySummary([]);
      setStaffMonthlyPayments([]);
    } finally {
      setStaffSummaryLoading(false);
    }
  }, [services]);

  React.useEffect(() => {
    fetchStaffMonthlySummary(staffSummaryMonth);
  }, [staffSummaryMonth, fetchStaffMonthlySummary]);

  React.useEffect(() => {
    const fetchAllPaymentRecords = async () => {
      try {
        const response = await fetch(WATER_SERVICES_URL);
        const result = await response.json();
        if (response.ok) {
          setAllPaymentRecords(Array.isArray(result.records) ? result.records : []);
        } else {
          setAllPaymentRecords([]);
        }
      } catch (_err) {
        setAllPaymentRecords([]);
      }
    };

    fetchAllPaymentRecords();
  }, []);

  React.useEffect(() => {
    if (!drilldownFilter) return;

    setSearchQuery("");
    setDateFilterType("all");
    setFromDate(drilldownFilter.serviceDate || "");
    setToDate(drilldownFilter.serviceDate || "");
    setShowFilters(true);
    setCurrentPage(1);
  }, [drilldownFilter?.requestKey]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority, filterWarrantyStatus, filterAmcStatus, filterClaimType, dateFilterType, fromDate, toDate]);

  const resolvePaymentStaffName = React.useCallback((payment: WaterServicePayment) => {
    if (payment.service_staff_name && payment.service_staff_name.trim()) {
      return payment.service_staff_name.trim();
    }

    const linkedService = services.find((service) => service.id === Number(payment.service_id));
    return (
      linkedService?.service_staff_name ||
      linkedService?.staff_name ||
      linkedService?.assigned_staff ||
      linkedService?.technician ||
      linkedService?.staff?.name ||
      'Unassigned'
    ).trim();
  }, [services]);

  // Filter out inverter services and then apply other filters
  const getFilteredAndSortedServices = React.useCallback(() => {
    // First filter out inverter services (those with INV prefix in service_code)
    let waterServices = services.filter(service => 
      !service.service_code?.toUpperCase().startsWith('INV')
    );
    
    let filtered = [...waterServices];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!drilldownFilter) {
      // Apply normal date filters based on service created_at only for manual page filtering.
      switch (dateFilterType) {
        case "today":
          filtered = filtered.filter(service => {
            const serviceDate = new Date(service.created_at);
            serviceDate.setHours(0, 0, 0, 0);
            return serviceDate.getTime() === today.getTime();
          });
          break;
        
        case "this_week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          filtered = filtered.filter(service => {
            const serviceDate = new Date(service.created_at);
            return serviceDate >= weekStart;
          });
          break;
        
        case "this_month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          filtered = filtered.filter(service => {
            const serviceDate = new Date(service.created_at);
            return serviceDate >= monthStart;
          });
          break;
        
        case "this_year":
          const yearStart = new Date(today.getFullYear(), 0, 1);
          yearStart.setHours(0, 0, 0, 0);
          filtered = filtered.filter(service => {
            const serviceDate = new Date(service.created_at);
            return serviceDate >= yearStart;
          });
          break;
        
        case "custom":
          if (fromDate && toDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(service => {
              const serviceDate = new Date(service.created_at);
              return serviceDate >= from && serviceDate <= to;
            });
          }
          break;
        
        default:
          break;
      }
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(service => service.status === filterStatus);
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(service => service.priority === filterPriority);
    }

    if (filterWarrantyStatus !== "all") {
      filtered = filtered.filter(service => service.warranty_status === filterWarrantyStatus);
    }

    if (filterAmcStatus !== "all") {
      filtered = filtered.filter(service => service.amc_status === filterAmcStatus);
    }

    if (filterClaimType !== "all") {
      filtered = filtered.filter(service => service.battery_claim === filterClaimType);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        (
          service.service_staff_name ||
          service.staff_name ||
          service.assigned_staff ||
          service.technician ||
          (service.staff && service.staff.name) ||
          'Unassigned'
        ).toLowerCase().includes(query) ||
        service.service_code?.toLowerCase().includes(query) ||
        service.customer_name?.toLowerCase().includes(query) ||
        service.customer_phone?.includes(query) ||
        getAlternatePhone(service)?.includes(query) ||
        service.battery_model?.toLowerCase().includes(query) ||
        service.battery_serial?.toLowerCase().includes(query) ||
        service.customer_email?.toLowerCase().includes(query)
      );
    }

    if (drilldownFilter?.serviceDate) {
      const normalizedStaffName = (drilldownFilter.staffName || '').trim().toLowerCase();
      const useStaffFilter = normalizedStaffName !== '' && normalizedStaffName !== 'unassigned';

      const matchedServiceIds = new Set(
        allPaymentRecords
          .filter((payment) => {
            const paymentDate = String(payment.service_date || '').slice(0, 10);
            if (paymentDate !== drilldownFilter.serviceDate) {
              return false;
            }

            if (!useStaffFilter) {
              return true;
            }

            return resolvePaymentStaffName(payment).toLowerCase() === normalizedStaffName;
          })
          .map((payment) => Number(payment.service_id))
          .filter((serviceId) => Number.isFinite(serviceId) && serviceId > 0)
      );

      filtered = filtered.filter((service) => matchedServiceIds.has(service.id));
    }

    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'name_desc':
          return (b.customer_name || '').localeCompare(a.customer_name || '');
        case 'service_code':
          return (a.service_code || '').localeCompare(b.service_code || '');
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [services, filterStatus, filterPriority, filterWarrantyStatus, filterAmcStatus, filterClaimType, searchQuery, sortBy, dateFilterType, fromDate, toDate, drilldownFilter, allPaymentRecords, resolvePaymentStaffName]);

  const allFilteredServices = getFilteredAndSortedServices();
  
  // Pagination calculations
  const totalItems = allFilteredServices.length;
  const totalPages = totalItems > 0 ? 1 : 0;
  const startIndex = 0;
  const endIndex = totalItems;
  const displayedServices = allFilteredServices;

  // Update selectAll when selectedRows changes
  React.useEffect(() => {
    if (displayedServices.length > 0) {
      const allDisplayedIds = displayedServices.map(s => s.id);
      const selectedDisplayedIds = Array.from(selectedRows).filter(id => allDisplayedIds.includes(id));
      
      if (selectedDisplayedIds.length === 0) {
        setSelectAll(false);
      } else if (selectedDisplayedIds.length === displayedServices.length) {
        setSelectAll(true);
      } else {
        setSelectAll(false);
      }
    } else {
      setSelectAll(false);
    }
  }, [selectedRows, displayedServices]);

  // Handle select all
  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectAll) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all currently displayed services
      const allIds = new Set(displayedServices.map(s => s.id));
      setSelectedRows(allIds);
    }
  };

  // Handle individual row selection
  const handleRowSelect = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  // Clear all selections
  const clearSelection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedRows(new Set());
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  // Hide toast notification
  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Handle refresh
  const handleRefresh = async () => {
    await onRefresh();
  };

  // Set default from and to dates for custom range
  const setDefaultCustomRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Handle date filter change
  const handleDateFilterChange = (type: string) => {
    setDateFilterType(type);
    if (type !== "custom") {
      setFromDate("");
      setToDate("");
      setShowDatePicker(false);
    } else {
      setDefaultCustomRange();
      setShowDatePicker(true);
    }
    setSelectedRows(new Set());
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFilterType("all");
    setFromDate("");
    setToDate("");
    setShowDatePicker(false);
    setSearchQuery("");
    onFilterStatusChange('all');
    onFilterPriorityChange('all');
    onFilterWarrantyStatusChange('all');
    onFilterAmcStatusChange('all');
    onFilterClaimTypeChange('all');
    setSelectedRows(new Set());
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilterType !== "all" || searchQuery !== "" || 
    filterStatus !== "all" || filterPriority !== "all" || 
    filterWarrantyStatus !== "all" || filterAmcStatus !== "all" || 
    filterClaimType !== "all";

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString || '';
    }
  };

  // Format date for filename
  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Get warranty status color and label
  const getWarrantyInfo = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'in_warranty':
        return { bg: '#dcfce7', text: '#166534', label: 'In Warranty' };
      case 'extended_warranty':
        return { bg: '#fef9c3', text: '#854d0e', label: 'Extended' };
      case 'out_of_warranty':
        return { bg: '#fee2e2', text: '#991b1b', label: 'Out of Warranty' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', label: 'Unknown' };
    }
  };

  // Get AMC status color and label
  const getAmcInfo = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active':
        return { bg: '#dcfce7', text: '#166534', label: 'AMC Active' };
      case 'expired':
        return { bg: '#fee2e2', text: '#991b1b', label: 'AMC Expired' };
      case 'no_amc':
        return { bg: '#f3f4f6', text: '#4b5563', label: 'No AMC' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', label: 'Unknown' };
    }
  };

  // Get equipment type
  const getEquipmentType = (service: ServiceOrder) => {
    if (service.battery_model) return 'battery';
    return 'unknown';
  };

  const getBatterySerials = (service: ServiceOrder): string => {
    const batteries = Array.isArray((service as any).batteries) ? (service as any).batteries : [];
    if (batteries.length > 0) {
      return batteries.map((b: any) => b?.battery_serial || '-').join(', ');
    }
    return service.battery_serial || '-';
  };

  // Get equipment icon - using Droplet for water services
  const getEquipmentIcon = (service: ServiceOrder) => {
    const type = getEquipmentType(service);
    return type === 'battery' ? <FiDroplet /> : <FiBattery />;
  };

  // Handle service click - opens payment history modal
  const handleServiceClick = (service: ServiceOrder, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedService(service);
    setSelectedPayment(null);
    setShowPaymentHistoryModal(true);
  };

  // Handle add payment button click
  const handleAddPayment = () => {
    setShowPaymentHistoryModal(false);
    setPaymentModalMode('add');
    setSelectedPayment(null);
    setShowPaymentModal(true);
  };

  // Handle edit payment
  const handleEditPayment = (payment: WaterServicePayment) => {
    setSelectedPayment(payment);
    setPaymentModalMode('edit');
    setShowPaymentModal(true);
  };

  // Handle payment save - API call to water_services.php
  const handlePaymentSave = async (paymentData: any) => {
    try {
      const isEdit = paymentData.id !== undefined;
      
      const url = isEdit 
        ? `${WATER_SERVICES_URL}?id=${paymentData.id}`
        : WATER_SERVICES_URL;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'save'} payment`);
      }

      // Show success toast notification
      showToast(
        `Payment ${isEdit ? 'updated' : 'saved'} successfully.\n` +
        `Amount: ${formatCurrency(paymentData.amount)}\n` +
        `Date: ${formatDate(paymentData.service_date)}`,
        'success'
      );
      
      // Close modal and refresh data
      setShowPaymentModal(false);
      setSelectedService(null);
      setSelectedPayment(null);
      
      // Call the onPaymentSuccess callback to refresh the parent component
      onPaymentSuccess();
      fetchStaffMonthlySummary(staffSummaryMonth);
      
    } catch (error: any) {
      console.error('Error saving payment:', error);
      showToast(
        `Failed to save payment: ${error.message || 'Please try again.'}`,
        'error'
      );
      throw new Error(error.message || 'Failed to save payment. Please try again.');
    }
  };

  // Handle payment delete
  const handlePaymentDelete = async (paymentId: number) => {
    try {
      const response = await fetch(`${WATER_SERVICES_URL}?id=${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete payment');
      }

      showToast(
        `Payment deleted successfully.`,
        'success'
      );
      
      // Refresh the payment list in the modal
      if (selectedService) {
        // The modal will refresh itself
      }
      fetchStaffMonthlySummary(staffSummaryMonth);
      
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      showToast(
        `Failed to delete payment: ${error.message || 'Please try again.'}`,
        'error'
      );
      throw new Error(error.message || 'Failed to delete payment. Please try again.');
    }
  };

  // Handle payment success from modal
  const handlePaymentSuccess = () => {
    // Re-open payment history modal to show updated list
    if (selectedService) {
      setShowPaymentHistoryModal(true);
    }
    onPaymentSuccess();
  };

  // Get selected services data (only from displayed services)
  const getSelectedServices = (): ServiceOrder[] => {
    return displayedServices.filter(service => selectedRows.has(service.id));
  };

  // Print function - supports selected items
  const handlePrint = () => {
    const selectedData = getSelectedServices();
    const dataToPrint = selectedData.length > 0 ? selectedData : displayedServices;
    
    if (dataToPrint.length === 0) {
      showToast('No data to print', 'error');
      return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow pop-ups to print', 'error');
      return;
    }
    
    // Generate print content
    const activeCount = dataToPrint.filter(s => s.status === 'active' || s.status === 'completed').length;
    const pendingCount = dataToPrint.filter(s => s.status === 'pending' || s.status === 'in_progress').length;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Service Call Completed Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #fff; }
          h1 { color: #10b981; font-size: 24px; margin-bottom: 10px; }
          .header { margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 10px; }
          .filters-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
          .filters-info h3 { margin: 0 0 10px 0; color: #374151; }
          .filters-info p { margin: 5px 0; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background-color: #10b981; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; }
          .summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd; }
          .summary h3 { margin: 0 0 15px 0; color: #0369a1; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .summary-item { background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
          .summary-item .label { font-size: 11px; color: #6b7280; margin-bottom: 5px; }
          .summary-item .value { font-size: 16px; font-weight: bold; color: #111827; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 10px; } .no-print { display: none; } }
          @media (max-width: 768px) { body { margin: 10px; } table { font-size: 11px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sun Water Service</h1>
          <h2>Water Service Call Completed Report</h2>
          <div class="metadata">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Records:</strong> ${dataToPrint.length}</p>
            ${selectedData.length > 0 ? `<p><strong>Showing:</strong> ${selectedData.length} selected records</p>` : ''}
          </div>
        </div>

        <div class="filters-info">
          <h3>Filter Information</h3>
          <p><strong>Date Range:</strong> ${
            dateFilterType === 'today' ? 'Today' :
            dateFilterType === 'this_week' ? 'This Week' :
            dateFilterType === 'this_month' ? 'This Month' :
            dateFilterType === 'this_year' ? 'This Year' :
            dateFilterType === 'custom' ? `${fromDate ? new Date(fromDate).toLocaleDateString() : 'Start'} to ${toDate ? new Date(toDate).toLocaleDateString() : 'End'}` :
            'All Time'
          }</p>
          <p><strong>Warranty Filter:</strong> ${filterWarrantyStatus === 'all' ? 'All' : filterWarrantyStatus}</p>
          <p><strong>AMC Filter:</strong> ${filterAmcStatus === 'all' ? 'All' : filterAmcStatus}</p>
          <p><strong>Claim Filter:</strong> ${filterClaimType === 'all' ? 'All' : filterClaimType}</p>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Service Code</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Alternate Phone</th>
                <th>Battery Model</th>
                <th>Warranty</th>
                <th>AMC</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${dataToPrint.map(service => {
                const warrantyInfo = getWarrantyInfo(service.warranty_status);
                const amcInfo = getAmcInfo(service.amc_status);
                return `
                  <tr>
                    <td>${service.service_code || ''}</td>
                    <td>${service.customer_name || ''}</td>
                    <td>${service.customer_phone || ''}</td>
                    <td>${getAlternatePhone(service) || ''}</td>
                    <td>${service.battery_model || ''}</td>
                    <td><span style="background: ${warrantyInfo.bg}; color: ${warrantyInfo.text}; padding: 4px 8px; border-radius: 4px;">${warrantyInfo.label}</span></td>
                    <td><span style="background: ${amcInfo.bg}; color: ${amcInfo.text}; padding: 4px 8px; border-radius: 4px;">${amcInfo.label}</span></td>
                    <td>${formatDate(service.created_at)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Total Services</div>
              <div class="value">${dataToPrint.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Active/Completed</div>
              <div class="value">${activeCount}</div>
            </div>
            <div class="summary-item">
              <div class="label">Pending/In Progress</div>
              <div class="value">${pendingCount}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer generated document - valid without signature</p>
          <p>Sun Water Service - All rights reserved</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    if (isMobile) {
      setShowMobileActions(false);
    }
  };

  // Export to CSV - supports selected items (Removed Final Cost)
  const exportToCSV = (selectedOnly: boolean = false) => {
    setExportLoading(true);
    try {
      let dataToExport: ServiceOrder[];
      
      if (selectedOnly) {
        // Export only selected items
        dataToExport = getSelectedServices();
        if (dataToExport.length === 0) {
          showToast(`No services selected for export`, 'error');
          setExportLoading(false);
          return;
        }
      } else {
        // Export all displayed items
        dataToExport = displayedServices;
      }
      
      if (dataToExport.length === 0) {
        showToast(`No data to export`, 'error');
        setExportLoading(false);
        return;
      }
      
      // Create CSV content - REMOVED Final Cost
      let csvContent = "";
      
      // Add headers - REMOVED Final Cost
      const headers = [
        'Service Code',
        'Customer Name',
        'Customer Phone',
        'Alternate Phone',
        'Customer Email',
        'Battery Model',
        'Battery Serial',
        'Battery Brand',
        'Battery Capacity',
        'Battery Voltage',
        'Battery Type',
        'Issue Description',
        'Warranty Status',
        'AMC Status',
        'Created Date',
        'Staff Name',
        'Notes'
      ];
      
      csvContent += headers.join(',') + '\n';
      
      // Add data rows - REMOVED Final Cost
      dataToExport.forEach(service => {
        const row = [
          `"${(service.service_code || '').replace(/"/g, '""')}"`,
          `"${(service.customer_name || '').replace(/"/g, '""')}"`,
          `"${(service.customer_phone || '').replace(/"/g, '""')}"`,
          `"${(getAlternatePhone(service) || '').replace(/"/g, '""')}"`,
          `"${(service.customer_email || '').replace(/"/g, '""')}"`,
          `"${(service.battery_model || '').replace(/"/g, '""')}"`,
          `"${(service.battery_serial || '').replace(/"/g, '""')}"`,
          `"${(service.battery_brand || '').replace(/"/g, '""')}"`,
          `"${(service.battery_capacity || '').replace(/"/g, '""')}"`,
          `"${(service.battery_voltage || '').replace(/"/g, '""')}"`,
          `"${(service.battery_type || '').replace(/"/g, '""')}"`,
          `"${(service.issue_description || '').replace(/"/g, '""')}"`,
          `"${(service.warranty_status || '').replace(/"/g, '""')}"`,
          `"${(service.amc_status || '').replace(/"/g, '""')}"`,
          `"${formatDate(service.created_at)}"`,
          `"${(service.staff_name || '').replace(/"/g, '""')}"`,
          `"${(service.notes || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      // Create download link
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = selectedOnly
        ? `selected_water_services_${formatDateForFilename()}.csv`
        : `water_services_export_${formatDateForFilename()}.csv`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(`Exported ${dataToExport.length} water service records to CSV.`, 'success');
      
      if (selectedOnly && isMobile) {
        setShowMobileActions(false);
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      showToast(`Failed to export to CSV. Please try again.`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Export to PDF - supports selected items (Removed Final Cost)
  const exportToPDF = (selectedOnly: boolean = false) => {
    setExportLoading(true);
    try {
      let dataToExport: ServiceOrder[];
      
      if (selectedOnly) {
        // Export only selected items
        dataToExport = getSelectedServices();
        if (dataToExport.length === 0) {
          showToast(`No services selected for export`, 'error');
          setExportLoading(false);
          return;
        }
      } else {
        // Export all displayed items
        dataToExport = displayedServices;
      }
      
      if (dataToExport.length === 0) {
        showToast(`No data to export`, 'error');
        setExportLoading(false);
        return;
      }

      const doc = new jsPDF({
        orientation: isMobile ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Water Service Department', 14, 13);

      // Reset text color for main content
      doc.setTextColor(0, 0, 0);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Water Service Call Completed Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(isMobile ? 8 : 9);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 35;
      
      // Date range
      let dateRangeText = 'Date Range: ';
      switch (dateFilterType) {
        case 'today':
          dateRangeText += `Today (${new Date().toLocaleDateString()})`;
          break;
        case 'this_week':
          dateRangeText += 'This Week';
          break;
        case 'this_month':
          dateRangeText += 'This Month';
          break;
        case 'this_year':
          dateRangeText += 'This Year';
          break;
        case 'custom':
          dateRangeText += `${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : 'End'}`;
          break;
        default:
          dateRangeText += 'All Time';
      }
      doc.text(dateRangeText, 14, yPos);
      
      yPos += 5;
      doc.text(`Total Water Service Records: ${dataToExport.length}`, 14, yPos);
      
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);

      if (selectedOnly) {
        yPos += 5;
        doc.text(`Selected Items: ${selectedRows.size}`, 14, yPos);
      }

      // Prepare table data - REMOVED Final Cost
      const tableColumn = isMobile 
        ? ['Code', 'Customer', 'Model']
        : ['Code', 'Customer', 'Phone', 'Alternate Phone', 'Battery Model', 'Warranty', 'AMC', 'Created'];

      const tableRows = dataToExport.map(service => {
        const warrantyInfo = getWarrantyInfo(service.warranty_status);
        const amcInfo = getAmcInfo(service.amc_status);
        
        if (isMobile) {
          return [
            service.service_code || '',
            service.customer_name || '',
            service.battery_model || ''
          ];
        }
        
        return [
          service.service_code || '',
          service.customer_name || '',
          service.customer_phone || '',
          getAlternatePhone(service) || '',
          service.battery_model || '',
          warrantyInfo.label,
          amcInfo.label,
          formatDate(service.created_at)
        ];
      });

      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: selectedOnly ? 50 : 45,
        theme: 'grid',
        styles: {
          fontSize: isMobile ? 7 : 8,
          cellPadding: isMobile ? 2 : 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: isMobile ? 7 : 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        didDrawPage: () => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} of ${pageCount}`,
              doc.internal.pageSize.getWidth() - 20,
              doc.internal.pageSize.getHeight() - 10
            );
          }
        }
      });

      // Add summary
      const activeCount = dataToExport.filter(s => s.status === 'active' || s.status === 'completed').length;
      const pendingCount = dataToExport.filter(s => s.status === 'pending' || s.status === 'in_progress').length;

      const finalY = (doc as any).lastAutoTable?.finalY || 60;

      doc.setFillColor(240, 249, 255);
      doc.rect(14, finalY + 10, doc.internal.pageSize.getWidth() - 28, 25, 'F');
      
      doc.setFontSize(isMobile ? 10 : 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Summary', 20, finalY + 20);
      
      doc.setFontSize(isMobile ? 7 : 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Total Water Services: ${dataToExport.length}`, 20, finalY + 30);
      doc.text(`Active/Completed: ${activeCount}`, 80, finalY + 30);
      doc.text(`Pending/In Progress: ${pendingCount}`, 140, finalY + 30);

      // Add footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This is a computer generated document - valid without signature',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );

      // Save PDF
      const fileName = selectedOnly
        ? `selected_water_services_${formatDateForFilename()}.pdf`
        : `water_services_export_${formatDateForFilename()}.pdf`;
      
      doc.save(fileName);
      
      showToast(`Exported ${dataToExport.length} water service records to PDF.`, 'success');
      
      if (selectedOnly && isMobile) {
        setShowMobileActions(false);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showToast(`Failed to export to PDF. Please try again.`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Render mobile card view
  const renderMobileCard = (service: ServiceOrder) => {
    const warrantyInfo = getWarrantyInfo(service.warranty_status);
    const amcInfo = getAmcInfo(service.amc_status);
    const isSelected = selectedRows.has(service.id);

    return (
      <div
        key={service.id}
        onClick={(e) => handleServiceClick(service, e)}
        style={{
          backgroundColor: isSelected ? '#eff6ff' : '#fff',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MotionDiv
              onClick={(e) => handleRowSelect(service.id, e)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#10b981' : '#6b7280'
              }}
            >
              {isSelected ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
            </MotionDiv>
            <div>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>
                {service.service_code}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                #{service.id}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleServiceClick(service, e);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiEye size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
            <div style={{ fontWeight: '500', fontSize: '14px' }}>{service.customer_name || 'No name'}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiPhone size={10} /> {service.customer_phone || 'No phone'}
            </div>
            {getAlternatePhone(service) && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Alt: {getAlternatePhone(service)}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Battery Info</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {getEquipmentIcon(service)}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{getBatteryNames(service)}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {getBatterySerials(service)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Warranty</div>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: warrantyInfo.bg,
              color: warrantyInfo.text
            }}>
              {warrantyInfo.label}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>AMC</div>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: amcInfo.bg,
              color: amcInfo.text
            }}>
              {amcInfo.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Service Date</div>
            <div style={{ fontWeight: '500', color: '#4b5563' }}>
              {formatDate(service.created_at)}
            </div>
          </div>
          <div>
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: service.status === 'completed' ? '#d1fae5' :
                             service.status === 'pending' ? '#fee2e2' :
                             service.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
              color: service.status === 'completed' ? '#065f46' :
                     service.status === 'pending' ? '#991b1b' :
                     service.status === 'in_progress' ? '#92400e' : '#4b5563'
            }}>
              {service.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleServiceClick(service, e);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FiEye size={14} />
            View Payments
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <div className="card-tab" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        padding: '0',
        width: '100%'
      }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: isMobile ? '20px 16px' : '30px 24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '20px',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap'
          }}>
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{
                width: isMobile ? '50px' : '60px',
                height: isMobile ? '50px' : '60px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '24px' : '30px',
                flexShrink: 0
              }}
            >
              <FiDroplet />
            </motion.div>
            <div style={{ flex: 1 }}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  margin: '0 0 4px 0',
                  fontSize: isMobile ? '20px' : '28px',
                  fontWeight: '600',
                  lineHeight: 1.2
                }}
              >
                Water Service Call Completed
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  margin: '0',
                  fontSize: isMobile ? '12px' : '14px',
                  opacity: '0.9'
                }}
              >
                Showing {startIndex + 1}-{endIndex} of {totalItems} Water Service Call Completed
                {selectedRows.size > 0 && (
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                    • {selectedRows.size} selected
                  </span>
                )}
              </motion.p>
            </div>
          </div>
          
          {/* Hero Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              position: isMobile ? 'relative' : 'absolute',
              right: isMobile ? 'auto' : '24px',
              top: isMobile ? 'auto' : '50%',
              transform: isMobile ? 'none' : 'translateY(-50%)',
              marginTop: isMobile ? '16px' : '0',
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              zIndex: 1,
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end'
            }}
          >
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <motion.button 
                onClick={() => setShowMobileActions(!showMobileActions)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <FiMenu size={18} />
                <span>Actions</span>
              </motion.button>
            )}

            {/* Actions */}
            {(!isMobile || showMobileActions) && (
              <>
                {/* CSV Button */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    exportToCSV(false);
                    if (isMobile) setShowMobileActions(false);
                  }}
                  disabled={exportLoading || displayedServices.length === 0}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: '#10b981',
                    cursor: displayedServices.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    opacity: displayedServices.length === 0 ? 0.5 : 1,
                    flex: isMobile ? '1' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <FiDownload size={isMobile ? 14 : 16} />
                  <span>CSV</span>
                </motion.button>
                
                {/* PDF Button */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    exportToPDF(false);
                    if (isMobile) setShowMobileActions(false);
                  }}
                  disabled={exportLoading || displayedServices.length === 0}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: '#ef4444',
                    cursor: displayedServices.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    opacity: displayedServices.length === 0 ? 0.5 : 1,
                    flex: isMobile ? '1' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <FiDownload size={isMobile ? 14 : 16} />
                  <span>PDF</span>
                </motion.button>
                
                {/* Print Button */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handlePrint();
                    if (isMobile) setShowMobileActions(false);
                  }}
                  disabled={displayedServices.length === 0}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: '#8b5cf6',
                    cursor: displayedServices.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    opacity: displayedServices.length === 0 ? 0.5 : 1,
                    flex: isMobile ? '1' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <FiPrinter size={isMobile ? 14 : 16} />
                  <span>Print</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </div>

        {/* Filter Bar */}
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 24px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: isMobile ? '12px' : '16px',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: isMobile ? 'auto' : '2',
            width: '100%'
          }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '16px',
              zIndex: 1
            }} />
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search by code, customer, phone, battery..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '10px 12px 10px 40px' : '10px 12px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: isMobile ? '14px' : '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            {searchQuery && (
              <motion.button 
                onClick={() => setSearchQuery('')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '4px'
                }}
              >
                <FiX size={16} />
              </motion.button>
            )}
          </div>

          {/* Date Filter */}
          <div style={{
            position: 'relative',
            flex: isMobile ? 'auto' : '1',
            width: isMobile ? '100%' : 'auto'
          }}>
            <FiCalendar style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '16px',
              zIndex: 1
            }} />
            <select
              value={dateFilterType}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '10px 12px 10px 40px' : '10px 12px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: isMobile ? '14px' : '14px',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '14px'
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Items Per Page Dropdown */}
          <div style={{
            position: 'relative',
            flex: isMobile ? 'auto' : '0 0 auto',
            width: isMobile ? '100%' : 'auto',
            minWidth: '120px'
          }}>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={{
                width: '100%',
                padding: isMobile ? '10px 12px' : '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: isMobile ? '14px' : '14px',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '14px'
              }}
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="30">30 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>

          {/* Filter Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: isMobile ? '10px 16px' : '10px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: showFilters ? '#e5e7eb' : '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <FiFilter size={14} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </motion.button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <MotionButton
              onClick={clearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '10px 16px' : '10px 16px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                backgroundColor: '#fff',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                justifyContent: 'center',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <FiX size={14} />
              Clear Filters
            </MotionButton>
          )}
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <div style={{
            padding: isMobile ? '12px 16px' : '12px 24px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: isMobile ? '13px' : '13px', color: '#6b7280', fontWeight: '500' }}>Custom Range:</span>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: isMobile ? '14px' : '13px',
                  outline: 'none',
                  backgroundColor: '#fff',
                  width: isMobile ? '100%' : 'auto'
                }}
              />
              <span style={{ color: '#6b7280' }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: isMobile ? '14px' : '13px',
                  outline: 'none',
                  backgroundColor: '#fff',
                  width: isMobile ? '100%' : 'auto'
                }}
              />
            </div>
          </div>
        )}

        {/* Staff Monthly Payment Summary */}
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 24px',
          backgroundColor: '#f0fdf4',
          borderBottom: '1px solid #dcfce7'
        }}>
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#065f46' }}>
              Staff Payment Summary (Month Wise)
            </h3>
            <input
              type="month"
              value={staffSummaryMonth}
              onChange={(e) => setStaffSummaryMonth(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #86efac',
                backgroundColor: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {staffSummaryLoading ? (
            <p style={{ margin: 0, color: '#166534', fontSize: '13px' }}>Loading monthly staff summary...</p>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {staffMonthlySummary.length > 0 ? staffMonthlySummary.map((item, idx) => (
                  <div key={`${item.service_staff_id || 'none'}-${idx}`} style={{
                    backgroundColor: '#fff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '10px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#065f46', fontWeight: 600 }}>{item.service_staff_name || 'Unassigned'}</div>
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                      Services: {item.service_count}
                    </div>
                    <div style={{ fontSize: '12px', color: '#166534' }}>
                      Amount: {formatCurrency(item.total_amount)}
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: '13px', color: '#166534' }}>No staff payments for selected month.</div>
                )}
              </div>

            </>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              padding: '20px 24px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            {/* Status Filter - Keeping Status filter in UI but removing from exports */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="testing">Testing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter - Keeping Priority filter in UI but removing from exports */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => onFilterPriorityChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px'
                }}
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Warranty Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Warranty:</span>
              <select
                value={filterWarrantyStatus}
                onChange={(e) => onFilterWarrantyStatusChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px'
                }}
              >
                <option value="all">All Warranties</option>
                <option value="in_warranty">In Warranty</option>
                <option value="extended_warranty">Extended</option>
                <option value="out_of_warranty">Out of Warranty</option>
              </select>
            </div>

            {/* AMC Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>AMC:</span>
              <select
                value={filterAmcStatus}
                onChange={(e) => onFilterAmcStatusChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px'
                }}
              >
                <option value="all">All AMC</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="no_amc">No AMC</option>
              </select>
            </div>

            {/* Claim Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Claim:</span>
              <select
                value={filterClaimType}
                onChange={(e) => onFilterClaimTypeChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px'
                }}
              >
                <option value="all">All Claims</option>
                <option value="none">None</option>
                <option value="shop_claim">Shop Claim</option>
                <option value="company_claim">Company Claim</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Info Panel */}
        <div style={{
          padding: isMobile ? '12px 16px' : '12px 24px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: isMobile ? '16px' : '24px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FiDroplet style={{ color: '#10b981', fontSize: isMobile ? '16px' : '18px' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Total Water Services</span>
              <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{services.filter(s => !s.service_code?.toUpperCase().startsWith('INV')).length}</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FiClock style={{ color: '#f59e0b', fontSize: isMobile ? '16px' : '18px' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Last Updated</span>
              <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{lastRefreshed.toLocaleTimeString()}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginLeft: 'auto'
          }}>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Showing all services
            </span>
          </div>
        </div>

        {/* Results Info with Selection Controls */}
        {displayedServices.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: isMobile ? '12px 16px' : '12px 24px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'flex-start'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleSelectAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '12px'
                  }}
                >
                  {selectAll ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
                  <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
                </button>
                
                {selectedRows.size > 0 && (
                  <>
                    <span style={{
                      fontSize: isMobile ? '12px' : '12px',
                      color: '#10b981',
                      fontWeight: '500'
                    }}>
                      {selectedRows.size} selected
                    </span>
                    <button 
                      onClick={clearSelection}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      <FiX size={14} />
                    </button>
                    
                    {/* Export Selected Buttons */}
                    {!isMobile && (
                      <>
                        <button 
                          onClick={() => exportToCSV(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d1fae5',
                            background: '#d1fae5',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          <FiDownload size={12} />
                          <span>Export CSV</span>
                        </button>
                        <button 
                          onClick={() => exportToPDF(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fee2e2',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          <FiDownload size={12} />
                          <span>Export PDF</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <span style={{
                fontSize: isMobile ? '12px' : '12px',
                color: '#6b7280'
              }}>
                Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalItems}</strong> Water Services
              </span>
              
              {searchQuery && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: '#e0f2fe',
                  borderRadius: '16px',
                  fontSize: isMobile ? '11px' : '11px',
                  color: '#0369a1'
                }}>
                  Filtered by: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#0369a1',
                    display: 'flex',
                    padding: '2px'
                  }}>
                    <FiX size={12} />
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Table/List Container */}
        <div style={{ 
          padding: '0', 
          overflowX: isMobile ? 'visible' : 'auto',
          maxHeight: 'calc(100vh - 400px)',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ margin: '0', fontSize: isMobile ? '14px' : '14px' }}>Loading Water Services...</p>
            </div>
          ) : error ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <FiAlertCircle style={{
                fontSize: isMobile ? '40px' : '48px',
                color: '#ef4444',
                marginBottom: '20px'
              }} />
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '600',
                color: '#111827'
              }}>Error Loading Water Services</h3>
              <p style={{
                margin: '0 0 24px 0',
                fontSize: isMobile ? '14px' : '14px',
                color: '#6b7280'
              }}>{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                style={{
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '14px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiRefreshCw />
                Try Again
              </motion.button>
            </div>
          ) : displayedServices.length > 0 ? (
            <>
              {/* Mobile Card View */}
              {isMobile && (
                <div style={{ padding: '16px' }}>
                  {displayedServices.map((service) => renderMobileCard(service))}
                </div>
              )}

              {/* Tablet and Desktop Table View */}
              {!isMobile && (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: isTablet ? '13px' : '14px',
                  minWidth: isTablet ? '1000px' : '1200px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#10b981',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'center',
                        width: '40px',
                        color: '#ffffff'
                      }}>
                        <div
                          onClick={handleSelectAll}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}
                        >
                          {selectAll ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        </div>
                      </th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Service Code</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Customer</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Contact</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Battery Info</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Warranty</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>AMC</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Created Date</th>
                      <th style={{
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: isTablet ? '11px' : '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedServices.map((service, index) => {
                      const warrantyInfo = getWarrantyInfo(service.warranty_status);
                      const amcInfo = getAmcInfo(service.amc_status);
                      const isSelected = selectedRows.has(service.id);
                      
                      return (
                        <MotionTr
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          onClick={() => handleServiceClick(service)}
                          style={{
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: isSelected ? '#eff6ff' : index % 2 === 0 ? '#fff' : '#fafafa',
                            cursor: 'pointer'
                          }}
                        >
                          <td style={{ 
                            padding: isTablet ? '12px' : '14px',
                            textAlign: 'center',
                            width: '40px'
                          }} onClick={(e) => e.stopPropagation()}>
                            <div
                              onClick={(e) => handleRowSelect(service.id, e)}
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#10b981' : '#6b7280'
                              }}
                            >
                              {isSelected ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                            </div>
                          </td>
                          <td style={{ 
                            padding: isTablet ? '12px' : '14px',
                            fontWeight: '600',
                            color: '#10b981'
                          }}>
                            {service.service_code}
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px' }}>
                            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px' }}>{service.customer_name}</div>
                            {service.customer_email && (
                              <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#6b7280' }}>{service.customer_email}</div>
                            )}
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4b5563' }}>
                              <FiPhone size={isTablet ? 11 : 12} />
                              <span style={{ fontSize: isTablet ? '12px' : '13px' }}>{service.customer_phone}</span>
                            </div>
                            {getAlternatePhone(service) && (
                              <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#94a3b8', marginTop: '4px' }}>
                                Alt: {getAlternatePhone(service)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: isTablet ? '28px' : '32px',
                                height: isTablet ? '28px' : '32px',
                                borderRadius: '6px',
                                backgroundColor: '#f0f9ff',
                                color: '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isTablet ? '14px' : '16px'
                              }}>
                                {getEquipmentIcon(service)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '500', fontSize: isTablet ? '12px' : '13px' }}>{getBatteryNames(service)}</div>
                                <div style={{ fontSize: isTablet ? '9px' : '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                                  {getBatterySerials(service)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: isTablet ? '10px' : '11px',
                              fontWeight: '500',
                              backgroundColor: warrantyInfo.bg,
                              color: warrantyInfo.text
                            }}>
                              {warrantyInfo.label}
                            </span>
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: isTablet ? '10px' : '11px',
                              fontWeight: '500',
                              backgroundColor: amcInfo.bg,
                              color: amcInfo.text
                            }}>
                              {amcInfo.label}
                            </span>
                          </td>
                          <td style={{ 
                            padding: isTablet ? '12px' : '14px',
                            fontSize: isTablet ? '11px' : '12px',
                            color: '#6b7280'
                          }}>
                            {formatDate(service.created_at)}
                          </td>
                          <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center' }}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceClick(service);
                              }}
                              style={{
                                padding: isTablet ? '5px 10px' : '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                fontSize: isTablet ? '11px' : '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <FiEye size={isTablet ? 11 : 12} />
                              View Payments
                            </motion.button>
                          </td>
                        </MotionTr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div style={{
              padding: isMobile ? '40px 16px' : '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{
                width: isMobile ? '60px' : '70px',
                height: isMobile ? '60px' : '70px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: isMobile ? '30px' : '35px',
                color: '#9ca3af'
              }}>
                <FiDroplet />
              </div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: '#374151'
              }}>No Water Services Found</h3>
              <p style={{
                margin: '0 0 20px 0',
                fontSize: isMobile ? '14px' : '14px',
                color: '#6b7280',
                padding: '0 16px'
              }}>
                {services.filter(s => !s.service_code?.toUpperCase().startsWith('INV')).length === 0 
                  ? 'No water services have been created yet'
                  : 'No results match your search or filters. Try adjusting your criteria.'
                }
              </p>
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  style={{
                    padding: isMobile ? '10px 20px' : '10px 24px',
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    backgroundColor: '#fff',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '14px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiXCircle />
                  Clear All Filters
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {displayedServices.length > 0 && totalPages > 1 && (
          <div style={{
            padding: isMobile ? '16px' : '20px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Showing all {totalItems} entries
            </div>

            <div style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* First Page Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiChevronsLeft size={14} />
              </motion.button>

              {/* Previous Page Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiChevronLeft size={14} />
                <span>Prev</span>
              </motion.button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === '...' || page === currentPage}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: page === currentPage ? '#10b981' : '#fff',
                    color: page === currentPage ? '#fff' : '#374151',
                    cursor: page === '...' ? 'default' : 'pointer',
                    fontSize: '13px',
                    minWidth: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {page}
                </motion.button>
              ))}

              {/* Next Page Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Next</span>
                <FiChevronRight size={14} />
              </motion.button>

              {/* Last Page Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiChevronsRight size={14} />
              </motion.button>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedRows.size > 0 && (
          <div style={{
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f0fdf4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600', color: '#166534' }}>
                {selectedRows.size} water service{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: isMobile ? '11px' : '12px',
                  cursor: 'pointer'
                }}
              >
                Clear Selection
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => exportToCSV(true)}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontSize: isMobile ? '12px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiDownload size={isMobile ? 12 : 14} />
                Export Selected
              </button>
              <button
                onClick={() => exportToPDF(true)}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: isMobile ? '12px' : '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiDownload size={isMobile ? 12 : 14} />
                PDF
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .filter-select:hover,
          .btn:hover,
          .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .filter-select:focus,
          input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16,185,129,0.1);
          }
          
          .date-range-picker input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16,185,129,0.1);
          }
          
          .btn.csv-btn:hover {
            background-color: #10b981 !important;
            color: white !important;
          }
          
          .btn.pdf-btn:hover {
            background-color: #ef4444 !important;
            color: white !important;
          }
          
          .btn.print-btn:hover {
            background-color: #8b5cf6 !important;
            color: white !important;
          }

          @media (max-width: 768px) {
            .staff-table {
              min-width: 600px;
            }
          }

          @media (max-width: 480px) {
            .staff-table {
              min-width: 100%;
            }
          }

          .table-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .table-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          .table-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `}</style>
      </div>

      {/* Payment History Modal */}
      <PaymentHistoryModal
        service={selectedService}
        isOpen={showPaymentHistoryModal}
        onClose={() => {
          setShowPaymentHistoryModal(false);
          setSelectedService(null);
        }}
        onAddPayment={handleAddPayment}
        onEditPayment={handleEditPayment}
        onDeletePayment={handlePaymentDelete}
      />

      {/* Add/Edit Payment Modal */}
      <PaymentModal
        payment={selectedPayment}
        service={selectedService}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        onSave={handlePaymentSave}
        onPaymentSuccess={handlePaymentSuccess}
        mode={paymentModalMode}
      />
    </>
  );
};

export default CardTab;
