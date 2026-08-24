// src/components/modals/ServiceDetailModal.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiUser,
  FiBattery,
  FiPower,
  FiCalendar,
  FiFileText,
  FiEdit,
  FiPrinter,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUsers,
  FiTag,
  FiClock,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import type { ServiceOrder } from "../types";
import {
  badgeToneForStatus,
  formatReceiptLabel,
  openPrintReceipt,
  type ReceiptSection,
} from "../utils/receiptPrint";

interface ServiceDetailModalProps {
  service: ServiceOrder;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getWarrantyColor?: (status: string) => string;
  getClaimColor: (claim: string) => string;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onEdit,
  onDelete,
  getWarrantyColor = () => "#6B7280",
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

  // Format currency
  const formatCurrency = (amount?: string) => {
    if (!amount || amount === '0.00' || amount === '0') return '';
    const num = parseFloat(amount);
    return isNaN(num) ? '' : `₹${num.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: isMobile ? 'short' : 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format date with time
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get service staff information
  const getStaffInfo = () => {
    const staffName = service.service_staff_name || 
                     service.staff_name || 
                     service.assigned_staff || 
                     service.technician || 
                     (service.staff && service.staff.name) || 
                     null;
    
    const staffEmail = service.service_staff_email || 
                      service.staff_email || 
                      (service.staff && service.staff.email) || 
                      null;
    
    const staffPhone = service.service_staff_phone || 
                      service.staff_phone || 
                      (service.staff && service.staff.phone) || 
                      null;
    
    const staffRole = service.service_staff_role || 
                     service.staff_role || 
                     (service.staff && service.staff.role) || 
                     null;
    
    return { staffName, staffEmail, staffPhone, staffRole };
  };

  // Get inverter information with all available fields
  const getInverterInfo = () => {
    return {
      // Basic Info
      id: service.inverter_id || null,
      code: service.inverter_code || null,
      model: service.inverter_model || null,
      serial: service.inverter_serial || null,
      brand: service.inverter_brand || null,
      
      // Specifications
      powerRating: service.inverter_power_rating || service.power_rating || service.inverter_capacity || null,
      type: service.inverter_type || service.type || null,
      waveType: service.inverter_wave_type || service.wave_type || null,
      
      // Electrical Specs
      inputVoltage: service.inverter_input_voltage || service.input_voltage || null,
      outputVoltage: service.inverter_output_voltage || service.output_voltage || null,
      efficiency: service.inverter_efficiency || service.efficiency || null,
      batteryVoltage: service.inverter_battery_voltage || service.battery_voltage || null,
      
      // Additional Info
      specifications: service.inverter_specifications || service.specifications || null,
      warrantyPeriod: service.inverter_warranty_period || service.warranty_period || null,
      price: service.inverter_price || service.price || null,
      status: service.inverter_status || service.status || null,
      
      // Dates
      purchaseDate: service.inverter_purchase_date || service.purchase_date || null,
      installationDate: service.inverter_installation_date || service.installation_date || null,
      condition: service.inverter_condition || service.condition || null
    };
  };

  // Get battery information
  const getBatteryInfo = () => {
    return {
      id: service.battery_id || null,
      code: service.battery_code || null,
      model: service.battery_model || null,
      serial: service.battery_serial || null,
      brand: service.battery_brand || null,
      capacity: service.battery_capacity || null,
      type: service.battery_type || null,
      voltage: service.battery_voltage || null,
      warranty: service.battery_warranty || null
    };
  };

  const getBatteryList = () => {
    const list = Array.isArray((service as any).batteries) ? (service as any).batteries : [];
    if (list.length > 0) return list;
    if (service.battery_model || service.battery_serial || service.battery_id) {
      return [{
        id: service.battery_id || null,
        battery_model: service.battery_model || null,
        battery_serial: service.battery_serial || null,
        brand: service.battery_brand || null,
        capacity: service.battery_capacity || null,
        voltage: service.battery_voltage || null,
        battery_type: service.battery_type || null
      }];
    }
    return [];
  };

  const getInverterList = () => {
    const list = Array.isArray((service as any).inverters) ? (service as any).inverters : [];
    if (list.length > 0) return list;
    if (service.inverter_model || service.inverter_serial || service.inverter_id) {
      return [{
        id: service.inverter_id || null,
        inverter_model: service.inverter_model || null,
        inverter_serial: service.inverter_serial || null,
        inverter_brand: service.inverter_brand || null,
        power_rating: service.inverter_power_rating || service.inverter_capacity || null,
        wave_type: service.inverter_wave_type || null,
        battery_voltage: service.inverter_battery_voltage || null
      }];
    }
    return [];
  };

  // Enhanced print receipt with all inverter data
  const printReceipt = () => {
    const { staffName, staffEmail, staffPhone, staffRole } = getStaffInfo();
    const inverter = getInverterInfo();
    const battery = getBatteryInfo();

    const amountValue = formatCurrency(service.final_cost || service.estimated_cost);
    const depositValue = formatCurrency(service.deposit_amount);
    const sections: ReceiptSection[] = [
      {
        title: "Customer Details",
        fields: [
          { label: "Customer Name", value: service.customer_name },
          { label: "Phone Number", value: service.customer_phone },
          { label: "Alternate Phone", value: service.customer_alternate_phone || null },
          { label: "Email Address", value: service.customer_email || null },
          {
            label: "Address",
            value: service.customer_address || null,
            wide: true,
            multiline: true,
          },
        ],
      },
      {
        title: "Product Details",
        fields: [
          { label: "Battery Model", value: battery.model },
          { label: "Battery Serial", value: battery.serial },
          { label: "Inverter Model", value: inverter.model },
          { label: "Inverter Serial", value: inverter.serial },
          { label: "Power Rating", value: inverter.powerRating ? `${inverter.powerRating} VA` : null },
          { label: "Replacement Serial", value: service.replacement_battery_serial || null },
        ],
      },
      {
        title: "Service Summary",
        fields: [
          { label: "Service Type", value: formatReceiptLabel(service.service_type) || "General Service" },
          { label: "Priority", value: formatReceiptLabel(service.priority) || "Standard" },
          { label: "Created On", value: formatDateTime(service.created_at) },
          {
            label: "Estimated Completion",
            value: service.estimated_completion_date ? formatDate(service.estimated_completion_date) : null,
          },
          { label: "Assigned Staff", value: staffName || "Not Assigned Yet" },
          { label: "Deposit Received", value: depositValue || null },
          {
            label: "Issue Description",
            value: service.issue_description || "No issue description provided.",
            wide: true,
            multiline: true,
          },
          { label: "Internal Notes", value: service.notes || null, wide: true, multiline: true },
        ],
      },
      {
        title: "Billing and Support",
        fields: [
          { label: "Claim Type", value: formatReceiptLabel(service.battery_claim) },
          { label: "Staff Role", value: staffRole || null },
          { label: "Staff Email", value: staffEmail || null },
          { label: "Staff Phone", value: staffPhone || null },
        ],
      },
    ];

    const opened = openPrintReceipt({
      documentTitle: `Service Receipt - ${service.service_code}`,
      serviceLine: "Battery and Inverter Service",
      receiptLabel: "Service Receipt",
      code: service.service_code,
      codeLabel: "Service Code",
      issuedOn: formatDateTime(service.created_at),
      badges: [
        {
          label: `Status: ${formatReceiptLabel(service.status) || "Pending"}`,
          tone: badgeToneForStatus(service.status),
        },
        {
          label: `Warranty: ${formatReceiptLabel(service.warranty_status) || "Out Of Warranty"}`,
          tone: badgeToneForStatus(service.warranty_status),
        },
        {
          label: `AMC: ${formatReceiptLabel(service.amc_status) || "No AMC"}`,
          tone: badgeToneForStatus(service.amc_status),
        },
        {
          label: `Payment: ${formatReceiptLabel(service.payment_status) || "Pending"}`,
          tone: badgeToneForStatus(service.payment_status),
        },
      ],
      amount: amountValue
        ? {
            label: service.final_cost ? "Final Amount" : "Estimated Amount",
            value: amountValue,
            helper: depositValue ? `Deposit received: ${depositValue}` : null,
          }
        : null,
      sections,
      footerTitle: "Thank you for choosing Sun Water Service.",
      footerNote: "Computer-generated service receipt for Sun Water Service support and service records.",
      signatureLabels: ["Customer", staffName || "Authorized By"],
    });

    if (!opened) {
      alert("Unable to start printing. Please try again.");
    }

    return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow?.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Service Receipt - ${service.service_code}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
                padding: 30px 20px; 
                background: #f3f4f6;
                color: #1f2937;
                line-height: 1.5;
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .receipt { 
                max-width: ${isMobile ? '100%' : '500px'}; 
                margin: 0 auto;
                padding: ${isMobile ? '25px 20px' : '30px'};
                background: #fff;
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                border: 1px solid #e5e7eb;
              }
              
              .header { 
                text-align: center; 
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 2px solid #10b981;
              }
              
              .header h2 {
                color: #10b981;
                margin: 0 0 10px 0;
                font-size: ${isMobile ? '26px' : '28px'};
                font-weight: 700;
                letter-spacing: -0.5px;
              }
              
              .header h3 {
                color: #374151;
                margin: 0 0 8px 0;
                font-size: ${isMobile ? '18px' : '20px'};
                font-weight: 600;
              }
              
              .header p {
                margin: 5px 0;
                color: #6b7280;
                font-size: ${isMobile ? '13px' : '14px'};
              }
              
              .badge {
                display: inline-block;
                padding: 6px 16px;
                background: #f3f4f6;
                border-radius: 100px;
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                margin-top: 10px;
              }
              
              .section { 
                margin: 20px 0; 
                padding: 15px;
                background: #f9fafb;
                border-radius: 16px;
                border: 1px solid #e5e7eb;
              }
              
              .section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #374151;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
              }
              
              .section-title i {
                color: #10b981;
              }
              
              .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
              }
              
              .info-item {
                background: #fff;
                padding: 12px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
              }
              
              .info-item .label {
                color: #6b7280;
                font-size: 12px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
              }
              
              .info-item .value {
                color: #111827;
                font-weight: 600;
                font-size: 14px;
                word-break: break-word;
              }
              
              .specs-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
              }
              
              .spec-item {
                background: #fff;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
              }
              
              .spec-item .label {
                color: #6b7280;
                font-size: 11px;
                margin-bottom: 2px;
              }
              
              .spec-item .value {
                color: #111827;
                font-weight: 600;
                font-size: 13px;
              }
              
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px dashed #e5e7eb;
                padding-top: 20px;
              }
              
              .footer p {
                margin: 5px 0;
              }
              
              .signature {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
                padding: 0 20px;
              }
              
              .signature-line {
                width: 200px;
                border-top: 1px dashed #9ca3af;
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
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
                  padding: 20px;
                }
                .section {
                  break-inside: avoid;
                }
                @page {
                  margin: 15mm;
                }
              }
              
              @media (max-width: 480px) {
                body { padding: 15px; }
                .receipt { padding: 20px; }
                .grid {
                  grid-template-columns: 1fr;
                }
                .specs-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <!-- Header -->
              <div class="header">
                <h2>âš¡ SUN POWERS</h2>
                <h3>Battery & Inverter Service</h3>
                <div class="badge">Service Order Receipt</div>
                <p style="margin-top: 15px;"><strong>Service Code:</strong> ${service.service_code}</p>
                <p><strong>Date:</strong> ${formatDateTime(service.created_at)}</p>
                <p><strong>Status:</strong> ${service.status?.toUpperCase() || 'PENDING'}</p>
              </div>
              
              <!-- Customer Information -->
              <div class="section">
                <div class="section-title">
                  <span>ðŸ‘¤</span> Customer Information
                </div>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">ðŸ“‹ Name</div>
                    <div class="value">${service.customer_name}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">ðŸ“ž Phone</div>
                    <div class="value">${service.customer_phone}</div>
                  </div>
                  ${service.customer_email ? `
                  <div class="info-item">
                    <div class="label">âœ‰ï¸ Email</div>
                    <div class="value">${service.customer_email}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Battery Details (if available) -->
              ${battery.model ? `
              <div class="section">
                <div class="section-title">
                  <span>ðŸ”‹</span> Battery Details
                </div>
                <div class="grid">
                  ${battery.code ? `
                  <div class="info-item">
                    <div class="label">ðŸ”‘ Code</div>
                    <div class="value">${battery.code}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="label">ðŸ“Š Model</div>
                    <div class="value">${battery.model}</div>
                  </div>
                  ${battery.serial ? `
                  <div class="info-item">
                    <div class="label">ðŸ”¢ Serial</div>
                    <div class="value">${battery.serial}</div>
                  </div>
                  ` : ''}
                  ${battery.brand ? `
                  <div class="info-item">
                    <div class="label">ðŸ­ Brand</div>
                    <div class="value">${battery.brand}</div>
                  </div>
                  ` : ''}
                  ${battery.capacity ? `
                  <div class="info-item">
                    <div class="label">ðŸ“ˆ Capacity</div>
                    <div class="value">${battery.capacity}</div>
                  </div>
                  ` : ''}
                  ${battery.type ? `
                  <div class="info-item">
                    <div class="label">âš¡ Type</div>
                    <div class="value">${battery.type}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              
              <!-- Inverter Details (ENHANCED SECTION) -->
              ${inverter.model ? `
              <div class="section">
                <div class="section-title">
                  <span>âš¡</span> Inverter Details
                </div>
                
                <!-- Basic Info -->
                <div class="grid" style="margin-bottom: 15px;">
                  ${inverter.code ? `
                  <div class="info-item">
                    <div class="label">ðŸ”‘ Inverter Code</div>
                    <div class="value">${inverter.code}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="label">ðŸ“Š Model</div>
                    <div class="value">${inverter.model}</div>
                  </div>
                  ${inverter.serial ? `
                  <div class="info-item">
                    <div class="label">ðŸ”¢ Serial Number</div>
                    <div class="value">${inverter.serial}</div>
                  </div>
                  ` : ''}
                  ${inverter.brand ? `
                  <div class="info-item">
                    <div class="label">ðŸ­ Brand</div>
                    <div class="value">${inverter.brand}</div>
                  </div>
                  ` : ''}
                </div>
                
                <!-- Specifications -->
                <div style="margin-top: 15px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 14px;">ðŸ“‹ Specifications</div>
                  <div class="specs-grid">
                    ${inverter.powerRating ? `
                    <div class="spec-item">
                      <div class="label">Power Rating</div>
                      <div class="value">${inverter.powerRating}VA</div>
                    </div>
                    ` : ''}
                    ${inverter.type ? `
                    <div class="spec-item">
                      <div class="label">Type</div>
                      <div class="value">${inverter.type}</div>
                    </div>
                    ` : ''}
                    ${inverter.waveType ? `
                    <div class="spec-item">
                      <div class="label">Wave Type</div>
                      <div class="value">${formatReceiptLabel(inverter.waveType)}</div>
                    </div>
                    ` : ''}
                    ${inverter.inputVoltage ? `
                    <div class="spec-item">
                      <div class="label">Input Voltage</div>
                      <div class="value">${inverter.inputVoltage}</div>
                    </div>
                    ` : ''}
                    ${inverter.outputVoltage ? `
                    <div class="spec-item">
                      <div class="label">Output Voltage</div>
                      <div class="value">${inverter.outputVoltage}</div>
                    </div>
                    ` : ''}
                    ${inverter.efficiency ? `
                    <div class="spec-item">
                      <div class="label">Efficiency</div>
                      <div class="value">${inverter.efficiency}</div>
                    </div>
                    ` : ''}
                    ${inverter.batteryVoltage ? `
                    <div class="spec-item">
                      <div class="label">Battery Voltage</div>
                      <div class="value">${inverter.batteryVoltage}</div>
                    </div>
                    ` : ''}
                    ${inverter.warrantyPeriod ? `
                    <div class="spec-item">
                      <div class="label">Warranty</div>
                      <div class="value">${inverter.warrantyPeriod}</div>
                    </div>
                    ` : ''}
                    ${inverter.condition ? `
                    <div class="spec-item">
                      <div class="label">Condition</div>
                      <div class="value">${inverter.condition}</div>
                    </div>
                    ` : ''}
                    ${inverter.status ? `
                    <div class="spec-item">
                      <div class="label">Status</div>
                      <div class="value">${inverter.status}</div>
                    </div>
                    ` : ''}
                  </div>
                </div>
                
                <!-- Dates -->
                ${inverter.purchaseDate || inverter.installationDate ? `
                <div style="margin-top: 15px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 14px;">ðŸ“… Important Dates</div>
                  <div class="specs-grid">
                    ${inverter.purchaseDate ? `
                    <div class="spec-item">
                      <div class="label">Purchase Date</div>
                      <div class="value">${formatDate(inverter.purchaseDate)}</div>
                    </div>
                    ` : ''}
                    ${inverter.installationDate ? `
                    <div class="spec-item">
                      <div class="label">Installation Date</div>
                      <div class="value">${formatDate(inverter.installationDate)}</div>
                    </div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}
                
                <!-- Additional Specifications -->
                ${inverter.specifications ? `
                <div style="margin-top: 15px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 14px;">ðŸ“ Additional Specs</div>
                  <div class="info-item">
                    <div class="value" style="white-space: pre-line;">${inverter.specifications}</div>
                  </div>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <!-- Service Staff -->
              <div class="section">
                <div class="section-title">
                  <span>ðŸ‘¥</span> Service Staff
                </div>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">ðŸ‘¤ Assigned To</div>
                    <div class="value">${staffName || 'Not Assigned'}</div>
                  </div>
                  ${staffRole ? `
                  <div class="info-item">
                    <div class="label">ðŸ“‹ Role</div>
                    <div class="value">${staffRole}</div>
                  </div>
                  ` : ''}
                  ${staffEmail ? `
                  <div class="info-item">
                    <div class="label">âœ‰ï¸ Email</div>
                    <div class="value">${staffEmail}</div>
                  </div>
                  ` : ''}
                  ${staffPhone ? `
                  <div class="info-item">
                    <div class="label">ðŸ“ž Phone</div>
                    <div class="value">${staffPhone}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Warranty & AMC -->
              <div class="section">
                <div class="section-title">
                  <span>ðŸ›¡ï¸</span> Warranty & AMC
                </div>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Warranty Status</div>
                    <div class="value" style="color: ${getWarrantyColor(service.warranty_status || 'out_of_warranty')}">
                      ${service.warranty_status?.replace(/_/g, ' ').toUpperCase() || 'OUT OF WARRANTY'}
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="label">AMC Status</div>
                    <div class="value">${service.amc_status?.replace(/_/g, ' ').toUpperCase() || 'NO AMC'}</div>
                  </div>
                </div>
              </div>
              
              <!-- Financial Details -->
              ${formatCurrency(service.final_cost || service.estimated_cost) ? `
              <div class="section">
                <div class="section-title">
                  <span>ðŸ’°</span> Financial Details
                </div>
                <div class="info-item">
                  <div class="label">Service Cost</div>
                  <div class="value" style="font-size: 20px; font-weight: 700; color: #10b981;">
                    ${formatCurrency(service.final_cost || service.estimated_cost)}
                  </div>
                </div>
              </div>
              ` : ''}
              
              <!-- Dates -->
              <div class="section">
                <div class="section-title">
                  <span>ðŸ“…</span> Dates
                </div>
                <div class="grid">
                  <div class="info-item">
                    <div class="label">Created</div>
                    <div class="value">${formatDateTime(service.created_at)}</div>
                  </div>
                  ${service.estimated_completion_date ? `
                  <div class="info-item">
                    <div class="label">Est. Completion</div>
                    <div class="value">${formatDate(service.estimated_completion_date)}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Issue Description -->
              ${service.issue_description ? `
              <div class="section">
                <div class="section-title">
                  <span>âš ï¸</span> Issue Description
                </div>
                <div class="info-item">
                  <div class="value" style="white-space: pre-line;">${service.issue_description}</div>
                </div>
              </div>
              ` : ''}
              
              <!-- Notes -->
              ${service.notes ? `
              <div class="section">
                <div class="section-title">
                  <span>ðŸ“</span> Additional Notes
                </div>
                <div class="info-item">
                  <div class="value" style="white-space: pre-line;">${service.notes}</div>
                </div>
              </div>
              ` : ''}
              
              <!-- Signature -->
              <div class="signature">
                <div>
                  <div class="signature-line"></div>
                  <div>Customer Signature</div>
                </div>
                <div>
                  <div class="signature-line"></div>
                  <div>Staff Signature</div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p>Thank you for choosing Sun Water Service Battery & Inverter Service</p>
                <p>For any queries, please contact the Sun Water Service service desk.</p>
                <p style="margin-top: 15px; font-style: italic; color: #9ca3af;">This is a computer generated receipt - valid without signature</p>
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow?.document.close();
    }
  };

  // Get staff information
  const { staffName, staffEmail, staffPhone, staffRole } = getStaffInfo();
  
  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'completed': return { bg: '#d1fae5', text: '#065f46' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const statusBadge = getStatusBadgeColor(service.status);
  const batteryList = getBatteryList();
  const inverterList = getInverterList();

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
        backgroundColor: 'rgba(0,0,0,0.5)',
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
          scale: isMobile ? 1 : 0.95, 
          y: isMobile ? 50 : 0 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0 
        }}
        exit={{ 
          opacity: 0, 
          scale: isMobile ? 1 : 0.95, 
          y: isMobile ? 50 : 0 
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isMobile ? '100%' : isTablet ? '920px' : '1240px',
          width: '100%',
          maxHeight: isMobile ? '95vh' : '90vh',
          overflowY: 'auto',
          backgroundColor: '#fff',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{
          padding: isMobile ? '20px 20px' : '24px 28px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderRadius: isMobile ? '24px 24px 0 0' : '24px 24px 0 0'
        }}>
          <div className="modal-title" style={{ flex: 1 }}>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                margin: 0, 
                fontSize: isMobile ? '22px' : '26px', 
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                letterSpacing: '-0.5px'
              }}
            >
              <FiFileText size={isMobile ? 24 : 28} />
              Service Order Details
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '10px' : '16px',
                marginTop: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '6px 14px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '30px',
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {service.service_code}
                </span>
                <span style={{ 
                  padding: '6px 14px',
                  backgroundColor: statusBadge.bg,
                  borderRadius: '30px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: statusBadge.text
                }}>
                  {service.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
                </span>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(16,185,129,0.2)',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  B: {batteryList.length}
                </span>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(251,146,60,0.2)',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  I: {inverterList.length}
                </span>
              </div>
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <FiCalendar size={14} />
                Created: {formatDateTime(service.created_at)}
              </span>
            </motion.div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Print Button */}
            <motion.button 
              onClick={printReceipt}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '20px',
                color: 'white',
                cursor: 'pointer',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: isMobile ? '44px' : '44px',
                height: isMobile ? '44px' : '44px',
                transition: 'all 0.2s'
              }}
              title="Print Receipt"
            >
              <FiPrinter size={20} />
            </motion.button>
            
