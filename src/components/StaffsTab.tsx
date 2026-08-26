import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiClock,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFilter,
  FiSearch,
  FiUserPlus,
  FiDollarSign,
  FiBriefcase,
  FiCreditCard,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiDownload,
  FiPlus,
  FiMinus,
  FiFileText,
  FiHash,
  FiRefreshCw,
  FiPrinter,
  FiSquare,
  FiCheckSquare,
  FiMenu,
  FiZap,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import StaffFormModal from "./modals/StaffFormModal";
import jsPDF from 'jspdf';
import { API_BASE_URL as DEFAULT_API_BASE_URL } from "../config/api";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import "./css/StaffTab.css";

// Custom type for timeout (replaces NodeJS.Timeout)
type Timeout = ReturnType<typeof setTimeout>;

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  password?: string;
  emergency_contact?: string;
  blood_group?: string;
  joining_date?: string;
  salary?: number;
}

interface Salary {
  id: number;
  staff_id: number;
  service_type: 'water' | 'inverter' | 'both';
  staff_name: string;
  amount: number;
  bonus: number;
  deductions: number;
  net_amount: number;
  salary_date: string;
  salary_month: string;
  payment_method: string;
  transaction_id: string;
  funding_source?: 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing';
  funding_amount?: number;
  funding_notes?: string;
  notes: string;
  paid_by: number;
  paid_by_name: string;
  created_at: string;
}

interface Expense {
  id: number;
  staff_id: number;
  staff_name: string;
  expense_type: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

interface StaffTabProps {
  staff?: User[];
  filteredStaff?: User[];
  filterStaffStatus?: string;
  filterStaffDepartment?: string;
  filterStaffRole?: string;
  searchTerm?: string;
  onViewStaff: (staff: User) => void;
  onEditStaff: (staff: User) => void;
  onDeleteStaff: (id: number) => void;
  onNewStaff: () => void;
  onAddSalary: (staff: User) => void;
  onAddExpense: (staff: User) => void;
  onFilterStaffStatusChange: (status: string) => void;
  onFilterStaffDepartmentChange: (department: string) => void;
  onFilterStaffRoleChange: (role: string) => void;
  onSearchChange: (search: string) => void;
  getStaffStatusColor: (isActive: boolean) => string;
  getRoleColor: (role: string) => string;
  loading?: boolean;
  apiBaseUrl?: string;
  refreshStaff?: () => void;
}

// Create motion components properly
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionTr = motion.tr;

const StaffTab: React.FC<StaffTabProps> = ({
  staff = [],
  filteredStaff = [],
  filterStaffStatus = "all",
  filterStaffDepartment = "all",
  filterStaffRole = "all",
  onViewStaff,
  onDeleteStaff,
  onFilterStaffStatusChange,
  onFilterStaffDepartmentChange,
  onFilterStaffRoleChange,
  onSearchChange,
  loading = false,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  refreshStaff
}) => {
  // Date filter states
  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Local search state
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");
  
  // Last refreshed state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Mobile menu state
  const [showMobileActions, setShowMobileActions] = useState<boolean>(false);
  
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  
  // API data states
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [salaryStats, setSalaryStats] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: number} | null>(null);
  
  // Helper function to get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  
  // Form states
  const [salaryForm, setSalaryForm] = useState({
    service_type: 'water' as 'water' | 'inverter' | 'both',
    amount: '',
    salary_month: getCurrentMonth(), // Automatically set to current month
    payment_method: 'bank_transfer',
    transaction_id: '',
    bonus: '0',
    deductions: '0',
    funding_source: 'raj_communication' as 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing',
    funding_amount: '0',
    funding_notes: '',
    notes: ''
  });
  const [editSalaryForm, setEditSalaryForm] = useState({
    service_type: 'water' as 'water' | 'inverter' | 'both',
    amount: '',
    salary_month: getCurrentMonth(),
    payment_method: 'bank_transfer',
    transaction_id: '',
    bonus: '0',
    deductions: '0',
    funding_source: 'raj_communication' as 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing',
    funding_amount: '0',
    funding_notes: '',
    notes: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    expense_type: '',
    amount: '',
    description: '',
    expense_date: getCurrentDate(),
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });
  const [editExpenseForm, setEditExpenseForm] = useState({
    expense_type: 'others',
    amount: '',
    description: '',
    expense_date: getCurrentDate(),
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });
  
  // Use custom Timeout type instead of NodeJS.Timeout
  const searchTimeoutRef = useRef<Timeout | null>(null);
  const notificationTimeoutRef = useRef<Timeout | null>(null);
  
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Handle resize
  useEffect(() => {
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
  useEffect(() => {
    if (staff.length > 0) {
      setLastRefreshed(new Date());
    }
  }, [staff]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchTerm, filterStaffStatus, filterStaffDepartment, filterStaffRole, dateFilterType, fromDate, toDate]);

  // Update salary month when month changes (every time the component renders or when a new month starts)
  useEffect(() => {
    // Check if the current month has changed from the stored value
    const currentMonth = getCurrentMonth();
    if (salaryForm.salary_month !== currentMonth) {
      setSalaryForm(prev => ({
        ...prev,
        salary_month: currentMonth
      }));
    }
  }, []); // Run once on mount and then whenever needed

  // Set up interval to check for month change (optional - for long-running apps)
  useEffect(() => {
    const checkMonthChange = () => {
      const currentMonth = getCurrentMonth();
      setSalaryForm(prev => {
        if (prev.salary_month !== currentMonth) {
          return {
            ...prev,
            salary_month: currentMonth
          };
        }
        return prev;
      });
    };

    // Check every hour for month change
    const interval = setInterval(checkMonthChange, 3600000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString || 'Invalid date';
    }
  };

  // Format date for filename
  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Format month
  const formatMonth = (monthStr: string): string => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
    } catch {
      return monthStr;
    }
  };

  // Set default from and to dates for custom range
  const setDefaultCustomRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Get date filtered staff with search
  const getFilteredStaff = (): User[] => {
    let filtered = [...filteredStaff];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply date filters
    switch (dateFilterType) {
      case "today":
        filtered = filtered.filter(staff => {
          const staffDate = new Date(staff.created_at);
          staffDate.setHours(0, 0, 0, 0);
          return staffDate.getTime() === today.getTime();
        });
        break;
      
      case "this_week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(staff => {
          const staffDate = new Date(staff.created_at);
          return staffDate >= weekStart;
        });
        break;
      
