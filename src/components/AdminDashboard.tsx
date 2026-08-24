// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiPackage, FiDollarSign, FiTrendingUp, FiBarChart2,
  FiLogOut, FiBell, FiSearch, FiMenu, FiHome,
  FiShield, FiActivity, FiAlertCircle, FiCheckCircle,
  FiClock, FiUserPlus, FiDownload, FiRefreshCw,
  FiEdit, FiTrash2, FiChevronLeft, FiChevronRight,
  FiTrendingDown, FiBox, FiUserCheck, FiFileText, FiPrinter,
  FiPlus, FiX, FiShoppingBag, FiEye, FiCalendar,
  FiUpload, FiTruck, FiUser, FiCamera,
  FiFilter, FiChevronDown, FiChevronUp, FiLock, FiChevronsRight,
  FiInfo, FiHardDrive,
  FiMessageSquare, FiCreditCard, FiTruck as FiDelivery, FiMapPin,
  FiPhone, FiMail, FiCalendar as FiDate, FiDollarSign as FiRupee,
  FiAlertTriangle, FiStar,
  FiCheck, FiXCircle, FiLoader
} from 'react-icons/fi';
import {
  LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './css/AdminDashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config/api';

// Enhanced Type Definitions
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  avatar?: string;
  profile_image?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  order_count?: number;
  department?: string;
  password?: string;
}

interface DashboardStats {
  total_users: number;
  total_clients: number;
  total_orders: number;
  total_products: number;
  active_staff: number;
  pending_orders: number;
  completed_orders: number;
  delivered_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
  active_products?: number;
  low_stock_products?: number;
  avg_order_value?: number;
}

interface StaffPerformance {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_image?: string;
  last_login: string;
  last_login_formatted: string;
  total_orders: number;
  completed_orders: number;
  active_orders: number;
  total_revenue: number;
  avg_rating: number;
  completion_rate: number;
  avg_order_value: number;
  performance_score: number;
  department: string;
}

interface Order {
  id: number;
  order_code: string;
  client_id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_address?: string;
  product_id: number;
  product_name: string;
  issue_description: string;
  warranty_status: 'in_warranty' | 'out_of_warranty' | 'extended_warranty';
  estimated_cost: string;
  final_cost: string;
  deposit_amount: string;
  payment_status: 'pending' | 'partially_paid' | 'paid' | 'refunded';
  estimated_delivery_date: string;
  status: 'pending' | 'scheduled' | 'process' | 'ready' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
  created_at: string;
  updated_at: string;
  staff_id?: number;
  staff_name?: string;
  diagnosis_notes?: string;
  repair_notes?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  service_type?: string;
  accessories?: string;
  technician_notes?: string;
  customer_feedback?: string;
  next_service_date?: string;
}

interface Client {
  id: number;
  client_code: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
  customer_since: string;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  brand: string;
  model: string;
  category: 'laptop' | 'desktop' | 'mobile' | 'tablet' | 'accessory' | 'other';
  specifications: string;
  purchase_date: string;
  warranty_period: string;
  warranty_status: 'active' | 'expired';
  price: string;
  stock_quantity: number;
  min_stock_level: number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
  supplier?: string;
  location?: string;
  total_orders?: number;
}

interface Delivery {
  id: number;
  order_id: number;
  order_code: string;
  delivery_code: string;
  client_name: string;
  client_phone: string;
  product_name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  delivery_type: 'home_delivery' | 'pickup';
  scheduled_date: string;
  scheduled_time: string;
  delivery_person: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  delivered_date?: string;
  notes: string;
  created_at: string;
}

