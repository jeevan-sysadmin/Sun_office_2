// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\components\modals\InverterServiceDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiEdit, 
  FiPrinter, 
  FiTrash2,
  FiCalendar,
  FiUser,
  FiServer,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';
import type { InverterService as SharedInverterService } from "../types";
import {
  badgeToneForStatus,
  formatReceiptLabel,
  openPrintReceipt,
  type ReceiptSection,
} from "../utils/receiptPrint";

export type InverterService = SharedInverterService;

interface InverterServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: InverterService | null;
  onEdit: (service: InverterService) => void;
  onDelete: (service: InverterService) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getWarrantyColor: (status: string) => string;
}

const InverterServiceDetailModal: React.FC<InverterServiceDetailModalProps> = ({
  isOpen,
  onClose,
  service: rawService,
  onEdit,
  onDelete,
  getStatusColor,
  getPaymentStatusColor,
  getWarrantyColor
}) => {
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check device type
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Guard clause - if no service or not open, return null
  if (!isOpen || !rawService) {
    return null;
  }

  const service = rawService;
  const selectedInverters = Array.isArray(service.inverters) ? service.inverters : [];
  const inverterModelsText = selectedInverters.length > 0
    ? selectedInverters.map((inv) => inv?.inverter_model).filter(Boolean).join(", ")
    : (service.inverter_model || "N/A");
  const inverterSerialsText = selectedInverters.length > 0
    ? selectedInverters.map((inv) => inv?.inverter_serial).filter(Boolean).join(", ")
    : (service.inverter_serial || "");
  const inverterBrandsText = selectedInverters.length > 0
    ? Array.from(new Set(selectedInverters.map((inv) => inv?.inverter_brand).filter(Boolean) as string[])).join(", ")
    : (service.inverter_brand || "");
  const inverterCards = selectedInverters.length > 0
    ? selectedInverters
    : [{
        id: service.inverter_id || 0,
        inverter_brand: service.inverter_brand || "",
        inverter_model: service.inverter_model || "",
        inverter_serial: service.inverter_serial || "",
        power_rating: service.inverter_power_rating || "",
        wave_type: service.inverter_wave_type || "",
        battery_voltage: ""
      }];

  // Format currency
  const formatCurrency = (amount?: number | string) => {
    if (amount === undefined || amount === null || amount === '' || amount === 0 || amount === '0' || amount === '0.00') {
      return '₹0.00';
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '₹0.00' : `₹${num.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: isMobile ? 'short' : 'short',
        day: 'numeric',
        hour: isMobile ? undefined : '2-digit',
        minute: isMobile ? undefined : '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format date only (without time)
  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: isMobile ? 'short' : 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get AMC status color
  const getAmcColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Print receipt
  const printReceipt = () => {
    const customerAddress = [
      service.customer_address,
      service.customer_city,
      service.customer_state,
      service.customer_zip ? `PIN ${service.customer_zip}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const finalAmount = formatCurrency(service.final_cost);
    const sections: ReceiptSection[] = [
      {
        title: "Customer Details",
        fields: [
          { label: "Customer Name", value: service.customer_name || "N/A" },
          { label: "Phone Number", value: service.customer_phone },
          { label: "Email Address", value: service.customer_email || null },
          { label: "Address", value: customerAddress || null, wide: true, multiline: true },
        ],
      },
      {
        title: "Inverter Details",
        fields: [
          { label: "Brand", value: inverterBrandsText || "N/A" },
          { label: "Model", value: inverterModelsText || "N/A" },
          { label: "Serial Number", value: inverterSerialsText || null },
          { label: "Power Rating", value: service.inverter_power_rating || "N/A" },
          { label: "Inverter Type", value: formatReceiptLabel(service.inverter_type) || null },
          { label: "Wave Type", value: formatReceiptLabel(service.inverter_wave_type) || null },
        ],
      },
      {
        title: "Service Summary",
        fields: [
          { label: "Service Type", value: formatReceiptLabel(service.service_type) || "Inverter Service" },
          { label: "Created On", value: formatDate(service.created_at) },
          {
            label: "Estimated Completion",
            value: service.estimated_completion_date ? formatDateOnly(service.estimated_completion_date) : null,
          },
          { label: "Technician", value: service.staff_name || null },
          { label: "Technician Email", value: service.staff_email || null },
          {
            label: "Issue Description",
            value: service.issue_description || "No issue description provided.",
            wide: true,
            multiline: true,
          },
          { label: "Additional Notes", value: service.notes || null, wide: true, multiline: true },
        ],
      },
    ];

    const opened = openPrintReceipt({
      documentTitle: `Inverter Service Receipt - ${service.service_code}`,
      serviceLine: "Inverter Service",
      receiptLabel: "Service Receipt",
      code: service.service_code,
      codeLabel: "Service Code",
      issuedOn: formatDateOnly(service.created_at),
      badges: [
        {
          label: `Status: ${formatReceiptLabel(service.status) || "Pending"}`,
          tone: badgeToneForStatus(service.status),
        },
        {
          label: `Warranty: ${formatReceiptLabel(service.warranty_status) || "Unknown"}`,
          tone: badgeToneForStatus(service.warranty_status),
        },
        {
          label: `AMC: ${formatReceiptLabel(service.amc_status) || "Unknown"}`,
          tone: badgeToneForStatus(service.amc_status),
        },
        {
          label: `Payment: ${formatReceiptLabel(service.payment_status) || "Pending"}`,
          tone: badgeToneForStatus(service.payment_status),
        },
      ],
      amount: {
        label: "Final Amount",
        value: finalAmount,
      },
      sections,
      footerTitle: "Thank you for choosing Sun Water Service.",
      footerNote: "Computer-generated inverter service receipt for Sun Water Service service records.",
      signatureLabels: ["Customer", service.staff_name || "Authorized By"],
    });

    if (!opened) {
      alert('Unable to start printing. Please try again.');
    }

    return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow?.document.write(`
        <html>
          <head>
            <title>Inverter Service Receipt - ${service.service_code}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
                color: #333;
                line-height: 1.6;
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .receipt { 
                max-width: ${isMobile ? '100%' : '400px'}; 
                margin: 0 auto;
                padding: ${isMobile ? '20px 15px' : '20px'};
                border: 1px solid #ddd;
                border-radius: 12px;
                background: #fff;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px;
                border-bottom: 2px solid #10b981;
                padding-bottom: 15px;
              }
              .header h2 {
                color: #10b981;
                margin: 0;
                font-size: ${isMobile ? '22px' : '24px'};
                font-weight: 600;
              }
              .header h3 {
                color: #334155;
                margin: 10px 0 5px;
                font-size: ${isMobile ? '16px' : '18px'};
                font-weight: 500;
              }
              .header p {
                margin: 5px 0;
                color: #64748b;
                font-size: ${isMobile ? '13px' : '14px'};
              }
              .section { 
                margin: 15px 0; 
                padding: 15px 0;
                border-bottom: 1px dashed #e2e8f0;
              }
              .section:last-child {
                border-bottom: none;
              }
              .section h4 {
                color: #475569;
                margin: 0 0 12px 0;
                font-size: ${isMobile ? '13px' : '14px'};
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
              }
              .section p {
                margin: 8px 0;
                font-size: ${isMobile ? '13px' : '14px'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
              }
              .section p strong {
                color: #1e293b;
                min-width: 120px;
              }
              .section p span {
                color: #334155;
                font-weight: 500;
                text-align: right;
                flex: 1;
              }
              .badge { 
                display: inline-block; 
                padding: 4px 10px; 
                border-radius: 20px; 
                font-size: ${isMobile ? '11px' : '11px'}; 
                margin: 2px;
                font-weight: 500;
                white-space: nowrap;
              }
              .footer {
                text-align: center;
                margin-top: 25px;
                color: #64748b;
                font-size: ${isMobile ? '11px' : '12px'};
                border-top: 1px dashed #e2e8f0;
                padding-top: 15px;
              }
              .footer p {
                margin: 5px 0;
              }
              .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin: 10px 0;
              }
              .info-item {
                background: #f8fafc;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
              }
              .info-item .label {
                color: #64748b;
                font-size: ${isMobile ? '11px' : '12px'};
                margin-bottom: 4px;
              }
              .info-item .value {
                color: #1e293b;
                font-weight: 600;
                font-size: ${isMobile ? '13px' : '14px'};
              }
              @media print {
                body { 
                  padding: 0; 
                  margin: 0;
                  background: white;
                }
                .receipt { 
                  border: none; 
                  box-shadow: none;
                  max-width: 100%;
                }
                @page {
                  margin: 15mm;
                }
              }
              @media (max-width: 480px) {
                body { padding: 10px; }
                .receipt { padding: 15px; }
                .section p {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 4px;
                }
                .section p strong {
                  min-width: auto;
                }
                .section p span {
                  text-align: left;
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>Sun Water Service Inverter Service</h2>
                <h3>Service Order Receipt</h3>
                <p><strong>Service Code:</strong> ${service.service_code}</p>
                <p><strong>Date:</strong> ${formatDateOnly(service.created_at)}</p>
              </div>
              
              <div class="section">
                <h4>Customer Information</h4>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Name</div>
                    <div class="value">${service.customer_name || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Phone</div>
                    <div class="value">${service.customer_phone}</div>
                  </div>
                  ${service.customer_email ? `
                  <div class="info-item">
                    <div class="label">Email</div>
                    <div class="value">${service.customer_email}</div>
                  </div>
                  ` : ''}
                </div>
                ${service.customer_address ? `
                <div style="margin-top: 10px;">
                  <div class="label">Address</div>
                  <div class="value">${service.customer_address}${service.customer_city ? `, ${service.customer_city}` : ''}${service.customer_state ? `, ${service.customer_state}` : ''}${service.customer_zip ? ` - ${service.customer_zip}` : ''}</div>
                </div>
                ` : ''}
              </div>
              
              <div class="section">
                <h4>Inverter Details</h4>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Brand</div>
                    <div class="value">${service.inverter_brand || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Model</div>
                    <div class="value">${service.inverter_model || 'N/A'}</div>
                  </div>
                  ${service.inverter_serial ? `
                  <div class="info-item">
                    <div class="label">Serial</div>
                    <div class="value">${service.inverter_serial}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="label">Power Rating</div>
                    <div class="value">${service.inverter_power_rating || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h4>Service Details</h4>
                <div class="info-item" style="margin-bottom: 10px;">
                  <div class="label">Issue</div>
                  <div class="value">${service.issue_description || 'No description'}</div>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                  <span class="badge" style="background: ${getStatusColor(service.status)}20; color: ${getStatusColor(service.status)}; border: 1px solid ${getStatusColor(service.status)};">
                    ${service.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span class="badge" style="background: ${getWarrantyColor(service.warranty_status)}20; color: ${getWarrantyColor(service.warranty_status)}; border: 1px solid ${getWarrantyColor(service.warranty_status)};">
                    Warranty: ${service.warranty_status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span class="badge" style="background: ${getAmcColor(service.amc_status)}20; color: ${getAmcColor(service.amc_status)}; border: 1px solid ${getAmcColor(service.amc_status)};">
                    AMC: ${service.amc_status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div class="section">
                <h4>Financial Details</h4>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Final Cost</div>
                    <div class="value">${formatCurrency(service.final_cost)}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Payment Status</div>
                    <div class="value" style="color: ${getPaymentStatusColor(service.payment_status || 'pending')}">
                      ${service.payment_status?.toUpperCase() || 'PENDING'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h4>Dates</h4>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Created</div>
                    <div class="value">${formatDateOnly(service.created_at)}</div>
                  </div>
                  ${service.estimated_completion_date ? `
                  <div class="info-item">
                    <div class="label">Est. Completion</div>
                    <div class="value">${formatDateOnly(service.estimated_completion_date)}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="label">Last Updated</div>
                    <div class="value">${formatDateOnly(service.updated_at)}</div>
                  </div>
                </div>
              </div>
              
              ${service.notes ? `
              <div class="section">
                <h4>Additional Notes</h4>
                <div class="info-item">
                  <div class="value" style="white-space: pre-line;">${service.notes}</div>
                </div>
              </div>
              ` : ''}
              
              ${service.staff_name ? `
              <div class="section">
                <h4>Assigned Technician</h4>
                <div class="info-item">
                  <div class="value">${service.staff_name}</div>
                  ${service.staff_email ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${service.staff_email}</div>` : ''}
                </div>
              </div>
              ` : ''}
              
              <div class="footer">
                <p>Thank you for choosing Sun Water Service Inverter Service</p>
                <p>For any queries, contact: +91 9876543210</p>
                <p>Support: Sun Water Service service desk</p>
                <p style="margin-top: 10px; font-style: italic; color: #94a3b8;">This is a computer generated receipt</p>
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow?.document.close();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && service && (
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
            padding: isMobile ? '0' : '20px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div 
            className="modal-content"
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
              maxWidth: isMobile ? '100%' : isTablet ? '800px' : '1000px',
              width: '100%',
              maxHeight: isMobile ? '90vh' : '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '20px 20px 0 0' : '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              border: '1px solid #e5e7eb'
            }}
          >
            {/* Header with Gradient - Responsive */}
            <div style={{
              padding: isMobile ? '16px 20px' : '24px 28px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: 'white',
              borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '8px' : '12px',
                  color: 'white',
                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                  <FiServer style={{ fontSize: isMobile ? '24px' : '28px' }} />
                  Inverter Service Details
                </h2>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  gap: isMobile ? '8px' : '16px', 
                  marginTop: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    fontSize: isMobile ? '13px' : '15px', 
                    opacity: '0.9',
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    Service Code: <strong>{service.service_code}</strong>
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: isMobile ? '4px 12px' : '4px 16px',
                    borderRadius: '30px',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: '600',
                    backgroundColor: 'white',
                    color: getStatusColor(service.status),
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {service.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <motion.button 
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  fontSize: isMobile ? '20px' : '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <FiX />
              </motion.button>
            </div>
            
            {/* Body - Responsive */}
            <div style={{ 
              padding: isMobile ? '16px' : '28px', 
              background: '#f8fafc'
            }}>
              {/* Summary Cards - Responsive Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: isMobile ? '12px' : '20px',
                marginBottom: isMobile ? '20px' : '28px'
              }}>
                {/* Payment Card */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '14px' : '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: isMobile ? '36px' : '40px',
                      height: isMobile ? '36px' : '40px',
                      borderRadius: '10px',
                      background: `${getPaymentStatusColor(service.payment_status || 'pending')}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiDollarSign style={{ color: getPaymentStatusColor(service.payment_status || 'pending'), fontSize: isMobile ? '18px' : '20px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#64748b', display: 'block' }}>Payment Status</span>
                      <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: '#1e293b' }}>
                        {service.payment_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: '4px',
                    background: '#e2e8f0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: service.payment_status === 'paid' ? '100%' : '0%',
                      height: '100%',
                      background: getPaymentStatusColor(service.payment_status || 'pending'),
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>

                {/* Warranty Card */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '14px' : '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: isMobile ? '36px' : '40px',
                      height: isMobile ? '36px' : '40px',
                      borderRadius: '10px',
                      background: `${getWarrantyColor(service.warranty_status)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiCheckCircle style={{ color: getWarrantyColor(service.warranty_status), fontSize: isMobile ? '18px' : '20px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#64748b', display: 'block' }}>Warranty</span>
                      <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: '#1e293b' }}>
                        {service.warranty_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Cost Card */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '14px' : '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  gridColumn: isTablet ? 'span 2' : 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: isMobile ? '36px' : '40px',
                      height: isMobile ? '36px' : '40px',
                      borderRadius: '10px',
                      background: '#10b98115',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiDollarSign style={{ color: '#10b981', fontSize: isMobile ? '18px' : '20px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#64748b', display: 'block' }}>Final Cost</span>
                      <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#059669' }}>
                        {formatCurrency(service.final_cost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Details Grid - Responsive */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                gap: isMobile ? '12px' : '20px'
              }}>
                {/* Customer Information */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  gridColumn: isMobile ? 'span 1' : 'span 1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: isMobile ? '15px' : '16px', 
                    fontWeight: '600',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px'
                  }}>
                    <FiUser style={{ fontSize: isMobile ? '16px' : '18px' }} />
                    Customer Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Name:</span>
                      <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>{service.customer_name || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Phone:</span>
                      <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>{service.customer_phone}</span>
                    </div>
                    {service.customer_email && (
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                        <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Email:</span>
                        <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500', wordBreak: 'break-all' }}>{service.customer_email}</span>
                      </div>
                    )}
                    {service.customer_address && (
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? '4px' : '0' }}>
                        <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Address:</span>
                        <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500', textAlign: isMobile ? 'left' : 'right', maxWidth: isMobile ? '100%' : '250px' }}>
                          {service.customer_address}
                          {service.customer_city && `, ${service.customer_city}`}
                          {service.customer_state && `, ${service.customer_state}`}
                          {service.customer_zip && ` - ${service.customer_zip}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inverter Information */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  gridColumn: isMobile ? 'span 1' : 'span 1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: isMobile ? '15px' : '16px', 
                    fontWeight: '600',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px'
                  }}>
                    <FiServer style={{ fontSize: isMobile ? '16px' : '18px' }} />
                    Inverter Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '12px' }}>
                    {inverterCards.map((inv: any, index: number) => (
                      <div
                        key={`${inv.id || 'inv'}-${index}`}
                        style={{
                          border: '1px solid #dbeafe',
                          background: '#f8fbff',
                          borderRadius: '10px',
                          padding: isMobile ? '10px' : '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginBottom: '8px' }}>
                          Inverter {index + 1}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: isMobile ? '12px' : '13px' }}>Brand:</span>
                            <span style={{ color: '#1e293b', fontSize: isMobile ? '13px' : '14px', fontWeight: 500 }}>{inv.inverter_brand || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: isMobile ? '12px' : '13px' }}>Model:</span>
                            <span style={{ color: '#1e293b', fontSize: isMobile ? '13px' : '14px', fontWeight: 500 }}>{inv.inverter_model || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: isMobile ? '12px' : '13px' }}>Serial:</span>
                            <span style={{ color: '#1e293b', fontSize: isMobile ? '13px' : '14px', fontWeight: 500, fontFamily: 'monospace' }}>{inv.inverter_serial || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: isMobile ? '12px' : '13px' }}>Power Rating:</span>
                            <span style={{ color: '#1e293b', fontSize: isMobile ? '13px' : '14px', fontWeight: 500 }}>{inv.power_rating || service.inverter_power_rating || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: isMobile ? '12px' : '13px' }}>Type:</span>
                            <span style={{ color: '#1e293b', fontSize: isMobile ? '13px' : '14px', fontWeight: 500 }}>{service.inverter_type || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issue Description - Full Width on Mobile */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  gridColumn: isMobile ? 'span 1' : 'span 2',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: isMobile ? '15px' : '16px', 
                    fontWeight: '600',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px'
                  }}>
                    <FiAlertCircle style={{ fontSize: isMobile ? '16px' : '18px' }} />
                    Issue Description
                  </h3>
                  <div style={{
                    padding: isMobile ? '12px' : '16px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#991b1b',
                    lineHeight: '1.6',
                    wordBreak: 'break-word'
                  }}>
                    {service.issue_description || 'No description provided'}
                  </div>
                </div>

                {/* Financial Details */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  gridColumn: isMobile ? 'span 1' : 'span 1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: isMobile ? '15px' : '16px', 
                    fontWeight: '600',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px'
                  }}>
                    <FiDollarSign style={{ fontSize: isMobile ? '16px' : '18px' }} />
                    Financial Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Final Cost:</span>
                      <span style={{ color: '#059669', fontSize: isMobile ? '16px' : '18px', fontWeight: '700' }}>
                        {formatCurrency(service.final_cost)}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? '8px' : '0',
                      marginTop: '8px',
                      paddingTop: '12px',
                      borderTop: '2px dashed #e2e8f0'
                    }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Payment Status:</span>
                      <span style={{
                        display: 'inline-block',
                        padding: isMobile ? '4px 12px' : '6px 16px',
                        borderRadius: '30px',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: '600',
                        background: `${getPaymentStatusColor(service.payment_status || 'pending')}15`,
                        color: getPaymentStatusColor(service.payment_status || 'pending'),
                        border: `1px solid ${getPaymentStatusColor(service.payment_status || 'pending')}30`
                      }}>
                        {service.payment_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div style={{
                  background: 'white',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  gridColumn: isMobile ? 'span 1' : 'span 1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: isMobile ? '15px' : '16px', 
                    fontWeight: '600',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '12px'
                  }}>
                    <FiCalendar style={{ fontSize: isMobile ? '16px' : '18px' }} />
                    Dates
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Created:</span>
                      <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>
                        {formatDate(service.created_at)}
                      </span>
                    </div>
                    {service.estimated_completion_date && (
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                        <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Est. Completion:</span>
                        <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>
                          {formatDateOnly(service.estimated_completion_date)}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Last Updated:</span>
                      <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>
                        {formatDate(service.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Staff */}
                {service.staff_name && (
                  <div style={{
                    background: 'white',
                    padding: isMobile ? '16px' : '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    gridColumn: isMobile ? 'span 1' : 'span 1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      fontSize: isMobile ? '15px' : '16px', 
                      fontWeight: '600',
                      color: '#8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: '12px'
                    }}>
                      <FiUser style={{ fontSize: isMobile ? '16px' : '18px' }} />
                      Assigned Technician
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                        <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Name:</span>
                        <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>{service.staff_name}</span>
                      </div>
                      {service.staff_email && (
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '4px' : '0' }}>
                          <span style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px' }}>Email:</span>
                          <span style={{ color: '#1e293b', fontSize: isMobile ? '14px' : '14px', fontWeight: '500', wordBreak: 'break-all' }}>{service.staff_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes - Full Width */}
                {service.notes && (
                  <div style={{
                    background: 'white',
                    padding: isMobile ? '16px' : '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    gridColumn: isMobile ? 'span 1' : 'span 2',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    marginTop: isMobile ? '0' : '0'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      fontSize: isMobile ? '15px' : '16px', 
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: '12px'
                    }}>
                      <FiFileText style={{ fontSize: isMobile ? '16px' : '18px' }} />
                      Additional Notes
                    </h3>
                    <div style={{
                      padding: isMobile ? '12px' : '16px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: isMobile ? '13px' : '14px',
                      color: '#334155',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word'
                    }}>
                      {service.notes}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer Actions - Responsive */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                justifyContent: 'flex-end',
                gap: isMobile ? '10px' : '12px',
                marginTop: isMobile ? '20px' : '28px',
                paddingTop: isMobile ? '16px' : '20px',
                borderTop: '2px solid #e2e8f0'
              }}>
                <motion.button 
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiX size={isMobile ? 18 : 16} /> Close
                </motion.button>
                <motion.button 
                  onClick={() => onDelete(service)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiTrash2 size={isMobile ? 18 : 16} /> Delete Service
                </motion.button>
                <motion.button 
                  onClick={() => onEdit(service)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiEdit size={isMobile ? 18 : 16} /> Edit Service
                </motion.button>
                <motion.button 
                  onClick={printReceipt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiPrinter size={isMobile ? 18 : 16} /> Print Receipt
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modal-content {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Custom scrollbar */
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
          button, .badge {
            min-height: 44px;
          }
          
          .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default InverterServiceDetailModal;
