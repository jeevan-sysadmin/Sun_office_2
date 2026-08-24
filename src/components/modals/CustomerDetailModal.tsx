import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiCalendar,
  FiClock,
  FiShoppingBag,
  FiEdit,
  FiFileText,
  FiMail,
  FiHome,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiCheck,
  FiGlobe,
  FiTrash2
} from "react-icons/fi";
import type { Customer } from "../types";

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: () => void;
  onDelete: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  open,
  onClose,
  customer,
  onEdit,
  onDelete
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [showFullAddress, setShowFullAddress] = React.useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  if (!open) return null;
  
  if (!customer) {
    console.error('CustomerDetailModal: customer is null');
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate customer stats
  const totalServices = customer.total_services || customer.service_count || 0;
  const hasMobile = customer.phone && customer.phone.toString().trim() !== '';
  const hasAlternatePhone = customer.alternate_phone && customer.alternate_phone.toString().trim() !== '';
  const hasEmail = customer.email && customer.email.trim() !== '';
  const hasAddress = customer.address && customer.address.trim() !== '';
  const hasNotes = customer.notes && customer.notes.trim() !== '';

  // Get customer tier based on services
  const getCustomerTier = () => {
    if (totalServices >= 10) return { name: 'Platinum', color: '#10b981', icon: FiAward, bg: '#d1fae5' };
    if (totalServices >= 5) return { name: 'Gold', color: '#f59e0b', icon: FiStar, bg: '#fed7aa' };
    if (totalServices >= 1) return { name: 'Silver', color: '#94a3b8', icon: FiTrendingUp, bg: '#f1f5f9' };
    return { name: 'New', color: '#3b82f6', icon: FiUser, bg: '#dbeafe' };
  };

  const customerTier = getCustomerTier();
  const TierIcon = customerTier.icon;

  // Get initials for avatar
  const getInitials = () => {
    return customer.full_name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Handle close - immediate close without delay
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    handleClose();
    // Small delay to ensure modal closes before opening edit
    setTimeout(() => {
      onEdit();
    }, 150);
  }, [handleClose, onEdit]);

  const handleDeleteClick = useCallback(() => {
    handleClose();
    setTimeout(() => {
      onDelete();
    }, 150);
  }, [handleClose, onDelete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '12px'
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              width: 'min(96vw, 1320px)',
              maxWidth: '1320px',
              minHeight: 'min(820px, 90vh)',
              maxHeight: '96vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '28px 32px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative Elements */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none'
              }} />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#667eea',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    {getInitials()}
                  </motion.div>
                  <div>
                    <h2 style={{
                      margin: 0,
                      fontSize: '26px',
                      fontWeight: '700',
                      color: 'white',
                      letterSpacing: '-0.5px'
                    }}>
                      {customer.full_name}
                    </h2>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'white',
                        fontFamily: 'monospace'
                      }}>
                        {customer.customer_code}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: customerTier.bg,
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        <TierIcon size={14} color={customerTier.color} />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: customerTier.color
                        }}>
                          {customerTier.name} Member
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '12px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '32px',
              maxHeight: 'calc(90vh - 140px)',
              overflowY: 'auto',
              scrollbarWidth: 'thin'
            }}>
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <motion.div
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    color: 'white'
                  }}
                >
                  <FiShoppingBag size={24} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalServices}</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Services</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    color: 'white'
                  }}
                >
                  <FiCalendar size={24} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {customer.last_service_date ? formatShortDate(customer.last_service_date) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Last Service</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    color: 'white'
                  }}
                >
                  <FiClock size={24} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatShortDate(customer.created_at)}</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Member Since</div>
                </motion.div>
              </div>

              {/* Contact Information */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FiUser style={{ color: '#667eea' }} />
                  Contact Information
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px'
                }}>
                  {/* Phone */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => hasMobile && copyToClipboard(customer.phone, 'phone')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiPhone size={16} color="white" />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Phone Number</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: hasMobile ? '#0f172a' : '#94a3b8' }}>{hasMobile ? customer.phone : 'Not provided'}</div>
                    {copiedField === 'phone' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '12px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FiCheck size={12} /> Copied
                      </motion.div>
                    )}
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    cursor: hasAlternatePhone ? 'pointer' : 'default',
                    opacity: hasAlternatePhone ? 1 : 0.6,
                    position: 'relative'
                  }}
                  onClick={() => hasAlternatePhone && copyToClipboard(customer.alternate_phone!, 'alternate_phone')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: hasAlternatePhone ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiPhone size={16} color="white" />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Alternate Phone</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: hasAlternatePhone ? '#0f172a' : '#94a3b8' }}>
                      {hasAlternatePhone ? customer.alternate_phone : 'Not provided'}
                    </div>
                    {copiedField === 'alternate_phone' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '12px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FiCheck size={12} /> Copied
                      </motion.div>
                    )}
                  </div>

                  {/* Email */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    cursor: hasEmail ? 'pointer' : 'default',
                    opacity: hasEmail ? 1 : 0.6,
                    position: 'relative'
                  }}
                  onClick={() => hasEmail && copyToClipboard(customer.email!, 'email')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: hasEmail ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiMail size={16} color="white" />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Email Address</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: hasEmail ? '#0f172a' : '#94a3b8', wordBreak: 'break-all' }}>
                      {hasEmail ? customer.email : 'Not provided'}
                    </div>
                    {copiedField === 'email' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '12px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FiCheck size={12} /> Copied
                      </motion.div>
                    )}
                  </div>

                  {/* Location Summary */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiGlobe size={16} color="white" />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Location</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                      {customer.city || 'N/A'}, {customer.state || 'N/A'}
                    </div>
                    {customer.zip_code && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        PIN: {customer.zip_code}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              {hasAddress && (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FiMapPin style={{ color: '#667eea' }} />
                    Address
                  </h3>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => copyToClipboard(customer.address!, 'address')}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <FiHome style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#334155',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {showFullAddress ? customer.address : `${customer.address!.substring(0, 100)}${customer.address!.length > 100 ? '...' : ''}`}
                        </p>
                        {customer.address!.length > 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFullAddress(!showFullAddress);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#667eea',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginTop: '8px',
                              fontWeight: '500'
                            }}
                          >
                            {showFullAddress ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </div>
                    {copiedField === 'address' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FiCheck size={12} /> Copied
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {hasNotes && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: '1px solid #fde047'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#854d0e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FiFileText />
                    Notes
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#713f12',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {customer.notes}
                  </p>
                </div>
              )}

              {/* System Information */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiClock size={18} />
                  System Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Created</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{formatDate(customer.created_at)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Last Updated</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{formatDate(customer.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 32px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Close
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteClick}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <FiTrash2 size={16} />
                Delete Customer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditClick}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <FiEdit size={16} />
                Edit Customer
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomerDetailModal;
