// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\components\modals\ProductDetailModal.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FiX,
  FiEdit,
  FiTrash2,
  FiBattery,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiInfo,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiHash
} from "react-icons/fi";
import "../css/ProductsTab.css";

interface Battery {
  id: number;
  battery_code: string;
  battery_model: string;
  battery_serial: string;
  brand: string;
  capacity: string;
  voltage: string;
  battery_type: string;
  category: string;
  status: string;
  claim_type: string;
  price: string;
  warranty_period: string;
  amc_period: string;
  battery_condition: string;
  is_spare: any;
  created_at: string;
  updated_at: string;
  total_services?: number;
  specifications?: string;
  purchase_date?: string;
  installation_date?: string;
  last_service_date?: string;
  warranty_expiry_date?: string;
  warranty_remarks?: string;
}

interface Inverter {
  id: number;
  inverter_code: string;
  inverter_model: string;
  inverter_serial: string; // Added serial field
  inverter_brand: string;
  power_rating: string;
  type: string;
  wave_type: string;
  input_voltage: string;
  output_voltage: string;
  efficiency: string;
  battery_voltage: string;
  specifications: string;
  warranty_period: string;
  price: string;
  status: string;
  purchase_date: string;
  installation_date: string;
  inverter_condition: string;
  created_at: string;
  updated_at: string;
}

interface ProductDetailModalProps {
  product: Battery | Inverter;
  productType: 'battery' | 'inverter';
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getBatteryTypeColor?: (type: string) => string;
  getConditionColor?: (condition: string) => string;
}

// Type guard to check if product is Battery
const isBattery = (product: Battery | Inverter): product is Battery => {
  return 'battery_code' in product;
};