interface AnalyticsData {
  monthly_revenue: Array<{month: string; revenue: number}>;
  order_trends: Array<{date: string; orders: number}>;
  category_distribution: Array<{category: string; count: number; value: number}>;
  status_distribution: Array<{status: string; count: number; color: string}>;
  priority_distribution: Array<{priority: string; count: number; color: string}>;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
  icon?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

// Alert Component
const AlertMessage: React.FC<{
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const icons = {
    error: <FiAlertCircle className="alert-icon" />,
    success: <FiCheckCircle className="alert-icon" />,
    warning: <FiAlertCircle className="alert-icon" />,
    info: <FiAlertCircle className="alert-icon" />,
  };

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        {icons[type]}
        <div className="alert-message">{message}</div>
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="modal-backdrop" onClick={onClose} />
          <div className="modal-overlay">
            <div className="modal-container">
              <div className={`modal-content ${sizeClasses[size]}`}>
                <div className="modal-header">
                  <div className="modal-title-wrapper">
                    <h3 className="modal-title">{title}</h3>
                    <div className="title-underline"></div>
                  </div>
                  <button
                    onClick={onClose}
                    className="modal-close-button"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Order Details Modal Component
const OrderDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onEdit: () => void;
  onGenerateReceipt: () => void;
  onDelete: () => void;
}> = ({ isOpen, onClose, order, onEdit, onGenerateReceipt, onDelete }) => {
  if (!order) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FiClock className="status-icon pending" />;
      case 'scheduled': return <FiCalendar className="status-icon scheduled" />;
      case 'process': return <FiLoader className="status-icon process" />;
      case 'ready': return <FiCheckCircle className="status-icon ready" />;
      case 'completed': return <FiCheck className="status-icon completed" />;
      case 'delivered': return <FiDelivery className="status-icon delivered" />;
      case 'cancelled': return <FiXCircle className="status-icon cancelled" />;
      default: return <FiInfo className="status-icon" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <FiTrendingDown className="priority-icon low" />;
      case 'medium': return <FiTrendingUp className="priority-icon medium" />;
      case 'high': return <FiAlertTriangle className="priority-icon high" />;
      case 'urgent': return <FiAlertTriangle className="priority-icon urgent" />;
      default: return <FiInfo className="priority-icon" />;
    }
  };

  const getWarrantyIcon = (warranty: string) => {
    switch (warranty) {
      case 'in_warranty': return <FiShield className="warranty-icon in-warranty" />;
      case 'out_of_warranty': return <FiShield className="warranty-icon out-warranty" />;
      case 'extended_warranty': return <FiShield className="warranty-icon extended-warranty" />;
      default: return <FiShield className="warranty-icon" />;
    }
  };

  const getPaymentIcon = (payment: string) => {
    switch (payment) {
      case 'pending': return <FiCreditCard className="payment-icon pending" />;
      case 'partially_paid': return <FiCreditCard className="payment-icon partially-paid" />;
      case 'paid': return <FiCreditCard className="payment-icon paid" />;
      case 'refunded': return <FiCreditCard className="payment-icon refunded" />;
      default: return <FiCreditCard className="payment-icon" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details - ${order.order_code}`}
      size="xl"
    >
      <div className="order-details-modal">
        {/* Order Header */}
        <div className="order-header">
          <div className="order-code-section">
            <h3 className="order-code">{order.order_code}</h3>
            <span className="order-date">Created: {formatDate(order.created_at)}</span>
          </div>
          <div className="order-status-section">
            <div className="status-display">
              {getStatusIcon(order.status)}
              <span className={`status-badge ${order.status}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div className="priority-display">
              {getPriorityIcon(order.priority)}
              <span className={`priority-badge ${order.priority}`}>
                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-details-grid">
          {/* Client Information */}
          <div className="detail-card client-info">
            <div className="detail-card-header">
              <FiUser className="detail-card-icon" />
              <h4>Client Information</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{order.client_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  <FiPhone className="inline-icon" /> {order.client_phone}
                </span>
              </div>
              {order.client_email && (
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">
                    <FiMail className="inline-icon" /> {order.client_email}
                  </span>
                </div>
              )}
              {order.client_address && (
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    <FiMapPin className="inline-icon" /> {order.client_address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="detail-card product-info">
            <div className="detail-card-header">
              <FiPackage className="detail-card-icon" />
              <h4>Product Information</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Product Name:</span>
                <span className="detail-value">{order.product_name}</span>
              </div>
              {(order.brand || order.model) && (
                <div className="detail-row">
                  <span className="detail-label">Brand/Model:</span>
                  <span className="detail-value">
                    {order.brand} {order.model ? `- ${order.model}` : ''}
                  </span>
                </div>
              )}
              {order.serial_number && (
                <div className="detail-row">
                  <span className="detail-label">Serial Number:</span>
                  <span className="detail-value">{order.serial_number}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Warranty:</span>
                <span className="detail-value">
                  {getWarrantyIcon(order.warranty_status)}
                  <span className={`warranty-status ${order.warranty_status}`}>
                    {order.warranty_status.replace('_', ' ')}
                  </span>
                </span>
              </div>
              {order.purchase_date && (
                <div className="detail-row">
                  <span className="detail-label">Purchase Date:</span>
                  <span className="detail-value">{formatDate(order.purchase_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="detail-card service-details">
            <div className="detail-card-header">
              <FiHardDrive className="detail-card-icon" />
              <h4>Service Details</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row full-width">
                <span className="detail-label">Issue Description:</span>
                <div className="detail-value issue-description">
                  {order.issue_description}
                </div>
              </div>
              {order.diagnosis_notes && (
                <div className="detail-row full-width">
                  <span className="detail-label">Diagnosis Notes:</span>
                  <div className="detail-value">
                    {order.diagnosis_notes}
                  </div>
                </div>
              )}
              {order.repair_notes && (
                <div className="detail-row full-width">
                  <span className="detail-label">Repair Notes:</span>
                  <div className="detail-value">
                    {order.repair_notes}
                  </div>
                </div>
              )}
              {order.technician_notes && (
                <div className="detail-row full-width">
                  <span className="detail-label">Technician Notes:</span>
                  <div className="detail-value">
                    {order.technician_notes}
                  </div>
                </div>
              )}
              {order.accessories && (
                <div className="detail-row">
                  <span className="detail-label">Accessories:</span>
                  <span className="detail-value">{order.accessories}</span>
                </div>
              )}
              {order.service_type && (
                <div className="detail-row">
                  <span className="detail-label">Service Type:</span>
                  <span className="detail-value">{order.service_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="detail-card financial-info">
            <div className="detail-card-header">
              <FiRupee className="detail-card-icon" />
              <h4>Financial Information</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Estimated Cost:</span>
                <span className="detail-value">
                  ₹{parseFloat(order.estimated_cost || '0').toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Final Cost:</span>
                <span className="detail-value final-cost">
                  ₹{parseFloat(order.final_cost || order.estimated_cost || '0').toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deposit Amount:</span>
                <span className="detail-value deposit-amount">
                  ₹{parseFloat(order.deposit_amount || '0').toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Status:</span>
                <span className="detail-value">
                  {getPaymentIcon(order.payment_status)}
                  <span className={`payment-status ${order.payment_status}`}>
                    {order.payment_status.replace('_', ' ')}
                  </span>
                </span>
              </div>
              {order.payment_status === 'partially_paid' && (
                <div className="detail-row">
                  <span className="detail-label">Balance Due:</span>
                  <span className="detail-value balance-due">
                    ₹{(parseFloat(order.final_cost || order.estimated_cost || '0') - 
                        parseFloat(order.deposit_amount || '0')).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Dates */}
          <div className="detail-card timeline-info">
            <div className="detail-card-header">
              <FiDate className="detail-card-icon" />
              <h4>Timeline & Dates</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Order Created:</span>
                <span className="detail-value">{formatDateTime(order.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDateTime(order.updated_at)}</span>
              </div>
              {order.estimated_delivery_date && (
                <div className="detail-row">
                  <span className="detail-label">Estimated Delivery:</span>
                  <span className="detail-value estimated-delivery">
                    {formatDate(order.estimated_delivery_date)}
                  </span>
                </div>
              )}
              {order.next_service_date && (
                <div className="detail-row">
                  <span className="detail-label">Next Service Date:</span>
                  <span className="detail-value next-service">
                    {formatDate(order.next_service_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Staff & Assignment */}
          <div className="detail-card staff-info">
            <div className="detail-card-header">
              <FiUserCheck className="detail-card-icon" />
              <h4>Staff Assignment</h4>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Assigned Staff:</span>
                <span className="detail-value">
                  {order.staff_name || 'Not Assigned'}
                </span>
              </div>
              {order.staff_id && (
                <div className="detail-row">
                  <span className="detail-label">Staff ID:</span>
                  <span className="detail-value">#{order.staff_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          {order.notes && (
            <div className="detail-card additional-notes">
              <div className="detail-card-header">
                <FiMessageSquare className="detail-card-icon" />
                <h4>Additional Notes</h4>
              </div>
              <div className="detail-card-content">
                <div className="notes-content">
                  {order.notes}
                </div>
              </div>
            </div>
          )}

          {/* Customer Feedback */}
          {order.customer_feedback && (
            <div className="detail-card customer-feedback">
              <div className="detail-card-header">
                <FiStar className="detail-card-icon" />
                <h4>Customer Feedback</h4>
              </div>
              <div className="detail-card-content">
                <div className="feedback-content">
                  {order.customer_feedback}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="order-details-actions">
          <button className="btn btn-primary" onClick={onGenerateReceipt}>
            <FiPrinter /> Generate Receipt
          </button>
          <button className="btn btn-secondary" onClick={onEdit}>
            <FiEdit /> Edit Order
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            <FiTrash2 /> Delete Order
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Password Reset Modal Component
const ResetPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  onResetPassword: (userId: number, newPassword: string) => Promise<void>;
}> = ({ isOpen, onClose, userId, userName, onResetPassword }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await onResetPassword(userId, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      size="sm"
    >
      <div className="modal-form">
        {success ? (
          <div className="success-message">
            <FiCheckCircle className="success-icon" />
            <p>Password reset successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userName">User</label>
              <input
                type="text"
                id="userName"
                value={userName}
                disabled
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="form-input"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="form-input"
                required
                minLength={6}
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

// Staff Details Modal Component
const StaffDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  staffOrders: Order[];
}> = ({ isOpen, onClose, staff, staffOrders }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Staff Orders - ${staff?.name || 'Unknown'}`}
      size="lg"
    >
      <div className="staff-orders-modal">
        {staff && (
          <div className="staff-info-section">
            <div className="staff-header">
              <div className="staff-avatar-large">
                {staff.profile_image ? (
                  <img 
                    src={staff.profile_image} 
                    alt={staff.name}
                    className="staff-profile-image"
                  />
                ) : (
                  <div className="avatar-initial-large">
                    {staff.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div className="staff-details">
                <h4>{staff.name}</h4>
                <p className="staff-email">{staff.email}</p>
                <div className="staff-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{staff.total_orders || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value">{staff.completed_orders || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active</span>
                    <span className="stat-value">{staff.active_orders || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value">₹{parseFloat(staff.total_revenue || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="staff-orders-section">
          <h4>Assigned Orders</h4>
          {staffOrders.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {staffOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="code-badge">{order.order_code}</span>
                      </td>
                      <td>{order.client_name}</td>
                      <td>{order.product_name}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>₹{order.final_cost || order.estimated_cost || '0'}</td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No orders assigned to this staff member.</p>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Check screen width on initial load
    return window.innerWidth >= 1024;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [loading, setLoading] = useState({
    dashboard: false,
    users: false,
    orders: false,
    clients: false,
    products: false,
    staff: false,
    analytics: false,
    deliveries: false
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data States
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [selectedStaffOrders, setSelectedStaffOrders] = useState<Order[]>([]);
  
  // Selection States
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<number[]>([]);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    users: {
      role: '',
      status: ''
    },
    orders: {
      status: '',
      priority: '',
      payment_status: '',
      exclude_delivered: true
    },
    clients: {
      city: ''
    },
    products: {
      category: '',
      status: ''
    },
    deliveries: {
      status: '',
      delivery_type: ''
    }
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc'
  });
  
  // Modal States
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'order' | 'client' | 'product' | 'delivery'>('user');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<{id: number; name: string} | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  // Form States
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    phone: '',
    department: 'general',
    is_active: true,
    profile_image: null as File | null,
    profile_image_url: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'process', label: 'Process' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const warrantyOptions = [
    { value: 'in_warranty', label: 'In Warranty' },
    { value: 'out_of_warranty', label: 'Out of Warranty' },
    { value: 'extended_warranty', label: 'Extended Warranty' }
  ];

  const paymentOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const categoryOptions = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'accessory', label: 'Accessory' },
    { value: 'other', label: 'Other' }
  ];

  const deliveryStatusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const deliveryTypeOptions = [
    { value: 'home_delivery', label: 'Home Delivery' },
    { value: 'pickup', label: 'Pickup' }
  ];
  
  const [newOrder, setNewOrder] = useState({
    client_id: '',
    client_name: '',
    client_phone: '',
    product_id: '',
    product_name: '',
    issue_description: '',
    warranty_status: 'out_of_warranty' as 'in_warranty' | 'out_of_warranty' | 'extended_warranty',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'scheduled' | 'process' | 'ready' | 'completed' | 'delivered' | 'cancelled',
    payment_status: 'pending' as 'pending' | 'partially_paid' | 'paid' | 'refunded',
    staff_id: '',
    estimated_cost: '0',
    final_cost: '0',
    deposit_amount: '0',
    estimated_delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  });
  
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    brand: '',
    model: '',
    category: 'laptop' as 'laptop' | 'desktop' | 'mobile' | 'tablet' | 'accessory' | 'other',
    price: '0',
    stock_quantity: '0',
    min_stock_level: '5',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_period: '1 year',
    specifications: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued'
  });
  
  // API Configuration
  // Check authentication and role
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      
      if (!token || !userData || isLoggedIn !== 'true') {
        navigate('/login');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        navigate('/login');
      }
    };
    
    checkAuth();
    
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile/tablet, open on desktop
      if (width < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);
  
  // Load data based on active tab
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setError(null);
      const tabKey = activeTab as keyof typeof loading;
      setLoading(prev => ({ ...prev, [tabKey]: true }));
      
      try {
        switch (activeTab) {
          case 'dashboard':
            await loadDashboardData();
            await loadNotifications();
            await loadStaffForDropdown();
            await loadClientsForDropdown(); // Load clients for dropdown
            break;
          case 'users':
            await loadUsers();
            break;
          case 'orders':
            await loadOrders();
            await loadStaffForDropdown();
            await loadClientsForDropdown(); // Load clients for dropdown
            break;
          case 'clients':
            await loadClients();
            break;
          case 'products':
            await loadProducts();
            break;
          case 'staff':
            await loadStaffPerformance();
            break;
          case 'analytics':
            await loadAnalytics();
            break;
          case 'deliveries':
            await loadDeliveries();
            break;
        }
      } catch (error: any) {
        console.error('Failed to load data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(prev => ({ ...prev, [tabKey]: false }));
      }
    };
    
    loadData();
  }, [activeTab, user]);
  
  // API functions
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };
  
  const apiRequest = async (endpoint: string, method: string = 'GET', data: any = null) => {
    const token = getAuthToken();
    if (!token) {
      handleLogout();
      throw new Error('No authentication token');
    }
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const config: RequestInit = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    console.log(`API Request: ${method} ${API_BASE_URL}/${endpoint}`, data);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
      
      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Check if response is HTML instead of JSON
        if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<br')) {
          throw new Error('Server returned HTML instead of JSON. Check API endpoint.');
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `API error: ${response.status}`);
        } catch (e) {
          throw new Error(errorText || `API error: ${response.status}`);
        }
      }
      
      const result = await response.json();
      console.log(`API Response from ${endpoint}:`, result);
      return result;
      
    } catch (error: any) {
      console.error('API request failed:', error);
      setError(error.message || 'Network error');
      throw error;
    }
  };
  
  // Data loading functions
  const loadDashboardData = async () => {
    try {
      // Load dashboard stats from API
      const data = await apiRequest('admin_api.php?action=dashboard_stats');
      
      if (data.success && data.stats) {
        console.log('Dashboard stats loaded:', data.stats);
        
        // Map API response to DashboardStats interface
        const stats: DashboardStats = {
          total_users: data.stats.total_users || 0,
          total_clients: data.stats.total_clients || 0,
          total_orders: data.stats.total_orders || 0,
          total_products: data.stats.total_products || 0,
          active_staff: data.stats.active_staff || 0,
          pending_orders: data.stats.pending_orders || 0,
          delivered_orders: data.stats.delivered_orders || 0,
          total_revenue: data.stats.total_revenue || 0,
          today_orders: data.stats.today_orders || 0,
          today_revenue: data.stats.today_revenue || 0,
          completed_orders: data.stats.completed_orders || 0,
          active_products: data.stats.active_products || 0,
          low_stock_products: data.stats.low_stock_products || 0,
          avg_order_value: data.stats.avg_order_value || 0
        };
        
        setDashboardStats(stats);
      } else {
        console.error('Failed to load dashboard stats:', data);
        // Fallback to manual calculations if API fails
        await fallbackDashboardData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to manual calculations
      await fallbackDashboardData();
    }
  };
  
  const fallbackDashboardData = async () => {
    try {
      // Try to load individual data and calculate manually
      const usersData = await apiRequest('admin_api.php?action=get_users');
      const clientsData = await apiRequest('admin_api.php?action=get_clients');
      const ordersData = await apiRequest('admin_api.php?action=get_orders');
      const productsData = await apiRequest('admin_api.php?action=get_products');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate today's orders and revenue
      const todayOrders = ordersData.orders ? 
        ordersData.orders.filter((o: any) => o.created_at && o.created_at.startsWith(today)) : [];
      
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => 
        sum + parseFloat(o.final_cost || o.estimated_cost || '0'), 0);
      
      // FIXED: Correctly calculate pending orders - only orders with status 'pending'
      const pendingOrders = ordersData.orders ? 
        ordersData.orders.filter((o: any) => 
          (o.status && o.status.toString().toLowerCase() === 'pending')
        ).length : 0;
      
      // Calculate total revenue
      const totalRevenue = ordersData.orders ? 
        ordersData.orders.reduce((sum: number, o: any) => 
          sum + parseFloat(o.final_cost || o.estimated_cost || '0'), 0) : 0;
      
      // Calculate delivered orders
      const deliveredOrders = ordersData.orders ? 
        ordersData.orders.filter((o: any) => 
          o.status && o.status.toString().toLowerCase() === 'delivered'
        ).length : 0;
      
      // Calculate completed orders
      const completedOrders = ordersData.orders ? 
        ordersData.orders.filter((o: any) => 
          o.status && o.status.toString().toLowerCase() === 'completed'
        ).length : 0;
      
      // Calculate active staff
      const activeStaff = usersData.users ? 
        usersData.users.filter((u: any) => 
          u.is_active === '1' || u.is_active === 1 || u.is_active === true || u.is_active === 'true'
        ).length : 0;
      
      // Calculate active products
      const activeProducts = productsData.products ? 
        productsData.products.filter((p: any) => p.status === 'active').length : 0;
      
      // Calculate low stock products
      const lowStockProducts = productsData.products ? 
        productsData.products.filter((p: any) => 
          parseInt(p.stock_quantity || 0) <= parseInt(p.min_stock_level || 5)
        ).length : 0;
      
      // Calculate average order value
      const avgOrderValue = ordersData.orders && ordersData.orders.length > 0 ? 
        totalRevenue / ordersData.orders.length : 0;
      
      const stats: DashboardStats = {
        total_users: usersData.users ? usersData.users.length : 0,
        total_clients: clientsData.clients ? clientsData.clients.length : 0,
        total_orders: ordersData.orders ? ordersData.orders.length : 0,
        total_products: productsData.products ? productsData.products.length : 0,
        active_staff: activeStaff,
        pending_orders: pendingOrders, // This now correctly counts only 'pending' status orders
        delivered_orders: deliveredOrders,
        completed_orders: completedOrders,
        total_revenue: totalRevenue,
        today_orders: todayOrders.length,
        today_revenue: todayRevenue,
        active_products: activeProducts,
        low_stock_products: lowStockProducts,
        avg_order_value: avgOrderValue
      };
      
      console.log('Fallback dashboard stats calculated:', {
        pendingOrders,
        totalOrders: ordersData.orders ? ordersData.orders.length : 0,
        statusBreakdown: ordersData.orders ? ordersData.orders.map((o: any) => o.status) : []
      });
      
      setDashboardStats(stats);
      
    } catch (error) {
      console.error('Error in fallback dashboard data:', error);
      // Set empty stats
      setDashboardStats({
        total_users: 0,
        total_clients: 0,
        total_orders: 0,
        total_products: 0,
        active_staff: 0,
        pending_orders: 0,
        delivered_orders: 0,
        completed_orders: 0,
        total_revenue: 0,
        today_orders: 0,
        today_revenue: 0,
        active_products: 0,
        low_stock_products: 0,
        avg_order_value: 0
      });
    }
  };
  
  const loadUsers = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_users');
      
      if (data.success && data.users) {
        const mappedUsers: User[] = data.users.map((user: any) => ({
          id: parseInt(user.id),
          name: user.name || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role as 'admin' | 'user',
          is_active: user.is_active === '1' || user.is_active === 1 || user.is_active === true,
          profile_image: user.profile_image || user.avatar,
          last_login: user.last_login || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          department: user.department || 'general'
        }));
        
        setUsers(mappedUsers);
        setSelectedUsers([]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };
  
  const loadStaffForDropdown = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_users');
      
      if (data.success && data.users) {
        const allUsers: User[] = data.users.map((user: any) => ({
          id: parseInt(user.id),
          name: user.name || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role as 'admin' | 'user',
          is_active: user.is_active === '1' || user.is_active === 1 || user.is_active === true,
          profile_image: user.profile_image,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          department: user.department || 'service'
        }));
        
        setStaffList(allUsers);
      } else {
        setStaffList(users);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaffList(users);
    }
  };
  
  // Load clients specifically for dropdown in create order modal
  const loadClientsForDropdown = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_clients');
      
      if (data.success && data.clients) {
        const mappedClients: Client[] = data.clients.map((client: any) => ({
          id: parseInt(client.id),
          client_code: client.client_code || `CLT${client.id}`,
          full_name: client.full_name || 'Unknown',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          zip_code: client.zip_code || '',
          notes: client.notes || '',
          created_at: client.created_at,
          updated_at: client.updated_at || client.created_at,
          total_orders: parseInt(client.total_orders) || 0,
          total_spent: parseFloat(client.total_spent) || 0,
          customer_since: client.created_at
        }));
        
        // We'll keep the main clients list as is, but ensure we have data
        if (clients.length === 0) {
          setClients(mappedClients);
        }
        return mappedClients;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error loading clients for dropdown:', error);
      return [];
    }
  };
  
  const loadOrders = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_orders');
      
      if (data.success && data.orders) {
        const mappedOrders: Order[] = data.orders.map((order: any) => ({
          id: parseInt(order.id),
          order_code: order.order_code || `ORD${order.id}`,
          client_id: parseInt(order.client_id) || 0,
          client_name: order.client_name || 'Unknown',
          client_phone: order.client_phone || '',
          client_email: order.client_email,
          client_address: order.client_address,
          product_id: parseInt(order.product_id) || 0,
          product_name: order.product_name || 'Unknown',
          issue_description: order.issue_description || '',
          warranty_status: order.warranty_status || 'out_of_warranty',
          estimated_cost: order.estimated_cost || '0',
          final_cost: order.final_cost || order.estimated_cost || '0',
          deposit_amount: order.deposit_amount || '0',
          payment_status: order.payment_status || 'pending',
          estimated_delivery_date: order.estimated_delivery_date || '',
          status: order.status || 'pending',
          priority: order.priority || 'medium',
          notes: order.notes || '',
          created_at: order.created_at,
          updated_at: order.updated_at || order.created_at,
          staff_id: order.staff_id ? parseInt(order.staff_id) : undefined,
          staff_name: order.staff_name,
          brand: order.brand,
          model: order.model,
          serial_number: order.serial_number,
          purchase_date: order.purchase_date,
          service_type: order.service_type,
          accessories: order.accessories,
          diagnosis_notes: order.diagnosis_notes,
          repair_notes: order.repair_notes,
          technician_notes: order.technician_notes,
          customer_feedback: order.customer_feedback,
          next_service_date: order.next_service_date
        }));
        
        setOrders(mappedOrders);
        setSelectedOrders([]);
        
        // Update pending orders count in dashboard stats after loading orders
        if (dashboardStats) {
          const pendingCount = mappedOrders.filter(order => 
            order.status && order.status.toString().toLowerCase() === 'pending'
          ).length;
          
          setDashboardStats(prev => prev ? {
            ...prev,
            pending_orders: pendingCount
          } : prev);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };
  
  const loadClients = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_clients');
      
      if (data.success && data.clients) {
        const mappedClients: Client[] = data.clients.map((client: any) => ({
          id: parseInt(client.id),
          client_code: client.client_code || `CLT${client.id}`,
          full_name: client.full_name || 'Unknown',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          zip_code: client.zip_code || '',
          notes: client.notes || '',
          created_at: client.created_at,
          updated_at: client.updated_at || client.created_at,
          total_orders: parseInt(client.total_orders) || 0,
          total_spent: parseFloat(client.total_spent) || 0,
          customer_since: client.created_at
        }));
        
        setClients(mappedClients);
        setSelectedClients([]);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };
  
  const loadProducts = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=get_products');
      
      if (data.success && data.products) {
        const mappedProducts: Product[] = data.products.map((product: any) => ({
          id: parseInt(product.id),
          product_code: product.product_code || `PRD${product.id}`,
          product_name: product.product_name || 'Unknown',
          brand: product.brand || '',
          model: product.model || '',
          category: (product.category as 'laptop' | 'desktop' | 'mobile' | 'tablet' | 'accessory' | 'other') || 'other',
          specifications: product.specifications || '',
          purchase_date: product.purchase_date || '',
          warranty_period: product.warranty_period || '',
          warranty_status: product.warranty_status || 'active',
          price: product.price || '0',
          stock_quantity: parseInt(product.stock_quantity) || 0,
          min_stock_level: parseInt(product.min_stock_level) || 5,
          status: (product.status as 'active' | 'inactive' | 'discontinued') || 'active',
          created_at: product.created_at,
          updated_at: product.updated_at || product.created_at
        }));
        
        setProducts(mappedProducts);
        setSelectedProducts([]);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };
  
  const loadDeliveries = async () => {
    try {
      const data = await apiRequest('deliveries.php');
      
      if (data.success && data.deliveries) {
        const mappedDeliveries: Delivery[] = data.deliveries.map((delivery: any) => ({
          id: parseInt(delivery.id),
          order_id: parseInt(delivery.order_id) || 0,
          order_code: delivery.order_code || '',
          delivery_code: delivery.delivery_code || `DEL${delivery.id}`,
          client_name: delivery.client_name || '',
          client_phone: delivery.client_phone || '',
          product_name: delivery.product_name || '',
          address: delivery.address || '',
          contact_person: delivery.contact_person || '',
          contact_phone: delivery.contact_phone || '',
          delivery_type: delivery.delivery_type === 'delivery' ? 'home_delivery' : 'pickup',
          scheduled_date: delivery.scheduled_date || '',
          scheduled_time: delivery.scheduled_time || '',
          delivery_person: delivery.delivery_person || '',
          status: delivery.status || 'scheduled',
          delivered_date: delivery.delivered_date || '',
          notes: delivery.notes || '',
          created_at: delivery.created_at || new Date().toISOString()
        }));
        
        setDeliveries(mappedDeliveries);
        setSelectedDeliveries([]);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setDeliveries([]);
    }
  };
  
  const loadStaffPerformance = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=staff_performance');
      
      if (data.success && data.staff) {
        const mappedStaff: StaffPerformance[] = data.staff.map((staff: any) => ({
          id: parseInt(staff.id),
          name: staff.name || 'Unknown',
          email: staff.email || '',
          role: staff.role || 'user',
          profile_image: staff.profile_image,
          last_login: staff.last_login || null,
          last_login_formatted: staff.last_login_formatted || 'Never',
          total_orders: parseInt(staff.total_orders) || 0,
          completed_orders: parseInt(staff.completed_orders) || 0,
          active_orders: parseInt(staff.active_orders) || 0,
          total_revenue: parseFloat(staff.total_revenue) || 0,
          avg_rating: parseFloat(staff.avg_rating) || 0,
          completion_rate: parseFloat(staff.completion_rate) || 0,
          avg_order_value: parseFloat(staff.avg_order_value) || 0,
          performance_score: parseFloat(staff.performance_score) || 0,
          department: staff.department || 'Service'
        }));
        
        setStaffPerformance(mappedStaff);
        console.log('Staff performance loaded:', mappedStaff.length, 'staff members');
      } else {
        setStaffPerformance([]);
      }
    } catch (error) {
      console.error('Error loading staff performance:', error);
      setStaffPerformance([]);
    }
  };
  
  const loadStaffOrders = async (staffId: number) => {
    try {
      const staffOrders = orders.filter(order => order.staff_id === staffId);
      setSelectedStaffOrders(staffOrders);
      return staffOrders;
    } catch (error) {
      console.error('Error loading staff orders:', error);
      return [];
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=analytics');
      
      if (data.success && data.analytics) {
        // Calculate priority distribution from orders
        const priorityCounts: any = {};
        orders.forEach(order => {
          priorityCounts[order.priority] = (priorityCounts[order.priority] || 0) + 1;
        });
        
        const priorityDistribution = Object.keys(priorityCounts).map(priority => ({
          priority,
          count: priorityCounts[priority],
          color: getPriorityColor(priority)
        }));
        
        // Calculate status distribution from orders
        const statusCounts: any = {};
        orders.forEach(order => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        
        const statusDistribution = Object.keys(statusCounts).map(status => ({
          status,
          count: statusCounts[status],
          color: getStatusColor(status)
        }));
        
        setAnalyticsData({
          monthly_revenue: data.analytics.monthly_revenue || [],
          order_trends: data.analytics.order_trends || [],
          category_distribution: data.analytics.category_distribution || [],
          status_distribution: statusDistribution,
          priority_distribution: priorityDistribution
        });
        
        console.log('Analytics data loaded:', data.analytics);
      } else {
        // Fallback data - calculate from orders
        const priorityCounts: any = {};
        const statusCounts: any = {};
        
        orders.forEach(order => {
          priorityCounts[order.priority] = (priorityCounts[order.priority] || 0) + 1;
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        
        const priorityDistribution = Object.keys(priorityCounts).map(priority => ({
          priority,
          count: priorityCounts[priority],
          color: getPriorityColor(priority)
        }));
        
        const statusDistribution = Object.keys(statusCounts).map(status => ({
          status,
          count: statusCounts[status],
          color: getStatusColor(status)
        }));
        
        setAnalyticsData({
          monthly_revenue: [],
          order_trends: [],
          category_distribution: [],
          status_distribution: statusDistribution,
          priority_distribution: priorityDistribution
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set fallback data from orders
      const priorityCounts: any = {};
      const statusCounts: any = {};
      
      orders.forEach(order => {
        priorityCounts[order.priority] = (priorityCounts[order.priority] || 0) + 1;
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
      
      const priorityDistribution = Object.keys(priorityCounts).map(priority => ({
        priority,
        count: priorityCounts[priority],
        color: getPriorityColor(priority)
      }));
      
      const statusDistribution = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status],
        color: getStatusColor(status)
      }));
      
      setAnalyticsData({
        monthly_revenue: [],
        order_trends: [],
        category_distribution: [],
        status_distribution: statusDistribution,
        priority_distribution: priorityDistribution
      });
    }
  };
  
  const loadNotifications = async () => {
    try {
      const data = await apiRequest('admin_api.php?action=notifications');
      
      if (data.success && data.notifications) {
        const mappedNotifications: Notification[] = data.notifications.map((notification: any) => ({
          id: notification.id,
          title: notification.title || 'Notification',
          message: notification.message || '',
          type: notification.type || 'info',
          is_read: notification.is_read || false,
          created_at: notification.created_at,
          icon: notification.type
        }));
        
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };
  
  // Helper function for status colors
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'process': return '#3498db';
      case 'scheduled': return '#9b59b6';
      case 'ready': return '#2ecc71';
      case 'completed': return '#27ae60';
      case 'delivered': return '#16a085';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  // Helper function for priority colors
  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'low': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      case 'urgent': return '#c0392b';
      default: return '#95a5a6';
    }
  };
  
  // Handle client selection for new order - UPDATED
  const handleClientSelect = async (clientId: string) => {
    if (clientId) {
      // If clients are already loaded, find the selected one
      let selectedClient = clients.find(client => client.id.toString() === clientId);
      
      // If clients not loaded yet, fetch from API
      if (!selectedClient && clients.length === 0) {
        try {
          const clientsData = await loadClientsForDropdown();
          selectedClient = clientsData.find(client => client.id.toString() === clientId);
        } catch (error) {
          console.error('Error loading client details:', error);
        }
      }
      
      if (selectedClient) {
        setNewOrder(prev => ({
          ...prev,
          client_id: clientId,
          client_name: selectedClient!.full_name,
          client_phone: selectedClient!.phone
        }));
      }
    } else {
      // Clear fields if no client selected
      setNewOrder(prev => ({
        ...prev,
        client_id: '',
        client_name: '',
        client_phone: ''
      }));
    }
  };
  
  // Handle create user
  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        setError('Please fill in all required fields (Name, Email, Password)');
        return;
      }

      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone || '',
        is_active: newUser.is_active ? 1 : 0
      };

      console.log('Creating user with data:', userData);

      const data = await apiRequest('admin_api.php?action=create_user', 'POST', userData);

      if (data.success) {
        setSuccessMessage('User created successfully');
        await loadUsers();
        await loadDashboardData();
        setShowCreateUser(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'user',
          phone: '',
          department: 'general',
          is_active: true,
          profile_image: null,
          profile_image_url: ''
        });
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    }
  };
  
  // Handle create order
  const handleCreateOrder = async () => {
    try {
      if (!newOrder.client_name || !newOrder.client_phone || !newOrder.product_name || !newOrder.issue_description) {
        setError('Please fill in all required fields (Client Name, Client Phone, Product Name, Issue Description)');
        return;
      }
      
      const orderData = {
        client_id: newOrder.client_id || '',
        client_name: newOrder.client_name,
        client_phone: newOrder.client_phone,
        product_name: newOrder.product_name,
        issue_description: newOrder.issue_description,
        warranty_status: newOrder.warranty_status,
        priority: newOrder.priority,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        staff_id: newOrder.staff_id || '',
        estimated_cost: parseFloat(newOrder.estimated_cost) || 0,
        final_cost: parseFloat(newOrder.final_cost) || 0,
        deposit_amount: parseFloat(newOrder.deposit_amount) || 0,
        estimated_delivery_date: newOrder.estimated_delivery_date,
        notes: newOrder.notes,
      };
      
      console.log('Creating order with data:', orderData);
      
      const data = await apiRequest('admin_api.php?action=create_order', 'POST', orderData);
      
      if (data.success) {
        setSuccessMessage('Order created successfully');
        await loadOrders();
        await loadDashboardData();
        setShowCreateOrder(false);
        setNewOrder({
          client_id: '',
          client_name: '',
          client_phone: '',
          product_id: '',
          product_name: '',
          issue_description: '',
          warranty_status: 'out_of_warranty',
          priority: 'medium',
          status: 'pending',
          payment_status: 'pending',
          staff_id: '',
          estimated_cost: '0',
          final_cost: '0',
          deposit_amount: '0',
          estimated_delivery_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to create order');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create order');
    }
  };
  
  // Handle create client
  const handleCreateClient = async () => {
    try {
      if (!newClient.full_name || !newClient.phone) {
        setError('Please fill in all required fields (Full Name, Phone)');
        return;
      }
      
      const clientData = {
        full_name: newClient.full_name,
        email: newClient.email || '',
        phone: newClient.phone,
        address: newClient.address || '',
        city: newClient.city || '',
        state: newClient.state || '',
        zip_code: newClient.zip_code || '',
        notes: newClient.notes || ''
      };
      
      console.log('Creating client with data:', clientData);
      
      const data = await apiRequest('admin_api.php?action=create_client', 'POST', clientData);
      
      if (data.success) {
        setSuccessMessage('Client created successfully');
        await loadClients();
        await loadDashboardData();
        setShowCreateClient(false);
        setNewClient({
          full_name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          notes: ''
        });
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to create client');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create client');
    }
  };
  
  // Handle create product
  const handleCreateProduct = async () => {
    try {
      if (!newProduct.product_name || !newProduct.price) {
        setError('Please fill in all required fields (Product Name, Price)');
        return;
      }
      
      const productData = {
        product_name: newProduct.product_name,
        brand: newProduct.brand || '',
        model: newProduct.model || '',
        category: newProduct.category,
        price: parseFloat(newProduct.price) || 0,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        min_stock_level: parseInt(newProduct.min_stock_level) || 5,
        purchase_date: newProduct.purchase_date,
        warranty_period: newProduct.warranty_period,
        status: newProduct.status,
        specifications: newProduct.specifications || ''
      };
      
      console.log('Creating product with data:', productData);
      
      const data = await apiRequest('admin_api.php?action=create_product', 'POST', productData);
      
      if (data.success) {
        setSuccessMessage('Product created successfully');
        await loadProducts();
        await loadDashboardData();
        setShowCreateProduct(false);
        setNewProduct({
          product_name: '',
          brand: '',
          model: '',
          category: 'laptop',
          price: '0',
          stock_quantity: '0',
          min_stock_level: '5',
          purchase_date: new Date().toISOString().split('T')[0],
          warranty_period: '1 year',
          specifications: '',
          status: 'active'
        });
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to create product');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create product');
    }
  };
  
  // Handle delete operations
  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const data = await apiRequest(`admin_api.php?action=delete_user&id=${id}`, 'DELETE');
        
        if (data.success) {
          setSuccessMessage('User deleted successfully');
          await loadUsers();
          await loadDashboardData();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.message || 'Failed to delete user');
        }
      } catch (error: any) {
        setError(error.message);
      }
    }
  };
  
  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const data = await apiRequest(`admin_api.php?action=delete_order&id=${id}`, 'DELETE');
        
        if (data.success) {
          setSuccessMessage('Order deleted successfully');
          await loadOrders();
          await loadDashboardData();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.message || 'Failed to delete order');
        }
      } catch (error: any) {
        setError(error.message);
      }
    }
  };
  
  const handleDeleteClient = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const data = await apiRequest(`admin_api.php?action=delete_client&id=${id}`, 'DELETE');
        
        if (data.success) {
          setSuccessMessage('Client deleted successfully');
          await loadClients();
          await loadDashboardData();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.message || 'Failed to delete client');
        }
      } catch (error: any) {
        setError(error.message);
      }
    }
  };
  
  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const data = await apiRequest(`admin_api.php?action=delete_product&id=${id}`, 'DELETE');
        
        if (data.success) {
          setSuccessMessage('Product deleted successfully');
          await loadProducts();
          await loadDashboardData();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.message || 'Failed to delete product');
        }
      } catch (error: any) {
        setError(error.message);
      }
    }
  };
  
  const handleDeleteDelivery = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        const data = await apiRequest(`admin_api.php?action=delete_delivery&id=${id}`, 'DELETE');
        
        if (data.success) {
          setSuccessMessage('Delivery deleted successfully');
          await loadDeliveries();
          await loadDashboardData();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.message || 'Failed to delete delivery');
        }
      } catch (error: any) {
        setError(error.message);
      }
    }
  };
  
  // Handle edit operations
  const handleEdit = (type: 'user' | 'order' | 'client' | 'product' | 'delivery', data: any) => {
    setEditType(type);
    setEditData(data);
    setShowEditModal(true);
  };
  
  const handleSaveEdit = async () => {
    try {
      let endpoint = 'admin_api.php';
      let method = 'POST';
      let requestData: any = {};
      
      switch (editType) {
        case 'user':
          endpoint += '?action=update_user';
          requestData = {
            id: editData.id,
            name: editData.name,
            email: editData.email,
            role: editData.role,
            phone: editData.phone || '',
            is_active: editData.is_active ? 1 : 0
          };
          break;
          
        case 'order':
          endpoint += '?action=update_order';
          requestData = {
            id: editData.id,
            client_id: editData.client_id || '',
            client_name: editData.client_name,
            client_phone: editData.client_phone,
            product_name: editData.product_name,
            issue_description: editData.issue_description,
            warranty_status: editData.warranty_status,
            estimated_cost: editData.estimated_cost,
            final_cost: editData.final_cost,
            deposit_amount: editData.deposit_amount || '0',
            payment_status: editData.payment_status,
            estimated_delivery_date: editData.estimated_delivery_date,
            status: editData.status,
            priority: editData.priority,
            notes: editData.notes,
            staff_id: editData.staff_id
          };
          break;
          
        case 'client':
          endpoint += '?action=update_client';
          requestData = {
            id: editData.id,
            full_name: editData.full_name,
            email: editData.email,
            phone: editData.phone,
            address: editData.address,
            city: editData.city,
            state: editData.state,
            zip_code: editData.zip_code,
            notes: editData.notes
          };
          break;
          
        case 'product':
          endpoint += '?action=update_product';
          requestData = {
            id: editData.id,
            product_name: editData.product_name,
            brand: editData.brand,
            model: editData.model,
            category: editData.category,
            specifications: editData.specifications,
            price: editData.price,
            stock_quantity: editData.stock_quantity,
            min_stock_level: editData.min_stock_level,
            status: editData.status
          };
          break;
          
        case 'delivery':
          endpoint += '?action=update_delivery';
          requestData = {
            id: editData.id,
            status: editData.status,
            delivery_person: editData.delivery_person,
            notes: editData.notes
          };
          break;
      }
      
      console.log(`Updating ${editType} with data:`, requestData);
      
      const response = await apiRequest(endpoint, method, requestData);
      
      if (response.success) {
        setSuccessMessage(`${editType.charAt(0).toUpperCase() + editType.slice(1)} updated successfully`);
        setShowEditModal(false);
        
        // Reload data based on active tab
        switch (activeTab) {
          case 'users':
            await loadUsers();
            break;
          case 'orders':
            await loadOrders();
            break;
          case 'clients':
            await loadClients();
            break;
          case 'products':
            await loadProducts();
            break;
          case 'deliveries':
            await loadDeliveries();
            break;
        }
        
        await loadDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Failed to update');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (userId: number, newPassword: string) => {
    try {
      const response = await apiRequest('admin_api.php?action=reset_password', 'POST', {
        user_id: userId,
        new_password: newPassword
      });
      
      if (response.success) {
        return;
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      throw error;
    }
  };
  
  const openResetPasswordModal = (userId: number, userName: string) => {
    setSelectedUserForReset({ id: userId, name: userName });
    setShowResetPasswordModal(true);
  };
  
  // Handle staff details view
  const handleViewStaffDetails = async (staff: any) => {
    setSelectedStaff(staff);
    const staffOrders = await loadStaffOrders(staff.id);
    setSelectedStaffOrders(staffOrders);
    setShowStaffDetailsModal(true);
  };
  
  // Handle order row click
  const handleOrderRowClick = (order: Order) => {
    setSelectedOrderDetails(order);
    setShowOrderDetailsModal(true);
  };
  
  // Handle order details actions
  const handleOrderDetailsEdit = () => {
    if (selectedOrderDetails) {
      handleEdit('order', selectedOrderDetails);
      setShowOrderDetailsModal(false);
    }
  };
  
  const handleOrderDetailsReceipt = () => {
    if (selectedOrderDetails) {
      generateOrderReceipt(selectedOrderDetails);
      setShowOrderDetailsModal(false);
    }
  };
  
  const handleOrderDetailsDelete = () => {
    if (selectedOrderDetails) {
      handleDeleteOrder(selectedOrderDetails.id);
      setShowOrderDetailsModal(false);
    }
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Handle sort
  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Handle filter change
  const handleFilterChange = (type: keyof typeof filters, key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      users: { role: '', status: '' },
      orders: { status: '', priority: '', payment_status: '', exclude_delivered: true },
      clients: { city: '' },
      products: { category: '', status: '' },
      deliveries: { status: '', delivery_type: '' }
    });
    setSortConfig({ key: '', direction: 'asc' });
  };
  
  // Filter and sort data
  const getFilteredAndSortedData = () => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'users':
        data = [...users];
        break;
      case 'orders':
        data = [...orders];
        break;
      case 'clients':
        data = [...clients];
        break;
      case 'products':
        data = [...products];
        break;
      case 'deliveries':
        data = [...deliveries];
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => {
        const searchableFields = Object.values(item)
          .map(val => String(val).toLowerCase())
          .join(' ');
        return searchableFields.includes(searchTerm.toLowerCase());
      });
    }
    
    // Apply filters
    const currentFilters = filters[activeTab as keyof typeof filters];
    if (currentFilters) {
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== 'exclude_delivered') {
          data = data.filter(item => {
            if (key === 'status' && activeTab === 'users') {
              const isActive = item.is_active === true || item.is_active === 1 || item.is_active === '1';
              return value === '1' ? isActive : !isActive;
            }
            return item[key] === value;
          });
        }
      });
      
      // Special filter for orders: exclude delivered orders if exclude_delivered is true
      if (activeTab === 'orders' && 'exclude_delivered' in currentFilters && currentFilters.exclude_delivered) {
        data = data.filter(item => item.status !== 'delivered');
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return data;
  };
  
  // Handle selection
  const handleSelectAll = (type: string) => {
    const filteredData = getFilteredAndSortedData();
    const allIds = filteredData.map(item => item.id);
    
    switch (type) {
      case 'users':
        setSelectedUsers(selectedUsers.length === allIds.length ? [] : allIds);
        break;
      case 'orders':
        setSelectedOrders(selectedOrders.length === allIds.length ? [] : allIds);
        break;
      case 'clients':
        setSelectedClients(selectedClients.length === allIds.length ? [] : allIds);
        break;
      case 'products':
        setSelectedProducts(selectedProducts.length === allIds.length ? [] : allIds);
        break;
      case 'deliveries':
        setSelectedDeliveries(selectedDeliveries.length === allIds.length ? [] : allIds);
        break;
    }
  };
  
  const handleSelectItem = (type: string, id: number) => {
    switch (type) {
      case 'users':
        setSelectedUsers(prev =>
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
        break;
      case 'orders':
        setSelectedOrders(prev =>
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
        break;
      case 'clients':
        setSelectedClients(prev =>
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
        break;
      case 'products':
        setSelectedProducts(prev =>
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
        break;
      case 'deliveries':
        setSelectedDeliveries(prev =>
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
        break;
    }
  };
  
  const handleRefresh = async () => {
    try {
      const tabKey = activeTab as keyof typeof loading;
      setLoading(prev => ({ ...prev, [tabKey]: true }));
      
      switch (activeTab) {
        case 'dashboard':
          await loadDashboardData();
          await loadNotifications();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'orders':
          await loadOrders();
          break;
        case 'clients':
          await loadClients();
          break;
        case 'products':
          await loadProducts();
          break;
        case 'staff':
          await loadStaffPerformance();
          break;
        case 'analytics':
          await loadAnalytics();
          break;
        case 'deliveries':
          await loadDeliveries();
          break;
      }
      setSuccessMessage('Data refreshed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError('Failed to refresh data');
    } finally {
      const tabKey = activeTab as keyof typeof loading;
      setLoading(prev => ({ ...prev, [tabKey]: false }));
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    navigate('/login');
  };
  
  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToPDF = (data: any[], title: string, filename: string) => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }
    
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Prepare table data
    const headers = Object.keys(data[0]);
    const tableData = data.map(row => headers.map(header => row[header] || ''));
    
    // Add table with border
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Save PDF automatically
    doc.save(filename);
  };
  
  const exportUsersToCSV = () => {
    const data = getFilteredAndSortedData();
    exportToCSV(data, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportUsersToPDF = () => {
    const data = getFilteredAndSortedData();
    exportToPDF(data, 'Users Report', `users_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportOrdersToCSV = () => {
    const data = getFilteredAndSortedData();
    exportToCSV(data, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportOrdersToPDF = () => {
    const data = getFilteredAndSortedData();
    exportToPDF(data, 'Orders Report', `orders_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportClientsToCSV = () => {
    const data = getFilteredAndSortedData();
    exportToCSV(data, `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportClientsToPDF = () => {
    const data = getFilteredAndSortedData();
    exportToPDF(data, 'Clients Report', `clients_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportProductsToCSV = () => {
    const data = getFilteredAndSortedData();
    exportToCSV(data, `products_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportProductsToPDF = () => {
    const data = getFilteredAndSortedData();
    exportToPDF(data, 'Products Report', `products_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportDeliveriesToCSV = () => {
    const data = getFilteredAndSortedData();
    exportToCSV(data, `deliveries_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportDeliveriesToPDF = () => {
    const data = getFilteredAndSortedData();
    exportToPDF(data, 'Deliveries Report', `deliveries_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Generate order receipt PDF (automatically downloads)
  const generateOrderReceipt = (order: Order) => {
    const doc = new jsPDF();
    
    // Add border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SUN COMPUTERS', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Service Center & Computer Solutions', 105, 32, { align: 'center' });
    doc.text('Contact: +91 1234567890 | Email: info@suncomputers.com', 105, 39, { align: 'center' });
    doc.text('Address: 123 Main Street, City, State - 600001', 105, 46, { align: 'center' });
    
    // Receipt Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE ORDER RECEIPT', 105, 60, { align: 'center' });
    
    // Horizontal line
    doc.setLineWidth(0.2);
    doc.line(20, 65, 190, 65);
    
    // Order Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details:', 20, 75);
    
    doc.setFont('helvetica', 'normal');
    let yPos = 82;
    
    const orderDetails = [
      ['Order Code:', order.order_code],
      ['Order Date:', new Date(order.created_at).toLocaleDateString('en-IN')],
      ['Status:', order.status.toUpperCase()],
      ['Priority:', order.priority.toUpperCase()],
      ['Warranty Status:', order.warranty_status.replace(/_/g, ' ').toUpperCase()]
    ];
    
    orderDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Client Details
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    const clientDetails = [
      ['Client Name:', order.client_name],
      ['Phone:', order.client_phone],
      ['Order Date:', new Date(order.created_at).toLocaleDateString('en-IN')]
    ];
    
    clientDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Product Details
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Product Details:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    const productDetails = [
      ['Product Name:', order.product_name],
      ['Brand/Model:', `${order.brand || ''} ${order.model || ''}`.trim()],
      ['Issue Description:', '']
    ];
    
    productDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      if (value) doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Issue Description (wrapped)
    const issueText = doc.splitTextToSize(order.issue_description || 'No description provided', 150);
    doc.text(issueText, 80, yPos - 14);
    yPos += (issueText.length * 7) - 7;
    
    // Payment Details
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    const paymentDetails = [
      ['Estimated Cost:', `₹${parseFloat(order.estimated_cost || '0').toFixed(2)}`],
      ['Final Cost:', `₹${parseFloat(order.final_cost || order.estimated_cost || '0').toFixed(2)}`],
      ['Payment Status:', order.payment_status.toUpperCase()],
      ['Deposit Amount:', `₹${parseFloat(order.deposit_amount || '0').toFixed(2)}`]
    ];
    
    paymentDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Staff Information
    if (order.staff_name) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Service Staff:', 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      doc.text(order.staff_name, 20, yPos);
      yPos += 7;
    }
    
    // Notes
    if (order.notes) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes:', 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      
      const notesText = doc.splitTextToSize(order.notes, 150);
      doc.text(notesText, 20, yPos);
      yPos += (notesText.length * 7);
    }
    
    // Footer
    yPos = 250;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Sun Computers!', 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('For any queries, please contact our customer support.', 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('This is a computer generated receipt.', 105, yPos, { align: 'center' });
    
    // Automatically download PDF
    doc.save(`order_receipt_${order.order_code}.pdf`);
  };
  
  // Generate delivery receipt PDF (automatically downloads)
  const generateDeliveryReceipt = (delivery: Delivery) => {
    const doc = new jsPDF();
    
    // Add border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SUN COMPUTERS', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Delivery Service Receipt', 105, 32, { align: 'center' });
    doc.text('Contact: +91 1234567890 | Email: delivery@suncomputers.com', 105, 39, { align: 'center' });
    
    // Receipt Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY RECEIPT', 105, 55, { align: 'center' });
    
    // Horizontal line
    doc.setLineWidth(0.2);
    doc.line(20, 60, 190, 60);
    
    // Delivery Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Details:', 20, 70);
    
    doc.setFont('helvetica', 'normal');
    let yPos = 77;
    
    const deliveryDetails = [
      ['Delivery Code:', delivery.delivery_code],
      ['Order Code:', delivery.order_code],
      ['Delivery Type:', delivery.delivery_type.replace('_', ' ').toUpperCase()],
      ['Status:', delivery.status.toUpperCase()],
      ['Scheduled Date:', new Date(delivery.scheduled_date).toLocaleDateString('en-IN')],
      ['Delivery Person:', delivery.delivery_person || 'Not assigned']
    ];
    
    deliveryDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Client Details
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    const clientDetails = [
      ['Client Name:', delivery.client_name],
      ['Contact Person:', delivery.contact_person],
      ['Contact Phone:', delivery.contact_phone]
    ];
    
    clientDetails.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // Delivery Address
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Address:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    const addressText = doc.splitTextToSize(delivery.address, 150);
    doc.text(addressText, 20, yPos);
    yPos += (addressText.length * 7);
    
    // Product Details
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Product Details:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(delivery.product_name || 'Not specified', 20, yPos);
    
    // Notes
    if (delivery.notes) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Delivery Notes:', 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      
      const notesText = doc.splitTextToSize(delivery.notes, 150);
      doc.text(notesText, 20, yPos);
      yPos += (notesText.length * 7);
    }
    
    // Signature Section
    yPos = 220;
    doc.setLineWidth(0.2);
    doc.line(30, yPos, 80, yPos);
    doc.line(120, yPos, 170, yPos);
    
    doc.text('Customer Signature', 55, yPos + 10, { align: 'center' });
    doc.text('Delivery Agent Signature', 145, yPos + 10, { align: 'center' });
    
    // Footer
    yPos = 250;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Sun Computers Delivery Service!', 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('For delivery queries, please contact: +91 9876543210', 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('This is a computer generated delivery receipt.', 105, yPos, { align: 'center' });
    
    // Automatically download PDF
    doc.save(`delivery_receipt_${delivery.delivery_code}.pdf`);
  };
  
  const openOrderReceipt = (order: Order) => {
    setSelectedOrderForReceipt(order);
    setShowReceiptModal(true);
  };
  
  const confirmGenerateReceipt = () => {
    if (selectedOrderForReceipt) {
      generateOrderReceipt(selectedOrderForReceipt);
      setShowReceiptModal(false);
      setSelectedOrderForReceipt(null);
      setSuccessMessage('Receipt generated and downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };
  
  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, color: 'blue' },
    { id: 'users', label: 'User Management', icon: <FiUsers />, color: 'purple' },
    { id: 'orders', label: 'Orders', icon: <FiPackage />, color: 'green' },
    { id: 'clients', label: 'Clients', icon: <FiUsers />, color: 'teal' },
    { id: 'products', label: 'Products', icon: <FiShoppingBag />, color: 'orange' },
    { id: 'deliveries', label: 'Deliveries', icon: <FiTruck />, color: 'red' },
    { id: 'staff', label: 'Staff Monitoring', icon: <FiActivity />, color: 'pink' },
    { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 />, color: 'indigo' },
  ];
  
  // Stats cards data - Updated to use real API data
  const statsCards = dashboardStats ? [
    {
      title: 'Total Products',
      value: dashboardStats.total_products?.toLocaleString() || '0',
      icon: <FiShoppingBag />,
      color: 'orange',
      description: 'Total products in inventory',
      onClick: () => {
        setActiveTab('products');
        setFilters(prev => ({...prev, products: {category: '', status: ''}}));
        setSearchTerm('');
      }
    },
    {
      title: "Today's Orders",
      value: dashboardStats.today_orders?.toLocaleString() || '0',
      icon: <FiPackage />,
      color: 'green',
      description: "Orders received today",
      onClick: () => {
        setActiveTab('orders');
        const today = new Date().toISOString().split('T')[0];
        setSearchTerm(today);
      }
    },
    {
      title: 'Total Users',
      value: dashboardStats.total_users?.toLocaleString() || '0',
      icon: <FiUsers />,
      color: 'blue',
      description: 'Active system users',
      onClick: () => {
        setActiveTab('users');
        setFilters(prev => ({...prev, users: {role: '', status: ''}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Total Clients',
      value: dashboardStats.total_clients?.toLocaleString() || '0',
      icon: <FiUsers />,
      color: 'teal',
      description: 'Registered clients',
      onClick: () => {
        setActiveTab('clients');
        setFilters(prev => ({...prev, clients: {city: ''}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Total Orders',
      value: dashboardStats.total_orders?.toLocaleString() || '0',
      icon: <FiPackage />,
      color: 'purple',
      description: 'All time orders',
      onClick: () => {
        setActiveTab('orders');
        setFilters(prev => ({...prev, orders: {status: '', priority: '', payment_status: '', exclude_delivered: true}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Active Staff',
      value: dashboardStats.active_staff?.toLocaleString() || '0',
      icon: <FiUserCheck />,
      color: 'pink',
      description: 'Active staff members',
      onClick: () => {
        setActiveTab('staff');
        setSearchTerm('');
      }
    },
    {
      title: 'Pending Orders',
      value: dashboardStats.pending_orders?.toLocaleString() || '0',
      icon: <FiClock />,
      color: 'orange',
      description: 'Awaiting processing',
      onClick: () => {
        setActiveTab('orders');
        setFilters(prev => ({...prev, orders: {status: 'pending', priority: '', payment_status: '', exclude_delivered: true}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Delivered Orders',
      value: dashboardStats.delivered_orders?.toLocaleString() || '0',
      icon: <FiCheckCircle />,
      color: 'green',
      description: 'Successfully delivered',
      onClick: () => {
        setActiveTab('deliveries');
        setFilters(prev => ({...prev, deliveries: {status: 'delivered', delivery_type: ''}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Completed Orders',
      value: dashboardStats.completed_orders?.toLocaleString() || '0',
      icon: <FiCheck />,
      color: 'green',
      description: 'Completed services',
      onClick: () => {
        setActiveTab('orders');
        setFilters(prev => ({...prev, orders: {status: 'completed', priority: '', payment_status: '', exclude_delivered: true}}));
        setSearchTerm('');
      }
    },
    {
      title: 'Today Revenue',
      value: `₹${dashboardStats.today_revenue?.toLocaleString() || '0'}`,
      icon: <FiDollarSign />,
      color: 'green',
      description: "Today's revenue",
      onClick: () => {
        setActiveTab('analytics');
        setSearchTerm('');
      }
    },
    {
      title: 'Total Revenue',
      value: `₹${dashboardStats.total_revenue?.toLocaleString() || '0'}`,
      icon: <FiDollarSign />,
      color: 'blue',
      description: 'Overall revenue',
      onClick: () => {
        setActiveTab('analytics');
        setSearchTerm('');
      }
    },
    {
      title: 'Active Products',
      value: dashboardStats.active_products?.toLocaleString() || '0',
      icon: <FiBox />,
      color: 'blue',
      description: 'Active in inventory',
      onClick: () => {
        setActiveTab('products');
        setFilters(prev => ({...prev, products: {category: '', status: 'active'}}));
        setSearchTerm('');
      }
    }
  ] : [];
  
  if (!user) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Loading Dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="super-admin-dashboard">
      {/* Alert Messages */}
      <div className="alert-container">
        {error && (
          <AlertMessage
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        
        {successMessage && (
          <AlertMessage
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile-sidebar' : ''} ${isTablet ? 'tablet-sidebar' : ''}`}
      >
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-logo">
              <FiShield />
            </div>
            <div className="brand-text">
              <h2>Sun Computers</h2>
              <p>Admin Dashboard</p>
            </div>
          </div>
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
            <FiChevronLeft />
          </button>
        </div>
        
        <div className="user-profile-card">
          <div className="profile-avatar">
            {user.profile_image ? (
              <img 
                src={user.profile_image} 
                alt={user.name}
                className="profile-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`avatar-initial ${user.profile_image ? 'hidden' : ''}`}>
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
          <div className="profile-info">
            <h3>{user.name || 'Admin User'}</h3>
            <div className="role-badge">
              <FiShield /> {user.role || 'Admin'}
            </div>
            <span className="user-email">{user.email || 'admin@suncomputers.com'}</span>
          </div>
        </div>
        
        <nav className="sidebar-navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile || isTablet) setSidebarOpen(false);
              }}
            >
              <span className={`nav-icon nav-icon-${item.color}`}>
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              <div className="nav-indicator"></div>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="btn btn-logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className={`main-content-wrapper ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left-section">
            <button className="toggle-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiChevronLeft /> : <FiMenu />}
            </button>
            
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>
          </div>
          
          <div className="header-right-section">
            <button 
              className="action-button" 
              onClick={handleRefresh} 
              title="Refresh"
              disabled={loading[activeTab as keyof typeof loading]}
            >
              <FiRefreshCw className={loading[activeTab as keyof typeof loading] ? 'spinning' : ''} />
            </button>
            
            <button className="action-button" title="Notifications">
              <FiBell />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="notification-badge">{notifications.filter(n => !n.is_read).length}</span>
              )}
            </button>
            
            {/* Logout button near notification icon */}
            <button 
              className="action-button logout-header-btn" 
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut />
            </button>
            
            <div className="user-menu">
              <div className="user-avatar-small">
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.name}
                    className="profile-image-small"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`avatar-initial-small ${user.profile_image ? 'hidden' : ''}`}>
                  {user.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
              <div className="user-details">
                <span className="user-name">{user.name || 'Admin User'}</span>
                <span className="user-role">{user.role || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="dashboard-main-content">
          {/* Loading Overlay */}
          {loading[activeTab as keyof typeof loading] && (
            <div className="loading-overlay-content">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
              </div>
              <p className="loading-text">Loading {activeTab} data...</p>
            </div>
          )}
          
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-content">
              <div className="welcome-greeting">
                <h1>
                  <span className="greeting-text">Welcome back,</span>
                  <span className="greeting-name"> {user.name?.split(' ')[0] || 'Admin'}! 👋</span>
                </h1>
                <p className="greeting-subtitle">
                  Monitor and manage your entire Sun Computers ecosystem
                </p>
              </div>
              {dashboardStats && (
                <div className="quick-stats">
                  <div className="stat-item" onClick={() => setActiveTab('products')}>
                    <div className="stat-icon-small">
                      <FiShoppingBag />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value-small">{dashboardStats.total_products?.toLocaleString() || '0'}</span>
                      <span className="stat-label">Products</span>
                    </div>
                  </div>
                  <div className="stat-item" onClick={() => setActiveTab('orders')}>
                    <div className="stat-icon-small">
                      <FiPackage />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value-small">{dashboardStats.today_orders?.toLocaleString() || '0'}</span>
                      <span className="stat-label">Today's Orders</span>
                    </div>
                  </div>
                  <div className="stat-item" onClick={() => setActiveTab('users')}>
                    <div className="stat-icon-small">
                      <FiUsers />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value-small">{dashboardStats.total_users?.toLocaleString() || '0'}</span>
                      <span className="stat-label">Users</span>
                    </div>
                  </div>
                  <div className="stat-item" onClick={() => setActiveTab('analytics')}>
                    <div className="stat-icon-small">
                      <FiDollarSign />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value-small">₹{dashboardStats.today_revenue?.toLocaleString() || '0'}</span>
                      <span className="stat-label">Today's Revenue</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="welcome-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleRefresh}
                disabled={loading[activeTab as keyof typeof loading]}
              >
                <FiRefreshCw className={loading[activeTab as keyof typeof loading] ? 'spinning' : ''} /> Refresh
              </button>
            </div>
          </div>
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="stats-grid-container">
                {statsCards.map((stat, index) => (
                  <div 
                    key={index}
                    className="stat-card clickable"
                    onClick={stat.onClick}
                  >
                    <div className="stat-card-inner">
                      <div className={`stat-icon stat-icon-${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div className="stat-content">
                        <h3 className="stat-value">{stat.value}</h3>
                        <p className="stat-title">{stat.title}</p>
                        {stat.description && (
                          <p className="stat-description">{stat.description}</p>
                        )}
                      </div>
                      <div className="stat-arrow">
                        <FiChevronRight />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>User Management</h3>
                    <p>Manage system users and permissions</p>
                  </div>
                  <div className="table-controls">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowCreateUser(true)}
                    >
                      <FiUserPlus /> Add User
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleFilterChange('users', 'role', '')}>
                      <FiFilter /> Clear Filters
                    </button>
                    <div className="export-buttons">
                      <button className="btn btn-export" onClick={exportUsersToCSV}>
                        <FiDownload /> Export CSV
                      </button>
                      <button className="btn btn-export" onClick={exportUsersToPDF}>
                        <FiFileText /> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="table-filters">
                  <div className="filter-controls">
                    <select 
                      className="filter-select"
                      value={filters.users.role}
                      onChange={(e) => handleFilterChange('users', 'role', e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                    <select 
                      className="filter-select"
                      value={filters.users.status}
                      onChange={(e) => handleFilterChange('users', 'status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div className="table-content">
                  {users.length > 0 ? (
                    <div className="table-wrapper">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.length === getFilteredAndSortedData().length}
                                  onChange={() => handleSelectAll('users')}
                                  className="selection-checkbox"
                                />
                              </th>
                              <th>S.No</th>
                              <th 
                                onClick={() => handleSort('name')}
                                className="sortable-header"
                              >
                                User Details {sortConfig.key === 'name' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Contact</th>
                              <th 
                                onClick={() => handleSort('role')}
                                className="sortable-header"
                              >
                                Role {sortConfig.key === 'role' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th 
                                onClick={() => handleSort('last_login')}
                                className="sortable-header"
                              >
                                Last Active {sortConfig.key === 'last_login' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredAndSortedData().map((user, index) => (
                              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => handleSelectItem('users', user.id)}
                                    className="selection-checkbox"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar">
                                      {user.profile_image ? (
                                        <img 
                                          src={user.profile_image} 
                                          alt={user.name}
                                          className="user-profile-image"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <div className={`avatar-initial-small ${user.profile_image ? 'hidden' : ''}`}>
                                        {user.name.charAt(0)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="user-name">
                                        {user.name}
                                      </div>
                                      <div className="user-email">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="contact-cell">
                                    {user.phone || 'Not set'}
                                  </div>
                                </td>
                                <td>
                                  <div className="role-cell">
                                    <span className={`role-badge ${user.role}`}>
                                      {user.role}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {user.last_login ? 
                                    new Date(user.last_login).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 
                                    'Never'
                                  }
                                </td>
                                <td>
                                  <div className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                  </div>
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Edit"
                                      onClick={() => handleEdit('user', user)}
                                    >
                                      <FiEdit />
                                    </button>
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Reset Password"
                                      onClick={() => openResetPasswordModal(user.id, user.name)}
                                    >
                                      <FiLock />
                                    </button>
                                    <button 
                                      className="action-button btn-sm danger" 
                                      title="Delete"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data">
                      {loading.users ? 'Loading users...' : 'No users found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="orders-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>Order Management</h3>
                    <p>Track and manage all service orders</p>
                  </div>
                  <div className="table-controls">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowCreateOrder(true)}
                    >
                      <FiPlus /> New Order
                    </button>
                    <button className="btn btn-secondary" onClick={clearAllFilters}>
                      <FiFilter /> Clear Filters
                    </button>
                    <div className="filter-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={filters.orders.exclude_delivered}
                          onChange={(e) => handleFilterChange('orders', 'exclude_delivered', e.target.checked.toString())}
                        />
                        Exclude Delivered Orders
                      </label>
                    </div>
                    <div className="export-buttons">
                      <button className="btn btn-export" onClick={exportOrdersToCSV}>
                        <FiDownload /> Export CSV
                      </button>
                      <button className="btn btn-export" onClick={exportOrdersToPDF}>
                        <FiFileText /> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="table-filters">
                  <div className="filter-controls">
                    <select 
                      className="filter-select"
                      value={filters.orders.status}
                      onChange={(e) => handleFilterChange('orders', 'status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select 
                      className="filter-select"
                      value={filters.orders.priority}
                      onChange={(e) => handleFilterChange('orders', 'priority', e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select 
                      className="filter-select"
                      value={filters.orders.payment_status}
                      onChange={(e) => handleFilterChange('orders', 'payment_status', e.target.value)}
                    >
                      <option value="">All Payment Status</option>
                      {paymentOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="table-content">
                  {orders.length > 0 ? (
                    <div className="table-wrapper">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.length === getFilteredAndSortedData().length}
                                  onChange={() => handleSelectAll('orders')}
                                  className="selection-checkbox"
                                />
                              </th>
                              <th>S.No</th>
                              <th 
                                onClick={() => handleSort('order_code')}
                                className="sortable-header"
                              >
                                Order Code {sortConfig.key === 'order_code' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Client Details</th>
                              <th>Product</th>
                              <th>Issue</th>
                              <th>Warranty</th>
                              <th>Amount</th>
                              <th>Payment</th>
                              <th 
                                onClick={() => handleSort('status')}
                                className="sortable-header"
                              >
                                Status {sortConfig.key === 'status' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Priority</th>
                              <th>Staff</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredAndSortedData().map((order, index) => (
                              <tr 
                                key={order.id} 
                                className={`order-row ${selectedOrders.includes(order.id) ? 'selected' : ''} ${order.status}`}
                                onClick={() => handleOrderRowClick(order)}
                              >
                                <td onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleSelectItem('orders', order.id);
                                    }}
                                    className="selection-checkbox"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                  <div className="order-code-cell">
                                    <span className="code-badge">{order.order_code}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="client-cell">
                                    <div className="client-name">{order.client_name}</div>
                                    <div className="client-phone">{order.client_phone}</div>
                                  </div>
                                </td>
                                <td>
                                  <div className="product-cell">
                                    <div className="product-name">{order.product_name}</div>
                                    {order.brand && (
                                      <div className="product-details">
                                        {order.brand} {order.model ? `- ${order.model}` : ''}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="truncate-cell">
                                  <div className="issue-description">
                                    {order.issue_description?.substring(0, 60) || 'No description'}
                                    {order.issue_description?.length > 60 && '...'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`warranty-badge ${order.warranty_status}`}>
                                    {order.warranty_status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  <div className="amount-cell">
                                    <div className="estimated">Est: ₹{order.estimated_cost || '0'}</div>
                                    <div className="final">Final: ₹{order.final_cost || order.estimated_cost || '0'}</div>
                                    {parseFloat(order.deposit_amount || '0') > 0 && (
                                      <div className="deposit">Dep: ₹{order.deposit_amount}</div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className={`payment-badge ${order.payment_status}`}>
                                    {order.payment_status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-badge ${order.status}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`priority-badge ${order.priority}`}>
                                    {order.priority}
                                  </span>
                                </td>
                                <td>
                                  <div className="staff-cell">
                                    {order.staff_name || 'Unassigned'}
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="action-buttons">
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit('order', order);
                                      }}
                                    >
                                      <FiEdit />
                                    </button>
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Receipt"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openOrderReceipt(order);
                                      }}
                                    >
                                      <FiPrinter />
                                    </button>
                                    <button 
                                      className="action-button btn-sm danger" 
                                      title="Delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteOrder(order.id);
                                      }}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data">
                      {loading.orders ? 'Loading orders...' : 'No orders found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="clients-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>Client Management</h3>
                    <p>Manage client information and history</p>
                  </div>
                  <div className="table-controls">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowCreateClient(true)}
                    >
                      <FiUserPlus /> Add Client
                    </button>
                    <button className="btn btn-secondary" onClick={clearAllFilters}>
                      <FiFilter /> Clear Filters
                    </button>
                    <div className="export-buttons">
                      <button className="btn btn-export" onClick={exportClientsToCSV}>
                        <FiDownload /> Export CSV
                      </button>
                      <button className="btn btn-export" onClick={exportClientsToPDF}>
                        <FiFileText /> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="table-filters">
                  <div className="filter-controls">
                    <input 
                      type="text"
                      className="filter-select"
                      placeholder="Filter by City"
                      value={filters.clients.city}
                      onChange={(e) => handleFilterChange('clients', 'city', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="table-content">
                  {clients.length > 0 ? (
                    <div className="table-wrapper">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedClients.length === getFilteredAndSortedData().length}
                                  onChange={() => handleSelectAll('clients')}
                                  className="selection-checkbox"
                                />
                              </th>
                              <th>S.No</th>
                              <th 
                                onClick={() => handleSort('client_code')}
                                className="sortable-header"
                              >
                                Client Code {sortConfig.key === 'client_code' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th 
                                onClick={() => handleSort('full_name')}
                                className="sortable-header"
                              >
                                Full Name {sortConfig.key === 'full_name' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th 
                                onClick={() => handleSort('phone')}
                                className="sortable-header"
                              >
                                Phone Number {sortConfig.key === 'phone' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Email Address</th>
                              <th>City, State</th>
                              <th>Total Orders</th>
                              <th>Total Spent</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredAndSortedData().map((client, index) => (
                              <tr key={client.id} className={selectedClients.includes(client.id) ? 'selected' : ''}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedClients.includes(client.id)}
                                    onChange={() => handleSelectItem('clients', client.id)}
                                    className="selection-checkbox"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                  <span className="code-badge">{client.client_code}</span>
                                </td>
                                <td>
                                  <div className="name-cell">
                                    {client.full_name}
                                  </div>
                                </td>
                                <td>
                                  <div className="phone-cell">
                                    {client.phone}
                                  </div>
                                </td>
                                <td>
                                  <div className="email-cell">
                                    {client.email}
                                  </div>
                                </td>
                                <td>
                                  <div className="location-cell">
                                    <div>{client.city}, {client.state}</div>
                                  </div>
                                </td>
                                <td>
                                  <div className="order-count">
                                    <span className="count-badge">{client.total_orders || 0}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="amount-spent">
                                    ₹{client.total_spent?.toLocaleString() || '0'}
                                  </div>
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Edit"
                                      onClick={() => handleEdit('client', client)}
                                    >
                                      <FiEdit />
                                    </button>
                                    <button 
                                      className="action-button btn-sm" 
                                      title="View Orders"
                                      onClick={() => {
                                        setActiveTab('orders');
                                        setSearchTerm(client.full_name);
                                      }}
                                    >
                                      <FiEye />
                                    </button>
                                    <button 
                                      className="action-button btn-sm danger" 
                                      title="Delete"
                                      onClick={() => handleDeleteClient(client.id)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data">
                      {loading.clients ? 'Loading clients...' : 'No clients found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="products-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>Product Management</h3>
                    <p>Manage inventory and product details</p>
                  </div>
                  <div className="table-controls">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowCreateProduct(true)}
                    >
                      <FiPlus /> Add Product
                    </button>
                    <button className="btn btn-secondary" onClick={clearAllFilters}>
                      <FiFilter /> Clear Filters
                    </button>
                    <div className="export-buttons">
                      <button className="btn btn-export" onClick={exportProductsToCSV}>
                        <FiDownload /> Export CSV
                      </button>
                      <button className="btn btn-export" onClick={exportProductsToPDF}>
                        <FiFileText /> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="table-filters">
                  <div className="filter-controls">
                    <select 
                      className="filter-select"
                      value={filters.products.category}
                      onChange={(e) => handleFilterChange('products', 'category', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select 
                      className="filter-select"
                      value={filters.products.status}
                      onChange={(e) => handleFilterChange('products', 'status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
                
                <div className="table-content">
                  {products.length > 0 ? (
                    <div className="table-wrapper">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.length === getFilteredAndSortedData().length}
                                  onChange={() => handleSelectAll('products')}
                                  className="selection-checkbox"
                                />
                              </th>
                              <th>S.No</th>
                              <th 
                                onClick={() => handleSort('product_code')}
                                className="sortable-header"
                              >
                                Product Code {sortConfig.key === 'product_code' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th 
                                onClick={() => handleSort('product_name')}
                                className="sortable-header"
                              >
                                Product Name {sortConfig.key === 'product_name' && (
                                  sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                              </th>
                              <th>Brand</th>
                              <th>Model</th>
                              <th>Category</th>
                              <th>Price</th>
                              <th>Stock</th>
                              <th>Min Stock</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredAndSortedData().map((product, index) => (
                              <tr key={product.id} className={selectedProducts.includes(product.id) ? 'selected' : ''}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => handleSelectItem('products', product.id)}
                                    className="selection-checkbox"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                  <span className="code-badge">{product.product_code}</span>
                                </td>
                                <td>
                                  <div className="product-name-cell">
                                    {product.product_name}
                                  </div>
                                </td>
                                <td>
                                  <div className="brand-cell">
                                    {product.brand}
                                  </div>
                                </td>
                                <td>
                                  <div className="model-cell">
                                    {product.model}
                                  </div>
                                </td>
                                <td>
                                  <div className="category-cell">
                                    {product.category}
                                  </div>
                                </td>
                                <td>
                                  <div className="price-cell">
                                    ₹{product.price}
                                  </div>
                                </td>
                                <td>
                                  <div className="stock-cell">
                                    <div className="stock-quantity">{product.stock_quantity}</div>
                                    <div className={`stock-indicator ${product.stock_quantity <= product.min_stock_level ? 'low' : 'normal'}`}>
                                      {product.stock_quantity <= product.min_stock_level ? 'Low' : 'Normal'}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="min-stock-cell">
                                    {product.min_stock_level}
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-badge ${product.status}`}>
                                    {product.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Edit"
                                      onClick={() => handleEdit('product', product)}
                                    >
                                      <FiEdit />
                                    </button>
                                    <button 
                                      className="action-button btn-sm danger" 
                                      title="Delete"
                                      onClick={() => handleDeleteProduct(product.id)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data">
                      {loading.products ? 'Loading products...' : 'No products found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="deliveries-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>Delivery Management</h3>
                    <p>Track and manage all deliveries</p>
                  </div>
                  <div className="table-controls">
                    <button className="btn btn-secondary" onClick={clearAllFilters}>
                      <FiFilter /> Clear Filters
                    </button>
                    <div className="export-buttons">
                      <button className="btn btn-export" onClick={exportDeliveriesToCSV}>
                        <FiDownload /> Export CSV
                      </button>
                      <button className="btn btn-export" onClick={exportDeliveriesToPDF}>
                        <FiFileText /> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="table-filters">
                  <div className="filter-controls">
                    <select 
                      className="filter-select"
                      value={filters.deliveries.status}
                      onChange={(e) => handleFilterChange('deliveries', 'status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      {deliveryStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select 
                      className="filter-select"
                      value={filters.deliveries.delivery_type}
                      onChange={(e) => handleFilterChange('deliveries', 'delivery_type', e.target.value)}
                    >
                      <option value="">All Delivery Types</option>
                      {deliveryTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="table-content">
                  {deliveries.length > 0 ? (
                    <div className="table-wrapper">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedDeliveries.length === getFilteredAndSortedData().length}
                                  onChange={() => handleSelectAll('deliveries')}
                                  className="selection-checkbox"
                                />
                              </th>
                              <th>S.No</th>
                              <th>Delivery Code</th>
                              <th>Order Code</th>
                              <th>Client Name</th>
                              <th>Contact Person</th>
                              <th>Delivery Address</th>
                              <th>Delivery Type</th>
                              <th>Scheduled Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredAndSortedData().map((delivery, index) => (
                              <tr key={delivery.id} className={selectedDeliveries.includes(delivery.id) ? 'selected' : ''}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedDeliveries.includes(delivery.id)}
                                    onChange={() => handleSelectItem('deliveries', delivery.id)}
                                    className="selection-checkbox"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                  <span className="code-badge">{delivery.delivery_code}</span>
                                </td>
                                <td>{delivery.order_code}</td>
                                <td>{delivery.client_name}</td>
                                <td>
                                  <div>
                                    <div>{delivery.contact_person}</div>
                                    <div className="small-text">{delivery.contact_phone}</div>
                                  </div>
                                </td>
                                <td className="truncate-cell">
                                  {delivery.address?.substring(0, 60)}...
                                </td>
                                <td>
                                  <span className={`delivery-type-badge ${delivery.delivery_type}`}>
                                    {delivery.delivery_type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  {new Date(delivery.scheduled_date).toLocaleDateString('en-IN')}
                                </td>
                                <td>
                                  <span className={`status-badge ${delivery.status}`}>
                                    {delivery.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Edit"
                                      onClick={() => handleEdit('delivery', delivery)}
                                    >
                                      <FiEdit />
                                    </button>
                                    <button 
                                      className="action-button btn-sm" 
                                      title="Delivery Receipt"
                                      onClick={() => generateDeliveryReceipt(delivery)}
                                    >
                                      <FiPrinter />
                                    </button>
                                    <button 
                                      className="action-button btn-sm" 
                                      title="View Order"
                                      onClick={() => {
                                        setActiveTab('orders');
                                        setSearchTerm(delivery.order_code);
                                      }}
                                    >
                                      <FiEye />
                                    </button>
                                    <button 
                                      className="action-button btn-sm danger" 
                                      title="Delete"
                                      onClick={() => handleDeleteDelivery(delivery.id)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data">
                      {loading.deliveries ? 'Loading deliveries...' : 'No deliveries found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Staff Monitoring Tab */}
          {activeTab === 'staff' && (
            <div className="staff-tab">
              <div className="data-table-wrapper">
                <div className="table-header-section">
                  <div className="table-title-wrapper">
                    <h3>Staff Performance Monitoring</h3>
                    <p>Track staff performance and assigned orders</p>
                  </div>
                  <div className="table-controls">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleRefresh()}
                      disabled={loading.staff}
                    >
                      <FiRefreshCw className={loading.staff ? 'spinning' : ''} /> Refresh
                    </button>
                  </div>
                </div>
                
                <div className="staff-performance-grid">
                  {staffPerformance.length > 0 ? (
                    <>
                      {staffPerformance.map((staff) => (
                        <div key={staff.id} className="staff-performance-card">
                          <div className="staff-card-header">
                            <div className="staff-avatar">
                              {staff.profile_image ? (
                                <img 
                                  src={staff.profile_image} 
                                  alt={staff.name}
                                  className="staff-profile-image"
                                />
                              ) : (
                                <div className="avatar-initial-staff">
                                  {staff.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="staff-info">
                              <h4>{staff.name}</h4>
                              <p className="staff-email">{staff.email}</p>
                              <div className="staff-role">
                                <span className={`role-badge ${staff.role}`}>
                                  {staff.role}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="staff-performance-stats">
                            <div className="performance-stat">
                              <span className="stat-label">Total Orders</span>
                              <span className="stat-value">{staff.total_orders}</span>
                            </div>
                            <div className="performance-stat">
                              <span className="stat-label">Completed</span>
                              <span className="stat-value">{staff.completed_orders}</span>
                            </div>
                            <div className="performance-stat">
                              <span className="stat-label">Active</span>
                              <span className="stat-value">{staff.active_orders}</span>
                            </div>
                            <div className="performance-stat">
                              <span className="stat-label">Total Revenue</span>
                              <span className="stat-value">₹{staff.total_revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="performance-metrics">
                            <div className="metric">
                              <span className="metric-label">Avg Order Value</span>
                              <span className="metric-value">₹{staff.avg_order_value.toFixed(2)}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Completion Rate</span>
                              <span className="metric-value">{staff.completion_rate.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="staff-last-login">
                            <span className="last-login-label">Last Login:</span>
                            <span className="last-login-value">{staff.last_login_formatted}</span>
                          </div>
                          
                          <div className="staff-card-actions">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleViewStaffDetails(staff)}
                            >
                              <FiEye /> View Orders
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setActiveTab('orders');
                                setSearchTerm(staff.name);
                              }}
                            >
                              <FiChevronsRight /> Go to Orders
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="no-data">
                      {loading.staff ? 'Loading staff performance data...' : 'No staff performance data available'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <div className="analytics-header">
                <div className="analytics-title">
                  <h3>Business Analytics Dashboard</h3>
                  <p>Real-time insights and performance metrics</p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleRefresh()}
                  disabled={loading.analytics}
                >
                  <FiRefreshCw className={loading.analytics ? 'spinning' : ''} /> Refresh Analytics
                </button>
              </div>
              
              {analyticsData ? (
                <div className="analytics-grid">
                  {/* Order Status Distribution Pie Chart */}
                  <div className="analytics-card medium">
                    <div className="card-header">
                      <h4>Order Status Distribution</h4>
                      <p>Current status of all orders</p>
                    </div>
                    <div className="chart-container">
                      {analyticsData.status_distribution && analyticsData.status_distribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={analyticsData.status_distribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.status}: ${entry.count}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="status"
                            >
                              {analyticsData.status_distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || getStatusColor(entry.status)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} orders`]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data">
                          <p>No status data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Priority Distribution Pie Chart */}
                  <div className="analytics-card medium">
                    <div className="card-header">
                      <h4>Order Priority Distribution</h4>
                      <p>Distribution of orders by priority level</p>
                    </div>
                    <div className="chart-container">
                      {analyticsData.priority_distribution && analyticsData.priority_distribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={analyticsData.priority_distribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.priority}: ${entry.count}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="priority"
                            >
                              {analyticsData.priority_distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || getPriorityColor(entry.priority)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} orders`]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data">
                          <p>No priority data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Monthly Revenue Chart */}
                  <div className="analytics-card large">
                    <div className="card-header">
                      <h4>Monthly Revenue Trend</h4>
                      <p>Revenue generated over months</p>
                    </div>
                    <div className="chart-container">
                      {analyticsData.monthly_revenue && analyticsData.monthly_revenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={analyticsData.monthly_revenue}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="month" 
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                              }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip 
                              formatter={(value) => [`₹${value}`, 'Revenue']}
                              labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#8884d8" 
                              fill="#8884d8" 
                              fillOpacity={0.3}
                              name="Revenue"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data">
                          <p>No revenue data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Trends Chart */}
                  <div className="analytics-card large">
                    <div className="card-header">
                      <h4>Order Trends</h4>
                      <p>Daily order count trends</p>
                    </div>
                    <div className="chart-container">
                      {analyticsData.order_trends && analyticsData.order_trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={analyticsData.order_trends}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-US')}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="orders" 
                              stroke="#82ca9d" 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                              name="Orders"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data">
                          <p>No order trend data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  {loading.analytics ? 'Loading analytics data...' : 'No analytics data available'}
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="dashboard-footer">
          <p className="footer-text">
            © 2026 Jeevan Larosh. All rights reserved
          </p>
          <div className="system-status">
            <div className="status-indicator">
              <div className="status-pulse"></div>
              <div className="status-dot"></div>
            </div>
            <span>System Status: Operational</span>
            <span className="last-updated">
              <FiClock /> Last Updated: {new Date().toLocaleString()}
            </span>
          </div>
        </footer>
      </div>
      
      {/* Modals */}
      
      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        title="Create New User"
        size="lg"
      >
        <div className="modal-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Profile Image</label>
              <div className="image-upload-container">
                <div className="image-preview">
                  {newUser.profile_image_url ? (
                    <img 
                      src={newUser.profile_image_url} 
                      alt="Profile preview" 
                      className="image-preview-img"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <FiCamera size={24} />
                      <span>Upload Image</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewUser(prev => ({
                          ...prev,
                          profile_image: file,
                          profile_image_url: reader.result as string
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="image-upload-input"
                  id="profile-image-upload"
                />
                <label htmlFor="profile-image-upload" className="btn btn-secondary">
                  <FiUpload /> Choose Image
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Enter full name"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Enter email address"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Enter password (min 6 characters)"
                className="form-input"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="Enter phone number"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}
                className="form-select"
                required
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="form-group">
              <label>Active Status</label>
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  checked={newUser.is_active}
                  onChange={(e) => setNewUser({...newUser, is_active: e.target.checked})}
                  id="is_active"
                />
                <label htmlFor="is_active">User is active</label>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCreateUser(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateUser}>
              Create User
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Create Order Modal - UPDATED with client dropdown */}
      <Modal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        title="Create New Service Order"
        size="lg"
      >
        <div className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Client Name *</label>
              <select
                value={newOrder.client_id}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.full_name} ({client.phone})
                  </option>
                ))}
              </select>
              <small className="form-hint">
                Select a client from the list to auto-fill their phone number
              </small>
            </div>
            <div className="form-group">
              <label>Client Phone *</label>
              <input
                type="tel"
                value={newOrder.client_phone}
                onChange={(e) => setNewOrder({...newOrder, client_phone: e.target.value})}
                placeholder="Client phone will auto-fill"
                className="form-input"
                required
                readOnly
                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
              <small className="form-hint">
                Phone number automatically filled from selected client
              </small>
            </div>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={newOrder.product_name}
                onChange={(e) => setNewOrder({...newOrder, product_name: e.target.value})}
                placeholder="Enter product name"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Service Staff</label>
              <select
                value={newOrder.staff_id}
                onChange={(e) => setNewOrder({...newOrder, staff_id: e.target.value})}
                className="form-select"
              >
                <option value="">Select Service Staff</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Issue Description *</label>
              <textarea
                value={newOrder.issue_description}
                onChange={(e) => setNewOrder({...newOrder, issue_description: e.target.value})}
                placeholder="Describe the issue"
                className="form-textarea"
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Priority Level *</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as any})}
                className="form-select"
                required
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Warranty Status *</label>
              <select
                value={newOrder.warranty_status}
                onChange={(e) => setNewOrder({...newOrder, warranty_status: e.target.value as any})}
                className="form-select"
                required
              >
                {warrantyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select
                value={newOrder.status}
                onChange={(e) => setNewOrder({...newOrder, status: e.target.value as any})}
                className="form-select"
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Status *</label>
              <select
                value={newOrder.payment_status}
                onChange={(e) => setNewOrder({...newOrder, payment_status: e.target.value as any})}
                className="form-select"
                required
              >
                {paymentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Cost (₹)</label>
              <input
                type="number"
                value={newOrder.estimated_cost}
                onChange={(e) => setNewOrder({...newOrder, estimated_cost: e.target.value})}
                placeholder="0.00"
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Final Cost (₹)</label>
              <input
                type="number"
                value={newOrder.final_cost}
                onChange={(e) => setNewOrder({...newOrder, final_cost: e.target.value})}
                placeholder="0.00"
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Deposit Amount (₹)</label>
              <input
                type="number"
                value={newOrder.deposit_amount}
                onChange={(e) => setNewOrder({...newOrder, deposit_amount: e.target.value})}
                placeholder="0.00"
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Estimated Delivery Date</label>
              <input
                type="date"
                value={newOrder.estimated_delivery_date}
                onChange={(e) => setNewOrder({...newOrder, estimated_delivery_date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={newOrder.notes}
                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                placeholder="Additional notes"
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCreateOrder(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateOrder}>
              Create Order
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateClient}
        onClose={() => setShowCreateClient(false)}
        title="Add New Client"
        size="md"
      >
        <div className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={newClient.full_name}
                onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                placeholder="Enter full name"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                placeholder="Enter email address"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                placeholder="Enter phone number"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={newClient.address}
                onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                placeholder="Enter address"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={newClient.city}
                onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                placeholder="Enter city"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={newClient.state}
                onChange={(e) => setNewClient({...newClient, state: e.target.value})}
                placeholder="Enter state"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={newClient.zip_code}
                onChange={(e) => setNewClient({...newClient, zip_code: e.target.value})}
                placeholder="Enter ZIP code"
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={newClient.notes}
                onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                placeholder="Additional notes"
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCreateClient(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateClient}>
              Add Client
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        title="Add New Product"
        size="lg"
      >
        <div className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={newProduct.product_name}
                onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                placeholder="Enter product name"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                placeholder="Enter brand"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={newProduct.model}
                onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                placeholder="Enter model"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                className="form-select"
                required
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                placeholder="0.00"
                className="form-input"
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                placeholder="0"
                className="form-input"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Minimum Stock Level</label>
              <input
                type="number"
                value={newProduct.min_stock_level}
                onChange={(e) => setNewProduct({...newProduct, min_stock_level: e.target.value})}
                placeholder="5"
                className="form-input"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                value={newProduct.purchase_date}
                onChange={(e) => setNewProduct({...newProduct, purchase_date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Warranty Period</label>
              <input
                type="text"
                value={newProduct.warranty_period}
                onChange={(e) => setNewProduct({...newProduct, warranty_period: e.target.value})}
                placeholder="e.g., 1 year"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select
                value={newProduct.status}
                onChange={(e) => setNewProduct({...newProduct, status: e.target.value as any})}
                className="form-select"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Specifications</label>
              <textarea
                value={newProduct.specifications}
                onChange={(e) => setNewProduct({...newProduct, specifications: e.target.value})}
                placeholder="Enter product specifications"
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCreateProduct(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateProduct}>
              Add Product
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${editType.charAt(0).toUpperCase() + editType.slice(1)}`}
        size="lg"
      >
        {editData && (
          <div className="modal-form">
            {editType === 'user' ? (
              <>
                <div className="form-group full-width">
                  <label>Profile Image</label>
                  <div className="image-upload-container">
                    <div className="image-preview">
                      {editData.profile_image_url || editData.profile_image || editData.avatar ? (
                        <img 
                          src={editData.profile_image_url || editData.profile_image || editData.avatar} 
                          alt="Profile preview" 
                          className="image-preview-img"
                        />
                      ) : (
                        <div className="image-placeholder">
                          <FiCamera size={24} />
                          <span>Upload Image</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditData({
                              ...editData,
                              profile_image: file,
                              profile_image_url: reader.result as string
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="image-upload-input"
                      id="edit-profile-image-upload"
                    />
                    <label htmlFor="edit-profile-image-upload" className="btn btn-secondary">
                      <FiUpload /> Change Image
                    </label>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={editData.role || 'user'}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Active Status</label>
                    <div className="form-checkbox">
                      <input
                        type="checkbox"
                        checked={!!editData.is_active}
                        onChange={(e) => setEditData({...editData, is_active: e.target.checked})}
                        id="edit-is_active"
                      />
                      <label htmlFor="edit-is_active">User is active</label>
                    </div>
                  </div>
                </div>
              </>
            ) : editType === 'order' ? (
              <div className="form-grid">
                <div className="form-group">
                  <label>Client Name *</label>
                  <select
                    value={editData.client_id || ''}
                    onChange={(e) => {
                      const clientId = e.target.value;
                      if (clientId) {
                        const selectedClient = clients.find(client => client.id.toString() === clientId);
                        if (selectedClient) {
                          setEditData({
                            ...editData,
                            client_id: clientId,
                            client_name: selectedClient.full_name,
                            client_phone: selectedClient.phone
                          });
                        }
                      } else {
                        setEditData({
                          ...editData,
                          client_id: '',
                          client_name: '',
                          client_phone: ''
                        });
                      }
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} ({client.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Client Phone *</label>
                  <input
                    type="tel"
                    value={editData.client_phone || ''}
                    onChange={(e) => setEditData({...editData, client_phone: e.target.value})}
                    className="form-input"
                    required
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={editData.product_name || ''}
                    onChange={(e) => setEditData({...editData, product_name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Service Staff</label>
                  <select
                    value={editData.staff_id || ''}
                    onChange={(e) => setEditData({...editData, staff_id: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select Service Staff</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Issue Description *</label>
                  <textarea
                    value={editData.issue_description || ''}
                    onChange={(e) => setEditData({...editData, issue_description: e.target.value})}
                    className="form-textarea"
                    rows={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Warranty Status *</label>
                  <select
                    value={editData.warranty_status || 'out_of_warranty'}
                    onChange={(e) => setEditData({...editData, warranty_status: e.target.value})}
                    className="form-select"
                    required
                  >
                    {warrantyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={editData.estimated_cost || '0'}
                    onChange={(e) => setEditData({...editData, estimated_cost: e.target.value})}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Final Cost (₹)</label>
                  <input
                    type="number"
                    value={editData.final_cost || editData.estimated_cost || '0'}
                    onChange={(e) => setEditData({...editData, final_cost: e.target.value})}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Deposit Amount (₹)</label>
                  <input
                    type="number"
                    value={editData.deposit_amount || '0'}
                    onChange={(e) => setEditData({...editData, deposit_amount: e.target.value})}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    value={editData.payment_status || 'pending'}
                    onChange={(e) => setEditData({...editData, payment_status: e.target.value})}
                    className="form-select"
                  >
                    {paymentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editData.status || 'pending'}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="form-select"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editData.priority || 'medium'}
                    onChange={(e) => setEditData({...editData, priority: e.target.value})}
                    className="form-select"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
            ) : editType === 'client' ? (
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={editData.city || ''}
                    onChange={(e) => setEditData({...editData, city: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={editData.state || ''}
                    onChange={(e) => setEditData({...editData, state: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    value={editData.zip_code || ''}
                    onChange={(e) => setEditData({...editData, zip_code: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    className="form-textarea"
                    rows={2}
                  />
                </div>
              </div>
            ) : editType === 'product' ? (
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={editData.product_name || ''}
                    onChange={(e) => setEditData({...editData, product_name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={editData.brand || ''}
                    onChange={(e) => setEditData({...editData, brand: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={editData.model || ''}
                    onChange={(e) => setEditData({...editData, model: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={editData.category || 'other'}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                    className="form-select"
                    required
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.price || '0'}
                    onChange={(e) => setEditData({...editData, price: e.target.value})}
                    className="form-input"
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={editData.stock_quantity || '0'}
                    onChange={(e) => setEditData({...editData, stock_quantity: e.target.value})}
                    className="form-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    value={editData.min_stock_level || '5'}
                    onChange={(e) => setEditData({...editData, min_stock_level: e.target.value})}
                    className="form-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={editData.status || 'active'}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Specifications</label>
                  <textarea
                    value={editData.specifications || ''}
                    onChange={(e) => setEditData({...editData, specifications: e.target.value})}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
            ) : editType === 'delivery' ? (
              <div className="form-grid">
                <div className="form-group">
                  <label>Delivery Status</label>
                  <select
                    value={editData.status || 'scheduled'}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="form-select"
                  >
                    {deliveryStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Person</label>
                  <input
                    type="text"
                    value={editData.delivery_person || ''}
                    onChange={(e) => setEditData({...editData, delivery_person: e.target.value})}
                    className="form-input"
                    placeholder="Enter delivery person name"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    className="form-textarea"
                    rows={3}
                    placeholder="Additional delivery notes"
                  />
                </div>
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUserForReset(null);
        }}
        userId={selectedUserForReset?.id || 0}
        userName={selectedUserForReset?.name || ''}
        onResetPassword={handleResetPassword}
      />
      
      {/* Receipt Confirmation Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedOrderForReceipt(null);
        }}
        title="Generate Order Receipt"
        size="sm"
      >
        <div className="modal-form">
          <div className="receipt-confirmation">
            <FiPrinter className="receipt-icon" />
            <h4>Generate Receipt for Order</h4>
            <p className="receipt-order-code">
              {selectedOrderForReceipt?.order_code}
            </p>
            <p className="receipt-client">
              Client: {selectedOrderForReceipt?.client_name}
            </p>
            <p className="receipt-amount">
              Amount: ₹{selectedOrderForReceipt?.final_cost || selectedOrderForReceipt?.estimated_cost || '0'}
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedOrderForReceipt(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmGenerateReceipt}>
                <FiPrinter /> Generate Receipt
              </button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Staff Details Modal */}
      <StaffDetailsModal
        isOpen={showStaffDetailsModal}
        onClose={() => {
          setShowStaffDetailsModal(false);
          setSelectedStaff(null);
          setSelectedStaffOrders([]);
        }}
        staff={selectedStaff}
        staffOrders={selectedStaffOrders}
      />
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => {
          setShowOrderDetailsModal(false);
          setSelectedOrderDetails(null);
        }}
        order={selectedOrderDetails}
        onEdit={handleOrderDetailsEdit}
        onGenerateReceipt={handleOrderDetailsReceipt}
        onDelete={handleOrderDetailsDelete}
      />
    </div>
  );
};

export default AdminDashboard;
