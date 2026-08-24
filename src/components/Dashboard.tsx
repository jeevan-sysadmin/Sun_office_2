// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\components\Dashboard.tsx
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMenu,
  FiSearch,
  FiBell,
  FiRefreshCw,
  FiRadio,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiCreditCard,
  FiLogOut,
  FiChevronLeft,
  FiClock,
  FiPhoneCall,
  FiDollarSign,
  FiUserCheck,
  FiServer,
  FiBarChart2,
  FiDatabase,
} from "react-icons/fi";
import "./css/Dashboard.css";
import { API_BASE_URL } from "../config/api";

const DashboardTab = lazy(() => import("./DashboardTab"));
const ServicesTab = lazy(() => import("./ServicesTab"));
const ClientsTab = lazy(() => import("./ClientsTab"));
const ProductsTab = lazy(() => import("./ProductsTab"));
const CardTab = lazy(() => import("./CardTab"));
const PendingCallsTab = lazy(() => import("./PendingCallsTab"));
const StaffTab = lazy(() => import("./StaffsTab"));
const RevenueTab = lazy(() => import("./RevenueTab"));
const InverterServiceTab = lazy(() => import("./InverterServiceTab"));
const OverallReportTab = lazy(() => import("./OverallReportTab"));
const BackupTab = lazy(() => import("./BackupTab"));

const InverterServiceDetailModal = lazy(() => import("./modals/InverterServiceDetailModal"));
const InverterServiceFormModal = lazy(() => import("./modals/InverterServiceFormModal"));
const ServiceDetailModal = lazy(() => import("./modals/ServiceDetailModal"));
const ServiceFormModal = lazy(() => import("./modals/ServiceFormModal"));
const CustomerDetailModal = lazy(() => import("./modals/CustomerDetailModal"));
const ProductFormModal = lazy(() => import("./modals/ProductFormModal"));
const ProductDetailModal = lazy(() => import("./modals/ProductDetailModal"));
const DeleteConfirmationModal = lazy(() => import("./modals/DeleteConfirmationModal"));
const StaffFormModal = lazy(() => import("./modals/StaffFormModal"));
const StaffDetailModal = lazy(() => import("./modals/StaffDetailModal"));
import type {
  User,
  ServiceOrder,
  InverterService,
  Customer,
  Battery,
  Inverter,
  Staff,
  DashboardStats,
  RevenueStats,
  Activity,
  ApiResponse,
  DashboardProps,
} from "./types";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  adminOnly?: boolean; // Add adminOnly flag
}

interface UiNotification {
  id: number;
  message: string;
  type: 'created' | 'updated' | 'deleted' | 'info';
  createdAt: string;
  read: boolean;
}

interface CardTabDrilldownFilter {
  staffName: string;
  serviceDate: string;
  requestKey: number;
}

// Sidebar Component with Pending Calls
interface SidebarProps {
  user: User;
  activeTab: string;
  onNavItemClick: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
  pendingCallsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  activeTab, 
  onNavItemClick, 
  onLogout,
  onClose,
  pendingCallsCount = 0
}) => {
  // Define nav items with adminOnly flag for Staff Management
  const [navItems] = React.useState<NavItem[]>([
    { icon: <FiHome />, label: 'Dashboard', id: 'dashboard', adminOnly: false },
    { icon: <FiShoppingBag />, label: 'Mark Service Call', id: 'services', adminOnly: false },
    { icon: <FiServer />, label: 'Inverter Service', id: 'inverter_services', adminOnly: false },
    { icon: <FiUsers />, label: 'New Account', id: 'customers', adminOnly: false },
    { icon: <FiBox />, label: 'AMC', id: 'products', adminOnly: false },
    { icon: <FiDollarSign />, label: 'Income and Expenses', id: 'revenue', adminOnly: false },
    { icon: <FiBarChart2 />, label: 'Overall Report', id: 'overall_report', adminOnly: false },
    { icon: <FiCreditCard />, label: 'Service Call Completed', id: 'cards', adminOnly: false },
    { icon: <FiUserCheck />, label: 'Add New Staff', id: 'staff', adminOnly: true }, // Admin only
    { icon: <FiPhoneCall />, label: 'Pending Service Calls', id: 'pending_calls', adminOnly: false },
    { icon: <FiDatabase />, label: 'Backup', id: 'backup', adminOnly: false }
  ]);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    // If item is adminOnly, only show if user role is admin
    if (item.adminOnly) {
      return user.role?.toLowerCase() === 'admin';
    }
    return true; // Show all non-admin items to everyone
  });

  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-header">
        <div className="brand">
          <div className="logo">
            <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <span>SO</span>
            </div>
            <div className="brand-info">
              <h2 className="sidebar-brand-text">Sun Water Service</h2>
              <p className="sidebar-subtext">Inverter & Battery Service</p>
            </div>
          </div>
        </div>
        <button 
          className="sidebar-toggle close"
          onClick={onClose}
        >
          <FiChevronLeft className="sidebar-icon" />
        </button>
      </div>

      <div className="sidebar-content">
        <div className="user-profile">
          <div className="user-info">
            <h3>{user.name}</h3>
            <p>{user.role}</p>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => (
            <motion.button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onNavItemClick(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              
              {item.id === 'pending_calls' && pendingCallsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="pending-calls-badge"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#EF4444',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginLeft: 'auto',
                    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <FiClock size={12} />
                  </motion.div>
                  {pendingCallsCount}
                </motion.span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <motion.button 
            className="logout-btn"
            onClick={onLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogOut className="logout-icon" />
            <span className="logout-text">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

// Helper function to parse is_spare field consistently
const parseIsSpare = (value: any): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const str = value.toLowerCase().trim();
    return str === 'true' || str === '1' || str === 'yes' || str === 'y' || str === 'on';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
};

const parseIdArray = (value: any): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((id: any) => parseInt(id, 10))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((id: any) => parseInt(id, 10))
          .filter((id: number) => Number.isInteger(id) && id > 0);
      }
    } catch {
      return [];
    }
  }

  return [];
};

// Enhanced search function for comprehensive search across all data types
const searchAcrossAllFields = (item: any, searchTerm: string, itemType: string): boolean => {
  if (!searchTerm || searchTerm.trim() === '') return true;
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  // Common search fields for all items
  const searchFields: string[] = [];
  
  switch(itemType) {
    case 'service':
      // Service Order search fields
      searchFields.push(
        item.service_code || '',
        item.customer_name || '',
        item.customer_phone || '',
        item.customer_email || '',
        item.battery_model || '',
        item.battery_serial || '',
        item.inverter_model || '',
        item.inverter_serial || '',
        item.issue_description || '',
        item.battery_brand || '',
        item.battery_capacity || '',
        item.battery_type || '',
        item.battery_voltage || '',
        item.estimated_completion_date || '',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      );
      break;
      
    case 'inverter_service':
      // Inverter Service search fields
      searchFields.push(
        item.service_code || '',
        item.customer_name || '',
        item.customer_phone || '',
        item.customer_email || '',
        item.inverter_model || '',
        item.inverter_serial || '',
        item.inverter_brand || '',
        item.inverter_power_rating || '',
        item.inverter_type || '',
        item.issue_description || '',
        item.diagnostic_results || '',
        item.repair_description || '',
        item.replacement_parts || '',
        item.estimated_completion_date || '',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      );
      break;
      
    case 'customer':
      // Customer search fields
      searchFields.push(
        item.customer_code || '',
        item.full_name || '',
        item.phone || '',
        item.alternate_phone || '',
        item.email || '',
        item.address || '',
        item.city || '',
        item.state || '',
        item.zip_code || ''
      );
      break;
      
    case 'battery':
      // Battery search fields
      searchFields.push(
        item.battery_code || '',
        item.battery_model || '',
        item.battery_serial || '',
        item.brand || '',
        item.capacity || '',
        item.voltage || '',
        item.battery_type || '',
        item.category || '',
        item.inverter_model || '',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      );
      break;
      
    case 'inverter':
      // Inverter search fields
      searchFields.push(
        item.inverter_code || '',
        item.inverter_model || '',
        item.inverter_brand || '',
        item.power_rating || '',
        item.type || '',
        item.wave_type || '',
        item.input_voltage || '',
        item.output_voltage || '',
        item.efficiency || '',
        item.battery_voltage || '',
        item.inverter_serial || '',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      );
      break;
      
    case 'staff':
      // Staff search fields
      searchFields.push(
        item.name || '',
        item.email || '',
        item.role || '',
        item.phone || '',
        item.department || '',
        item.position || '',
        item.address || ''
      );
      break;
      
    default:
      // Generic search for unknown types
      Object.values(item).forEach(value => {
        if (typeof value === 'string') {
          searchFields.push(value);
        } else if (typeof value === 'number') {
          searchFields.push(value.toString());
        }
      });
  }
  
  // Check if any search field contains the search term
  return searchFields.some(field => 
    field && field.toLowerCase().includes(searchLower)
  );
};

// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ onLogout, user: propUser }) => {
  // User state - initialize from props or localStorage
  const [user, setUser] = useState<User>(() => {
    // First try to use the user from props (passed from App.tsx)
    if (propUser) {
      return propUser;
    }
    
    // Fallback: try to load from localStorage
    try {
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    
    // Ultimate fallback - should never happen if login works correctly
    return {
      id: 1,
      name: "User",
      email: "user@example.com",
      role: "Staff",
      avatar: "",
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  // Update user when prop changes
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      // Also update localStorage to keep it in sync
      localStorage.setItem('userData', JSON.stringify(propUser));
    }
  }, [propUser]);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [selectedFinancialMonth, setSelectedFinancialMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showServiceForm, setShowServiceForm] = useState<boolean>(false);
  const [showInverterServiceForm, setShowInverterServiceForm] = useState<boolean>(false);
  const [showCustomerDetail, setShowCustomerDetail] = useState<boolean>(false);
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [showProductDetail, setShowProductDetail] = useState<boolean>(false);
  const [showStaffForm, setShowStaffForm] = useState<boolean>(false);
  const [showStaffDetail, setShowStaffDetail] = useState<boolean>(false);
  const [staffFormMode, setStaffFormMode] = useState<'add' | 'edit' | 'salary' | 'expense'>('add');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Barcode scanning states - ONLY for Products Management
  const [scanningBatterySerial, setScanningBatterySerial] = useState<boolean>(false);
  const [scanningInverterSerial, setScanningInverterSerial] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Product type state for Products Management
  const [productsTab, setProductsTab] = useState<'batteries' | 'inverters'>('batteries');
  
  // Data states
  const [selectedService, setSelectedService] = useState<ServiceOrder | null>(null);
  const [selectedInverterService, setSelectedInverterService] = useState<InverterService | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<Inverter | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: number | string} | null>(null);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [inverterServices, setInverterServices] = useState<InverterService[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [recentServices, setRecentServices] = useState<ServiceOrder[]>([]);
  const [pendingCallsCount, setPendingCallsCount] = useState<number>(0);
  const [cardTabDrilldownFilter, setCardTabDrilldownFilter] = useState<CardTabDrilldownFilter | null>(null);
  
  // Revenue Stats
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    total_revenue: 0,
    today_revenue: 0,
    week_revenue: 0,
    month_revenue: 0,
    year_revenue: 0,
    pending_payments: 0,
    completed_payments: 0,
    average_order_value: 0,
    revenue_by_payment_method: {
      cash: 0,
      card: 0,
      online: 0
    },
    revenue_by_service_type: {
      battery_service: 0,
      inverter_service: 0,
      hybrid_service: 0
    },
    recent_transactions: []
  });
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_customers: 0,
    total_batteries: 0,
    total_inverters: 0,
    active_batteries: 0,
    active_inverters: 0,
    total_services: 0,
    pending_services: 0,
    total_staff: 0,
    monthly_revenue: 0,
    monthly_expenses: 0,
    monthly_salary: 0,
    monthly_profit: 0,
    battery_conditions: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      dead: 0
    },
    inverter_conditions: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      dead: 0
    },
    warranty_status: {
      "": 0,
      in_warranty: 0,
      extended_warranty: 0,
      out_of_warranty: 0,
      no_warranty: 0
    }
  });
  const [activities] = useState<Activity[]>([
    { activity: "Dashboard loaded successfully", timestamp: new Date().toLocaleTimeString() }
  ]);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterClaimType, setFilterClaimType] = useState<string>("all");
  const [filterBatteryType, setFilterBatteryType] = useState<string>("all");
  const [filterInverterType, setFilterInverterType] = useState<string>("all");
  const [filterInverterBrand, setFilterInverterBrand] = useState<string>("all");
  const [filterInverterStatus, setFilterInverterStatus] = useState<string>("all");
  const [filterSpareStatus, setFilterSpareStatus] = useState<string>("all");
  const [filterWarrantyStatus, setFilterWarrantyStatus] = useState<string>("all");
  const [filterAmcStatus, setFilterAmcStatus] = useState<string>("all");
  const [filterStaffStatus, setFilterStaffStatus] = useState<string>("all");
  const [filterStaffDepartment, setFilterStaffDepartment] = useState<string>("all");
  const [filterStaffRole, setFilterStaffRole] = useState<string>("all");
  
  // Service form state
  const [serviceForm, setServiceForm] = useState({
    id: null as number | null,
    customer_id: null as number | null,
    customer_phone: "",
    battery_id: null as number | null,
    inverter_id: null as number | null,
    battery_ids: [] as number[],
    inverter_ids: [] as number[],
    service_staff_id: null as number | null,
    issue_description: "",
    warranty_status: "in_warranty" as string,
    amc_status: "no_amc" as string,
    notes: "",
    status: "pending" as string,
    priority: "medium" as string,
    payment_status: "pending" as string,
    amount: "",
    estimated_cost: "",
    final_cost: "",
    deposit_amount: "",
    estimated_completion_date: "",
    battery_claim: "none",
    service_type: "battery_service",
    showReplacementForm: false,
    replacement_battery_model: "",
    replacement_battery_serial: "",
    replacement_battery_brand: "",
    replacement_battery_capacity: "",
    replacement_battery_type: "",
    replacement_battery_voltage: "",
    replacement_battery_price: "",
    replacement_battery_warranty: "",
    replacement_installation_date: "",
    replacement_battery_notes: ""
  });
  
  // Inverter Service form state
  const [inverterServiceForm, setInverterServiceForm] = useState({
    id: null as number | null,
    customer_id: null as number | null,
    customer_phone: "",
    inverter_id: null as number | null,
    inverter_ids: [] as number[],
    service_staff_id: null as number | null,
    issue_description: "",
    diagnostic_results: "",
    repair_description: "",
    replacement_parts: "",
    warranty_status: "in_warranty" as string,
    amc_status: "no_amc" as string,
    notes: "",
    status: "pending" as string,
    priority: "medium" as string,
    payment_status: "pending" as string,
    amount: "",
    estimated_cost: "",
    final_cost: "",
    deposit_amount: "",
    estimated_completion_date: "",
    inverter_claim: "none",
    service_type: "inverter_service",
    showReplacementForm: false
  });
  
  // API Base URL
  // Refs
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationIdRef = useRef<number>(1);
  const lastNotifiedSuccessRef = useRef<string | null>(null);
  
  // Helper function to find battery by serial
  const findBatteryBySerial = (batterySerial: string): Battery | null => {
    const battery = batteries.find(b => b.battery_serial === batterySerial);
    return battery || null;
  };
  
  // Helper function to find inverter by serial
  const findInverterBySerial = (inverterSerial: string): Inverter | null => {
    const inverter = inverters.find(i => i.inverter_serial === inverterSerial);
    return inverter || null;
  };
  
  // Handle barcode scanning - ONLY for Products Management
  const handleBarcodeScanned = (barcode: string) => {
    // Only handle product management barcode scanning
    if (activeTab === 'products') {
      if (productsTab === 'batteries') {
        // Check if battery with this serial already exists
        const existingBattery = findBatteryBySerial(barcode);
        if (existingBattery) {
          setError(`Battery with serial ${barcode} already exists in database.`);
          setTimeout(() => setError(null), 5000);
          return;
        }
        
        setSuccessMessage(`Battery serial scanned: ${barcode}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (productsTab === 'inverters') {
        // Check if inverter with this serial already exists
        const existingInverter = findInverterBySerial(barcode);
        if (existingInverter) {
          setError(`Inverter with serial ${barcode} already exists in database.`);
          setTimeout(() => setError(null), 5000);
          return;
        }
        
        setSuccessMessage(`Inverter serial scanned: ${barcode}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
    
    setScanningBatterySerial(false);
    setScanningInverterSerial(false);
    setBarcodeInput("");
  };
  
  // Start scanning for battery serial - ONLY for Products Management
  const startBatterySerialScan = () => {
    // Only allow in products tab
    if (activeTab !== 'products') {
      setError('Barcode scanning is only available in Products Management');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setScanningBatterySerial(true);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    setSuccessMessage('Barcode scanning mode activated. Please scan the battery serial number.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Start scanning for inverter serial - ONLY for Products Management
  const startInverterSerialScan = () => {
    // Only allow in products tab
    if (activeTab !== 'products') {
      setError('Barcode scanning is only available in Products Management');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setScanningInverterSerial(true);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    setSuccessMessage('Barcode scanning mode activated. Please scan the inverter serial number.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Stop scanning
  const stopScanning = () => {
    setScanningBatterySerial(false);
    setScanningInverterSerial(false);
    setBarcodeInput("");
  };
  
  // Effects
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile) {
        setSidebarOpen(false);
      } else if (tablet) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      if (dashboardContentRef.current) {
        const { scrollTop } = dashboardContentRef.current;
        setShowScrollTop(scrollTop > 300);
      }
    };
    
    const contentElement = dashboardContentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addUiNotification = (message: string, type: 'created' | 'updated' | 'deleted' | 'info' = 'info') => {
    const notification: UiNotification = {
      id: notificationIdRef.current++,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notification, ...prev].slice(0, 30));
  };

  useEffect(() => {
    if (!successMessage) return;
    if (lastNotifiedSuccessRef.current === successMessage) return;
    lastNotifiedSuccessRef.current = successMessage;

    const lower = successMessage.toLowerCase();
    let type: 'created' | 'updated' | 'deleted' | 'info' = 'info';
    if (lower.includes('created') || lower.includes('added')) {
      type = 'created';
    } else if (lower.includes('updated') || lower.includes('edited')) {
      type = 'updated';
    } else if (lower.includes('deleted') || lower.includes('removed')) {
      type = 'deleted';
    }
    addUiNotification(successMessage, type);
  }, [successMessage]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        switch(activeTab) {
          case 'dashboard':
            await Promise.all([
              loadDashboardData(selectedFinancialMonth),
              loadServices(),
              loadInverterServices()
            ]);
            break;
          case 'services':
            await loadServices();
            break;
          case 'inverter_services':
            await loadInverterServices();
            break;
          case 'customers':
            await loadCustomers();
            break;
          case 'products':
            await Promise.all([
              loadBatteries(),
              loadInverters()
            ]);
            break;
          case 'revenue':
            await loadRevenueData();
            break;
          case 'overall_report':
            await Promise.all([
              loadDashboardData(selectedFinancialMonth),
              loadServices(),
              loadInverterServices()
            ]);
            break;
          case 'cards':
            await loadServices();
            await loadInverterServices();
            break;
          case 'pending_calls':
            await loadPendingCallsCount();
            break;
          case 'staff':
            // Only load staff data if user is admin
            if (user.role?.toLowerCase() === 'admin') {
              await loadStaff();
            } else {
              // If non-admin tries to access staff page, redirect to dashboard
              setActiveTab('dashboard');
              setError('You do not have permission to access Staff Management');
              setTimeout(() => setError(null), 3000);
            }
            break;
          case 'backup':
            break;
          default:
            break;
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(`Failed to load ${activeTab} data. Please check your connection.`);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeTab, user.role, selectedFinancialMonth]);
  
  // Load pending calls count for badge
  const loadPendingCallsCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pending_calls.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPendingCallsCount(data.total_pending_calls || 0);
      } else {
        setPendingCallsCount(0);
      }
    } catch (error) {
      console.error('Error loading pending calls count:', error);
      setPendingCallsCount(0);
    }
  };
  
  // Load staff data
  const loadStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.users) {
        const formattedStaff: Staff[] = data.users.map((user: any) => ({
          id: parseInt(user.id),
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'staff',
          is_active: user.is_active === true || user.is_active === 'true' || user.is_active === 1,
          last_login: user.last_login || null, // Keep as null
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
          phone: user.phone || '',
          address: user.address || '',
          department: user.department || '',
          position: user.position || '',
          password: user.password || ''
        }));
        
        setStaff(formattedStaff);
        setSuccessMessage('Staff data loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load staff data');
      }
      
    } catch (error: any) {
      console.error('Error loading staff:', error);
      throw error;
    }
  };
  
  // Load inverter services
  const loadInverterServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inverter_services.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const resolveCreatedAt = (service: any): string =>
          service.created_at ||
          service.create_date ||
          service.created_date ||
          service.createdAt ||
          service.date_created ||
          '';

        const resolveUpdatedAt = (service: any, createdAt: string): string =>
          service.updated_at ||
          service.updated_date ||
          service.updatedAt ||
          createdAt;

        const formattedServices: InverterService[] = data.data.map((service: any) => {
          const resolvedCreatedAt = resolveCreatedAt(service);
          const resolvedUpdatedAt = resolveUpdatedAt(service, resolvedCreatedAt);

          return ({
          id: parseInt(service.id),
          service_code: service.service_code || '',
          customer_id: parseInt(service.customer_id || '0'),
          customer_name: service.customer_name || '', // Ensure string
          customer_phone: service.customer_phone || '',
          customer_email: service.customer_email || '',
          customer_address: service.customer_address || '',
          inverter_id: parseInt(service.inverter_id || '0'),
          inverter_ids: Array.isArray(service.inverter_ids)
            ? service.inverter_ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id) && id > 0)
            : [],
          inverter_model: service.inverter_model || '',
          inverter_serial: service.inverter_serial || '',
          inverter_brand: service.inverter_brand || '',
          inverter_power_rating: service.inverter_power_rating || '',
          inverter_type: service.inverter_type || '',
          inverter_wave_type: service.inverter_wave_type || '',
          inverters: Array.isArray(service.inverters) ? service.inverters : [],
          issue_description: service.issue_description || '',
          diagnostic_results: service.diagnostic_results || '',
          repair_description: service.repair_description || '',
          replacement_parts: service.replacement_parts || '',
          status: service.status || 'pending',
          priority: service.priority || 'medium',
          payment_status: service.payment_status || 'pending',
          estimated_cost: service.estimated_cost || '0',
          final_cost: service.final_cost || '0',
          deposit_amount: service.deposit_amount || '0',
          warranty_status: service.warranty_status || 'out_of_warranty',
          amc_status: service.amc_status || 'no_amc',
          inverter_claim: service.inverter_claim || 'none',
          estimated_completion_date: service.estimated_completion_date || '',
          notes: service.notes || '',
          created_at: resolvedCreatedAt,
          updated_at: resolvedUpdatedAt,
          service_staff_id: parseInt(service.service_staff_id || '0'),
          staff_name: service.staff_name || '',
          staff_email: service.staff_email || '',
          service_type: 'inverter_service'
        });
        });
        setInverterServices(formattedServices);
        setSuccessMessage('Inverter services loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load inverter services');
      }
      
    } catch (error: any) {
      console.error('Error loading inverter services:', error);
      throw error;
    }
  };
  
  // Load revenue data
  const loadRevenueData = async () => {
    try {
      await loadServices();
      await loadInverterServices();
      
      const completedServices = services.filter(s => 
        s.status === 'completed' || s.status === 'delivered'
      );
      
      const completedInverterServices = inverterServices.filter(s => 
        s.status === 'completed' || s.status === 'delivered'
      );
      
      const totalBatteryRevenue = completedServices.reduce((sum, service) => {
        const finalCost = parseFloat(service.final_cost || '0');
        return sum + (isNaN(finalCost) ? 0 : finalCost);
      }, 0);
      
      const totalInverterRevenue = completedInverterServices.reduce((sum, service) => {
        const finalCost = parseFloat(service.final_cost || '0');
        return sum + (isNaN(finalCost) ? 0 : finalCost);
      }, 0);
      
      const totalRevenue = totalBatteryRevenue + totalInverterRevenue;
      
      const today = new Date().toDateString();
      const todayRevenue = [...completedServices, ...completedInverterServices]
        .filter(s => new Date(s.updated_at).toDateString() === today)
        .reduce((sum, service) => {
          const finalCost = parseFloat(service.final_cost || '0');
          return sum + (isNaN(finalCost) ? 0 : finalCost);
        }, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekRevenue = [...completedServices, ...completedInverterServices]
        .filter(s => new Date(s.updated_at) >= weekAgo)
        .reduce((sum, service) => {
          const finalCost = parseFloat(service.final_cost || '0');
          return sum + (isNaN(finalCost) ? 0 : finalCost);
        }, 0);
      
      const thisMonth = new Date().getMonth();
      const monthRevenue = [...completedServices, ...completedInverterServices]
        .filter(s => new Date(s.updated_at).getMonth() === thisMonth)
        .reduce((sum, service) => {
          const finalCost = parseFloat(service.final_cost || '0');
          return sum + (isNaN(finalCost) ? 0 : finalCost);
        }, 0);
      
      const thisYear = new Date().getFullYear();
      const yearRevenue = [...completedServices, ...completedInverterServices]
        .filter(s => new Date(s.updated_at).getFullYear() === thisYear)
        .reduce((sum, service) => {
          const finalCost = parseFloat(service.final_cost || '0');
          return sum + (isNaN(finalCost) ? 0 : finalCost);
        }, 0);
      
      const pendingPayments = [...services, ...inverterServices]
        .filter(s => s.payment_status === 'pending' || s.payment_status === 'partial')
        .reduce((sum, service) => {
          const finalCost = parseFloat(service.final_cost || service.estimated_cost || '0');
          const deposit = parseFloat(service.deposit_amount || '0');
          return sum + (isNaN(finalCost) ? 0 : finalCost - (isNaN(deposit) ? 0 : deposit));
        }, 0);
      
      const batteryServiceRevenue = completedServices.reduce((sum, service) => {
        const finalCost = parseFloat(service.final_cost || '0');
        return sum + (isNaN(finalCost) ? 0 : finalCost);
      }, 0);
      
      const inverterServiceRevenue = completedInverterServices.reduce((sum, service) => {
        const finalCost = parseFloat(service.final_cost || '0');
        return sum + (isNaN(finalCost) ? 0 : finalCost);
      }, 0);
      
      // Mock payment method distribution
      const cashRevenue = totalRevenue * 0.6;
      const cardRevenue = totalRevenue * 0.3;
      const onlineRevenue = totalRevenue * 0.1;
      
      setRevenueStats({
        total_revenue: totalRevenue,
        today_revenue: todayRevenue,
        week_revenue: weekRevenue,
        month_revenue: monthRevenue,
        year_revenue: yearRevenue,
        pending_payments: pendingPayments,
        completed_payments: completedServices.length + completedInverterServices.length,
        average_order_value: (completedServices.length + completedInverterServices.length) > 0 
          ? totalRevenue / (completedServices.length + completedInverterServices.length) 
          : 0,
        revenue_by_payment_method: {
          cash: cashRevenue,
          card: cardRevenue,
          online: onlineRevenue
        },
        revenue_by_service_type: {
          battery_service: batteryServiceRevenue,
          inverter_service: inverterServiceRevenue,
          hybrid_service: 0
        },
        recent_transactions: [...services, ...inverterServices].slice(0, 10) as ServiceOrder[]
      });
      
      setSuccessMessage('Revenue data loaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      throw error;
    }
  };
  
  // Load dashboard data from API
  const loadDashboardData = async (financialMonth?: string) => {
    try {
      const monthValue = financialMonth || selectedFinancialMonth;
      const [yy, mm] = monthValue.split('-');
      let revenueSummaryForMonth: any = null;

      try {
        const revenueRes = await fetch(`${API_BASE_URL}/revenue.php?date_range=all&year=${yy || new Date().getFullYear()}&month=${mm || (new Date().getMonth() + 1)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (revenueRes.ok) {
          const revenueJson = await revenueRes.json();
          if (revenueJson?.success && revenueJson?.summary?.overall) {
            revenueSummaryForMonth = revenueJson.summary.overall;
          }
        }
      } catch (err) {
        console.error('Revenue summary fetch failed for dashboard financial sync:', err);
      }

      const params = new URLSearchParams();
      if (yy && mm) {
        params.append('year', yy);
        params.append('month', mm);
      }
      const response = await fetch(`${API_BASE_URL}/dashboard_stats.php${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setDashboardStats({
          total_customers: parseInt(data.data.total_customers?.toString() || '0'),
          total_batteries: parseInt(data.data.total_batteries?.toString() || '0'),
          total_inverters: parseInt(data.data.total_inverters?.toString() || '0'),
          active_batteries: parseInt(data.data.active_batteries?.toString() || '0'),
          active_inverters: parseInt(data.data.active_inverters?.toString() || '0'),
          total_services: parseInt(data.data.total_services?.toString() || '0'),
          pending_services: parseInt(data.data.pending_services?.toString() || '0'),
          total_staff: parseInt(data.data.total_staff?.toString() || '0'),
          monthly_revenue: revenueSummaryForMonth
            ? parseFloat(revenueSummaryForMonth.total_income?.toString() || '0')
            : parseFloat(data.data.monthly_revenue?.toString() || '0'),
          monthly_expenses: revenueSummaryForMonth
            ? parseFloat(revenueSummaryForMonth.total_expenses?.toString() || '0')
            : parseFloat(data.data.monthly_expenses?.toString() || '0'),
          monthly_salary: revenueSummaryForMonth
            ? parseFloat(revenueSummaryForMonth.total_salaries?.toString() || '0')
            : parseFloat(data.data.monthly_salary?.toString() || '0'),
          monthly_profit: revenueSummaryForMonth
            ? parseFloat(revenueSummaryForMonth.net_profit?.toString() || '0')
            : parseFloat(data.data.monthly_profit?.toString() || '0'),
          battery_conditions: {
            excellent: data.data.battery_conditions?.excellent || 0,
            good: data.data.battery_conditions?.good || 0,
            fair: data.data.battery_conditions?.fair || 0,
            poor: data.data.battery_conditions?.poor || 0,
            dead: data.data.battery_conditions?.dead || 0
          },
          inverter_conditions: {
            excellent: data.data.inverter_conditions?.excellent || 0,
            good: data.data.inverter_conditions?.good || 0,
            fair: data.data.inverter_conditions?.fair || 0,
            poor: data.data.inverter_conditions?.poor || 0,
            dead: data.data.inverter_conditions?.dead || 0
          },
          warranty_status: {
            "": data.data.warranty_status?.[""] || 0,
            in_warranty: data.data.warranty_status?.in_warranty || 0,
            extended_warranty: data.data.warranty_status?.extended_warranty || 0,
            out_of_warranty: data.data.warranty_status?.out_of_warranty || 0,
            no_warranty: data.data.warranty_status?.no_warranty || 0
          }
        });
        
        if (data.data.recent_services) {
          const formattedRecentServices: ServiceOrder[] = data.data.recent_services.map((service: any) => ({
            id: parseInt(service.id),
            service_code: service.service_code || '',
            customer_id: parseInt(service.customer_id || '0'),
            customer_name: service.customer_name || '',
            customer_phone: service.customer_phone || '',
            customer_email: service.customer_email || '',
            customer_address: service.customer_address || '',
            battery_id: parseInt(service.battery_id || '0'),
            battery_model: service.battery_model || '',
            battery_serial: service.battery_serial || '',
            battery_brand: service.battery_brand || '',
            battery_capacity: service.battery_capacity || '',
            battery_voltage: service.battery_voltage || '',
            battery_type: service.battery_type || '',
            inverter_model: service.inverter_model || '',
            inverter_serial: service.inverter_serial || '', // Ensure string
            issue_description: service.issue_description || '',
            status: service.status || '',
            priority: service.priority || 'medium',
            payment_status: service.payment_status || 'pending',
            estimated_cost: service.estimated_cost || '0',
            final_cost: service.final_cost || '0',
            deposit_amount: service.deposit_amount || '0',
            warranty_status: service.warranty_status || 'out_of_warranty',
            amc_status: service.amc_status || 'no_amc',
            battery_claim: service.battery_claim || 'none',
            estimated_completion_date: service.estimated_completion_date || '',
            notes: service.notes || '',
            created_at: service.created_at || '',
            updated_at: service.updated_at || '',
            service_staff_id: parseInt(service.service_staff_id || '0'),
            staff_name: service.staff_name || '',
            staff_email: service.staff_email || '',
            replacement_battery_serial: service.replacement_battery_serial || '',
            service_type: service.service_type || 'battery_service'
          }));
          setRecentServices(formattedRecentServices);
        }
        
        setSuccessMessage('Dashboard data loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load dashboard data');
      }
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  };
  
  // Load services from API
  const loadServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services.php?limit=10000&page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const normalizedServices: ServiceOrder[] = data.data.map((service: any) => {
          const batteries = Array.isArray(service.batteries) ? service.batteries : [];
          const inverters = Array.isArray(service.inverters) ? service.inverters : [];
          const firstBattery = batteries[0] || {};
          const firstInverter = inverters[0] || {};
          const batteryIds = parseIdArray(service.battery_ids);
          const inverterIds = parseIdArray(service.inverter_ids);

          return ({
          id: parseInt(service.id),
          service_code: service.service_code || '',
          customer_id: parseInt(service.customer_id || '0'),
          customer_name: service.customer_name || '',
          customer_phone: service.customer_phone || '',
          customer_alternate_phone: service.customer_alternate_phone || service.alternate_phone || '',
          customer_email: service.customer_email || '',
          customer_address: service.customer_address || '',
          battery_id: parseInt(service.battery_id || '0'),
          battery_ids: batteryIds,
          batteries,
          battery_model: service.battery_model || firstBattery.battery_model || '',
          battery_serial: service.battery_serial || firstBattery.battery_serial || '',
          battery_brand: service.battery_brand || firstBattery.brand || '',
          battery_capacity: service.battery_capacity || firstBattery.capacity || '',
          battery_voltage: service.battery_voltage || firstBattery.voltage || '',
          battery_type: service.battery_type || firstBattery.battery_type || '',
          inverter_model: service.inverter_model || firstInverter.inverter_model || '',
          inverter_id: parseInt(service.inverter_id || '0'),
          inverter_ids: inverterIds,
          inverters,
          inverter_serial: service.inverter_serial || firstInverter.inverter_serial || '',
          issue_description: service.issue_description || '',
          status: service.status || 'pending',
          priority: service.priority || 'medium',
          payment_status: service.payment_status || 'pending',
          estimated_cost: service.estimated_cost || '0',
          final_cost: service.final_cost || '0',
          deposit_amount: service.deposit_amount || '0',
          warranty_status: service.warranty_status || 'out_of_warranty',
          amc_status: service.amc_status || 'no_amc',
          battery_claim: service.battery_claim || 'none',
          estimated_completion_date: service.estimated_completion_date || '',
          notes: service.notes || '',
          created_at: service.created_at || '',
          updated_at: service.updated_at || '',
          service_staff_id: parseInt(service.service_staff_id || '0'),
          staff_name: service.staff_name || '',
          staff_email: service.staff_email || '',
          replacement_battery_serial: service.replacement_battery_serial || '',
          service_type: service.service_type || 'battery_service'
          });
        });
        setServices(normalizedServices);
        setSuccessMessage('Services loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load services');
      }
      
    } catch (error: any) {
      console.error('Error loading services:', error);
      throw error;
    }
  };
  
  // Load customers from API
  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.customers) {
        const customersWithServiceCount = data.customers.map((customer: any) => {
          const serviceCount = services.filter(service => 
            service.customer_name === customer.full_name || 
            service.customer_phone === customer.phone
          ).length;
          
          const inverterServiceCount = inverterServices.filter(service => 
            service.customer_name === customer.full_name || 
            service.customer_phone === customer.phone
          ).length;
          
          const customerServices = [...services, ...inverterServices].filter(service => 
            service.customer_name === customer.full_name || 
            service.customer_phone === customer.phone
          );
          
          const lastServiceDate = customerServices.length > 0
            ? new Date(Math.max(...customerServices.map(s => new Date(s.created_at).getTime()))).toISOString()
            : undefined;
          
          return {
            id: parseInt(customer.id),
            customer_code: customer.customer_code || '',
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            alternate_phone: customer.alternate_phone || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            zip_code: customer.zip_code || '',
            notes: customer.notes || '',
            created_at: customer.created_at || '',
            updated_at: customer.updated_at || customer.created_at || new Date().toISOString(),
            service_count: serviceCount + inverterServiceCount, // Make required
            last_service_date: lastServiceDate,
            total_services: serviceCount + inverterServiceCount
          };
        });
        
        setCustomers(customersWithServiceCount);
        setSuccessMessage('Customers loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load customers');
      }
      
    } catch (error: any) {
      console.error('Error loading customers:', error);
      throw error;
    }
  };
  
  // Load batteries from API
  const loadBatteries = async () => {
    try {
      console.log('Loading batteries from API...');
      const response = await fetch(`${API_BASE_URL}/batteries.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data && data.data.batteries) {
        const formattedBatteries: Battery[] = data.data.batteries.map((battery: any) => {
          const isSpareValue = parseIsSpare(battery.is_spare);
          
          return {
            id: parseInt(battery.id),
            battery_code: battery.battery_code || '',
            battery_model: battery.battery_model || '',
            battery_serial: battery.battery_serial || '',
            brand: battery.brand || '',
            capacity: battery.capacity || '',
            voltage: battery.voltage || '12V',
            battery_type: battery.battery_type || 'lead_acid',
            category: battery.category || 'inverter',
            price: battery.price || '0',
            warranty_period: battery.warranty_period || '',
            amc_period: battery.amc_period || '0',
            inverter_model: battery.inverter_model || '',
            battery_condition: battery.battery_condition || 'good',
            is_spare: isSpareValue,
            spare_status: battery.spare_status || 'available',
            created_at: battery.created_at || new Date().toISOString(),
            total_services: parseInt(battery.total_services || '0'),
            specifications: battery.specifications || '',
            purchase_date: battery.purchase_date || new Date().toISOString().split('T')[0],
            installation_date: battery.installation_date || new Date().toISOString().split('T')[0],
            last_service_date: battery.last_service_date || '',
            stock_quantity: battery.stock_quantity || '0',
            claim_type: battery.claim_type || '',
            status: battery.status || 'active',
            shop_stock_quantity: battery.shop_stock_quantity || '0',
            company_stock_quantity: battery.company_stock_quantity || '0',
            tracking_status: battery.tracking_status || 'active',
            warranty_expiry_date: battery.warranty_expiry_date || '',
            warranty_remarks: battery.warranty_remarks || ''
          };
        });
        
        setBatteries(formattedBatteries);
        setSuccessMessage('Batteries loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (data.success && data.batteries) {
        const formattedBatteries: Battery[] = data.batteries.map((battery: any) => {
          const isSpareValue = parseIsSpare(battery.is_spare);
          
          return {
            id: parseInt(battery.id),
            battery_code: battery.battery_code || '',
            battery_model: battery.battery_model || '',
            battery_serial: battery.battery_serial || '',
            brand: battery.brand || '',
            capacity: battery.capacity || '',
            voltage: battery.voltage || '12V',
            battery_type: battery.battery_type || 'lead_acid',
            category: battery.category || 'inverter',
            price: battery.price || '0',
            warranty_period: battery.warranty_period || '',
            amc_period: battery.amc_period || '0',
            inverter_model: battery.inverter_model || '',
            battery_condition: battery.battery_condition || 'good',
            is_spare: isSpareValue,
            spare_status: battery.spare_status || 'available',
            created_at: battery.created_at || new Date().toISOString(),
            total_services: parseInt(battery.total_services || '0'),
            specifications: battery.specifications || '',
            purchase_date: battery.purchase_date || new Date().toISOString().split('T')[0],
            installation_date: battery.installation_date || new Date().toISOString().split('T')[0],
            last_service_date: battery.last_service_date || '',
            stock_quantity: battery.stock_quantity || '0',
            claim_type: battery.claim_type || '',
            status: battery.status || 'active',
            shop_stock_quantity: battery.shop_stock_quantity || '0',
            company_stock_quantity: battery.company_stock_quantity || '0',
            tracking_status: battery.tracking_status || 'active',
            warranty_expiry_date: battery.warranty_expiry_date || '',
            warranty_remarks: battery.warranty_remarks || ''
          };
        });
        
        setBatteries(formattedBatteries);
        setSuccessMessage('Batteries loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load batteries');
      }
      
    } catch (error: any) {
      console.error('Error loading batteries:', error);
      throw error;
    }
  };
  
  // Load inverters from API
  const loadInverters = async () => {
    try {
      console.log('Loading inverters from API...');
      const response = await fetch(`${API_BASE_URL}/inverters.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const formattedInverters: Inverter[] = data.data.map((inverter: any) => ({
          id: parseInt(inverter.id),
          inverter_code: inverter.inverter_code || '',
          inverter_model: inverter.inverter_model || '',
          inverter_brand: inverter.inverter_brand || '',
          power_rating: inverter.power_rating || '',
          type: inverter.type || 'inverter',
          wave_type: inverter.wave_type || 'modified_sine',
          input_voltage: inverter.input_voltage || '230V',
          output_voltage: inverter.output_voltage || '230V',
          efficiency: inverter.efficiency || '',
          battery_voltage: inverter.battery_voltage || '12V',
          specifications: inverter.specifications || '',
          warranty_period: inverter.warranty_period || '1 year',
          price: inverter.price || '0',
          status: inverter.status || 'active',
          purchase_date: inverter.purchase_date || new Date().toISOString().split('T')[0],
          installation_date: inverter.installation_date || new Date().toISOString().split('T')[0],
          inverter_condition: inverter.inverter_condition || 'good',
          created_at: inverter.created_at || '',
          updated_at: inverter.updated_at || '',
          total_services: parseInt(inverter.total_services || '0'),
          inverter_serial: inverter.inverter_serial || ''
        }));
        
        setInverters(formattedInverters);
        setSuccessMessage('Inverters loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to load inverters');
      }
      
    } catch (error: any) {
      console.error('Error loading inverters:', error);
      throw error;
    }
  };
  
  // Helper functions
  const handleLogout = () => {
    localStorage.clear();
    onLogout();
  };
  
  // Navigation handler
  const handleNavItemClick = (id: string) => {
    // Check if trying to access staff page and user is not admin
    if (id === 'staff' && user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to access Staff Management');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setActiveTab(id);
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
    setSearchTerm("");
    setFilterStatus("all");
    setFilterServiceType("all");
    setFilterPriority("all");
    setFilterClaimType("all");
    setFilterBatteryType("all");
    setFilterInverterType("all");
    setFilterInverterBrand("all");
    setFilterInverterStatus("all");
    setFilterSpareStatus("all");
    setFilterWarrantyStatus("all");
    setFilterAmcStatus("all");
    setFilterStaffStatus("all");
    setFilterStaffDepartment("all");
    setFilterStaffRole("all");
    setCardTabDrilldownFilter(null);
    
    // Stop scanning when changing tabs
    stopScanning();
  };

  const handleOpenCompletedCallsFromReport = ({ staffName, serviceDate }: { staffName: string; serviceDate: string }) => {
    setCardTabDrilldownFilter({
      staffName,
      serviceDate,
      requestKey: Date.now(),
    });
    setActiveTab('cards');
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
    stopScanning();
  };
  
  // Refresh handler
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      switch(activeTab) {
        case 'dashboard':
          await Promise.all([
            loadDashboardData(),
            loadServices(),
            loadInverterServices()
          ]);
          break;
        case 'services':
          await loadServices();
          break;
        case 'inverter_services':
          await loadInverterServices();
          break;
        case 'customers':
          await loadCustomers();
          break;
        case 'products':
          await Promise.all([
            loadBatteries(),
            loadInverters()
          ]);
          break;
        case 'revenue':
          await loadRevenueData();
          break;
        case 'overall_report':
          await Promise.all([
            loadDashboardData(selectedFinancialMonth),
            loadServices(),
            loadInverterServices()
          ]);
          break;
        case 'cards':
          await loadServices();
          await loadInverterServices();
          break;
        case 'pending_calls':
          await loadPendingCallsCount();
          break;
        case 'staff':
          // Only refresh staff data if user is admin
          if (user.role?.toLowerCase() === 'admin') {
            await loadStaff();
          } else {
            setError('You do not have permission to access Staff Management');
            setTimeout(() => setError(null), 3000);
          }
          break;
        case 'backup':
          break;
        default:
          break;
      }
      
      setSuccessMessage('Data refreshed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };
  
  // Scroll to top
  const scrollToTop = () => {
    if (dashboardContentRef.current) {
      dashboardContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Service handlers
  const resolveCustomerAlternatePhone = (service: ServiceOrder) => {
    const matchedCustomer = customers.find((customer) =>
      (service.customer_id && customer.id === service.customer_id) ||
      (service.customer_name && customer.full_name === service.customer_name) ||
      (service.customer_phone && customer.phone === service.customer_phone)
    );

    return service.customer_alternate_phone || matchedCustomer?.alternate_phone || '';
  };

  const handleViewService = (service: ServiceOrder) => {
    setShowServiceForm(false);
    setSelectedService({
      ...service,
      customer_alternate_phone: resolveCustomerAlternatePhone(service),
    });
  };
  
  const handleEditService = (service: ServiceOrder) => {
    setSelectedService(null);
    setShowServiceForm(false);
    
    setSelectedService(service);
    setServiceForm({
      id: service.id,
      customer_id: service.customer_id || null,
      customer_phone: service.customer_phone || "",
      battery_id: service.battery_id || null,
      inverter_id: service.inverter_id || null,
      battery_ids: Array.isArray((service as any).battery_ids) ? (service as any).battery_ids : (service.battery_id ? [service.battery_id] : []),
      inverter_ids: Array.isArray((service as any).inverter_ids) ? (service as any).inverter_ids : (service.inverter_id ? [service.inverter_id] : []),
      service_staff_id: service.service_staff_id || null,
      issue_description: service.issue_description || "",
      warranty_status: service.warranty_status || "out_of_warranty",
      amc_status: service.amc_status || "no_amc",
      notes: service.notes || "",
      status: service.status || "pending",
      priority: service.priority || "medium",
      payment_status: service.payment_status || "pending",
      amount: service.estimated_cost || service.final_cost || "0",
      estimated_cost: service.estimated_cost || "0",
      final_cost: service.final_cost || "0",
      deposit_amount: service.deposit_amount || "0",
      estimated_completion_date: service.estimated_completion_date || "",
      battery_claim: service.battery_claim || "none",
      service_type: service.service_type || "battery_service",
      showReplacementForm: false,
      replacement_battery_model: "",
      replacement_battery_serial: "",
      replacement_battery_brand: "",
      replacement_battery_capacity: "",
      replacement_battery_type: "",
      replacement_battery_voltage: "",
      replacement_battery_price: "",
      replacement_battery_warranty: "",
      replacement_installation_date: "",
      replacement_battery_notes: ""
    });
    
    setTimeout(() => {
      setShowServiceForm(true);
    }, 50);
  };
  
  // Inverter Service handlers
  const handleViewInverterService = (service: InverterService) => {
    setShowInverterServiceForm(false);
    setSelectedInverterService(service);
  };
  
  const handleEditInverterService = (service: InverterService) => {
    console.log("Editing inverter service:", service);
    
    setSelectedInverterService(null);
    setShowInverterServiceForm(false);
    
    const formData = {
      id: service.id || null,
      customer_id: service.customer_id || null,
      customer_phone: service.customer_phone || "",
      inverter_id: service.inverter_id || null,
      inverter_ids: Array.isArray((service as any).inverter_ids) ? (service as any).inverter_ids : (service.inverter_id ? [service.inverter_id] : []),
      service_staff_id: service.service_staff_id || null,
      issue_description: service.issue_description || "",
      diagnostic_results: service.diagnostic_results || "",
      repair_description: service.repair_description || "",
      replacement_parts: service.replacement_parts || "",
      warranty_status: service.warranty_status || "out_of_warranty",
      amc_status: service.amc_status || "no_amc",
      notes: service.notes || "",
      status: service.status || "pending",
      priority: service.priority || "medium",
      payment_status: service.payment_status || "pending",
      amount: service.estimated_cost || service.final_cost || "0",
      estimated_cost: service.estimated_cost || "0",
      final_cost: service.final_cost || "0",
      deposit_amount: service.deposit_amount || "0",
      estimated_completion_date: service.estimated_completion_date || "",
      inverter_claim: service.inverter_claim || "none",
      service_type: "inverter_service",
      showReplacementForm: false
    };
    
    setSelectedInverterService(service);
    setInverterServiceForm(formData);
    
    setTimeout(() => {
      setShowInverterServiceForm(true);
    }, 50);
  };
  
  const handleDeleteInverterService = async (id: number) => {
    setDeleteItem({ type: 'inverter_service', id });
    setShowDeleteConfirm(true);
  };
  
  // New Inverter Service Order handler
  const handleNewInverterServiceOrder = () => {
    setSelectedInverterService(null);
    setInverterServiceForm({
      id: null,
      customer_id: null,
      customer_phone: "",
      inverter_id: null,
      inverter_ids: [],
      service_staff_id: null,
      issue_description: "",
      diagnostic_results: "",
      repair_description: "",
      replacement_parts: "",
      warranty_status: "in_warranty",
      amc_status: "no_amc",
      notes: "",
      status: "pending",
      priority: "medium",
      payment_status: "pending",
      amount: "",
      estimated_cost: "",
      final_cost: "",
      deposit_amount: "",
      estimated_completion_date: "",
      inverter_claim: "none",
      service_type: "inverter_service",
      showReplacementForm: false
    });
    setShowInverterServiceForm(true);
  };
  
  const handleDeleteService = async (id: number) => {
    setDeleteItem({ type: 'service', id });
    setShowDeleteConfirm(true);
  };
  
  // New Service Order handler
  const handleNewServiceOrder = () => {
    setSelectedService(null);
    setServiceForm({
      id: null,
      customer_id: null,
      customer_phone: "",
      battery_id: null,
      inverter_id: null,
      battery_ids: [],
      inverter_ids: [],
      service_staff_id: null,
      issue_description: "",
      warranty_status: "in_warranty",
      amc_status: "no_amc",
      notes: "",
      status: "pending",
      priority: "medium",
      payment_status: "pending",
      amount: "",
      estimated_cost: "",
      final_cost: "",
      deposit_amount: "",
      estimated_completion_date: "",
      battery_claim: "none",
      service_type: "battery_service",
      showReplacementForm: false,
      replacement_battery_model: "",
      replacement_battery_serial: "",
      replacement_battery_brand: "",
      replacement_battery_capacity: "",
      replacement_battery_type: "",
      replacement_battery_voltage: "",
      replacement_battery_price: "",
      replacement_battery_warranty: "",
      replacement_installation_date: "",
      replacement_battery_notes: ""
    });
    setShowServiceForm(true);
  };
  
  // Service form handlers
  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'battery_ids' || name === 'inverter_ids') {
      let parsed: number[] = [];
      try {
        const arr = JSON.parse(value);
        if (Array.isArray(arr)) parsed = arr.map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0);
      } catch {
        parsed = [];
      }
      setServiceForm(prev => ({
        ...prev,
        [name]: parsed,
        battery_id: name === 'battery_ids' ? (parsed[0] || null) : prev.battery_id,
        inverter_id: name === 'inverter_ids' ? (parsed[0] || null) : prev.inverter_id
      }));
      return;
    }
    setServiceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/services.php`;
      const isEdit = selectedService !== null;
      
      const toValidIds = (value: any): number[] => {
        if (!Array.isArray(value)) return [];
        return value
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0);
      };

      const batteryIds = toValidIds((serviceForm as any).battery_ids);
      const inverterIds = toValidIds((serviceForm as any).inverter_ids);
      const primaryBatteryId = batteryIds[0] || (serviceForm.battery_id ? Number(serviceForm.battery_id) : null);
      const primaryInverterId = inverterIds[0] || (serviceForm.inverter_id ? Number(serviceForm.inverter_id) : null);
      const normalizedServiceType = serviceForm.service_type || "battery_service";
      const matchedCustomer = customers.find((customer) => customer.id === Number(serviceForm.customer_id));
      const normalizedCustomerPhone = String(
        serviceForm.customer_phone ||
        matchedCustomer?.phone ||
        ""
      ).replace(/\D/g, "").slice(0, 10);
      const normalizedServiceStaffId = serviceForm.service_staff_id
        ? Number(serviceForm.service_staff_id) || null
        : null;
      const normalizedEstimatedCompletionDate = String(
        serviceForm.estimated_completion_date || ""
      ).trim() || null;
      const normalizedIssueDescription = (serviceForm.issue_description || "").trim()
        || (normalizedServiceType === "battery_service"
          ? "Routine water service visit"
          : "Routine inverter service visit");

      const serviceData: any = {
        customer_id: serviceForm.customer_id || "",
        customer_phone: normalizedCustomerPhone,
        battery_ids: batteryIds,
        inverter_ids: inverterIds,
        battery_id: primaryBatteryId || "",
        inverter_id: primaryInverterId || "",
        service_staff_id: normalizedServiceStaffId,
        issue_description: normalizedIssueDescription,
        warranty_status: serviceForm.warranty_status || "out_of_warranty",
        amc_status: serviceForm.amc_status || "no_amc",
        notes: serviceForm.notes || "",
        status: serviceForm.status || "pending",
        priority: serviceForm.priority || "medium",
        payment_status: serviceForm.payment_status || "pending",
        estimated_cost: serviceForm.estimated_cost || "0",
        final_cost: serviceForm.final_cost || "0",
        deposit_amount: serviceForm.deposit_amount || "0",
        estimated_completion_date: normalizedEstimatedCompletionDate,
        battery_claim: serviceForm.battery_claim || "none",
        service_type: normalizedServiceType
      };
      
      // Add replacement battery serial if present
      if (serviceForm.replacement_battery_serial) {
        serviceData.replacement_battery_serial = serviceForm.replacement_battery_serial;
      }
      
      if (isEdit && selectedService) {
        serviceData.id = selectedService.id;
      }
      
      console.log("Submitting service data:", serviceData);
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
      
      const data = await response.json();
      console.log("Service save response:", data);
      
      if (data.success) {
        await loadServices();
        setShowServiceForm(false);
        setSelectedService(null);
        setSuccessMessage(isEdit ? 'Service updated successfully!' : 'Service created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const detail = data.error ? ` (${data.error})` : '';
        throw new Error((data.message || 'Failed to save service') + detail);
      }
      
    } catch (error: any) {
      console.error('Error saving service:', error);
      setError('Failed to save service order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Inverter Service form handlers
  const handleInverterServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'inverter_ids') {
      let parsed: number[] = [];
      try {
        const raw = JSON.parse(value || '[]');
        if (Array.isArray(raw)) {
          parsed = raw.map((v: any) => parseInt(v)).filter((id: number) => !isNaN(id) && id > 0);
        }
      } catch {
        parsed = [];
      }
      setInverterServiceForm(prev => ({
        ...prev,
        inverter_ids: parsed,
        inverter_id: parsed[0] || null
      }));
      return;
    }
    setInverterServiceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleInverterServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const isEdit = selectedInverterService !== null;
      
      // Use query parameter format for PUT requests to match PHP API
      const url = `${API_BASE_URL}/inverter_services.php`;
      
      const serviceData: any = {
        customer_id: inverterServiceForm.customer_id || "",
        customer_phone: inverterServiceForm.customer_phone || "",
        inverter_id: inverterServiceForm.inverter_id || "",
        inverter_ids: Array.isArray((inverterServiceForm as any).inverter_ids) ? (inverterServiceForm as any).inverter_ids : [],
        service_staff_id: inverterServiceForm.service_staff_id
          ? Number(inverterServiceForm.service_staff_id) || null
          : null,
        issue_description: inverterServiceForm.issue_description || "",
        diagnostic_results: inverterServiceForm.diagnostic_results || "",
        repair_description: inverterServiceForm.repair_description || "",
        replacement_parts: inverterServiceForm.replacement_parts || "",
        warranty_status: inverterServiceForm.warranty_status || "out_of_warranty",
        amc_status: inverterServiceForm.amc_status || "no_amc",
        notes: inverterServiceForm.notes || "",
        status: inverterServiceForm.status || "pending",
        priority: inverterServiceForm.priority || "medium",
        payment_status: inverterServiceForm.payment_status || "pending",
        estimated_cost: inverterServiceForm.estimated_cost || "0",
        final_cost: inverterServiceForm.final_cost || "0",
        deposit_amount: inverterServiceForm.deposit_amount || "0",
        estimated_completion_date: String(inverterServiceForm.estimated_completion_date || "").trim() || null,
        inverter_claim: inverterServiceForm.inverter_claim || "none"
      };
      
      // Include ID for both edit and create (if provided)
      if (isEdit && selectedInverterService) {
        serviceData.id = selectedInverterService.id;
      } else if (inverterServiceForm.id) {
        serviceData.id = inverterServiceForm.id;
      }
      
      console.log("Submitting inverter service data to:", url);
      console.log("Is Edit:", isEdit);
      console.log("Service Data:", serviceData);
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Inverter service save response:", data);
      
      if (data.success) {
        await loadInverterServices();
        setShowInverterServiceForm(false);
        setSelectedInverterService(null);
        setSuccessMessage(isEdit ? 'Inverter service updated successfully!' : 'Inverter service created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to save inverter service');
      }
      
    } catch (error: any) {
      console.error('Error saving inverter service:', error);
      setError('Failed to save inverter service: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Customer handlers
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };
  
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(false); // Close detail modal if open
    // Don't set showCustomerForm here - let ClientsTab handle it
  };
  
  const handleDeleteCustomer = async (id: number) => {
    setDeleteItem({ type: 'customer', id });
    setShowDeleteConfirm(true);
  };
  
  // Battery handlers
  const handleViewBattery = (battery: Battery) => {
    setSelectedBattery(battery);
    setShowProductDetail(true);
  };
  
  const handleEditBattery = (battery: Battery) => {
    setSelectedBattery(battery);
    setShowProductForm(true);
  };
  
  // Inverter handlers
  const handleViewInverter = (inverter: Inverter) => {
    setSelectedInverter(inverter);
    setShowProductDetail(true);
  };
  
  const handleEditInverter = (inverter: Inverter) => {
    setSelectedInverter(inverter);
    setShowProductForm(true);
  };
  
  // Staff handlers - Only accessible to admin
  const handleViewStaff = (staffMember: Staff) => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to view staff details');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedStaff(staffMember);
    setShowStaffDetail(true);
  };
  
  const handleEditStaff = (staffMember: Staff) => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to edit staff');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedStaff(staffMember);
    setStaffFormMode('edit');
    setShowStaffForm(true);
  };
  
  const handleAddStaff = () => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to add staff');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedStaff(null);
    setStaffFormMode('add');
    setShowStaffForm(true);
  };

  const handleAddSalary = (staffMember: Staff) => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to add salary');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedStaff(staffMember);
    setStaffFormMode('salary');
    setShowStaffForm(true);
  };

  const handleAddExpense = (staffMember: Staff) => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to add expenses');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedStaff(staffMember);
    setStaffFormMode('expense');
    setShowStaffForm(true);
  };
  
  const handleDeleteStaff = async (id: number) => {
    // Check if user is admin
    if (user.role?.toLowerCase() !== 'admin') {
      setError('You do not have permission to delete staff');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setDeleteItem({ type: 'staff', id });
    setShowDeleteConfirm(true);
  };

  const handleStaffFormSuccess = () => {
    loadStaff();
    setSuccessMessage('Operation completed successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStaffFormClose = () => {
    setShowStaffForm(false);
    setSelectedStaff(null);
  };

  const handleStaffDetailClose = () => {
    setShowStaffDetail(false);
    setSelectedStaff(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    if (severity === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let url = '';
      
      switch(deleteItem.type) {
        case 'service':
          url = `${API_BASE_URL}/services.php?id=${deleteItem.id}`;
          break;
        case 'inverter_service':
          url = `${API_BASE_URL}/inverter_services.php?id=${deleteItem.id}`;
          break;
        case 'customer':
          url = `${API_BASE_URL}/customers.php?id=${deleteItem.id}`;
          break;
        case 'battery':
          url = `${API_BASE_URL}/batteries.php?id=${deleteItem.id}`;
          break;
        case 'inverter':
          url = `${API_BASE_URL}/inverters.php?id=${deleteItem.id}`;
          break;
        case 'staff':
          // Check if user is admin before deleting staff
          if (user.role?.toLowerCase() !== 'admin') {
            throw new Error('You do not have permission to delete staff');
          }
          url = `${API_BASE_URL}/users.php?id=${deleteItem.id}`;
          break;
        default:
          throw new Error('Invalid delete type');
      }
      
      console.log(`Deleting ${deleteItem.type} with ID:`, deleteItem.id, "URL:", url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Delete response:", data);
      
      if (data.success) {
        switch(deleteItem.type) {
          case 'service':
            await loadServices();
            break;
          case 'inverter_service':
            await loadInverterServices();
            break;
          case 'customer':
            await loadCustomers();
            break;
          case 'battery':
            await loadBatteries();
            break;
          case 'inverter':
            await loadInverters();
            break;
          case 'staff':
            await loadStaff();
            break;
        }
        
        setSuccessMessage(`${deleteItem.type} deleted successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || `Failed to delete ${deleteItem.type}`);
      }
      
    } catch (error: any) {
      console.error(`Error deleting ${deleteItem?.type}:`, error);
      setError(`Failed to delete ${deleteItem?.type}: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteItem(null);
    }
  };
  
  // Color helper functions
  const getStatusColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'delivered': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'scheduled': return '#6366F1';
      case 'pending': return '#6B7280';
      case 'cancelled': return '#DC2626';
      case 'ready': return '#22C55E';
      case 'testing': return '#8B5CF6';
      case 'charging': return '#EC4899';
      case 'repair': return '#F97316';
      case 'diagnostic': return '#8B5CF6';
      case 'repairing': return '#F97316';
      default: return '#6B7280';
    }
  };
  
  const getPriorityColor = (priority: string): string => {
    switch(priority?.toLowerCase()) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };
  
  const getPaymentStatusColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'paid': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'refunded': return '#8B5CF6';
      default: return '#6B7280';
    }
  };
  
  const getServiceTypeColor = (type: string): string => {
    switch(type?.toLowerCase()) {
      case 'battery_service': return '#3B82F6';
      case 'inverter_service': return '#10B981';
      case 'hybrid_service': return '#F59E0B';
      default: return '#6B7280';
    }
  };
  
  const getWarrantyColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'in_warranty': return '#10B981';
      case 'extended_warranty': return '#3B82F6';
      case 'out_of_warranty': return '#DC2626';
      case 'active': return '#10B981';
      case 'expired': return '#DC2626';
      case 'void': return '#6B7280';
      default: return '#6B7280';
    }
  };
  
  const getClaimColor = (claim: string): string => {
    switch(claim?.toLowerCase()) {
      case 'shop_claim': return '#F59E0B';
      case 'company_claim': return '#3B82F6';
      case 'none': return '#6B7280';
      default: return '#6B7280';
    }
  };
  
  const getBatteryTypeColor = (type: string): string => {
    switch(type?.toLowerCase()) {
      case 'lead_acid': return '#3B82F6';
      case 'lithium_ion': return '#10B981';
      case 'gel': return '#EC4899';
      case 'agm': return '#F59E0B';
      case 'tubular': return '#8B5CF6';
      case 'li-ion': return '#10B981';
      case 'li-po': return '#EC4899';
      default: return '#6B7280';
    }
  };

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

  const getWaveTypeColor = (waveType: string): string => {
    switch(waveType?.toLowerCase()) {
      case 'pure_sine': return '#10b981';
      case 'modified_sine': return '#f59e0b';
      case 'square_wave': return '#6b7280';
      default: return '#6b7280';
    }
  };
  
  const getSpareStatusColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'available': return '#10B981';
      case 'allocated': return '#F59E0B';
      case 'returned': return '#3B82F6';
      case 'claimed': return '#8B5CF6';
      case 'in_use': return '#F59E0B';
      case 'reserved': return '#8B5CF6';
      default: return '#6B7280';
    }
  };
  
  const getConditionColor = (condition: string): string => {
    switch(condition?.toLowerCase()) {
      case 'good': return '#10B981';
      case 'fair': return '#F59E0B';
      case 'poor': return '#DC2626';
      case 'needs_replacement': return '#EF4444';
      case 'defective': return '#DC2626';
      case 'new': return '#10B981';
      case 'excellent': return '#059669';
      case 'dead': return '#991B1B';
      default: return '#6B7280';
    }
  };

  const getStaffStatusColor = (isActive: boolean): string => {
    return isActive ? '#10B981' : '#6B7280';
  };
  
  const getRoleColor = (role: string): string => {
    switch(role?.toLowerCase()) {
      case 'admin': return '#EF4444';
      case 'manager': return '#F59E0B';
      case 'technician': return '#3B82F6';
      case 'sales': return '#10B981';
      case 'staff': return '#8B5CF6';
      default: return '#6B7280';
    }
  };
  
  // Enhanced filter functions with comprehensive search
  const getFilteredServices = () => {
    let filtered = [...services];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(service => 
        searchAcrossAllFields(service, searchTerm, 'service')
      );
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(service => service.status === filterStatus);
    }
    
    // Apply service type filter
    if (filterServiceType !== "all") {
      filtered = filtered.filter(service => service.service_type === filterServiceType);
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(service => service.priority === filterPriority);
    }
    
    // Apply claim type filter
    if (filterClaimType !== "all") {
      filtered = filtered.filter(service => service.battery_claim === filterClaimType);
    }
    
    // Apply warranty status filter
    if (filterWarrantyStatus !== "all") {
      filtered = filtered.filter(service => service.warranty_status === filterWarrantyStatus);
    }
    
    // Apply AMC status filter
    if (filterAmcStatus !== "all") {
      filtered = filtered.filter(service => service.amc_status === filterAmcStatus);
    }
    
    return filtered;
  };
  
  const getFilteredInverterServices = () => {
    let filtered = [...inverterServices];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(service => 
        searchAcrossAllFields(service, searchTerm, 'inverter_service')
      );
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(service => service.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(service => service.priority === filterPriority);
    }
    
    // Apply warranty status filter
    if (filterWarrantyStatus !== "all") {
      filtered = filtered.filter(service => service.warranty_status === filterWarrantyStatus);
    }
    
    return filtered;
  };
  
  const getFilteredCustomers = () => {
    let filtered = [...customers];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(customer => 
        searchAcrossAllFields(customer, searchTerm, 'customer')
      );
    }
    
    return filtered;
  };
  
  const getFilteredBatteries = () => {
    let filtered = [...batteries];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(battery => 
        searchAcrossAllFields(battery, searchTerm, 'battery')
      );
    }
    
    // Apply battery type filter
    if (filterBatteryType !== "all") {
      filtered = filtered.filter(battery => battery.battery_type === filterBatteryType);
    }
    
    // Apply spare status filter
    if (filterSpareStatus !== "all") {
      if (filterSpareStatus === "spare") {
        filtered = filtered.filter(battery => parseIsSpare(battery.is_spare));
      } else if (filterSpareStatus === "regular") {
        filtered = filtered.filter(battery => !parseIsSpare(battery.is_spare));
      } else {
        filtered = filtered.filter(battery => battery.spare_status === filterSpareStatus);
      }
    }
    
    // Apply warranty status filter
    if (filterWarrantyStatus !== "all") {
      filtered = filtered.filter(battery => battery.status === filterWarrantyStatus);
    }
    
    return filtered;
  };

  const getFilteredInverters = () => {
    let filtered = [...inverters];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(inverter => 
        searchAcrossAllFields(inverter, searchTerm, 'inverter')
      );
    }
    
    // Apply inverter type filter
    if (filterInverterType !== "all") {
      filtered = filtered.filter(inverter => inverter.type === filterInverterType);
    }
    
    // Apply inverter brand filter
    if (filterInverterBrand !== "all") {
      filtered = filtered.filter(inverter => inverter.inverter_brand === filterInverterBrand);
    }
    
    // Apply inverter status filter
    if (filterInverterStatus !== "all") {
      filtered = filtered.filter(inverter => inverter.status === filterInverterStatus);
    }
    
    // Apply warranty status filter
    if (filterWarrantyStatus !== "all") {
      filtered = filtered.filter(inverter => inverter.status === filterWarrantyStatus);
    }
    
    return filtered;
  };

  const getFilteredStaff = () => {
    let filtered = [...staff];
    
    // Apply search filter using enhanced search function
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(member => 
        searchAcrossAllFields(member, searchTerm, 'staff')
      );
    }
    
    // Apply staff status filter
    if (filterStaffStatus !== "all") {
      const isActive = filterStaffStatus === "active";
      filtered = filtered.filter(member => member.is_active === isActive);
    }
    
    // Apply staff department filter
    if (filterStaffDepartment !== "all" && filterStaffDepartment) {
      filtered = filtered.filter(member => member.department === filterStaffDepartment);
    }
    
    // Apply staff role filter
    if (filterStaffRole !== "all" && filterStaffRole) {
      filtered = filtered.filter(member => member.role === filterStaffRole);
    }
    
    return filtered;
  };

  const filteredServices = getFilteredServices();
  const filteredInverterServices = getFilteredInverterServices();
  const filteredCustomers = getFilteredCustomers();
  const filteredBatteries = getFilteredBatteries();
  const filteredInverters = getFilteredInverters();
  const filteredStaff = getFilteredStaff();
  
  // Determine which product type to show in the ProductsTab
  const handleProductsTabChange = (tab: 'batteries' | 'inverters') => {
    setProductsTab(tab);
  };

  // Determine which product is selected for form/detail
  const getSelectedProduct = () => {
    if (productsTab === 'batteries') {
      return selectedBattery;
    } else {
      return selectedInverter;
    }
  };

  const handleProductSave = async (productData: any, isEdit: boolean, productType: 'battery' | 'inverter') => {
    // Use the isEdit parameter
    console.log(`Saving product: ${productType}, isEdit: ${isEdit}`);
    
    if (productType === 'battery') {
      await handleBatterySave(productData);
    } else {
      await handleInverterSave(productData);
    }
  };

  const handleBatterySave = async (batteryData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/batteries.php`;
      const isEdit = selectedBattery !== null;

      if (isEdit && selectedBattery) {
        batteryData.id = selectedBattery.id;

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(batteryData)
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to update battery');
        }
      } else {
        // Create separate battery records for each serial token.
        // Supports new lines, spaces, tabs, and commas.
        const serialNumbers = (batteryData.battery_serial || '')
          .split(/[,\s]+/)
          .map((serial: string) => serial.trim())
          .filter((serial: string) => serial.length > 0);

        const serialsToCreate = serialNumbers.length > 0 ? serialNumbers : [''];

        for (const serial of serialsToCreate) {
          const payload = {
            ...batteryData,
            battery_serial: serial
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || `Failed to add battery for serial: ${serial || 'N/A'}`);
          }
        }
      }

      await loadBatteries();
      setShowProductForm(false);
      setSelectedBattery(null);
      setSuccessMessage(
        isEdit
          ? 'Battery updated successfully!'
          : 'Battery records added successfully!'
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error saving battery:', error);
      setError('Failed to save battery: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInverterSave = async (inverterData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/inverters.php`;
      const isEdit = selectedInverter !== null;
      
      // Prepare base data for API
      const baseApiData: any = {
        inverter_model: inverterData.inverter_model || "",
        inverter_brand: inverterData.inverter_brand || "",
        power_rating: inverterData.power_rating || "",
        type: inverterData.type || "inverter",
        wave_type: inverterData.wave_type || "modified_sine",
        input_voltage: inverterData.input_voltage || "230V",
        output_voltage: inverterData.output_voltage || "230V",
        efficiency: inverterData.efficiency || "",
        battery_voltage: inverterData.battery_voltage || "12V",
        specifications: inverterData.specifications || "",
        warranty_period: inverterData.warranty_period || "1 year",
        price: inverterData.price || "0",
        status: inverterData.status || "active",
        purchase_date: inverterData.purchase_date || null,
        installation_date: inverterData.installation_date || null,
        inverter_condition: inverterData.inverter_condition || "good"
      };
      
      if (isEdit && selectedInverter) {
        const apiData = {
          ...baseApiData,
          id: selectedInverter.id,
          inverter_serial: inverterData.inverter_serial || ""
        };

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        if (!(data && (data.success === true || data.success === "true" || data.success === 1))) {
          const errorMsg = data.message || data.error || 'Failed to update inverter';
          throw new Error(errorMsg);
        }
      } else {
        // Create separate inverter records for each serial token.
        // Supports new lines, spaces, tabs, and commas.
        const serialNumbers = (inverterData.inverter_serial || '')
          .split(/[,\s]+/)
          .map((serial: string) => serial.trim())
          .filter((serial: string) => serial.length > 0);

        const serialsToCreate = serialNumbers.length > 0 ? serialNumbers : [''];

        for (const serial of serialsToCreate) {
          const apiData = {
            ...baseApiData,
            inverter_serial: serial
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(apiData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const data = await response.json();
          if (!(data && (data.success === true || data.success === "true" || data.success === 1))) {
            const errorMsg = data.message || data.error || `Failed to add inverter for serial: ${serial || 'N/A'}`;
            throw new Error(errorMsg);
          }
        }
      }

      await loadInverters(); // Reload inverters to get updated list
      setShowProductForm(false);
      setSelectedInverter(null);
      setSuccessMessage(isEdit ? 'Inverter updated successfully!' : 'Inverter records added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error saving inverter:', error);
      setError('Failed to save inverter: ' + error.message);
      // Re-throw to be caught by the modal
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSave = async (customerData: any, isEdit: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/customers.php`;
      
      if (isEdit && selectedCustomer) {
        customerData.id = selectedCustomer.id;
      }
      
      console.log("Saving customer data:", customerData);
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Customer save response:", data);
      
      if (data.success) {
        await loadCustomers(); // Reload customers to get updated list
        setShowCustomerDetail(false);
        setSelectedCustomer(null);
        setSuccessMessage(isEdit ? 'Customer updated successfully!' : 'Customer created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to save customer');
      }
      
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer: ' + error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle barcode input key press - ONLY for Products Management
  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = barcodeInput.trim();
      if (barcode) {
        handleBarcodeScanned(barcode);
        setBarcodeInput("");
      }
    }
  };
  
  // Customer form handlers
  const handleNewCustomer = () => {
    console.log("Opening new customer form");
    setSelectedCustomer(null);
    // Don't set showCustomerForm here - let ClientsTab handle it
  };

  const handleCustomerDetailClose = () => {
    console.log("Closing customer detail");
    setShowCustomerDetail(false);
    setSelectedCustomer(null);
  };

  useEffect(() => {
    const warmUpHeavyTabs = () => {
      void import("./ServicesTab");
      void import("./ProductsTab");
      void import("./RevenueTab");
      void import("./OverallReportTab");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmUpHeavyTabs, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(warmUpHeavyTabs, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);
  
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            user={user}
            activeTab={activeTab}
            onNavItemClick={handleNavItemClick}
            onLogout={handleLogout}
            onClose={() => setSidebarOpen(false)}
            pendingCallsCount={pendingCallsCount}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="nav-left">
            {!sidebarOpen && (
              <motion.button 
                className="sidebar-toggle open"
                onClick={() => setSidebarOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiMenu />
              </motion.button>
            )}
            <div className="brand-mobile">
              <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                <span>SO</span>
              </div>
              <div className="brand-info">
                <h2>Sun Water Service</h2>
              </div>
            </div>
            <motion.div 
              className="search-box"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab === 'dashboard' ? 'dashboard' : activeTab + '...'}`}
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-search" 
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </motion.div>
          </div>
          <div className="nav-right">
            {/* Scan buttons ONLY for Products Management */}
            {activeTab === 'products' && productsTab === 'batteries' && (
              <motion.button 
                className="nav-btn scan-btn"
                onClick={startBatterySerialScan}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Scan Battery Serial"
                style={{
                  background: scanningBatterySerial ? '#EF4444' : '#3B82F6',
                  color: 'white'
                }}
              >
                <FiRadio />
              </motion.button>
            )}
            {activeTab === 'products' && productsTab === 'inverters' && (
              <motion.button 
                className="nav-btn scan-btn"
                onClick={startInverterSerialScan}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Scan Inverter Serial"
                style={{
                  background: scanningInverterSerial ? '#EF4444' : '#3B82F6',
                  color: 'white'
                }}
              >
                <FiRadio />
              </motion.button>
            )}
            <motion.button 
              className="nav-btn refresh-btn"
              onClick={handleRefresh}
              title="Refresh Data"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'spinning' : ''} />
            </motion.button>
            <div className="notification-dropdown" ref={notificationRef} style={{ position: 'relative' }}>
              <motion.button 
                className="nav-btn notification-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next) {
                    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
                  }
                }}
              >
                <FiBell />
                {unreadNotificationsCount > 0 && (
                  <span className="notification-badge">{unreadNotificationsCount}</span>
                )}
              </motion.button>
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '280px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>Notifications</span>
                      <button
                        onClick={() => setNotifications([])}
                        style={{
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                          color: '#374151',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: '#374151',
                        borderBottom: '1px solid #f8fafc',
                        backgroundColor:
                          item.type === 'created' ? '#ecfdf5' :
                          item.type === 'updated' ? '#eff6ff' :
                          item.type === 'deleted' ? '#fef2f2' : '#ffffff'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px', textTransform: 'capitalize' }}>{item.type}</div>
                        <div>{item.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="user-menu">
              <div className="user-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-menu-info">
                <span>{user.name}</span>
                <span className="user-role">{user.role}</span>
                <span className="user-email-small">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scanning Mode Indicator - Only shows in Products Management */}
        {(scanningBatterySerial || scanningInverterSerial) && (
          <div className="scanning-mode-indicator">
            <FiRadio className="scanning-icon" />
            <span className="scanning-text">
              {scanningBatterySerial ? "Battery Serial Scanning Mode Active - Press Enter when done..." :
               scanningInverterSerial ? "Inverter Serial Scanning Mode Active - Press Enter when done..." :
               "Barcode Scanning Mode Active - Press Enter when done..."}
            </span>
            <motion.button 
              className="btn outline small"
              onClick={stopScanning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Stop Scanning
            </motion.button>
          </div>
        )}

        {/* Hidden Barcode Input - Only active in Products Management */}
        {(scanningBatterySerial || scanningInverterSerial) && (
          <input
            type="text"
            ref={barcodeInputRef}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyPress={handleBarcodeKeyPress}
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              opacity: 0,
              pointerEvents: 'none'
            }}
            autoFocus
          />
        )}

        {/* Dashboard Content */}
        <div 
          className="dashboard-content" 
          ref={dashboardContentRef}
          style={{ 
            overflowY: 'auto',
            height: 'calc(100vh - 70px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div 
                className="success-alert"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FiCheckCircle />
                <span>{successMessage}</span>
                <button onClick={() => setSuccessMessage(null)}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="error-alert"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FiAlertCircle />
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Section */}
          <div className="header-section">
            <div className="header-content">
              <div>
                <h1>Welcome, {user.name}! ⚡</h1>
                <p>Sun Water Service - Inverter & Battery Service, Buy and Service Shop</p>
                <p className="data-info">
                  Showing real-time data from database • Last updated: {new Date().toLocaleTimeString()}
                  {searchTerm && searchTerm.trim() !== '' && (
                    <span className="search-info"> • Search results for: "{searchTerm}"</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading data from database...</p>
            </div>
          )}

          <Suspense
            fallback={
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading section...</p>
              </div>
            }
          >

          {/* Staff Form Modal - Only accessible to admin */}
          {user.role?.toLowerCase() === 'admin' && (
            <AnimatePresence>
              {showStaffForm && (
                <StaffFormModal
                  open={showStaffForm}
                  onClose={handleStaffFormClose}
                  mode={staffFormMode}
                  data={staffFormMode === 'salary' || staffFormMode === 'expense' ? selectedStaff : selectedStaff}
                  staffList={staff}
                  onSuccess={handleStaffFormSuccess}
                  showSnackbar={showSnackbar}
                />
              )}
            </AnimatePresence>
          )}

          {/* Staff Detail Modal - Only accessible to admin */}
          {user.role?.toLowerCase() === 'admin' && (
            <AnimatePresence>
              {showStaffDetail && selectedStaff && (
                <StaffDetailModal
                  open={showStaffDetail}
                  onClose={handleStaffDetailClose}
                  staff={selectedStaff}
                  onEdit={() => {
                    handleStaffDetailClose();
                    handleEditStaff(selectedStaff);
                  }}
                  onAddSalary={() => {
                    const currentStaff = selectedStaff;
                    handleStaffDetailClose();
                    if (currentStaff) {
                      handleAddSalary(currentStaff);
                    }
                  }}
                  onAddExpense={() => {
                    const currentStaff = selectedStaff;
                    handleStaffDetailClose();
                    if (currentStaff) {
                      handleAddExpense(currentStaff);
                    }
                  }}
                  onDelete={() => {
                    const currentStaff = selectedStaff;
                    handleStaffDetailClose();
                    if (currentStaff) {
                      handleDeleteStaff(currentStaff.id);
                    }
                  }}
                  onRefresh={loadStaff}
                />
              )}
            </AnimatePresence>
          )}

          {/* Battery Service Form Modal */}
          <AnimatePresence>
            {showServiceForm && (
              <ServiceFormModal
                showForm={showServiceForm}
                editMode={selectedService !== null}
                formType="service"
                serviceForm={serviceForm}
                customers={customers}
                batteries={batteries}
                staffUsers={staff as any} // Cast to any to avoid type issues
                loading={{
                  services: loading
                }}
                onClose={() => {
                  setShowServiceForm(false);
                  setSelectedService(null);
                }}
                onServiceInputChange={handleServiceInputChange}
                onServiceSubmit={handleServiceSubmit}
                editingServiceId={selectedService?.id || null}
              />
            )}
          </AnimatePresence>

          {/* Inverter Service Form Modal */}
          <AnimatePresence>
            {showInverterServiceForm && (
              <InverterServiceFormModal
                showForm={showInverterServiceForm}
                editMode={selectedInverterService !== null}
                formType="inverter_service"
                serviceForm={inverterServiceForm}
                customers={customers}
                inverters={inverters}
                staffUsers={staff as any} // Cast to any to avoid type issues
                loading={{ services: loading }}
                onClose={() => {
                  console.log("Closing inverter service form");
                  setShowInverterServiceForm(false);
                  setSelectedInverterService(null);
                }}
                onServiceInputChange={handleInverterServiceInputChange}
                onServiceSubmit={handleInverterServiceSubmit}
                editingServiceId={selectedInverterService?.id || null}
                onFetchServiceData={async () => {
                  return selectedInverterService;
                }}
              />
            )}
          </AnimatePresence>

          {/* Service Detail Modal - Only show if NOT in edit mode */}
          <AnimatePresence>
            {selectedService && !showServiceForm && (
              <ServiceDetailModal
                service={selectedService}
                onClose={() => setSelectedService(null)}
                onEdit={() => {
                  handleEditService(selectedService);
                }}
                onDelete={() => {
                  const serviceId = selectedService.id;
                  setSelectedService(null);
                  handleDeleteService(serviceId);
                }}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getWarrantyColor={getWarrantyColor}
                getClaimColor={getClaimColor}
              />
            )}
          </AnimatePresence>

          {/* Inverter Service Detail Modal - Only show if NOT in edit mode */}
          <AnimatePresence>
            {selectedInverterService && !showInverterServiceForm && (
              <InverterServiceDetailModal
                isOpen={!!selectedInverterService}
                onClose={() => setSelectedInverterService(null)}
                service={selectedInverterService}
                onEdit={(service) => {
                  setSelectedInverterService(null);
                  handleEditInverterService(service);
                }}
                onDelete={(service) => {
                  setSelectedInverterService(null);
                  handleDeleteInverterService(service.id);
                }}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getWarrantyColor={getWarrantyColor}
              />
            )}
          </AnimatePresence>

          {/* Customer Detail Modal */}
          <AnimatePresence>
            {showCustomerDetail && selectedCustomer && (
              <CustomerDetailModal
                open={showCustomerDetail}
                customer={selectedCustomer}
                onClose={handleCustomerDetailClose}
                onEdit={() => {
                  handleCustomerDetailClose();
                  handleEditCustomer(selectedCustomer);
                }}
                onDelete={() => {
                  const customerId = selectedCustomer.id;
                  handleCustomerDetailClose();
                  handleDeleteCustomer(customerId);
                }}
              />
            )}
          </AnimatePresence>

          {/* Product Form Modal */}
          <AnimatePresence>
            {showProductForm && (
              <ProductFormModal
                product={getSelectedProduct()}
                productType={productsTab === 'batteries' ? 'battery' : 'inverter'}
                onClose={() => {
                  setShowProductForm(false);
                  setSelectedBattery(null);
                  setSelectedInverter(null);
                }}
                onSave={handleProductSave}
                loading={loading}
                scannedBarcode={barcodeInput}
                scanningActive={scanningBatterySerial || scanningInverterSerial}
                onBarcodeScanned={(barcode) => {
                  setBarcodeInput(barcode);
                }}
              />
            )}
          </AnimatePresence>

          {/* Product Detail Modal */}
          <AnimatePresence>
            {showProductDetail && (selectedBattery || selectedInverter) && (
              <ProductDetailModal
                product={selectedBattery || selectedInverter as any} // Cast to any to avoid null issue
                productType={selectedBattery ? 'battery' : 'inverter'}
                onClose={() => {
                  setShowProductDetail(false);
                  setSelectedBattery(null);
                  setSelectedInverter(null);
                }}
                onEdit={() => {
                  setShowProductDetail(false);
                  if (selectedBattery) {
                    handleEditBattery(selectedBattery);
                  } else if (selectedInverter) {
                    handleEditInverter(selectedInverter);
                  }
                }}
                onDelete={() => {
                  if (selectedBattery) {
                    setDeleteItem({ type: 'battery', id: selectedBattery.id });
                  } else if (selectedInverter) {
                    setDeleteItem({ type: 'inverter', id: selectedInverter.id });
                  }
                  setShowProductDetail(false);
                  setSelectedBattery(null);
                  setSelectedInverter(null);
                  setShowDeleteConfirm(true);
                }}
                getBatteryTypeColor={getBatteryTypeColor}
                getConditionColor={getConditionColor}
              />
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && deleteItem && (
              <DeleteConfirmationModal
                itemType={deleteItem.type}
                itemId={deleteItem.id}
                onClose={() => {
                  setShowDeleteConfirm(false);
                  setDeleteItem(null);
                }}
                onConfirm={handleConfirmDelete}
                loading={loading}
              />
            )}
          </AnimatePresence>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardTab
              dashboardStats={dashboardStats}
              selectedFinancialMonth={selectedFinancialMonth}
              onFinancialMonthChange={setSelectedFinancialMonth}
              onOpenDashboardOverview={() => handleNavItemClick('overall_report')}
              onOpenFinancialOverview={() => handleNavItemClick('revenue')}
              onOpenCustomersPage={() => handleNavItemClick('customers')}
              onOpenServicesPage={() => handleNavItemClick('services')}
              onOpenProductsPage={() => handleNavItemClick('products')}
              onOpenStaffPage={() => handleNavItemClick('staff')}
              recentServices={recentServices.slice(0, 5)}
              activities={activities}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getServiceTypeColor={getServiceTypeColor}
              onViewService={handleViewService}
              onEditService={handleEditService}
              onViewAllServices={() => setActiveTab('services')}
              loading={loading}
            />
          )}

          {/* Battery Services Tab - Table View Only */}
          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              filteredServices={filteredServices}
              customers={customers}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterClaimType={filterClaimType}
              onViewService={handleViewService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              onFilterStatusChange={setFilterStatus}
              onFilterPriorityChange={setFilterPriority}
              onFilterClaimTypeChange={setFilterClaimType}
              onNewService={handleNewServiceOrder}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getPaymentStatusColor={getPaymentStatusColor}
              loading={loading}
            />
          )}

          {/* Inverter Services Tab - Table View Only */}
          {activeTab === 'inverter_services' && (
            <InverterServiceTab
              services={filteredInverterServices}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              onViewService={handleViewInverterService}
              onEditService={handleEditInverterService}
              onDeleteService={handleDeleteInverterService}
              onFilterStatusChange={setFilterStatus}
              onFilterPriorityChange={setFilterPriority}
              onNewService={handleNewInverterServiceOrder}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getWarrantyColor={getWarrantyColor}
              loading={loading}
            />
          )}

          {/* Cards Tab - Dedicated Card View */}
          {activeTab === 'cards' && (
            <CardTab
              services={[...filteredServices, ...filteredInverterServices] as ServiceOrder[]}
              customers={customers}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
              drilldownFilter={cardTabDrilldownFilter}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterClaimType={filterClaimType}
              filterWarrantyStatus={filterWarrantyStatus}
              filterAmcStatus={filterAmcStatus}
              onFilterStatusChange={setFilterStatus}
              onFilterPriorityChange={setFilterPriority}
              onFilterClaimTypeChange={setFilterClaimType}
              onFilterWarrantyStatusChange={setFilterWarrantyStatus}
              onFilterAmcStatusChange={setFilterAmcStatus}
              onViewService={handleViewService}
            />
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <RevenueTab
              revenueStats={revenueStats}
              services={[...services, ...inverterServices] as ServiceOrder[]}
              loading={loading}
              error={error}
              onRefresh={loadRevenueData}
            />
          )}

          {activeTab === 'overall_report' && (
            <OverallReportTab
              services={[...services, ...inverterServices] as ServiceOrder[]}
              dashboardStats={dashboardStats}
              selectedMonth={selectedFinancialMonth}
              onMonthChange={setSelectedFinancialMonth}
              onOpenCompletedCalls={handleOpenCompletedCallsFromReport}
              loading={loading}
            />
          )}

          {/* Clients Management Tab */}
          {activeTab === 'customers' && (
            <ClientsTab
              customers={filteredCustomers}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onNewCustomer={handleNewCustomer}
              onRefreshCustomers={loadCustomers}
              onSaveCustomer={handleCustomerSave}
              loading={loading}
              showSnackbar={showSnackbar}
            />
          )}

          {/* Products Management Tab */}
          {activeTab === 'products' && (
            <ProductsTab
              // Battery props
              batteries={filteredBatteries}
              filteredBatteries={filteredBatteries}
              filterBatteryType={filterBatteryType}
              filterSpareStatus={filterSpareStatus}
              filterWarrantyStatus={filterWarrantyStatus}
              searchTerm={searchTerm}
              onViewBattery={handleViewBattery}
              onEditBattery={handleEditBattery}
              onDeleteBattery={(id) => {
                setDeleteItem({ type: 'battery', id });
                setShowDeleteConfirm(true);
              }}
              onNewBattery={() => {
                setProductsTab('batteries');
                setSelectedBattery(null);
                setShowProductForm(true);
              }}
              onFilterBatteryTypeChange={setFilterBatteryType}
              onFilterSpareStatusChange={setFilterSpareStatus}
              onFilterWarrantyStatusChange={setFilterWarrantyStatus}
              
              // Inverter props
              inverters={filteredInverters}
              filteredInverters={filteredInverters}
              filterInverterBrand={filterInverterBrand}
              filterInverterStatus={filterInverterStatus}
              filterInverterType={filterInverterType}
              onViewInverter={handleViewInverter}
              onEditInverter={handleEditInverter}
              onDeleteInverter={(id) => {
                setDeleteItem({ type: 'inverter', id });
                setShowDeleteConfirm(true);
              }}
              onNewInverter={() => {
                setProductsTab('inverters');
                setSelectedInverter(null);
                setShowProductForm(true);
              }}
              onFilterInverterBrandChange={setFilterInverterBrand}
              onFilterInverterStatusChange={setFilterInverterStatus}
              onFilterInverterTypeChange={setFilterInverterType}
              
              // Common props
              getBatteryTypeColor={getBatteryTypeColor}
              getInverterTypeColor={getInverterTypeColor}
              getWaveTypeColor={getWaveTypeColor}
              getConditionColor={getConditionColor}
              getSpareStatusColor={getSpareStatusColor}
              getWarrantyColor={getWarrantyColor}
              loading={loading}
              
              // Tab control
              activeTab={productsTab}
              onTabChange={handleProductsTabChange}

              // Barcode scanning props
              scanningBatterySerial={scanningBatterySerial}
              scanningInverterSerial={scanningInverterSerial}
              scannedBarcode={barcodeInput}
            />
          )}

          {/* Pending Calls Tab */}
          {activeTab === 'pending_calls' && (
            <PendingCallsTab 
              onCallCustomer={(customer) => {
                console.log('Calling customer:', customer);
              }}
              onViewDetails={(customer) => {
                console.log('Viewing details for:', customer);
              }}
            />
          )}

          {/* Staff Management Tab - Only visible to admin */}
          {activeTab === 'staff' && user.role?.toLowerCase() === 'admin' && (
            <StaffTab
              staff={filteredStaff}
              filteredStaff={filteredStaff}
              filterStaffStatus={filterStaffStatus}
              filterStaffDepartment={filterStaffDepartment}
              filterStaffRole={filterStaffRole}
              searchTerm={searchTerm}
              onViewStaff={handleViewStaff}
              onEditStaff={handleEditStaff}
              onDeleteStaff={handleDeleteStaff}
              onNewStaff={handleAddStaff}
              onAddSalary={handleAddSalary}
              onAddExpense={handleAddExpense}
              onFilterStaffStatusChange={setFilterStaffStatus}
              onFilterStaffDepartmentChange={setFilterStaffDepartment}
              onFilterStaffRoleChange={setFilterStaffRole}
              getStaffStatusColor={getStaffStatusColor}
              getRoleColor={getRoleColor}
              loading={loading}
              onSearchChange={setSearchTerm}
            />
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <BackupTab
              apiBaseUrl={API_BASE_URL}
              showSnackbar={showSnackbar}
            />
          )}
          </Suspense>

          {/* Scroll to Top Button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                className="scroll-to-top"
                onClick={scrollToTop}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiChevronUp />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-content">
              <p>© 2026 Jeevan Larosh. All rights reserved</p>
              <div className="footer-links">
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy'); }}>Privacy Policy</a>
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service'); }}>Terms of Service</a>
                <a href="#support" onClick={(e) => { e.preventDefault(); alert('Support Center'); }}>Support Center</a>
                <a href="#contact" onClick={(e) => { e.preventDefault(); alert('Contact Us'); }}>Contact Us</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