// Type guard to check if product is Inverter
const isInverter = (product: Battery | Inverter): product is Inverter => {
  return 'inverter_code' in product;
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  productType,
  onClose,
  onEdit,
  onDelete,
  getBatteryTypeColor = (_type: string) => '#6b7280',
  getConditionColor = (_condition: string) => '#6b7280'
}) => {
  // Responsive breakpoints
  const breakpoints = {
    mobile: 640,
    tablet: 1024,
    laptop: 1280
  };

  // Window dimensions state
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Device type detection
  const isMobile = windowDimensions.width < breakpoints.mobile;
  const isTablet = windowDimensions.width >= breakpoints.mobile && windowDimensions.width < breakpoints.tablet;
  const isLaptop = windowDimensions.width >= breakpoints.tablet && windowDimensions.width < breakpoints.laptop;
  const isDesktop = windowDimensions.width >= breakpoints.laptop;

  // Grid columns based on device
  const getGridColumns = () => {
    if (isMobile) return '1fr';
    if (isTablet) return 'repeat(2, 1fr)';
    if (isLaptop) return 'repeat(3, 1fr)';
    return 'repeat(3, 1fr)'; // Desktop
  };

  // Modal width based on device
  const getModalWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '95%';
    if (isLaptop) return '90%';
    return '1000px'; // Desktop max width
  };

  // Font sizes based on device
  const getFontSize = (type: 'h1' | 'h2' | 'h3' | 'body' | 'small') => {
    if (isMobile) {
      switch(type) {
        case 'h1': return '24px';
        case 'h2': return '20px';
        case 'h3': return '16px';
        case 'body': return '14px';
        case 'small': return '12px';
        default: return '14px';
      }
    } else if (isTablet) {
      switch(type) {
        case 'h1': return '28px';
        case 'h2': return '22px';
        case 'h3': return '18px';
        case 'body': return '15px';
        case 'small': return '13px';
        default: return '15px';
      }
    } else {
      switch(type) {
        case 'h1': return '32px';
        case 'h2': return '24px';
        case 'h3': return '20px';
        case 'body': return '16px';
        case 'small': return '14px';
        default: return '16px';
      }
    }
  };

  // Padding based on device
  const getPadding = (type: 'modal' | 'section' | 'card') => {
    if (isMobile) {
      switch(type) {
        case 'modal': return '16px';
        case 'section': return '20px';
        case 'card': return '16px';
        default: return '16px';
      }
    } else if (isTablet) {
      switch(type) {
        case 'modal': return '20px';
        case 'section': return '24px';
        case 'card': return '20px';
        default: return '20px';
      }
    } else {
      switch(type) {
        case 'modal': return '24px';
        case 'section': return '24px';
        case 'card': return '20px';
        default: return '20px';
      }
    }
  };

  // Debug: Log the product data when component mounts
  useEffect(() => {
    console.log(`🔍 DEBUG - ${productType} data received in modal:`, product);
  }, [product, productType]);

  // Format price with Indian Rupees
  const formatPrice = (price: string | number): string => {
    if (!price) return '₹0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${numPrice.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format date based on device
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: isMobile ? 'short' : 'long',
        year: 'numeric'
      };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch {
      return 'Invalid Date';
    }
  };

  // Format date with time for desktop/tablet, without time for mobile
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      if (isMobile) {
        return new Date(dateString).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } else {
        return new Date(dateString).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return 'Invalid Date';
    }
  };

  // Calculate product age if purchase date exists
  const calculateAge = (): string => {
    const purchaseDate = isBattery(product) 
      ? product.purchase_date 
      : isInverter(product) 
        ? product.purchase_date 
        : undefined;
    
    if (!purchaseDate) return 'N/A';
    
    try {
      const purchase = new Date(purchaseDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - purchase.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        if (remainingMonths > 0) {
          return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
        }
        return `${years} year${years > 1 ? 's' : ''}`;
      }
    } catch {
      return 'N/A';
    }
  };

  // Get status badge color
  const getStatusDetails = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: '#10B98120', color: '#10B981', icon: FiCheckCircle };
      case 'in_service':
        return { bg: '#F59E0B20', color: '#F59E0B', icon: FiTool };
      case 'discontinued':
        return { bg: '#6B728020', color: '#6B7280', icon: FiX };
      case 'out_of_stock':
        return { bg: '#EF444420', color: '#EF4444', icon: FiPackage };
      case 'replaced':
        return { bg: '#8B5CF620', color: '#8B5CF6', icon: FiBattery };
      default:
        return { bg: '#6B728020', color: '#6B7280', icon: FiAlertCircle };
    }
  };

  // Get inverter type color
  const getInverterTypeColor = (type: string): string => {
    switch(type?.toLowerCase()) {
      case 'inverter': return '#3b82f6';
      case 'ups': return '#f59e0b';
      case 'solar': return '#10b981';
      case 'battery_charger': return '#8b5cf6';
      case 'stabilizer': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get wave type color
  const getWaveTypeColor = (waveType: string): string => {
    switch(waveType?.toLowerCase()) {
      case 'pure_sine': return '#10b981';
      case 'modified_sine': return '#f59e0b';
      case 'square_wave': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get status details
  const productStatus = isBattery(product) 
    ? product.status || 'active'
    : isInverter(product) 
      ? product.status || 'active'
      : 'active';
      
  const statusDetails = getStatusDetails(productStatus);
  const StatusIcon = statusDetails.icon;

  // Get product code
  const productCode = isBattery(product) 
    ? product.battery_code 
    : isInverter(product) 
      ? product.inverter_code 
      : 'N/A';

  // Get product model
  const productModel = isBattery(product) 
    ? product.battery_model 
    : isInverter(product) 
      ? product.inverter_model 
      : 'N/A';

  // Get product brand
  const productBrand = isBattery(product) 
    ? product.brand 
    : isInverter(product) 
      ? product.inverter_brand 
      : 'N/A';

  // Get product serial - NEW
  const productSerial = isBattery(product) 
    ? product.battery_serial 
    : isInverter(product) 
      ? product.inverter_serial 
      : 'N/A';

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : getPadding('modal'),
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease'
      }}
    >
      <motion.div 
        className={`modal-content product-detail-modal ${isBattery(product) ? 'battery-theme' : 'inverter-theme'}`}
        initial={{ 
          opacity: 0, 
          scale: isMobile ? 1 : 0.9, 
          y: isMobile ? 50 : 0 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0 
        }}
        exit={{ 
          opacity: 0, 
          scale: isMobile ? 1 : 0.9, 
          y: isMobile ? 50 : 0 
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: getModalWidth(),
          maxWidth: isDesktop ? '1000px' : 'none',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          boxShadow: isDesktop 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
            : '0 20px 40px -12px rgba(0, 0, 0, 0.2)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div 
          className="modal-header" 
          style={{
            padding: getPadding('section'),
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: isMobile ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
            background: isMobile ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
            zIndex: 10,
            borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0',
            color: isMobile ? 'white' : 'inherit',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '0'
          }}
        >
          <div className="modal-title" style={{ width: isMobile ? '100%' : 'auto' }}>
            <h2 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '10px' : '12px', 
              margin: 0, 
              fontSize: getFontSize('h2'),
              color: isMobile ? 'white' : '#1f2937',
              flexWrap: 'wrap'
            }}>
              {isBattery(product) ? (
                <FiBattery color={isMobile ? 'white' : '#3b82f6'} size={isMobile ? 24 : 28} />
              ) : (
                <FiZap color={isMobile ? 'white' : '#f59e0b'} size={isMobile ? 24 : 28} />
              )}
              {isBattery(product) ? 'Battery' : 'Inverter'} Details
            </h2>
            <p style={{ 
              margin: '6px 0 0', 
              color: isMobile ? 'rgba(255,255,255,0.9)' : '#6b7280', 
              fontSize: getFontSize('small')
            }}>
              {isBattery(product) ? 'Battery Code' : 'Inverter Code'}: {productCode}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            {/* Edit button in header for mobile */}
            {isMobile && (
              <motion.button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '10px 16px',
                  fontSize: getFontSize('body'),
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                <FiEdit size={18} /> Edit
              </motion.button>
            )}
            
            <motion.button 
              className="close-btn"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: isMobile ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                border: 'none',
                fontSize: isMobile ? '20px' : '18px',
                cursor: 'pointer',
                color: isMobile ? 'white' : '#6b7280',
                padding: isMobile ? '12px' : '10px',
                borderRadius: '8px',
                width: isMobile ? '48px' : '40px',
                height: isMobile ? '48px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isMobile ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <FiX size={isMobile ? 20 : 18} />
            </motion.button>
          </div>
        </div>
        
        {/* Content */}
        <div 
          className="product-detail-content" 
          style={{ 
            padding: getPadding('section'),
            backgroundColor: '#f8fafc',
            minHeight: isMobile ? 'calc(90vh - 120px)' : 'auto'
          }}
        >
          {/* Summary Card */}
          <div 
            className="summary-card" 
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? '16px' : '24px',
              padding: getPadding('card'),
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flex: isMobile ? '1' : '0 1 auto'
            }}>
              <div style={{
                width: isMobile ? '60px' : '70px',
                height: isMobile ? '60px' : '70px',
                borderRadius: '12px',
                background: isBattery(product) ? '#3b82f620' : '#f59e0b20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isBattery(product) ? (
                  <FiBattery size={isMobile ? 32 : 36} color="#3b82f6" />
                ) : (
                  <FiZap size={isMobile ? 32 : 36} color="#f59e0b" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: getFontSize('h3'), 
                  fontWeight: '600',
                  color: '#1e293b',
                  wordBreak: 'break-word'
                }}>
                  {productModel || 'N/A'}
                </h3>
                <p style={{ 
                  margin: '6px 0 0', 
                  fontSize: getFontSize('body'), 
                  color: '#64748b'
                }}>
                  {productBrand || 'N/A'}
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isMobile ? '12px' : '16px',
              marginLeft: isMobile ? '0' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'flex-end'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f1f5f9',
                padding: isMobile ? '10px 16px' : '8px 16px',
                borderRadius: '30px'
              }}>
                <FiPackage size={isMobile ? 16 : 14} color="#64748b" />
                <span style={{ 
                  fontSize: getFontSize('small'), 
                  color: '#1e293b', 
                  fontWeight: '500' 
                }}>
                  ID: #{product.id}
                </span>
              </div>
              
              <span 
                className="status-badge"
                style={{ 
                  backgroundColor: statusDetails.bg,
                  color: statusDetails.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '10px 20px' : '8px 16px',
                  borderRadius: '30px',
                  fontSize: getFontSize('small'),
                  fontWeight: '600',
                  border: `1px solid ${statusDetails.color}30`,
                  whiteSpace: 'nowrap'
                }}
              >
                <StatusIcon size={isMobile ? 16 : 14} />
                {productStatus?.replace(/_/g, ' ').toUpperCase() || 'ACTIVE'}
              </span>
            </div>
          </div>

          {isBattery(product) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '10px' : '14px',
                marginBottom: '22px'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '14px'
              }}>
                <div style={{ fontSize: getFontSize('small'), color: '#475569', marginBottom: '4px' }}>Capacity</div>
                <div style={{ fontSize: getFontSize('h3'), fontWeight: 700, color: '#0c4a6e' }}>{product.capacity || 'N/A'}</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #dcfce7 0%, #f8fafc 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '14px'
              }}>
                <div style={{ fontSize: getFontSize('small'), color: '#475569', marginBottom: '4px' }}>Voltage</div>
                <div style={{ fontSize: getFontSize('h3'), fontWeight: 700, color: '#14532d' }}>{product.voltage || 'N/A'}</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #f8fafc 100%)',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '14px'
              }}>
                <div style={{ fontSize: getFontSize('small'), color: '#475569', marginBottom: '4px' }}>Condition</div>
                <div style={{ fontSize: getFontSize('h3'), fontWeight: 700, color: '#92400e' }}>
                  {(product.battery_condition || 'N/A').replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ede9fe 0%, #f8fafc 100%)',
                border: '1px solid #ddd6fe',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '14px'
              }}>
                <div style={{ fontSize: getFontSize('small'), color: '#475569', marginBottom: '4px' }}>Total Services</div>
                <div style={{ fontSize: getFontSize('h3'), fontWeight: 700, color: '#4c1d95' }}>{product.total_services ?? 0}</div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div 
            className="product-detail-grid" 
            style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(),
              gap: isMobile ? '16px' : '20px'
            }}
          >
            {/* Basic Information - UPDATED WITH SERIAL */}
            <div 
              className="detail-section" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#3b82f6',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiPackage size={isMobile ? 16 : 18} color="#3b82f6" /> Basic Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    {isBattery(product) ? 'Battery Code:' : 'Inverter Code:'}
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '600', 
                    color: '#1f2937',
                    fontSize: getFontSize('body'),
                    wordBreak: 'break-word'
                  }}>
                    {productCode}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Model:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body'),
                    wordBreak: 'break-word'
                  }}>
                    {productModel || 'N/A'}
                  </span>
                </div>
                
                {/* SERIAL NUMBER - NOW SHOWS FOR BOTH BATTERY AND INVERTER */}
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    <FiHash size={12} /> Serial Number:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937', 
                    fontFamily: 'monospace',
                    fontSize: getFontSize('body'),
                    wordBreak: 'break-all'
                  }}>
                    {productSerial || 'N/A'}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Brand:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body'),
                    wordBreak: 'break-word'
                  }}>
                    {productBrand || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Specifications */}
            <div 
              className="detail-section" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#f59e0b',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiTool size={isMobile ? 16 : 18} color="#f59e0b" /> Specifications
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                {isBattery(product) ? (
                  // Battery Specifications
                  <>
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Battery Type:
                      </span>
                      <span 
                        className="detail-value"
                        style={{ 
                          color: getBatteryTypeColor(product.battery_type),
                          fontWeight: '600',
                          fontSize: getFontSize('body'),
                          wordBreak: 'break-word'
                        }}
                      >
                        {product.battery_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Category:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body'),
                        wordBreak: 'break-word'
                      }}>
                        {product.category?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Capacity:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.capacity || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Voltage:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.voltage || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Condition:
                      </span>
                      <span 
                        className="detail-value"
                        style={{ 
                          color: getConditionColor(product.battery_condition),
                          fontWeight: '600',
                          fontSize: getFontSize('body')
                        }}
                      >
                        {product.battery_condition?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    
                    {product.total_services !== undefined && (
                      <div className="detail-item" style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        gap: isMobile ? '4px' : '0'
                      }}>
                        <span className="detail-label" style={{ 
                          color: '#6b7280', 
                          fontSize: getFontSize('small'),
                          fontWeight: '500'
                        }}>
                          Total Services:
                        </span>
                        <span className="detail-value" style={{ 
                          fontWeight: '500', 
                          color: '#1f2937',
                          fontSize: getFontSize('body')
                        }}>
                          {product.total_services}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  // Inverter Specifications
                  <>
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Type:
                      </span>
                      <span 
                        className="detail-value"
                        style={{ 
                          color: getInverterTypeColor(product.type),
                          fontWeight: '600',
                          fontSize: getFontSize('body'),
                          wordBreak: 'break-word'
                        }}
                      >
                        {product.type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Power Rating:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.power_rating || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Wave Type:
                      </span>
                      <span 
                        className="detail-value"
                        style={{ 
                          color: getWaveTypeColor(product.wave_type),
                          fontWeight: '600',
                          fontSize: getFontSize('body')
                        }}
                      >
                        {product.wave_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Input Voltage:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.input_voltage || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Output Voltage:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.output_voltage || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Efficiency:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.efficiency || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Battery Voltage:
                      </span>
                      <span className="detail-value" style={{ 
                        fontWeight: '500', 
                        color: '#1f2937',
                        fontSize: getFontSize('body')
                      }}>
                        {product.battery_voltage || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="detail-item" style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span className="detail-label" style={{ 
                        color: '#6b7280', 
                        fontSize: getFontSize('small'),
                        fontWeight: '500'
                      }}>
                        Condition:
                      </span>
                      <span 
                        className="detail-value"
                        style={{ 
                          color: getConditionColor(product.inverter_condition),
                          fontWeight: '600',
                          fontSize: getFontSize('body')
                        }}
                      >
                        {product.inverter_condition?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Warranty & Pricing */}
            <div 
              className="detail-section" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#10b981',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiDollarSign size={isMobile ? 16 : 18} color="#10b981" /> Warranty & Pricing
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Price:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '700', 
                    color: '#059669',
                    fontSize: isMobile ? '18px' : '18px'
                  }}>
                    {formatPrice(product.price)}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Warranty Period:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body')
                  }}>
                    {product.warranty_period || 'N/A'}
                  </span>
                </div>
                
                {isBattery(product) && product.amc_period && (
                  <div className="detail-item" style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    gap: isMobile ? '4px' : '0'
                  }}>
                    <span className="detail-label" style={{ 
                      color: '#6b7280', 
                      fontSize: getFontSize('small'),
                      fontWeight: '500'
                    }}>
                      AMC Period:
                    </span>
                    <span className="detail-value" style={{ 
                      fontWeight: '500', 
                      color: '#1f2937',
                      fontSize: getFontSize('body')
                    }}>
                      {product.amc_period === "0" || product.amc_period === "0 year" ? "No AMC" : product.amc_period}
                    </span>
                  </div>
                )}
                
                {isBattery(product) && product.warranty_expiry_date && (
                  <div className="detail-item" style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    gap: isMobile ? '4px' : '0'
                  }}>
                    <span className="detail-label" style={{ 
                      color: '#6b7280', 
                      fontSize: getFontSize('small'),
                      fontWeight: '500'
                    }}>
                      Warranty Expiry:
                    </span>
                    <span className="detail-value" style={{ 
                      fontWeight: '500', 
                      color: '#1f2937',
                      fontSize: getFontSize('body')
                    }}>
                      {formatDate(product.warranty_expiry_date)}
                    </span>
                  </div>
                )}
                
                {isBattery(product) && product.warranty_remarks && (
                  <div className="detail-item" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <span className="detail-label" style={{ 
                      color: '#6b7280', 
                      fontSize: getFontSize('small'),
                      fontWeight: '500'
                    }}>
                      Warranty Remarks:
                    </span>
                    <span className="detail-value" style={{ 
                      fontWeight: '400', 
                      color: '#4b5563', 
                      fontSize: getFontSize('body'),
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      lineHeight: '1.6',
                      wordBreak: 'break-word'
                    }}>
                      {product.warranty_remarks}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dates Information */}
            <div 
              className="detail-section" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#8b5cf6',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiCalendar size={isMobile ? 16 : 18} color="#8b5cf6" /> Dates Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Purchase Date:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body')
                  }}>
                    {formatDate(isBattery(product) ? product.purchase_date : isInverter(product) ? product.purchase_date : undefined)}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Installation Date:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body')
                  }}>
                    {formatDate(isBattery(product) ? product.installation_date : isInverter(product) ? product.installation_date : undefined)}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Product Age:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body')
                  }}>
                    {calculateAge()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Created Information */}
            <div 
              className="detail-section" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#64748b',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiInfo size={isMobile ? 16 : 18} color="#64748b" /> Created Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Created Date:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937',
                    fontSize: getFontSize('body')
                  }}>
                    {formatDateTime(product.created_at)}
                  </span>
                </div>
                
                <div className="detail-item" style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span className="detail-label" style={{ 
                    color: '#6b7280', 
                    fontSize: getFontSize('small'),
                    fontWeight: '500'
                  }}>
                    Database ID:
                  </span>
                  <span className="detail-value" style={{ 
                    fontWeight: '500', 
                    color: '#1f2937', 
                    fontFamily: 'monospace',
                    fontSize: getFontSize('body')
                  }}>
                    #{product.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Specifications Details - Full Width */}
          {product.specifications && (
            <div 
              className="detail-section full-width" 
              style={{
                backgroundColor: '#fff',
                padding: getPadding('card'),
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                marginTop: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: getFontSize('h3'),
                color: '#3b82f6',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                <FiInfo size={isMobile ? 16 : 18} color="#3b82f6" /> Specifications Details
              </h3>
              
              <div 
                className="specifications-content" 
                style={{
                  backgroundColor: '#f8fafc',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{ 
                  margin: 0, 
                  color: '#4b5563', 
                  fontSize: getFontSize('body'), 
                  lineHeight: '1.7',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {product.specifications}
                </p>
              </div>
            </div>
          )}
          
          {/* Action Buttons - Only show on Tablet/Laptop/Desktop */}
          {!isMobile && (
            <div 
              className="product-detail-actions" 
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: '16px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '2px solid #e5e7eb'
              }}
            >
              <motion.button 
                className="btn danger"
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                whileHover={{ scale: 1.02, backgroundColor: '#fef2f2' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: isTablet ? '12px 28px' : '12px 32px',
                  background: isBattery(product)
                    ? 'linear-gradient(135deg, #1d4ed8 0%, #0f4c81 100%)'
                    : 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
                  border: isBattery(product)
                    ? '2px solid #1d4ed8'
                    : '2px solid #c2410c',
                  borderRadius: '10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: getFontSize('body'),
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: isBattery(product)
                    ? '0 4px 10px rgba(29, 78, 216, 0.28)'
                    : '0 4px 10px rgba(234, 88, 12, 0.28)'
                }}
              >
                <FiTrash2 size={isTablet ? 18 : 16} /> Delete {isBattery(product) ? 'Battery' : 'Inverter'}
              </motion.button>

              <motion.button 
                className="btn outline"
                onClick={onClose}
                whileHover={{ scale: 1.02, backgroundColor: '#f1f5f9' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: isTablet ? '12px 28px' : '12px 32px',
                  backgroundColor: 'transparent',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: getFontSize('body'),
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                Close
              </motion.button>
              
              <motion.button 
                className="btn primary"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: isTablet ? '12px 28px' : '12px 32px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: getFontSize('body'),
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <FiEdit size={isTablet ? 18 : 16} /> Edit {isBattery(product) ? 'Battery' : 'Inverter'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        .modal-content {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Custom scrollbar for all devices */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Better touch targets for mobile */
        @media (max-width: 640px) {
          button, 
          .status-badge,
          select,
          input,
          textarea {
            min-height: 48px;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
          
          .modal-content {
            max-height: 90vh;
          }
          
          /* Improve scrolling on mobile */
          .product-detail-content {
            padding-bottom: 30px;
          }
        }
        
        /* Tablet styles */
        @media (min-width: 641px) and (max-width: 1024px) {
          .modal-content {
            max-height: 85vh;
          }
          
          .detail-section:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
            transition: all 0.2s;
          }
        }
        
        /* Laptop/Desktop styles */
        @media (min-width: 1025px) {
          .modal-content {
            max-height: 85vh;
          }
          
          .detail-section {
            transition: all 0.2s;
          }
          
          .detail-section:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            transform: translateY(-4px);
            border-color: #3b82f6;
            transition: all 0.3s;
          }
          
          .btn.primary:hover {
            background-color: #2563eb;
            box-shadow: 0 6px 10px -2px rgba(59, 130, 246, 0.4);
          }
          
          .btn.outline:hover {
            border-color: #3b82f6;
            color: #3b82f6;
          }
        }
        
        /* Animations */
        .detail-item {
          transition: all 0.2s;
        }
        
        .detail-item:hover .detail-label {
          color: #3b82f6;
        }
        
        /* Prevent text overflow */
        .detail-value {
          max-width: 60%;
          text-align: right;
        }
        
        @media (max-width: 640px) {
          .detail-value {
            max-width: 100%;
            text-align: left;
          }
        }
        
        /* Loading animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }

        /* Battery Detail Full Theme */
        .product-detail-modal.battery-theme {
          background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
        }

        .product-detail-modal.battery-theme .modal-header {
          background: linear-gradient(135deg, #0f4c81 0%, #2563eb 48%, #22c1c3 100%) !important;
          color: #ffffff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18) !important;
        }

        .product-detail-modal.battery-theme .modal-header h2,
        .product-detail-modal.battery-theme .modal-header p {
          color: #ffffff !important;
        }

        .product-detail-modal.battery-theme .close-btn {
          background: rgba(255, 255, 255, 0.22) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        .product-detail-modal.battery-theme .product-detail-content {
          background:
            radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.10), transparent 35%),
            radial-gradient(circle at 90% 10%, rgba(34, 197, 94, 0.10), transparent 30%),
            #f8fafc !important;
        }

        .product-detail-modal.battery-theme .summary-card {
          border: 1px solid #bfdbfe !important;
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.12) !important;
          background: linear-gradient(135deg, #ffffff 0%, #eef6ff 100%) !important;
        }

        .product-detail-modal.battery-theme .status-badge {
          box-shadow: 0 4px 12px rgba(15, 76, 129, 0.12);
        }

        .product-detail-modal.battery-theme .detail-section {
          border: 1px solid #dbeafe !important;
          box-shadow: 0 6px 18px rgba(15, 76, 129, 0.08) !important;
          background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%) !important;
        }

        .product-detail-modal.battery-theme .detail-section:hover {
          border-color: #60a5fa !important;
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.16) !important;
          transform: translateY(-4px);
        }

        .product-detail-modal.battery-theme .detail-label {
          color: #64748b !important;
        }

        .product-detail-modal.battery-theme .detail-value {
          color: #0f172a !important;
          font-weight: 600;
        }

        .product-detail-modal.battery-theme .btn.primary {
          background: linear-gradient(135deg, #2563eb 0%, #0f4c81 100%) !important;
          border: 1px solid #1d4ed8 !important;
        }

        .product-detail-modal.battery-theme .btn.outline {
          border-color: #93c5fd !important;
          color: #1e3a8a !important;
          background: #ffffff;
        }

        /* Inverter Detail Full Theme */
        .product-detail-modal.inverter-theme {
          background: linear-gradient(180deg, #fff9f1 0%, #fffaf5 100%);
        }

        .product-detail-modal.inverter-theme .modal-header {
          background: linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #f59e0b 100%) !important;
          color: #ffffff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18) !important;
        }

        .product-detail-modal.inverter-theme .modal-header h2,
        .product-detail-modal.inverter-theme .modal-header p {
          color: #ffffff !important;
        }

        .product-detail-modal.inverter-theme .close-btn {
          background: rgba(255, 255, 255, 0.22) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        .product-detail-modal.inverter-theme .product-detail-content {
          background:
            radial-gradient(circle at 12% 0%, rgba(245, 158, 11, 0.14), transparent 35%),
            radial-gradient(circle at 88% 10%, rgba(234, 88, 12, 0.12), transparent 30%),
            #fffaf5 !important;
        }

        .product-detail-modal.inverter-theme .summary-card {
          border: 1px solid #fed7aa !important;
          box-shadow: 0 8px 22px rgba(234, 88, 12, 0.12) !important;
          background: linear-gradient(135deg, #ffffff 0%, #fff3e0 100%) !important;
        }

        .product-detail-modal.inverter-theme .status-badge {
          box-shadow: 0 4px 12px rgba(124, 45, 18, 0.12);
        }

        .product-detail-modal.inverter-theme .detail-section {
          border: 1px solid #fdba74 !important;
          box-shadow: 0 6px 18px rgba(124, 45, 18, 0.08) !important;
          background: linear-gradient(180deg, #ffffff 0%, #fff9f2 100%) !important;
        }

        .product-detail-modal.inverter-theme .detail-section:hover {
          border-color: #fb923c !important;
          box-shadow: 0 12px 26px rgba(234, 88, 12, 0.16) !important;
          transform: translateY(-4px);
        }

        .product-detail-modal.inverter-theme .detail-label {
          color: #7c2d12 !important;
          opacity: 0.78;
        }

        .product-detail-modal.inverter-theme .detail-value {
          color: #431407 !important;
          font-weight: 600;
        }

        .product-detail-modal.inverter-theme .btn.primary {
          background: linear-gradient(135deg, #ea580c 0%, #9a3412 100%) !important;
          border: 1px solid #c2410c !important;
        }

        .product-detail-modal.inverter-theme .btn.outline {
          border-color: #fdba74 !important;
          color: #9a3412 !important;
          background: #ffffff;
        }
      `}</style>
    </motion.div>
  );
};

export default ProductDetailModal;