            {/* Close Button */}
            <motion.button 
              className="close-btn"
              onClick={onClose}
              whileHover={{ rotate: 90, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: isMobile ? '22px' : '24px',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: isMobile ? '44px' : '44px',
                height: isMobile ? '44px' : '44px',
                transition: 'all 0.2s'
              }}
            >
              <FiX />
            </motion.button>
          </div>
        </div>
        
        {/* Content - Timeline and Documents tabs removed */}
        <div style={{ 
          padding: isMobile ? '16px' : '22px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)'
        }}>
          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'minmax(300px, 0.9fr) minmax(430px, 1.25fr) minmax(300px, 0.9fr)',
            alignItems: 'start',
            gap: isMobile ? '14px' : '18px'
          }}>
            {/* Customer Information */}
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                gridColumn: isMobile ? '1' : 'span 1'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#eef2ff',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiUser size={18} />
                </span>
                Customer Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiUser size={12} /> Full Name
                  </div>
                  <div style={{ color: '#111827', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
                    {service.customer_name}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiPhone size={12} /> Phone Number
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    background: '#f9fafb',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6'
                  }}>
                    <FiPhone size={16} color="#4f46e5" />
                    <span style={{ color: '#111827', fontSize: isMobile ? '15px' : '16px', fontWeight: '500' }}>
                      {service.customer_phone}
                    </span>
                  </div>
                </div>
                {service.customer_alternate_phone && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiPhone size={12} /> Alternate Phone
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#f9fafb',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <FiPhone size={16} color="#4f46e5" />
                      <span style={{ color: '#111827', fontSize: isMobile ? '15px' : '16px', fontWeight: '500' }}>
                        {service.customer_alternate_phone}
                      </span>
                    </div>
                  </div>
                )}
                {service.customer_email && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiMail size={12} /> Email Address
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      background: '#f9fafb',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <FiMail size={16} color="#4f46e5" />
                      <span style={{ color: '#111827', fontSize: isMobile ? '14px' : '15px' }}>
                        {service.customer_email}
                      </span>
                    </div>
                  </div>
                )}
                {service.customer_address && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiMapPin size={12} /> Service Address
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '10px',
                      background: '#f9fafb',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <FiMapPin size={16} color="#4f46e5" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: '#111827', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.5' }}>
                        {service.customer_address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
                        {/* Battery Information */}
            {batteryList.length > 0 && (
              <motion.div 
                className="detail-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '20px' : '24px',
                  borderRadius: '20px',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '2px solid #f3f4f6',
                  paddingBottom: '15px'
                }}>
                  <span style={{
                    background: '#dcfce7',
                    padding: '8px',
                    borderRadius: '12px',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiBattery size={18} />
                  </span>
                  Battery Information ({batteryList.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {batteryList.map((item: any, index: number) => (
                    <div key={`battery-${item?.id || index}`} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderLeft: '4px solid #16a34a', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Battery {index + 1}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Model:</span> {item?.battery_model || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Serial:</span> {item?.battery_serial || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Brand:</span> {item?.brand || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Capacity:</span> {item?.capacity || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Type:</span> {item?.battery_type ? String(item.battery_type).replace(/_/g, ' ') : '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Voltage:</span> {item?.voltage || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Inverter Information */}
            {inverterList.length > 0 && (
              <motion.div 
                className="detail-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '20px' : '24px',
                  borderRadius: '20px',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  gridColumn: isMobile ? '1' : 'span 1'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '2px solid #f3f4f6',
                  paddingBottom: '15px'
                }}>
                  <span style={{
                    background: '#fed7aa',
                    padding: '8px',
                    borderRadius: '12px',
                    color: '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiPower size={18} />
                  </span>
                  Inverter Information ({inverterList.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {inverterList.map((item: any, index: number) => (
                    <div key={`inverter-${item?.id || index}`} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #ea580c', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Inverter {index + 1}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Model:</span> {item?.inverter_model || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Serial:</span> {item?.inverter_serial || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Brand:</span> {item?.inverter_brand || '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Power:</span> {item?.power_rating ? `${item.power_rating}VA` : '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Wave Type:</span> {item?.wave_type ? String(item.wave_type).replace(/_/g, ' ') : '-'}</div>
                        <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Battery Voltage:</span> {item?.battery_voltage || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Service Staff Information */}
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#ede9fe',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiUsers size={18} />
                </span>
                Service Staff
              </h3>
              
              {staffName ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Assigned Technician</div>
                    <div style={{ 
                      fontSize: isMobile ? '20px' : '22px', 
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}>
                      {staffName}
                    </div>
                  </div>
                  
                  {staffRole && (
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Role</div>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: '#f3f4f6',
                        borderRadius: '30px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {staffRole}
                      </div>
                    </div>
                  )}
                  
                  {staffEmail && (
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Email</div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#f9fafb',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #f3f4f6'
                      }}>
                        <FiMail size={16} color="#7c3aed" />
                        <span style={{ fontSize: '14px', color: '#111827' }}>{staffEmail}</span>
                      </div>
                    </div>
                  )}
                  
                  {staffPhone && (
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Phone</div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#f9fafb',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #f3f4f6'
                      }}>
                        <FiPhone size={16} color="#7c3aed" />
                        <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{staffPhone}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: isMobile ? '14px' : '15px',
                  fontStyle: 'italic',
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '2px dashed #e5e7eb'
                }}>
                  <FiUsers size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <div>No staff assigned to this service</div>
                </div>
              )}
            </motion.div>
            
            {/* Warranty & AMC */}
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#fee2e2',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiTag size={18} />
                </span>
                Warranty & AMC
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Warranty Status</div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    background: service.warranty_status === 'in_warranty' ? '#dcfce7' : 
                               service.warranty_status === 'extended_warranty' ? '#fef9c3' : '#fee2e2',
                    color: service.warranty_status === 'in_warranty' ? '#166534' : 
                           service.warranty_status === 'extended_warranty' ? '#854d0e' : '#991b1b',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {service.warranty_status?.replace(/_/g, ' ').toUpperCase() || 'OUT OF WARRANTY'}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>AMC Status</div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    background: service.amc_status === 'active' ? '#dcfce7' : 
                               service.amc_status === 'expired' ? '#fee2e2' : '#f3f4f6',
                    color: service.amc_status === 'active' ? '#166534' : 
                           service.amc_status === 'expired' ? '#991b1b' : '#4b5563',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {service.amc_status?.replace(/_/g, ' ').toUpperCase() || 'NO AMC'}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Replacement Battery */}
            {service.replacement_battery_serial && (
              <motion.div 
                className="detail-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '20px' : '24px',
                  borderRadius: '20px',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '2px solid #f3f4f6',
                  paddingBottom: '15px'
                }}>
                  <span style={{
                    background: '#dcfce7',
                    padding: '8px',
                    borderRadius: '12px',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiBattery size={18} />
                  </span>
                  Replacement Battery
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiTag size={12} /> Serial Number
                    </div>
                    <div style={{ 
                      background: '#f9fafb',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6',
                      fontFamily: 'monospace',
                      fontWeight: '500',
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      {service.replacement_battery_serial}
                    </div>
                  </div>
                  
                  {service.replacement_battery_model && (
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Model</div>
                      <div style={{ fontWeight: '500', fontSize: '16px', color: '#111827' }}>
                        {service.replacement_battery_model}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Financial Details */}
            {formatCurrency(service.final_cost || service.estimated_cost) && (
              <motion.div 
                className="detail-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '20px' : '24px',
                  borderRadius: '20px',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '2px solid #f3f4f6',
                  paddingBottom: '15px'
                }}>
                  <span style={{
                    background: '#fef9c3',
                    padding: '8px',
                    borderRadius: '12px',
                    color: '#a16207',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ₹
                  </span>
                  Financial Details
                </h3>
                
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>Service Cost</div>
                  <div style={{ 
                    fontSize: isMobile ? '28px' : '32px', 
                    fontWeight: '700',
                    color: '#10b981',
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(service.final_cost || service.estimated_cost)}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Dates */}
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#e0f2fe',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiCalendar size={18} />
                </span>
                Dates
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={12} /> Created
                  </div>
                  <div style={{ 
                    background: '#f9fafb',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {formatDateTime(service.created_at)}
                  </div>
                </div>
                
                {service.estimated_completion_date && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar size={12} /> Estimated Completion
                    </div>
                    <div style={{ 
                      background: '#f9fafb',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {formatDate(service.estimated_completion_date)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Issue Description Section */}
          {service.issue_description && (
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginTop: '20px'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#fee2e2',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiAlertCircle size={18} />
                </span>
                Issue Description
              </h3>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#fef2f2',
                borderRadius: '16px',
                border: '1px solid #fee2e2',
                whiteSpace: 'pre-line',
                fontSize: isMobile ? '14px' : '15px',
                color: '#991b1b',
                lineHeight: '1.7'
              }}>
                {service.issue_description}
              </div>
            </motion.div>
          )}
          
          {/* Notes Section */}
          {service.notes && (
            <motion.div 
              className="detail-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              style={{
                backgroundColor: '#fff',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginTop: '20px'
              }}
            >
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '15px'
              }}>
                <span style={{
                  background: '#f3f4f6',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiFileText size={18} />
                </span>
                Additional Notes
              </h3>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '16px',
                border: '1px solid #f3f4f6',
                whiteSpace: 'pre-line',
                fontSize: isMobile ? '14px' : '15px',
                color: '#4b5563',
                lineHeight: '1.7'
              }}>
                {service.notes}
              </div>
            </motion.div>
          )}          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              justifyContent: 'flex-end',
              gap: isMobile ? '12px' : '16px',
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '2px solid #f3f4f6'
            }}
          >
            <motion.button 
              className="btn outline"
              onClick={onClose}
              whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: isMobile ? '16px 24px' : '14px 28px',
                borderRadius: '14px',
                border: '2px solid #e5e7eb',
                backgroundColor: '#fff',
                color: '#4b5563',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: isMobile ? '100%' : 'auto',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <FiX size={18} />
              Close
            </motion.button>
            
            <motion.button 
              className="btn danger"
              onClick={onDelete}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: isMobile ? '16px 24px' : '14px 32px',
                borderRadius: '14px',
                border: '1px solid #fecaca',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: isMobile ? '100%' : 'auto',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.12)',
                transition: 'all 0.2s'
              }}
            >
              <FiTrash2 size={18} />
              Delete Service
            </motion.button>

            <motion.button 
              className="btn primary"
              onClick={onEdit}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: isMobile ? '16px 24px' : '14px 32px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: isMobile ? '100%' : 'auto',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <FiEdit size={18} />
              Edit Service
            </motion.button>
            
            <motion.button 
              className="btn secondary"
              onClick={printReceipt}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: isMobile ? '16px 24px' : '14px 32px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: isMobile ? '100%' : 'auto',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <FiPrinter size={18} />
              Print Receipt
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
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
          button {
            min-height: 48px;
          }
        }
        
        /* Animations */
        .detail-section {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          will-change: transform;
        }
        
        .detail-section:hover {
          transform: translateY(-3px);
          border-color: #e2e8f0 !important;
          box-shadow: 0 14px 24px -14px rgba(15, 23, 42, 0.35) !important;
        }
        
        /* Print styles */
        @media print {
          .modal-overlay {
            position: absolute;
            background: white;
          }
          .modal-content {
            box-shadow: none;
            border: none;
          }
          .close-btn, .btn {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ServiceDetailModal;