      case "this_month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(staff => {
          const staffDate = new Date(staff.created_at);
          return staffDate >= monthStart;
        });
        break;
      
      case "this_year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(staff => {
          const staffDate = new Date(staff.created_at);
          return staffDate >= yearStart;
        });
        break;
      
      case "custom":
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          
          filtered = filtered.filter(staff => {
            const staffDate = new Date(staff.created_at);
            return staffDate >= from && staffDate <= to;
          });
        }
        break;
      
      default:
        break;
    }

    // Apply local search filter
    if (localSearchTerm && localSearchTerm.trim() !== '') {
      const searchLower = localSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(staff => 
        (staff.name && staff.name.toLowerCase().includes(searchLower)) ||
        (staff.email && staff.email.toLowerCase().includes(searchLower)) ||
        (staff.role && staff.role.toLowerCase().includes(searchLower)) ||
        (staff.department && staff.department.toLowerCase().includes(searchLower)) ||
        (staff.phone && staff.phone.includes(localSearchTerm))
      );
    }

    return filtered;
  };

  const allFilteredStaff = getFilteredStaff();
  const quickActionStaff = selectedItems.size > 0
    ? allFilteredStaff.find((member) => selectedItems.has(member.id)) || null
    : null;
  
  // Pagination calculations
  const totalItems = allFilteredStaff.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;
  const startIndex = totalItems > 0 ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = totalItems > 0 ? Math.min(startIndex + itemsPerPage, totalItems) : 0;
  const displayStaff = allFilteredStaff.slice(startIndex, endIndex);
  
  const allStaff = staff;

  // Update select all when selection changes
  useEffect(() => {
    if (displayStaff.length > 0) {
      const allSelected = displayStaff.every(staff => selectedItems.has(staff.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, displayStaff]);

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
    setSelectedItems(new Set());
    setSelectAll(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFilterType("all");
    setFromDate("");
    setToDate("");
    setShowDatePicker(false);
    setLocalSearchTerm("");
    onFilterStaffStatusChange("all");
    onFilterStaffDepartmentChange("all");
    onFilterStaffRoleChange("all");
    setSelectedItems(new Set());
    setSelectAll(false);
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilterType !== "all" || 
    localSearchTerm !== "" || 
    filterStaffStatus !== "all" || 
    filterStaffDepartment !== "all" || 
    filterStaffRole !== "all";

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const delta = 2;
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

  // Selection handlers
  const handleSelectItem = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(displayStaff.map(staff => staff.id));
      setSelectedItems(allIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  // Handle delete
  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeleteItem({ type: 'staff', id });
    setSelectedStaff(staff.find(s => s.id === id) || null);
    setShowDeleteConfirm(true);
  };

  // Handle bulk delete
  const handleBulkDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected staff member(s)?`)) {
      selectedItems.forEach(id => {
        onDeleteStaff(id);
      });
      setSelectedItems(new Set());
      setSelectAll(false);
      setShowMobileActions(false);
      showNotification(`${selectedItems.size} staff members deleted successfully`, 'success');
      
      if (refreshStaff) {
        refreshStaff();
      }
    }
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, staffMember: User) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  // Handle view click
  const handleViewClick = (e: React.MouseEvent, staffMember: User) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStaff(staffMember);
    onViewStaff(staffMember);
  };

  // Handle successful edit from modal
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedStaff(null);
    showNotification('Staff information updated successfully', 'success');
    
    if (refreshStaff) {
      refreshStaff();
    }
  };

  // Handle successful add from modal
  const handleAddSuccess = () => {
    setShowAddModal(false);
    showNotification('Staff added successfully', 'success');
    
    if (refreshStaff) {
      refreshStaff();
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteItem && selectedStaff) {
      onDeleteStaff(deleteItem.id);
      setShowDeleteConfirm(false);
      setSelectedStaff(null);
      setDeleteItem(null);
      showNotification('Staff member deleted successfully', 'success');
      
      if (refreshStaff) {
        refreshStaff();
      }
      
      if (selectedItems.has(deleteItem.id)) {
        const newSelected = new Set(selectedItems);
        newSelected.delete(deleteItem.id);
        setSelectedItems(newSelected);
        setSelectAll(newSelected.size === displayStaff.length && displayStaff.length > 0);
      }
    }
  };

  // Get selected items data
  const getSelectedItems = (): User[] => {
    return displayStaff.filter(staff => selectedItems.has(staff.id));
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    setNotification({
      show: true,
      message,
      type
    });

    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
      notificationTimeoutRef.current = null;
    }, 3000);
  };


  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Fetch salaries for selected staff
  const fetchStaffSalaries = async (staffId: number) => {
    try {
      setApiLoading(true);
      const response = await fetch(`${apiBaseUrl}/salary.php?staff_id=${staffId}`);
      const data: ApiResponse<Salary[]> = await response.json();
      
      if (data.success) {
        setSalaries(data.data);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching salaries:', error);
      showNotification('Failed to fetch salary history', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch expenses for selected staff
  const fetchStaffExpenses = async (staffId: number) => {
    try {
      setApiLoading(true);
      const response = await fetch(`${apiBaseUrl}/expenses.php?staff_id=${staffId}`);
      const data: ApiResponse<Expense[]> = await response.json();
      
      if (data.success) {
        setExpenses(data.data);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showNotification('Failed to fetch expense history', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch salary statistics
  const fetchSalaryStats = async (staffId?: number) => {
    try {
      const url = staffId 
        ? `${apiBaseUrl}/salary.php?action=stats&staff_id=${staffId}`
        : `${apiBaseUrl}/salary.php?action=stats`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSalaryStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching salary stats:', error);
    }
  };

  // Fetch expense statistics
  const fetchExpenseStats = async (staffId?: number) => {
    try {
      const url = staffId 
        ? `${apiBaseUrl}/expenses.php?action=stats&staff_id=${staffId}`
        : `${apiBaseUrl}/expenses.php?action=stats`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setExpenseStats(data.data || null);
      } else {
        setExpenseStats(null);
      }
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      setExpenseStats(null);
    }
  };

  // Create salary record
  const createSalary = async () => {
    if (!selectedStaff) return;

    try {
      setApiLoading(true);
      
      const amount = parseFloat(salaryForm.amount);
      const bonus = parseFloat(salaryForm.bonus) || 0;
      const deductions = parseFloat(salaryForm.deductions) || 0;
      const netAmount = amount + bonus - deductions;

      if (!salaryForm.salary_month.match(/^\d{4}-\d{2}$/)) {
        showNotification('Salary month must be in YYYY-MM format (e.g., 2026-02)', 'error');
        setApiLoading(false);
        return;
      }

      const salaryData = {
        staff_id: selectedStaff.id,
        service_type: salaryForm.service_type,
        staff_name: selectedStaff.name,
        amount: amount,
        salary_month: salaryForm.salary_month,
        payment_method: salaryForm.payment_method,
        transaction_id: salaryForm.transaction_id || `TXN${Date.now()}`,
        bonus: bonus,
        deductions: deductions,
        net_amount: netAmount,
        funding_source: salaryForm.funding_source,
        funding_amount: salaryForm.funding_source === 'business_income' ? 0 : parseFloat(salaryForm.funding_amount || '0'),
        funding_notes: salaryForm.funding_notes,
        notes: salaryForm.notes,
        paid_by: 1
      };

      const response = await fetch(`${apiBaseUrl}/salary.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData)
      });

      const data: ApiResponse<Salary> = await response.json();

      if (data.success) {
        showNotification('Salary recorded successfully', 'success');
        setShowSalaryModal(false);
        
        // Reset form with current month
        setSalaryForm({
          service_type: 'water',
          amount: '',
          salary_month: getCurrentMonth(), // Reset to current month
          payment_method: 'bank_transfer',
          transaction_id: '',
          bonus: '0',
          deductions: '0',
          funding_source: 'raj_communication',
          funding_amount: '0',
          funding_notes: '',
          notes: ''
        });

        if (showSalaryHistory && selectedStaff) {
          fetchStaffSalaries(selectedStaff.id);
        }

        if (refreshStaff) {
          refreshStaff();
        }
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error creating salary:', error);
      showNotification('Failed to record salary', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Create expense record
  const createExpense = async () => {
    if (!selectedStaff) return;

    try {
      setApiLoading(true);

      const expenseData = {
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        expense_type: expenseForm.expense_type,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        expense_date: expenseForm.expense_date,
        payment_method: expenseForm.payment_method,
        receipt_number: expenseForm.receipt_number || null,
        notes: expenseForm.notes,
        created_by: 1
      };

      const response = await fetch(`${apiBaseUrl}/expenses.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData)
      });

      const data: ApiResponse<Expense> = await response.json();

      if (data.success) {
        showNotification('Expense recorded successfully', 'success');
        setShowExpenseModal(false);
        
        setExpenseForm({
          expense_type: '',
          amount: '',
          description: '',
          expense_date: getCurrentDate(),
          payment_method: 'cash',
          receipt_number: '',
          notes: ''
        });

        if (showExpenseHistory && selectedStaff) {
          fetchStaffExpenses(selectedStaff.id);
          fetchExpenseStats(selectedStaff.id);
        }

        if (refreshStaff) {
          refreshStaff();
        }
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      showNotification('Failed to record expense', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Handle view salary history
  const handleViewSalaryHistory = (staffMember: User) => {
    setSelectedStaff(staffMember);
    fetchStaffSalaries(staffMember.id);
    fetchSalaryStats(staffMember.id);
    setShowSalaryHistory(true);
  };

  // Handle view expense history
  const handleViewExpenseHistory = (staffMember: User) => {
    setSelectedStaff(staffMember);
    fetchStaffExpenses(staffMember.id);
    fetchExpenseStats(staffMember.id);
    setShowExpenseHistory(true);
  };

  // Handle add salary
  const handleAddSalary = (staffMember: User) => {
    setSelectedStaff(staffMember);
    
    setSalaryForm({
      service_type: 'water',
      amount: '',
      salary_month: getCurrentMonth(), // Set to current month
      payment_method: 'bank_transfer',
      transaction_id: `TXN${Date.now()}`,
      bonus: '0',
      deductions: '0',
      funding_source: 'raj_communication',
      funding_amount: '0',
      funding_notes: '',
      notes: ''
    });
    setShowSalaryModal(true);
  };

  const handleEditSalaryRecord = (salary: Salary) => {
    setEditingSalary(salary);
    setEditSalaryForm({
      service_type: salary.service_type,
      amount: String(salary.amount ?? ''),
      salary_month: salary.salary_month || getCurrentMonth(),
      payment_method: salary.payment_method || 'bank_transfer',
      transaction_id: salary.transaction_id || '',
      bonus: String(salary.bonus ?? 0),
      deductions: String(salary.deductions ?? 0),
      funding_source: salary.funding_source || 'business_income',
      funding_amount: String(salary.funding_amount ?? 0),
      funding_notes: salary.funding_notes || '',
      notes: salary.notes || ''
    });
    setShowEditSalaryModal(true);
  };

  const updateSalaryRecord = async () => {
    if (!editingSalary || !selectedStaff) return;
    try {
      setApiLoading(true);

      const amount = parseFloat(editSalaryForm.amount || '0');
      const bonus = parseFloat(editSalaryForm.bonus || '0');
      const deductions = parseFloat(editSalaryForm.deductions || '0');
      const netAmount = amount + bonus - deductions;

      if (amount <= 0) {
        showNotification('Amount must be greater than 0', 'error');
        setApiLoading(false);
        return;
      }
      if (!editSalaryForm.salary_month.match(/^\d{4}-\d{2}$/)) {
        showNotification('Salary month must be in YYYY-MM format', 'error');
        setApiLoading(false);
        return;
      }

      const payload = {
        service_type: editSalaryForm.service_type,
        amount,
        salary_month: editSalaryForm.salary_month,
        payment_method: editSalaryForm.payment_method,
        transaction_id: editSalaryForm.transaction_id || `TXN${Date.now()}`,
        bonus,
        deductions,
        net_amount: netAmount,
        funding_source: editSalaryForm.funding_source,
        funding_amount: editSalaryForm.funding_source === 'business_income' ? 0 : parseFloat(editSalaryForm.funding_amount || '0'),
        funding_notes: editSalaryForm.funding_notes,
        notes: editSalaryForm.notes,
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name
      };

      const response = await fetch(`${apiBaseUrl}/salary.php?id=${editingSalary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update salary');
      }

      showNotification('Salary history updated successfully', 'success');
      setShowEditSalaryModal(false);
      setEditingSalary(null);
      await fetchStaffSalaries(selectedStaff.id);
      await fetchSalaryStats(selectedStaff.id);
    } catch (error: any) {
      console.error('Error updating salary:', error);
      showNotification(error.message || 'Failed to update salary', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Handle add expense
  const handleAddExpense = (staffMember: User) => {
    setSelectedStaff(staffMember);
    setExpenseForm({
      expense_type: '',
      amount: '',
      description: '',
      expense_date: getCurrentDate(),
      payment_method: 'cash',
      receipt_number: '',
      notes: ''
    });
    setShowExpenseModal(true);
  };

  // Handle salary form submit
  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSalary();
  };

  // Handle expense form submit
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense();
  };

  const handleEditExpenseRecord = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseForm({
      expense_type: expense.expense_type || 'others',
      amount: String(expense.amount ?? ''),
      description: expense.description || '',
      expense_date: expense.expense_date || getCurrentDate(),
      payment_method: expense.payment_method || 'cash',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || ''
    });
    setShowEditExpenseModal(true);
  };

  const updateExpenseRecord = async () => {
    if (!editingExpense || !selectedStaff) return;
    try {
      setApiLoading(true);
      const amount = parseFloat(editExpenseForm.amount || '0');
      if (amount <= 0) {
        showNotification('Amount must be greater than 0', 'error');
        setApiLoading(false);
        return;
      }

      const payload = {
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        expense_type: editExpenseForm.expense_type,
        amount,
        description: editExpenseForm.description,
        expense_date: editExpenseForm.expense_date,
        payment_method: editExpenseForm.payment_method,
        receipt_number: editExpenseForm.receipt_number || null,
        notes: editExpenseForm.notes
      };

      const response = await fetch(`${apiBaseUrl}/expenses.php?id=${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update expense');
      }

      showNotification('Expense history updated successfully', 'success');
      setShowEditExpenseModal(false);
      setEditingExpense(null);
      await fetchStaffExpenses(selectedStaff.id);
      await fetchExpenseStats(selectedStaff.id);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      showNotification(error.message || 'Failed to update expense', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Calculate net amount
  const calculateNetAmount = () => {
    const amount = parseFloat(salaryForm.amount) || 0;
    const bonus = parseFloat(salaryForm.bonus) || 0;
    const deductions = parseFloat(salaryForm.deductions) || 0;
    return amount + bonus - deductions;
  };

  // Handle search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  // Print function
  const handlePrint = () => {
    const selectedData = getSelectedItems();
    const dataToPrint = selectedData.length > 0 ? selectedData : displayStaff;
    
    if (dataToPrint.length === 0) {
      alert('No staff data to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    const activeCount = dataToPrint.filter(s => s.is_active).length;
    const inactiveCount = dataToPrint.filter(s => !s.is_active).length;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #fff; color: #333; }
          h1 { color: #667eea; font-size: 24px; margin: 0 0 10px 0; }
          .header { margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 10px; }
          .filters-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
          .filters-info h3 { margin: 0 0 10px 0; color: #374151; }
          .filters-info p { margin: 5px 0; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background-color: #667eea; color: white; padding: 10px; text-align: left; font-size: 12px; }
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
          <h1>Sun Water Service Battery Service</h1>
          <h2>Staff Report</h2>
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
          <p><strong>Status Filter:</strong> ${filterStaffStatus === 'all' ? 'All' : filterStaffStatus}</p>
          <p><strong>Department Filter:</strong> ${filterStaffDepartment === 'all' ? 'All' : filterStaffDepartment}</p>
          <p><strong>Role Filter:</strong> ${filterStaffRole === 'all' ? 'All' : filterStaffRole}</p>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              ${dataToPrint.map(staff => `
                <tr>
                  <td>${staff.id}</td>
                  <td>${staff.name || ''}</td>
                  <td>${staff.email || ''}</td>
                  <td>${staff.phone || ''}</td>
                  <td>${staff.role || 'Staff'}</td>
                  <td>${staff.department || '-'}</td>
                  <td>
                    <span class="status-badge" style="background-color: ${staff.is_active ? '#10b981' : '#ef4444'}">
                      ${staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>${new Date(staff.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Total Staff</div>
              <div class="value">${dataToPrint.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Active Staff</div>
              <div class="value">${activeCount}</div>
            </div>
            <div class="summary-item">
              <div class="label">Inactive Staff</div>
              <div class="value">${inactiveCount}</div>
            </div>
            <div class="summary-item">
              <div class="label">Departments</div>
              <div class="value">${new Set(dataToPrint.map(s => s.department).filter(Boolean)).size}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer generated document - valid without signature</p>
          <p>Sun Water Service Battery Service - All rights reserved</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Export to CSV
  const exportToCSV = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : displayStaff;
      
      if (dataToExport.length === 0) {
        alert('No staff data to export');
        return;
      }

      const exportData = dataToExport.map(staff => ({
        'ID': staff.id,
        'Name': staff.name || '',
        'Email': staff.email || '',
        'Phone': staff.phone || '',
        'Role': staff.role || 'Staff',
        'Department': staff.department || '',
        'Position': staff.position || '',
        'Status': staff.is_active ? 'Active' : 'Inactive',
        'Emergency Contact': staff.emergency_contact || '',
        'Blood Group': staff.blood_group || '',
        'Salary': staff.salary ? formatCurrency(staff.salary) : '',
        'Last Login': staff.last_login ? formatDate(staff.last_login) : 'Never',
        'Created Date': formatDate(staff.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Staff');
      
      const fileName = selectedOnly
        ? `selected_staff_${formatDateForFilename()}.csv`
        : `staff_list_${formatDateForFilename()}.csv`;
      
      XLSX.writeFile(wb, fileName);
      
      if (selectedOnly) setShowMobileActions(false);
      showNotification('CSV exported successfully', 'success');
    } catch (error) {
      console.error('CSV Export Error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF
  const exportToPDF = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : displayStaff;
      
      if (dataToExport.length === 0) {
        alert('No staff data to export');
        return;
      }

      const doc = new jsPDF({
        orientation: isMobile ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN POWERS BATTERY SERVICE', 14, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Staff Management', 14, 13);

      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(isMobile ? 14 : 16);
      doc.setFont('helvetica', 'bold');
      doc.text('Staff Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
      doc.setFontSize(isMobile ? 8 : 9);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 35;
      
      let dateRangeText = 'Date Range: ';
      switch (dateFilterType) {
        case 'today': dateRangeText += `Today (${new Date().toLocaleDateString()})`; break;
        case 'this_week': dateRangeText += 'This Week'; break;
        case 'this_month': dateRangeText += 'This Month'; break;
        case 'this_year': dateRangeText += 'This Year'; break;
        case 'custom': dateRangeText += `${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : 'End'}`; break;
        default: dateRangeText += 'All Time';
      }
      doc.text(dateRangeText, 14, yPos);
      
      yPos += 5;
      doc.text(`Total Records: ${dataToExport.length}`, 14, yPos);
      
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);

      // Prepare table data
      const tableColumn = isMobile 
        ? ['Name', 'Role', 'Status']
        : ['Name', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Joined'];

      const tableRows = dataToExport.map(staff => {
        if (isMobile) {
          return [
            staff.name || '',
            staff.role || 'Staff',
            staff.is_active ? 'Active' : 'Inactive'
          ];
        }
        return [
          staff.name || '',
          staff.email || '',
          staff.phone || '',
          staff.role || 'Staff',
          staff.department || '-',
          staff.is_active ? 'Active' : 'Inactive',
          formatDate(staff.created_at)
        ];
      });

      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: {
          fontSize: isMobile ? 7 : 8,
          cellPadding: isMobile ? 2 : 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontSize: isMobile ? 7 : 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        didDrawPage: () => {
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
      const activeCount = dataToExport.filter(s => s.is_active).length;
      const inactiveCount = dataToExport.filter(s => !s.is_active).length;
      const departmentCount = new Set(dataToExport.map(s => s.department).filter(Boolean)).size;

      const finalY = (doc as any).lastAutoTable?.finalY || 60;

      doc.setFillColor(240, 249, 255);
      doc.rect(14, finalY + 10, doc.internal.pageSize.getWidth() - 28, 25, 'F');
      
      doc.setFontSize(isMobile ? 10 : 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('Summary', 20, finalY + 20);
      
      doc.setFontSize(isMobile ? 7 : 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Total Staff: ${dataToExport.length}`, 20, finalY + 30);
      doc.text(`Active: ${activeCount}`, 80, finalY + 30);
      doc.text(`Inactive: ${inactiveCount}`, 120, finalY + 30);
      doc.text(`Departments: ${departmentCount}`, 160, finalY + 30);

      // Add footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This is a computer generated document - valid without signature',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );

      const fileName = selectedOnly
        ? `selected_staff_${formatDateForFilename()}.pdf`
        : `staff_list_${formatDateForFilename()}.pdf`;
      
      doc.save(fileName);
      
      if (selectedOnly) setShowMobileActions(false);
      showNotification('PDF exported successfully', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Get role color
  const getRoleColorStyle = (role: string): string => {
    const colors: Record<string, string> = {
      'admin': '#ef4444',
      'manager': '#f59e0b',
      'staff': '#10b981',
      'technician': '#3b82f6',
      'sales': '#8b5cf6'
    };
    return colors[role?.toLowerCase()] || '#6b7280';
  };

  // Render mobile card view
  const renderMobileCard = (staffMember: User) => (
    <div
      key={staffMember.id}
      onClick={(e) => handleViewClick(e, staffMember)}
      style={{
        backgroundColor: selectedItems.has(staffMember.id) ? '#eff6ff' : '#fff',
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
            onClick={(e) => handleSelectItem(staffMember.id, e)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedItems.has(staffMember.id) ? '#667eea' : '#6b7280'
            }}
          >
            {selectedItems.has(staffMember.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
          </MotionDiv>
          <div>
            <div style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>
              {staffMember.name || 'Unnamed'}
            </div>
            <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '500' }}>
              #{staffMember.id}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewClick(e, staffMember);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(e, staffMember);
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              color: '#f59e0b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiEdit2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Contact</div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>{staffMember.email || 'No email'}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiPhone size={10} /> {staffMember.phone || 'No phone'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Role & Department</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: getRoleColorStyle(staffMember.role),
              color: '#fff'
            }}>
              {staffMember.role || 'Staff'}
            </span>
            {staffMember.department && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {staffMember.department}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Joined Date</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCalendar size={12} color="#6b7280" />
            <span style={{ fontSize: '12px' }}>{formatDate(staffMember.created_at)}</span>
          </div>
        </div>
        <div>
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: staffMember.is_active ? '#d1fae5' : '#fee2e2',
            color: staffMember.is_active ? '#065f46' : '#991b1b'
          }}>
            {staffMember.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewSalaryHistory(staffMember);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            color: '#10b981',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiDollarSign size={14} />
          Salary
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewExpenseHistory(staffMember);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            color: '#f59e0b',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiCreditCard size={14} />
          Expenses
        </button>
        <button
          onClick={(e) => handleDeleteClick(e, staffMember.id)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiTrash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDeleteConfirm(false);
        setShowSalaryModal(false);
        setShowExpenseModal(false);
        setShowEditModal(false);
        setShowAddModal(false);
        setShowSalaryHistory(false);
        setShowExpenseHistory(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="staff-tab" style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      padding: '0',
      width: '100%'
    }}>
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className={`notification ${notification.type}`}
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              padding: '12px 24px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: notification.type === 'success' ? '#10b981' : 
                              notification.type === 'error' ? '#ef4444' : '#3b82f6',
              color: '#fff'
            }}
          >
            {notification.type === 'success' && <FiCheckCircle size={20} />}
            {notification.type === 'error' && <FiAlertCircle size={20} />}
            {notification.type === 'info' && <FiInfo size={20} />}
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{notification.message}</span>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                padding: '4px'
              }}
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Form Modal for Edit */}
      <StaffFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        mode="edit"
        data={selectedStaff}
        staffList={staff}
        onSuccess={handleEditSuccess}
        showSnackbar={showNotification}
      />

      {/* Staff Form Modal for Add */}
      <StaffFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        data={null}
        staffList={staff}
        onSuccess={handleAddSuccess}
        showSnackbar={showNotification}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deleteItem && selectedStaff && (
          <DeleteConfirmationModal
            itemType="staff"
            itemId={deleteItem.id}
            itemName={selectedStaff.name}
            onClose={() => {
              setShowDeleteConfirm(false);
              setSelectedStaff(null);
              setDeleteItem(null);
            }}
            onConfirm={confirmDelete}
            loading={loading || apiLoading}
          />
        )}
      </AnimatePresence>

      {/* Salary Modal */}
      <AnimatePresence>
        {showSalaryModal && selectedStaff && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSalaryModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div 
              className="salary-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}
            >
              <div className="modal-header" style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="modal-title">
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Record Salary Payment</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Process salary for {selectedStaff.name}</p>
                </div>
                <button className="close-btn" onClick={() => setShowSalaryModal(false)} style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af'
                }}>
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSalarySubmit}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="staff-summary-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <div 
                      className="staff-summary-avatar"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getRoleColorStyle(selectedStaff.role)} 0%, ${getRoleColorStyle(selectedStaff.role)}CC 100%)`,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedStaff.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="staff-summary-info">
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{selectedStaff.name}</h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                        {selectedStaff.role} • {selectedStaff.department || 'No Department'}
                      </p>
                    </div>
                  </div>

                  <div className="form-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {/* Service Type Dropdown */}
                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiZap style={{ display: 'inline', marginRight: '4px' }} />
                        Service Type *
                      </label>
                      <select
                        value={salaryForm.service_type}
                        onChange={(e) => setSalaryForm({...salaryForm, service_type: e.target.value as 'water' | 'inverter'})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="water">Water Services</option>
                        <option value="inverter">Inverter Services</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />
                        Base Salary *
                      </label>
                      <input
                        type="number"
                        value={salaryForm.amount}
                        onChange={(e) => setSalaryForm({...salaryForm, amount: e.target.value})}
                        placeholder="Enter base amount"
                        required
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                        Salary Month (YYYY-MM) *
                      </label>
                      <input
                        type="text"
                        value={salaryForm.salary_month}
                        onChange={(e) => setSalaryForm({...salaryForm, salary_month: e.target.value})}
                        placeholder="YYYY-MM"
                        required
                        pattern="\d{4}-\d{2}"
                        title="Please enter month in YYYY-MM format"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        Current month: {getCurrentMonth()}
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiCreditCard style={{ display: 'inline', marginRight: '4px' }} />
                        Payment Method *
                      </label>
                      <select
                        value={salaryForm.payment_method}
                        onChange={(e) => setSalaryForm({...salaryForm, payment_method: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiHash style={{ display: 'inline', marginRight: '4px' }} />
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={salaryForm.transaction_id}
                        onChange={(e) => setSalaryForm({...salaryForm, transaction_id: e.target.value})}
                        placeholder="Auto-generated if empty"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group bonus-field" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiPlus style={{ display: 'inline', marginRight: '4px' }} />
                        Bonus Amount (+)
                      </label>
                      <input
                        type="number"
                        value={salaryForm.bonus}
                        onChange={(e) => setSalaryForm({...salaryForm, bonus: e.target.value})}
                        placeholder="Bonus amount"
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group deduction-field" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiMinus style={{ display: 'inline', marginRight: '4px' }} />
                        Deductions (-)
                      </label>
                      <input
                        type="number"
                        value={salaryForm.deductions}
                        onChange={(e) => setSalaryForm({...salaryForm, deductions: e.target.value})}
                        placeholder="Deduction amount"
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiBriefcase style={{ display: 'inline', marginRight: '4px' }} />
                        Salary Amount Source
                      </label>
                      <select
                        value={salaryForm.funding_source}
                        onChange={(e) => setSalaryForm({
                          ...salaryForm,
                          funding_source: e.target.value as 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing',
                          funding_amount: e.target.value === 'business_income' ? '0' : salaryForm.funding_amount,
                          funding_notes: e.target.value === 'business_income' ? '' : salaryForm.funding_notes
                        })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="raj_communication">Raj Electricals</option>
                        <option value="business_income">Sun Water Service</option>
                        <option value="owner_cash">Owner Cash</option>
                        <option value="other_borrowing">Other Borrowing</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />
                        Borrowed / Support Amount
                      </label>
                      <input
                        type="number"
                        value={salaryForm.funding_amount}
                        onChange={(e) => setSalaryForm({...salaryForm, funding_amount: e.target.value})}
                        placeholder="Amount taken from Raj Electricals"
                        min="0"
                        step="0.01"
                        disabled={salaryForm.funding_source === 'business_income'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: salaryForm.funding_source === 'business_income' ? '#f9fafb' : '#fff'
                        }}
                      />
                    </div>
                  </div>

                  <div className="net-amount-card" style={{
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div className="net-amount-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiDollarSign style={{ color: '#0369a1' }} />
                      <span style={{ fontWeight: '500', color: '#0369a1' }}>Net Amount</span>
                    </div>
                    <div className="net-amount-value" style={{ fontSize: '20px', fontWeight: '600', color: '#0369a1' }}>
                      ₹{calculateNetAmount().toFixed(2)}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      Funding Notes
                    </label>
                    <textarea
                      value={salaryForm.funding_notes}
                      onChange={(e) => setSalaryForm({...salaryForm, funding_notes: e.target.value})}
                      placeholder="Example: Took Rs.5000 from Raj Electricals to complete salary payment"
                      rows={2}
                      disabled={salaryForm.funding_source === 'business_income'}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        marginBottom: '12px',
                        backgroundColor: salaryForm.funding_source === 'business_income' ? '#f9fafb' : '#fff'
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <FiFileText style={{ display: 'inline', marginRight: '4px' }} />
                      Payment Notes
                    </label>
                    <textarea
                      value={salaryForm.notes}
                      onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                      placeholder="Add any notes about this salary payment..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '20px 24px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <MotionButton 
                    type="button"
                    className="btn secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSalaryModal(false)}
                    disabled={apiLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton 
                    type="submit"
                    className="btn primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={apiLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {apiLoading ? <FiRefreshCw className="spinning" /> : <FiDollarSign />}
                    {apiLoading ? 'Processing...' : 'Process Payment'}
                  </MotionButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && selectedStaff && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExpenseModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div 
              className="expense-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}
            >
              <div className="modal-header" style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="modal-title">
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Record Expense</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Add expense for {selectedStaff.name}</p>
                </div>
                <button className="close-btn" onClick={() => setShowExpenseModal(false)} style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af'
                }}>
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="staff-summary-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <div 
                      className="staff-summary-avatar"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getRoleColorStyle(selectedStaff.role)} 0%, ${getRoleColorStyle(selectedStaff.role)}CC 100%)`,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedStaff.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="staff-summary-info">
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{selectedStaff.name}</h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                        {selectedStaff.role} • {selectedStaff.department || 'No Department'}
                      </p>
                    </div>
                  </div>

                  <div className="form-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiBriefcase style={{ display: 'inline', marginRight: '4px' }} />
                        Expense Category *
                      </label>
                      <select
                        value={expenseForm.expense_type}
                        onChange={(e) => setExpenseForm({...expenseForm, expense_type: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="">Select category</option>
                        <option value="petrol">Petrol</option>
                        <option value="travel">Travel</option>
                        <option value="food">Food</option>
                        <option value="stationery">Stationery</option>
                        <option value="equipment">Equipment</option>
                        <option value="training">Training</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />
                        Amount *
                      </label>
                      <input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        placeholder="Enter amount"
                        required
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                        Expense Date *
                      </label>
                      <input
                        type="date"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiCreditCard style={{ display: 'inline', marginRight: '4px' }} />
                        Payment Method *
                      </label>
                      <select
                        value={expenseForm.payment_method}
                        onChange={(e) => setExpenseForm({...expenseForm, payment_method: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiHash style={{ display: 'inline', marginRight: '4px' }} />
                        Receipt Number
                      </label>
                      <input
                        type="text"
                        value={expenseForm.receipt_number}
                        onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                        placeholder="Enter receipt number"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        <FiFileText style={{ display: 'inline', marginRight: '4px' }} />
                        Description *
                      </label>
                      <input
                        type="text"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                        placeholder="Brief description"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <FiFileText style={{ display: 'inline', marginRight: '4px' }} />
                      Additional Notes
                    </label>
                    <textarea
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                      placeholder="Add any additional notes..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '20px 24px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <MotionButton 
                    type="button"
                    className="btn secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowExpenseModal(false)}
                    disabled={apiLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton 
                    type="submit"
                    className="btn primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={apiLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {apiLoading ? <FiRefreshCw className="spinning" /> : <FiCreditCard />}
                    {apiLoading ? 'Saving...' : 'Save Expense'}
                  </MotionButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salary History Modal */}
      <AnimatePresence>
        {showSalaryHistory && selectedStaff && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSalaryHistory(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div 
              className="history-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}
            >
              <div className="modal-header" style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="modal-title">
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Salary History</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Payment history for {selectedStaff.name}</p>
                </div>
                <button className="close-btn" onClick={() => setShowSalaryHistory(false)} style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af'
                }}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ 
                padding: '24px',
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 140px)'
              }}>
                {apiLoading ? (
                  <div className="loading-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="loading-spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e5e7eb',
                      borderTop: '4px solid #667eea',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Loading salary history...</p>
                  </div>
                ) : (
                  <>
                    {/* Salary Stats */}
                    {salaryStats && salaryStats.by_staff && salaryStats.by_staff[0] && (
                      <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        marginBottom: '24px'
                      }}>
                        <div className="stat-card mini" style={{
                          padding: '16px',
                          backgroundColor: '#f0f9ff',
                          borderRadius: '8px',
                          border: '1px solid #bae6fd'
                        }}>
                          <div className="stat-label" style={{ fontSize: '11px', color: '#0369a1', marginBottom: '4px' }}>Total Paid</div>
                          <div className="stat-value" style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                            {formatCurrency(salaryStats.by_staff[0].total_net || 0)}
                          </div>
                        </div>
                        <div className="stat-card mini" style={{
                          padding: '16px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '8px',
                          border: '1px solid #fde68a'
                        }}>
                          <div className="stat-label" style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>Payments</div>
                          <div className="stat-value" style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                            {salaryStats.by_staff[0].payment_count || 0}
                          </div>
                        </div>
                        <div className="stat-card mini" style={{
                          padding: '16px',
                          backgroundColor: '#d1fae5',
                          borderRadius: '8px',
                          border: '1px solid #a7f3d0'
                        }}>
                          <div className="stat-label" style={{ fontSize: '11px', color: '#065f46', marginBottom: '4px' }}>Average</div>
                          <div className="stat-value" style={{ fontSize: '16px', fontWeight: '600', color: '#065f46' }}>
                            {formatCurrency(salaryStats.by_staff[0].average_net || 0)}
                          </div>
                        </div>
                        <div className="stat-card mini" style={{
                          padding: '16px',
                          backgroundColor: '#f3e8ff',
                          borderRadius: '8px',
                          border: '1px solid #e9d5ff'
                        }}>
                          <div className="stat-label" style={{ fontSize: '11px', color: '#6b21a8', marginBottom: '4px' }}>Last Payment</div>
                          <div className="stat-value" style={{ fontSize: '14px', fontWeight: '600', color: '#6b21a8' }}>
                            {formatDate(salaryStats.by_staff[0].last_payment)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Salary List */}
                    {salaries.length > 0 ? (
                      <div className="history-list">
                        <table className="history-table" style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Service Type</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Month</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Base</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Bonus</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Deductions</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Net Amount</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Payment Method</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salaries.map((salary) => (
                              <tr key={salary.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px' }}>
                                  <span className={`service-badge ${salary.service_type}`} style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: salary.service_type === 'water' ? '#dbeafe' : '#fef3c7',
                                    color: salary.service_type === 'water' ? '#1e40af' : '#92400e'
                                  }}>
                                    {salary.service_type === 'water' ? '💧 Water' : '⚡ Inverter'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>{formatMonth(salary.salary_month)}</td>
                                <td style={{ padding: '12px' }}>{formatCurrency(salary.amount)}</td>
                                <td style={{ padding: '12px', color: '#10b981' }}>{salary.bonus > 0 ? `+${formatCurrency(salary.bonus)}` : '-'}</td>
                                <td style={{ padding: '12px', color: '#ef4444' }}>{salary.deductions > 0 ? `-${formatCurrency(salary.deductions)}` : '-'}</td>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#059669' }}>{formatCurrency(salary.net_amount)}</td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`payment-badge ${salary.payment_method}`} style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: salary.payment_method === 'cash' ? '#d1fae5' :
                                                   salary.payment_method === 'bank_transfer' ? '#dbeafe' :
                                                   salary.payment_method === 'upi' ? '#fef3c7' : '#f3e8ff',
                                    color: salary.payment_method === 'cash' ? '#065f46' :
                                          salary.payment_method === 'bank_transfer' ? '#1e40af' :
                                          salary.payment_method === 'upi' ? '#92400e' : '#6b21a8'
                                  }}>
                                    {salary.payment_method.replace('_', ' ')}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <button
                                    onClick={() => handleEditSalaryRecord(salary)}
                                    style={{
                                      border: '1px solid #bfdbfe',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '12px',
                                      fontWeight: 600
                                    }}
                                  >
                                    <FiEdit2 size={12} />
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-history" style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#6b7280'
                      }}>
                        <FiDollarSign size={48} style={{ marginBottom: '16px', color: '#9ca3af' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>No salary records found</h4>
                        <p style={{ margin: '0', fontSize: '14px' }}>Click the salary button to record a payment</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer" style={{
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <MotionButton 
                  type="button"
                  className="btn secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSalaryHistory(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Close
                </MotionButton>
                <MotionButton 
                  type="button"
                  className="btn primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSalaryHistory(false);
                    handleAddSalary(selectedStaff);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiDollarSign />
                  Add New Salary
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Salary Modal */}
      <AnimatePresence>
        {showEditSalaryModal && editingSalary && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditSalaryModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '20px'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0' }}>Edit Salary History</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <select value={editSalaryForm.service_type} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, service_type: e.target.value as 'water' | 'inverter' | 'both' })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="water">Water</option>
                  <option value="inverter">Inverter</option>
                  <option value="both">Both</option>
                </select>
                <input type="month" value={editSalaryForm.salary_month} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, salary_month: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <input type="number" placeholder="Amount" value={editSalaryForm.amount} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, amount: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <input type="number" placeholder="Bonus" value={editSalaryForm.bonus} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, bonus: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <input type="number" placeholder="Deductions" value={editSalaryForm.deductions} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, deductions: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <select value={editSalaryForm.funding_source} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, funding_source: e.target.value as 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing', funding_amount: e.target.value === 'business_income' ? '0' : editSalaryForm.funding_amount, funding_notes: e.target.value === 'business_income' ? '' : editSalaryForm.funding_notes })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="raj_communication">Raj Electricals</option>
                  <option value="business_income">Sun Water Service</option>
                  <option value="owner_cash">Owner Cash</option>
                  <option value="other_borrowing">Other Borrowing</option>
                </select>
                <input type="number" placeholder="Borrowed / Support Amount" value={editSalaryForm.funding_amount} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, funding_amount: e.target.value })} disabled={editSalaryForm.funding_source === 'business_income'} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: editSalaryForm.funding_source === 'business_income' ? '#f9fafb' : '#fff' }} />
                <input type="text" placeholder="Transaction ID" value={editSalaryForm.transaction_id} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, transaction_id: e.target.value })} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <textarea placeholder="Funding Notes" value={editSalaryForm.funding_notes} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, funding_notes: e.target.value })} disabled={editSalaryForm.funding_source === 'business_income'} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', minHeight: '72px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: editSalaryForm.funding_source === 'business_income' ? '#f9fafb' : '#fff' }} />
                <textarea placeholder="Notes" value={editSalaryForm.notes} onChange={(e) => setEditSalaryForm({ ...editSalaryForm, notes: e.target.value })} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', minHeight: '90px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setShowEditSalaryModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button onClick={updateSalaryRecord} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}>
                  {apiLoading ? 'Saving...' : 'Update Salary'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense History Modal */}
      <AnimatePresence>
        {showExpenseHistory && selectedStaff && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExpenseHistory(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div 
              className="history-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}
            >
              <div className="modal-header" style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="modal-title">
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Expense History</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Expense records for {selectedStaff.name}</p>
                </div>
                <button className="close-btn" onClick={() => setShowExpenseHistory(false)} style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af'
                }}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ 
                padding: '24px',
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 140px)'
              }}>
                {apiLoading ? (
                  <div className="loading-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="loading-spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e5e7eb',
                      borderTop: '4px solid #667eea',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Loading expense history...</p>
                  </div>
                ) : (
                  <>
                    {expenseStats && expenses.length > 0 ? (
                      <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        marginBottom: '24px'
                      }}>
                        {expenseStats.total_amount > 0 && (
                          <div className="stat-card mini" style={{
                            padding: '16px',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '8px',
                            border: '1px solid #bae6fd'
                          }}>
                            <div className="stat-label" style={{ fontSize: '11px', color: '#0369a1', marginBottom: '4px' }}>Total Expenses</div>
                            <div className="stat-value" style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                              {formatCurrency(expenseStats.total_amount || 0)}
                            </div>
                          </div>
                        )}
                        
                        {expenseStats.expense_count > 0 && (
                          <div className="stat-card mini" style={{
                            padding: '16px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '8px',
                            border: '1px solid #fde68a'
                          }}>
                            <div className="stat-label" style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>Expense Count</div>
                            <div className="stat-value" style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                              {expenseStats.expense_count || 0}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {expenses.length > 0 ? (
                      <div className="history-list">
                        <table className="history-table" style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Category</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Description</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Amount</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Payment</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Receipt</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map((expense) => (
                              <tr key={expense.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px' }}>{formatDate(expense.expense_date)}</td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`category-badge ${expense.expense_type}`} style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: expense.expense_type === 'petrol' ? '#dbeafe' :
                                                   expense.expense_type === 'travel' ? '#fef3c7' :
                                                   expense.expense_type === 'food' ? '#d1fae5' :
                                                   expense.expense_type === 'stationery' ? '#f3e8ff' : '#fee2e2',
                                    color: expense.expense_type === 'petrol' ? '#1e40af' :
                                          expense.expense_type === 'travel' ? '#92400e' :
                                          expense.expense_type === 'food' ? '#065f46' :
                                          expense.expense_type === 'stationery' ? '#6b21a8' : '#991b1b'
                                  }}>
                                    {expense.expense_type}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>{expense.description}</td>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#059669' }}>{formatCurrency(expense.amount)}</td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`payment-badge ${expense.payment_method}`} style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: expense.payment_method === 'cash' ? '#d1fae5' :
                                                   expense.payment_method === 'card' ? '#dbeafe' :
                                                   expense.payment_method === 'upi' ? '#fef3c7' : '#f3e8ff',
                                    color: expense.payment_method === 'cash' ? '#065f46' :
                                          expense.payment_method === 'card' ? '#1e40af' :
                                          expense.payment_method === 'upi' ? '#92400e' : '#6b21a8'
                                  }}>
                                    {expense.payment_method}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>{expense.receipt_number || '-'}</td>
                                <td style={{ padding: '12px' }}>
                                  <button
                                    onClick={() => handleEditExpenseRecord(expense)}
                                    style={{
                                      border: '1px solid #fed7aa',
                                      backgroundColor: '#fff7ed',
                                      color: '#c2410c',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '12px',
                                      fontWeight: 600
                                    }}
                                  >
                                    <FiEdit2 size={12} />
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-history" style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#6b7280'
                      }}>
                        <FiCreditCard size={48} style={{ marginBottom: '16px', color: '#9ca3af' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>No expense records found</h4>
                        <p style={{ margin: '0', fontSize: '14px' }}>Click the expense button to record an expense</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer" style={{
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <MotionButton 
                  type="button"
                  className="btn secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExpenseHistory(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Close
                </MotionButton>
                <MotionButton 
                  type="button"
                  className="btn primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowExpenseHistory(false);
                    handleAddExpense(selectedStaff);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f59e0b',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiCreditCard />
                  Add New Expense
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Expense Modal */}
      <AnimatePresence>
        {showEditExpenseModal && editingExpense && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditExpenseModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: isMobile ? '16px' : '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '20px'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0' }}>Edit Expense History</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <select value={editExpenseForm.expense_type} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, expense_type: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="petrol">Petrol</option>
                  <option value="others">Others</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="stationery">Stationery</option>
                </select>
                <input type="number" placeholder="Amount" value={editExpenseForm.amount} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <input type="date" value={editExpenseForm.expense_date} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, expense_date: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <select value={editExpenseForm.payment_method} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, payment_method: e.target.value })} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <input type="text" placeholder="Receipt Number" value={editExpenseForm.receipt_number} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, receipt_number: e.target.value })} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <textarea placeholder="Description" value={editExpenseForm.description} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', minHeight: '72px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                <textarea placeholder="Notes" value={editExpenseForm.notes} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, notes: e.target.value })} style={{ gridColumn: isMobile ? 'span 1' : 'span 2', minHeight: '72px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setShowEditExpenseModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button onClick={updateExpenseRecord} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ea580c', color: '#fff', cursor: 'pointer' }}>
                  {apiLoading ? 'Saving...' : 'Update Expense'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="staff-hero" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        
        <div className="hero-content" style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '12px' : '20px',
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap'
        }}>
          <motion.div 
            className="hero-icon-wrapper"
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
            <FiUser />
          </motion.div>
          <div className="hero-text" style={{ flex: 1 }}>
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
              Staff Management
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
              Showing {startIndex + 1}-{endIndex} of {totalItems} staff members
            </motion.p>
          </div>
        </div>
        
        {/* Hero Actions */}
        <motion.div 
          className="hero-actions"
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
            <MotionButton 
              className="btn mobile-menu-btn"
              onClick={() => setShowMobileActions(!showMobileActions)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'white',
                color: '#667eea',
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
            </MotionButton>
          )}

          {/* Actions */}
          {(!isMobile || showMobileActions) && (
            <>
              <MotionButton 
                className="btn new-order-btn"
                onClick={() => {
                  setShowAddModal(true);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Add New Staff"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiUserPlus size={isMobile ? 16 : 18} />
                <span>{isMobile ? 'Add' : 'Add Staff'}</span>
              </MotionButton>

              <MotionButton
                className="btn"
                onClick={() => {
                  if (quickActionStaff) handleViewSalaryHistory(quickActionStaff);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!quickActionStaff}
                title="View Salary History (S)"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#10b981',
                  cursor: !quickActionStaff ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: !quickActionStaff ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDollarSign size={isMobile ? 14 : 16} />
                <span>Salary (S)</span>
              </MotionButton>

              <MotionButton
                className="btn"
                onClick={() => {
                  if (quickActionStaff) handleViewExpenseHistory(quickActionStaff);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!quickActionStaff}
                title="View Expense History (X)"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#f59e0b',
                  cursor: !quickActionStaff ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: !quickActionStaff ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiCreditCard size={isMobile ? 14 : 16} />
                <span>Expense (X)</span>
              </MotionButton>

              <MotionButton 
                className="btn csv-btn"
                onClick={() => {
                  exportToCSV(false);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={displayStaff.length === 0}
                title="Export to CSV"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#10b981',
                  cursor: displayStaff.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayStaff.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDownload size={isMobile ? 14 : 16} />
                <span>CSV</span>
              </MotionButton>
              
              <MotionButton 
                className="btn pdf-btn"
                onClick={() => {
                  exportToPDF(false);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={displayStaff.length === 0}
                title="Export to PDF"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#ef4444',
                  cursor: displayStaff.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayStaff.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDownload size={isMobile ? 14 : 16} />
                <span>PDF</span>
              </MotionButton>
              
              <MotionButton 
                className="btn print-btn"
                onClick={() => {
                  handlePrint();
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={displayStaff.length === 0}
                title="Print"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#3b82f6',
                  cursor: displayStaff.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayStaff.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiPrinter size={isMobile ? 14 : 16} />
                <span>Print</span>
              </MotionButton>
            </>
          )}
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="search-filter-bar" style={{
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
        <div className="search-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '2',
          width: '100%'
        }}>
          <FiSearch className="search-icon" style={{
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
            placeholder={isMobile ? "Search..." : "Search by name, email, role, department..."}
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="search-input"
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px 10px 40px' : '10px 12px 10px 40px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: isMobile ? '14px' : '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {localSearchTerm && (
            <MotionButton 
              className="clear-search"
              onClick={handleClearSearch}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
            </MotionButton>
          )}
        </div>

        {/* Date Filter */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiCalendar className="filter-icon" style={{
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
            className="filter-select"
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
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '0 0 auto',
          width: isMobile ? '100%' : 'auto',
          minWidth: '120px'
        }}>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="filter-select"
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

        {/* Status Filter */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiFilter className="filter-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1
          }} />
          <select
            value={filterStaffStatus}
            onChange={(e) => onFilterStaffStatusChange(e.target.value)}
            className="filter-select"
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiBriefcase className="filter-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1
          }} />
          <select
            value={filterStaffDepartment}
            onChange={(e) => onFilterStaffDepartmentChange(e.target.value)}
            className="filter-select"
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
            <option value="all">All Departments</option>
            {Array.from(new Set(staff.map(s => s.department).filter(Boolean))).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiUser className="filter-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1
          }} />
          <select
            value={filterStaffRole}
            onChange={(e) => onFilterStaffRoleChange(e.target.value)}
            className="filter-select"
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
            <option value="all">All Roles</option>
            {Array.from(new Set(staff.map(s => s.role))).map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <MotionButton
            className="btn clear-filters"
            onClick={clearFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: isMobile ? '10px 16px' : '10px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto'
            }}
            title="Clear all filters"
          >
            <FiX size={14} />
            Clear Filters
          </MotionButton>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {showDatePicker && (
        <div className="date-range-picker" style={{
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

      {/* Info Panel */}
      <div className="info-panel" style={{
        padding: isMobile ? '12px 16px' : '12px 24px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: isMobile ? '16px' : '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div className="info-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiUser className="info-icon" style={{ color: '#667eea', fontSize: isMobile ? '16px' : '18px' }} />
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Total Staff</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{allStaff.length}</span>
          </div>
        </div>
        
        <div className="info-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiCheckCircle className="info-icon" style={{ color: '#10b981', fontSize: isMobile ? '16px' : '18px' }} />
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Active</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>
              {allStaff.filter(s => s.is_active).length}
            </span>
          </div>
        </div>

        <div className="info-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiClock className="info-icon" style={{ color: '#f59e0b', fontSize: isMobile ? '16px' : '18px' }} />
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Last Updated</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="info-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginLeft: 'auto'
        }}>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} staff
          </span>
        </div>
      </div>

      {/* Results Info with Selection Controls */}
      {displayStaff.length > 0 && (
        <motion.div 
          className="results-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
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
          <div className="results-left" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-start'
          }}>
            <div className="selection-controls" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <button 
                className="select-all-btn"
                onClick={handleSelectAll}
                title={selectAll ? "Deselect all" : "Select all"}
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
              
              {selectedItems.size > 0 && (
                <>
                  <span className="selection-count" style={{
                    fontSize: isMobile ? '12px' : '12px',
                    color: '#667eea',
                    fontWeight: '500'
                  }}>
                    {selectedItems.size} selected
                  </span>
                  <button 
                    className="clear-selection-btn"
                    onClick={handleClearSelection}
                    title="Clear selection"
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
                  
                  <button 
                    className="bulk-delete-btn"
                    onClick={handleBulkDeleteClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      background: '#fee2e2',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: isMobile ? '12px' : '12px',
                      fontWeight: '500'
                    }}
                  >
                    <FiTrash2 size={12} />
                    <span>Delete Selected</span>
                  </button>

                  {!isMobile && (
                    <>
                      <button 
                        className="export-selected-csv"
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
                        className="export-selected-pdf"
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
            
            <span className="results-count" style={{
              fontSize: isMobile ? '12px' : '12px',
              color: '#6b7280'
            }}>
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalItems}</strong> staff members
            </span>
            
            {localSearchTerm && (
              <span className="search-term" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#e0f2fe',
                borderRadius: '16px',
                fontSize: isMobile ? '11px' : '11px',
                color: '#0369a1'
              }}>
                Filtered by: "{localSearchTerm}"
                <button onClick={handleClearSearch} style={{
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
      <div className="table-container" style={{ 
        padding: '0', 
        overflowX: isMobile ? 'visible' : 'auto',
        maxHeight: 'calc(100vh - 400px)',
        overflowY: 'auto'
      }}>
        {(loading || apiLoading) ? (
          <div className="loading-state" style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div className="loading-spinner" style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ margin: '0', fontSize: isMobile ? '14px' : '14px' }}>Loading staff data...</p>
          </div>
        ) : displayStaff.length > 0 ? (
          <>
            {/* Mobile Card View */}
            {isMobile && (
              <div style={{ padding: '16px' }}>
                {displayStaff.map((staffMember) => renderMobileCard(staffMember))}
              </div>
            )}

            {/* Tablet and Desktop Table View */}
            {!isMobile && (
              <table className="staff-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: isTablet ? '13px' : '14px',
                minWidth: isTablet ? '1000px' : '1200px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f3f4f6',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'center',
                      width: '40px'
                    }}>
                      <MotionDiv
                        onClick={handleSelectAll}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000'
                        }}
                      >
                        {selectAll ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                      </MotionDiv>
                    </th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Staff Member</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Role</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Department</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#000000',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStaff.map((staffMember, index) => (
                    <MotionTr 
                      key={staffMember.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={(e) => handleViewClick(e, staffMember)}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: selectedItems.has(staffMember.id) ? '#eff6ff' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ 
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'center',
                        width: '40px'
                      }}>
                        <MotionDiv
                          onClick={(e) => handleSelectItem(staffMember.id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedItems.has(staffMember.id) ? '#667eea' : '#6b7280'
                          }}
                        >
                          {selectedItems.has(staffMember.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        </MotionDiv>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: isTablet ? '32px' : '36px',
                            height: isTablet ? '32px' : '36px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${getRoleColorStyle(staffMember.role)} 0%, ${getRoleColorStyle(staffMember.role)}CC 100%)`,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: isTablet ? '13px' : '14px',
                            flexShrink: 0
                          }}>
                            {staffMember.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px', fontSize: isTablet ? '13px' : '14px' }}>{staffMember.name}</div>
                            {staffMember.phone && (
                              <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FiPhone size={isTablet ? 9 : 10} /> {staffMember.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiMail style={{ color: '#000000', fontSize: isTablet ? '11px' : '12px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#000000' }}>
                            {staffMember.email}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: isTablet ? '11px' : '12px',
                          fontWeight: '500',
                          backgroundColor: getRoleColorStyle(staffMember.role),
                          color: '#fff'
                        }}>
                          {staffMember.role || 'Staff'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#000000' }}>
                          {staffMember.department || '-'}
                          {staffMember.position && <span style={{ fontSize: isTablet ? '10px' : '11px', color: '#000000', marginLeft: '4px' }}>({staffMember.position})</span>}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: isTablet ? '11px' : '12px',
                          fontWeight: '500',
                          backgroundColor: staffMember.is_active ? '#d1fae5' : '#fee2e2',
                          color: staffMember.is_active ? '#065f46' : '#991b1b'
                        }}>
                          {staffMember.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar style={{ color: '#000000', fontSize: isTablet ? '11px' : '12px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#000000' }}>
                            {formatDate(staffMember.created_at)}
                          </span>
                        </div>
                      </td>
                    </MotionTr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <div className="empty-state" style={{
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
              <FiUser />
            </div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#374151'
            }}>No staff members found</h3>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? '14px' : '14px',
              color: '#6b7280',
              padding: '0 16px'
            }}>
              {allStaff.length === 0 
                ? 'Add your first staff member to get started'
                : 'No results match your search or filters. Try adjusting your criteria.'
              }
            </p>
            <MotionButton 
              className="btn primary"
              onClick={() => setShowAddModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '10px 20px' : '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#667eea',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiUserPlus />
              Add New Staff
            </MotionButton>
          </div>
        )}
      </div>

      {/* Pagination */}
      {displayStaff.length > 0 && totalPages > 1 && (
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
            Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} entries
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <MotionButton
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
            </MotionButton>

            <MotionButton
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
            </MotionButton>

            {getPageNumbers().map((page, index) => (
              <MotionButton
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...' || page === currentPage}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: page === currentPage ? '#667eea' : '#fff',
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
              </MotionButton>
            ))}

            <MotionButton
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
            </MotionButton>

            <MotionButton
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
            </MotionButton>
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
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
        }
        
        .date-range-picker input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
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
          background-color: #3b82f6 !important;
          color: white !important;
        }
        
        .btn.new-order-btn:hover {
          background-color: #667eea !important;
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
  );
};

export default StaffTab;
