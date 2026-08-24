import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip,
  alpha,
  Fade,
  Slide,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { API_BASE_URL } from "../../config/api";
import Grid from '@mui/material/GridLegacy';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Event as EventIcon,
  Money as MoneyIcon,
  Receipt as ReceiptIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  WaterDrop as WaterDropIcon,
  Bolt as BoltIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  BarChart as BarChartIcon,
  Print as PrintIcon,
  Build as BuildIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Favorite as FavoriteIcon,
  DeleteOutline as DeleteIcon,
  AttachMoney as AttachMoneyIcon,
  ReceiptLong as ReceiptLongIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Responsive Styled Components
const GlassDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    [theme.breakpoints.up('sm')]: {
      borderRadius: 24,
    },
    [theme.breakpoints.up('md')]: {
      borderRadius: 32,
    },
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.3)',
    overflow: 'hidden',
    margin: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      margin: theme.spacing(2),
    },
    width: 'calc(100% - 16px)',
    [theme.breakpoints.up('sm')]: {
      width: 'calc(100% - 32px)',
    }
  }
}));

const GradientHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
    borderRadius: '50%'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
    borderRadius: '50%'
  }
}));

const AnimatedAvatar = styled(motion(Avatar))(({ theme }) => ({
  width: 60,
  height: 60,
  fontSize: 24,
  [theme.breakpoints.up('sm')]: {
    width: 80,
    height: 80,
    fontSize: 32,
  },
  [theme.breakpoints.up('md')]: {
    width: 100,
    height: 100,
    fontSize: 42,
  },
  fontWeight: 700,
  border: '3px solid rgba(255,255,255,0.3)',
  [theme.breakpoints.up('sm')]: {
    border: '4px solid rgba(255,255,255,0.3)',
  },
  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05) rotate(5deg)',
    borderColor: 'white'
  }
}));

const StatCard = styled(motion(Card))((({ theme }) => ({
  borderRadius: 12,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 16,
  },
  [theme.breakpoints.up('md')]: {
    borderRadius: 20,
  },
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  border: '1px solid rgba(102, 126, 234, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 20px 30px -10px rgba(102, 126, 234, 0.3)',
    borderColor: alpha('#667eea', 0.3)
  }
})));

const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
  },
  borderRadius: 12,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 16,
  },
  [theme.breakpoints.up('md')]: {
    borderRadius: 20,
  },
  background: 'white',
  border: '1px solid rgba(102, 126, 234, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: alpha('#667eea', 0.3),
    boxShadow: '0 10px 30px -10px rgba(102, 126, 234, 0.2)'
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '0.8rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.85rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '0.9rem',
  },
  '&.header': {
    fontWeight: 700,
    backgroundColor: alpha('#667eea', 0.05),
    color: '#2d3748',
    borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
  }
}));

const ServiceBadge = styled(Box)<{ type?: string }>(({ theme, type }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  [theme.breakpoints.up('sm')]: {
    padding: '4px 12px',
    gap: 6,
  },
  [theme.breakpoints.up('md')]: {
    padding: '6px 16px',
    gap: 8,
  },
  borderRadius: 20,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 30,
  },
  fontSize: '0.7rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.75rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '0.85rem',
  },
  fontWeight: 600,
  ...(type === 'water' && {
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    color: '#1976d2',
    border: '1px solid rgba(25, 118, 210, 0.2)'
  }),
  ...(type === 'inverter' && {
    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    color: '#f57c00',
    border: '1px solid rgba(245, 124, 0, 0.2)'
  }),
  ...(type === 'both' && {
    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    color: '#388e3c',
    border: '1px solid rgba(56, 142, 60, 0.2)'
  })
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.9rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '1rem',
  },
  minHeight: 48,
  [theme.breakpoints.up('sm')]: {
    minHeight: 56,
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 60,
  },
  transition: 'all 0.3s ease',
  '&.Mui-selected': {
    color: '#667eea',
    fontWeight: 700
  }
}));

const AnimatedNumber = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.25rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '1.5rem',
  },
  animation: 'countUp 0.5s ease-out',
  '@keyframes countUp': {
    '0%': { opacity: 0, transform: 'translateY(20px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
  }
}));

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
  avatar?: string;
  emergency_contact?: string;
  blood_group?: string;
  date_of_birth?: string;
  joining_date?: string;
  salary?: number;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  aadhar_number?: string;
}

interface Salary {
  id: number;
  staff_id: number | null;
  staff_name: string;
  service_type: string;
  amount: number;
  salary_date: string;
  salary_month: string;
  payment_method: string;
  transaction_id: string;
  bonus: number;
  deductions: number;
  net_amount: number;
  funding_source?: string;
  funding_amount?: number;
  funding_notes?: string;
  notes: string;
  paid_by: number | null;
  paid_by_name: string;
  paid_at: string;
  created_at: string;
  updated_at: string;
  paid_by_email?: string;
  staff_user_name?: string;
  staff_email?: string;
}

interface Expense {
  id: number;
  staff_id: number | null;
  staff_name: string;
  service_type: string;
  expense_type: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  receipt_number: string | null;
  notes: string;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface WaterPayment {
  id: number;
  service_id: number;
  amount: number;
  service_date: string;
  notes: string;
  service_staff_id?: number | null;
  service_staff_name?: string | null;
  service_code?: string;
  customer_name?: string;
}

interface StaffDetailModalProps {
  open: boolean;
  onClose: () => void;
  staff: User | null;
  onEdit?: () => void;
  onRefresh?: () => void;
  onDelete?: () => void;
  onAddSalary?: () => void;
  onAddExpense?: () => void;
  onEditSalary?: (salary: Salary) => void;
  onEditExpense?: (expense: Expense) => void;
}

const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  open,
  onClose,
  staff,
  onEdit,
  onRefresh,
  onDelete,
  onAddSalary,
  onAddExpense,
  onEditSalary,
  onEditExpense
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'water' | 'inverter'>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');
  const [waterPayments, setWaterPayments] = useState<WaterPayment[]>([]);
  const [waterLoading, setWaterLoading] = useState(false);
  const [waterYearlyTotal, setWaterYearlyTotal] = useState(0);
  const [waterYearlyCount, setWaterYearlyCount] = useState(0);
  const [editingSalaryRecord, setEditingSalaryRecord] = useState<Salary | null>(null);
  const [editingExpenseRecord, setEditingExpenseRecord] = useState<Expense | null>(null);
  const [salaryEditForm, setSalaryEditForm] = useState({
    service_type: 'water',
    salary_month: '',
    amount: '',
    bonus: '0',
    deductions: '0',
    payment_method: 'bank_transfer',
    transaction_id: '',
    funding_source: 'raj_communication',
    funding_amount: '0',
    funding_notes: '',
    notes: ''
  });
  const [expenseEditForm, setExpenseEditForm] = useState({
    expense_type: 'others',
    amount: '',
    description: '',
    expense_date: '',
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });

  // Get month name from month number
  const getMonthName = (monthNumber: number): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1];
  };

  const getSelectedMonthLabel = (): string => {
    return selectedMonth === 'all' ? 'All Months' : getMonthName(selectedMonth);
  };

  // Format salary month for display (YYYY-MM to Month YYYY)
  const formatSalaryMonth = (monthYearStr: string): string => {
    try {
      const [year, month] = monthYearStr.split('-');
      const monthNum = parseInt(month, 10);
      const monthName = getMonthName(monthNum);
      return `${monthName} ${year}`;
    } catch {
      return monthYearStr;
    }
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
    } catch {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatFundingSource = (source?: string): string => {
    switch (source) {
      case 'raj_communication':
        return 'Raj Electricals';
      case 'owner_cash':
        return 'Owner Cash';
      case 'other_borrowing':
        return 'Other Borrowing';
      case 'business_income':
      default:
        return 'Sun Water Service';
    }
  };

  useEffect(() => {
    if (open && staff) {
      loadStaffData();
    }
  }, [open, staff]);

  useEffect(() => {
    if (open && staff) {
      loadWaterPayments();
    }
  }, [open, staff, selectedYear, selectedMonth]);

  const loadStaffData = async () => {
    if (!staff) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load salaries from salary.php
      const salaryResponse = await fetch(`${API_BASE_URL}/salary.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!salaryResponse.ok) {
        throw new Error(`Failed to load salary data: ${salaryResponse.status}`);
      }
      
      const salaryData = await salaryResponse.json();
      console.log('Salary API Response:', salaryData);
      
      if (salaryData.success && salaryData.data) {
        // Filter salaries for this staff member - improved filtering
        const staffSalaries = salaryData.data.filter((s: any) => {
          // Check by staff_id (numeric comparison)
          if (s.staff_id && parseInt(s.staff_id) === staff.id) {
            return true;
          }
          // Check by staff_name (case-insensitive)
          if (s.staff_name && s.staff_name.toLowerCase() === staff.name.toLowerCase()) {
            return true;
          }
          return false;
        });
        
        console.log('Filtered salaries for staff:', staffSalaries);
        
        const formattedSalaries: Salary[] = staffSalaries.map((s: any) => ({
          id: parseInt(s.id),
          staff_id: s.staff_id ? parseInt(s.staff_id) : null,
          staff_name: s.staff_name || staff.name,
          service_type: s.service_type || 'water',
          amount: parseFloat(s.amount) || 0,
          salary_month: s.salary_month || '',
          payment_method: s.payment_method || 'cash',
          transaction_id: s.transaction_id || '',
          bonus: parseFloat(s.bonus) || 0,
          deductions: parseFloat(s.deductions) || 0,
          net_amount: parseFloat(s.net_amount) || parseFloat(s.amount) || 0,
          funding_source: s.funding_source || 'business_income',
          funding_amount: parseFloat(s.funding_amount) || 0,
          funding_notes: s.funding_notes || '',
          notes: s.notes || '',
          paid_by: s.paid_by ? parseInt(s.paid_by) : null,
          paid_by_name: s.paid_by_name || 'System',
          paid_at: s.paid_at || '',
          created_at: s.created_at || '',
          updated_at: s.updated_at || '',
          paid_by_email: s.paid_by_email,
          staff_user_name: s.staff_user_name,
          staff_email: s.staff_email
        }));
        
        console.log('Formatted salaries:', formattedSalaries);
        setSalaries(formattedSalaries);
      }

      // Load expenses from expenses.php
      const expenseResponse = await fetch(`${API_BASE_URL}/expenses.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!expenseResponse.ok) {
        throw new Error(`Failed to load expense data: ${expenseResponse.status}`);
      }
      
      const expenseData = await expenseResponse.json();
      console.log('Expense API Response:', expenseData);
      
      if (expenseData.success && expenseData.data) {
        // Filter expenses for this staff member
        const staffExpenses = expenseData.data.filter((e: any) => {
          // Check by staff_id (numeric comparison)
          if (e.staff_id && parseInt(e.staff_id) === staff.id) {
            return true;
          }
          // Check by staff_name (case-insensitive)
          if (e.staff_name && e.staff_name.toLowerCase() === staff.name.toLowerCase()) {
            return true;
          }
          return false;
        });
        
        console.log('Filtered expenses:', staffExpenses);
        
        const formattedExpenses: Expense[] = staffExpenses.map((e: any) => ({
          id: parseInt(e.id),
          staff_id: e.staff_id ? parseInt(e.staff_id) : null,
          staff_name: e.staff_name || staff.name,
          service_type: e.service_type || 'water',
          expense_type: e.expense_type || 'others',
          amount: parseFloat(e.amount) || 0,
          description: e.description || '',
          expense_date: e.expense_date || '',
          payment_method: e.payment_method || 'cash',
          receipt_number: e.receipt_number || null,
          notes: e.notes || '',
          created_by: e.created_by ? parseInt(e.created_by) : null,
          created_by_name: e.created_by_name || 'System',
          created_at: e.created_at || '',
          updated_at: e.updated_at || ''
        }));
        
        setExpenses(formattedExpenses);
      }
      
    } catch (error) {
      console.error('Error loading staff data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load staff financial data');
    } finally {
      setLoading(false);
    }
  };

  const getSalaryMonthKey = (salary: Salary): string => salary.salary_month || '';

  const loadWaterPayments = async () => {
    if (!staff) return;

    setWaterLoading(true);
    try {
      const monthParam = selectedMonth === 'all'
        ? selectedYear
        : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const response = await fetch(`${API_BASE_URL}/water_services.php?action=staff_monthly_summary&month=${monthParam}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load water payments: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const list: WaterPayment[] = (data.payments || []).map((p: any) => ({
          id: parseInt(p.id, 10),
          service_id: parseInt(p.service_id, 10),
          amount: parseFloat(p.amount) || 0,
          service_date: p.service_date || '',
          notes: p.notes || '',
          service_staff_id: p.service_staff_id ? parseInt(p.service_staff_id, 10) : null,
          service_staff_name: p.service_staff_name || null,
          service_code: p.service_code || '',
          customer_name: p.customer_name || ''
        }));

        const filtered = list.filter((p) =>
          (p.service_staff_id && p.service_staff_id === staff.id) ||
          (p.service_staff_name && p.service_staff_name.toLowerCase() === staff.name.toLowerCase())
        );
        setWaterPayments(filtered);
      } else {
        setWaterPayments([]);
      }

      // Year-wise total amount and count for this staff profile
      const yearlyResponse = await fetch(`${API_BASE_URL}/water_services.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (yearlyResponse.ok) {
        const yearlyData = await yearlyResponse.json();
        const yearlyRecords = Array.isArray(yearlyData.records) ? yearlyData.records : [];
        const yearlyFiltered = yearlyRecords.filter((p: any) => {
          const staffMatch =
            (p.service_staff_id && parseInt(p.service_staff_id, 10) === staff.id) ||
            (p.service_staff_name && String(p.service_staff_name).toLowerCase() === staff.name.toLowerCase());

          if (!staffMatch || !p.service_date) return false;
          const d = new Date(p.service_date);
          if (d.getFullYear().toString() !== selectedYear) return false;
          if (selectedMonth === 'all') return true;
          return d.getMonth() + 1 === selectedMonth;
        });

        const yearTotal = yearlyFiltered.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        setWaterYearlyTotal(yearTotal);
        setWaterYearlyCount(yearlyFiltered.length);
      } else {
        setWaterYearlyTotal(0);
        setWaterYearlyCount(0);
      }
    } catch (err) {
      console.error('Error loading water payments:', err);
      setWaterPayments([]);
      setWaterYearlyTotal(0);
      setWaterYearlyCount(0);
    } finally {
      setWaterLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadStaffData();
    if (onRefresh) onRefresh();
    showSnackbar('Data refreshed successfully.', 'success');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get available years from salary/expense data
  const getAvailableYears = (): string[] => {
    const years = new Set<string>();
    salaries.forEach(s => {
      const monthKey = getSalaryMonthKey(s);
      if (monthKey) {
        const [year] = monthKey.split('-');
        if (year) years.add(year);
      }
    });
    expenses.forEach(e => {
      if (e.expense_date) {
        const year = new Date(e.expense_date).getFullYear().toString();
        years.add(year);
      }
    });
    
    // Always include current year for reliable month-wise filtering
    years.add(new Date().getFullYear().toString());

    // Also keep a recent range available so month-wise filter is never blocked
    const currentYear = new Date().getFullYear();
    years.add((currentYear - 1).toString());
    years.add((currentYear - 2).toString());

    // If no data at all, still keep at least recent years
    if (years.size === 0) {
      years.add(currentYear.toString());
      years.add((currentYear - 1).toString());
      years.add((currentYear - 2).toString());
    }
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  // Month-wise filter should always allow all 12 months
  const getAvailableMonths = (): number[] => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Filter salaries by selected year, month, and service type
  const filteredSalaries = salaries.filter(s => {
    // Apply service filter
    if (serviceFilter !== 'all') {
      if (!s.service_type || s.service_type.toLowerCase() !== serviceFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Month/year should follow paid date month first (fallback salary_month)
    const monthKey = getSalaryMonthKey(s);
    if (monthKey) {
      const [year, month] = monthKey.split('-');
      const parsedMonth = parseInt(month, 10);
      if (year !== selectedYear) return false;
      if (selectedMonth === 'all') return true;
      return parsedMonth === selectedMonth;
    }
    return false;
  });

  // Filter expenses by selected year, month, and service type
  const filteredExpenses = expenses.filter(e => {
    // Apply service filter
    if (serviceFilter !== 'all') {
      if (!e.service_type || e.service_type.toLowerCase() !== serviceFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Parse expense date
    if (e.expense_date) {
      const expenseDate = new Date(e.expense_date);
      const expenseMonth = expenseDate.getMonth() + 1;
      const expenseYear = expenseDate.getFullYear().toString();
      
      if (expenseYear !== selectedYear) return false;
      if (selectedMonth === 'all') return true;
      return expenseMonth === selectedMonth;
    }
    return false;
  });

  // Calculate totals
  const calculateTotals = () => {
    const totalSalary = filteredSalaries.reduce((sum, s) => sum + s.net_amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const rajElectricalsSalary = filteredSalaries.reduce((sum, s) => {
      if (s.funding_source === 'raj_communication') {
        return sum + (s.funding_amount || 0);
      }
      return sum;
    }, 0);
    const otherFundingSalary = filteredSalaries.reduce((sum, s) => {
      if (s.funding_source && s.funding_source !== 'business_income' && s.funding_source !== 'raj_communication') {
        return sum + (s.funding_amount || 0);
      }
      return sum;
    }, 0);
    const sunOfficeSalary = totalSalary - rajElectricalsSalary - otherFundingSalary;

    return {
      totalSalary,
      totalExpenses,
      sunOfficeSalary,
      rajElectricalsSalary,
      otherFundingSalary,
      averageSalary: filteredSalaries.length > 0 ? totalSalary / filteredSalaries.length : 0,
      totalNetProfit: totalSalary - totalExpenses
    };
  };

  const totals = calculateTotals();
  const totalWaterAmount = waterPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalWaterCount = waterPayments.length;

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 3000);
  };


  const openSalaryEditDialog = (salary: Salary) => {
    setEditingSalaryRecord(salary);
    setSalaryEditForm({
      service_type: salary.service_type || 'water',
      salary_month: salary.salary_month || '',
      amount: String(salary.amount ?? ''),
      bonus: String(salary.bonus ?? 0),
      deductions: String(salary.deductions ?? 0),
      payment_method: salary.payment_method || 'bank_transfer',
      transaction_id: salary.transaction_id || '',
      funding_source: salary.funding_source || 'raj_communication',
      funding_amount: String(salary.funding_amount ?? 0),
      funding_notes: salary.funding_notes || '',
      notes: salary.notes || ''
    });
  };

  const openExpenseEditDialog = (expense: Expense) => {
    setEditingExpenseRecord(expense);
    setExpenseEditForm({
      expense_type: expense.expense_type || 'others',
      amount: String(expense.amount ?? ''),
      description: expense.description || '',
      expense_date: expense.expense_date || '',
      payment_method: expense.payment_method || 'cash',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || ''
    });
  };

  const handleSalaryUpdate = async () => {
    if (!editingSalaryRecord || !staff) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/salary.php?id=${editingSalaryRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          staff_name: staff.name,
          service_type: salaryEditForm.service_type,
          amount: parseFloat(salaryEditForm.amount || '0'),
          salary_month: salaryEditForm.salary_month,
          payment_method: salaryEditForm.payment_method,
          transaction_id: salaryEditForm.transaction_id,
          funding_source: salaryEditForm.funding_source,
          funding_amount: salaryEditForm.funding_source === 'business_income' ? 0 : parseFloat(salaryEditForm.funding_amount || '0'),
          funding_notes: salaryEditForm.funding_notes,
          bonus: parseFloat(salaryEditForm.bonus || '0'),
          deductions: parseFloat(salaryEditForm.deductions || '0'),
          notes: salaryEditForm.notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update salary');
      }

      setEditingSalaryRecord(null);
      showSnackbar('Salary updated successfully.', 'success');
      await loadStaffData();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating salary:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to update salary.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseUpdate = async () => {
    if (!editingExpenseRecord || !staff) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/expenses.php?id=${editingExpenseRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          staff_name: staff.name,
          expense_type: expenseEditForm.expense_type,
          amount: parseFloat(expenseEditForm.amount || '0'),
          description: expenseEditForm.description,
          expense_date: expenseEditForm.expense_date,
          payment_method: expenseEditForm.payment_method,
          receipt_number: expenseEditForm.receipt_number || null,
          notes: expenseEditForm.notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update expense');
      }

      setEditingExpenseRecord(null);
      showSnackbar('Expense updated successfully.', 'success');
      await loadStaffData();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating expense:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to update expense.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalary = async (salary: Salary) => {
    const confirmed = window.confirm(`Delete salary record for ${salary.staff_name} for ${formatSalaryMonth(salary.salary_month)}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/salary.php?id=${salary.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete salary');
      }

      showSnackbar('Salary deleted successfully.', 'success');
      await loadStaffData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting salary:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete salary.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const confirmed = window.confirm(`Delete expense record for ${expense.staff_name} on ${formatDate(expense.expense_date)}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/expenses.php?id=${expense.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete expense');
      }

      showSnackbar('Expense deleted successfully.', 'success');
      await loadStaffData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete expense.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!staff) return;

    let csvContent = "Staff Report\n\n";
    
    // Staff Information
    csvContent += "STAFF INFORMATION\n";
    csvContent += `Name,${staff.name}\n`;
    csvContent += `Email,${staff.email}\n`;
    csvContent += `Role,${staff.role}\n`;
    csvContent += `Phone,${staff.phone || 'N/A'}\n`;
    csvContent += `Department,${staff.department || 'N/A'}\n`;
    csvContent += `Position,${staff.position || 'N/A'}\n`;
    csvContent += `Status,${staff.is_active ? 'Active' : 'Inactive'}\n`;
    csvContent += `Joined,${staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'N/A'}\n\n`;

    // Financial Summary
    csvContent += "FINANCIAL SUMMARY\n";
    csvContent += `Total Salary,${formatCurrency(totals.totalSalary).replace(/[^0-9.,]/g, '')}\n`;
    csvContent += `Total Expenses,${formatCurrency(totals.totalExpenses).replace(/[^0-9.,]/g, '')}\n`;
    csvContent += `Net Profit,${formatCurrency(totals.totalNetProfit).replace(/[^0-9.,]/g, '')}\n`;
    csvContent += `Average Salary,${formatCurrency(totals.averageSalary).replace(/[^0-9.,]/g, '')}\n\n`;

    // Salary History
    csvContent += "SALARY HISTORY\n";
    csvContent += "Month,Service Type,Base Amount,Bonus,Deductions,Net Amount,Payment Method,Paid By\n";
    
    filteredSalaries.forEach(s => {
      const formattedMonth = formatSalaryMonth(s.salary_month);
      csvContent += `${formattedMonth},${s.service_type || 'N/A'},${s.amount},${s.bonus},${s.deductions},${s.net_amount},${s.payment_method},${s.paid_by_name}\n`;
    });

    csvContent += "\nEXPENSE HISTORY\n";
    csvContent += "Date,Service Type,Expense Type,Description,Amount,Payment Method,Created By\n";
    
    filteredExpenses.forEach(e => {
      csvContent += `${new Date(e.expense_date).toLocaleDateString()},${e.service_type || 'N/A'},${e.expense_type},${e.description || '-'},${e.amount},${e.payment_method},${e.created_by_name}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${staff.name.replace(/\s+/g, '_')}_report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showSnackbar('CSV downloaded successfully.', 'success');
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!staff) return;

    const doc = new jsPDF({
      orientation: isMobile ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const totals = calculateTotals();
    let yPos = 20;

    // Title
    doc.setFontSize(isMobile ? 20 : 24);
    doc.setTextColor(102, 126, 234);
    doc.text('Staff Report', 20, yPos);
    yPos += 15;

    // Staff Info
    doc.setFontSize(isMobile ? 12 : 14);
    doc.setTextColor(0, 0, 0);
    doc.text('Staff Information', 20, yPos);
    yPos += 10;

    doc.setFontSize(isMobile ? 8 : 10);
    const staffInfo = [
      ['Name:', staff.name],
      ['Email:', staff.email],
      ['Role:', staff.role],
      ['Phone:', staff.phone || 'N/A'],
      ['Department:', staff.department || 'N/A'],
      ['Position:', staff.position || 'N/A'],
      ['Status:', staff.is_active ? 'Active' : 'Inactive'],
      ['Joined:', staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'N/A']
    ];

    staffInfo.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value.toString(), 70, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Financial Summary
    doc.setFontSize(isMobile ? 12 : 14);
    doc.text('Financial Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(isMobile ? 8 : 10);
    const financialInfo = [
      ['Total Salary:', formatCurrency(totals.totalSalary)],
      ['Total Expenses:', formatCurrency(totals.totalExpenses)],
      ['Net Profit:', formatCurrency(totals.totalNetProfit)],
      ['Average Salary:', formatCurrency(totals.averageSalary)]
    ];

    financialInfo.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value.toString(), 70, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Salary History Table
    if (filteredSalaries.length > 0) {
      doc.setFontSize(isMobile ? 12 : 14);
      doc.text('Salary History', 20, yPos);
      yPos += 10;

      const salaryColumns = isMobile 
        ? ['Month', 'Service', 'Net']
        : ['Month', 'Service', 'Base', 'Bonus', 'Deductions', 'Net', 'Method'];
      
      const salaryRows = filteredSalaries.map(s => {
        const formattedMonth = formatSalaryMonth(s.salary_month);
        if (isMobile) {
          return [
            formattedMonth,
            s.service_type || 'N/A',
            formatCurrency(s.net_amount).replace(/[^0-9.-]/g, '')
          ];
        }
        return [
          formattedMonth,
          s.service_type || 'N/A',
          formatCurrency(s.amount).replace(/[^0-9.-]/g, ''),
          formatCurrency(s.bonus).replace(/[^0-9.-]/g, ''),
          formatCurrency(s.deductions).replace(/[^0-9.-]/g, ''),
          formatCurrency(s.net_amount).replace(/[^0-9.-]/g, ''),
          s.payment_method
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [salaryColumns],
        body: salaryRows,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: isMobile ? 6 : 8 },
        columnStyles: isMobile 
          ? {
              0: { cellWidth: 20 },
              1: { cellWidth: 15 },
              2: { cellWidth: 20, halign: 'right' }
            }
          : {
              0: { cellWidth: 25 },
              1: { cellWidth: 15 },
              2: { cellWidth: 15, halign: 'right' },
              3: { cellWidth: 15, halign: 'right' },
              4: { cellWidth: 15, halign: 'right' },
              5: { cellWidth: 15, halign: 'right' },
              6: { cellWidth: 15 }
            }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Expense History Table
    if (filteredExpenses.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(isMobile ? 12 : 14);
      doc.text('Expense History', 20, yPos);
      yPos += 10;

      const expenseColumns = isMobile 
        ? ['Date', 'Type', 'Amount']
        : ['Date', 'Service', 'Type', 'Description', 'Amount'];
      
      const expenseRows = filteredExpenses.map(e => {
        if (isMobile) {
          return [
            new Date(e.expense_date).toLocaleDateString(),
            e.expense_type,
            formatCurrency(e.amount).replace(/[^0-9.-]/g, '')
          ];
        }
        return [
          new Date(e.expense_date).toLocaleDateString(),
          e.service_type || 'N/A',
          e.expense_type,
          e.description?.substring(0, 15) || '-',
          formatCurrency(e.amount).replace(/[^0-9.-]/g, '')
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [expenseColumns],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: isMobile ? 6 : 8 },
        columnStyles: isMobile 
          ? {
              0: { cellWidth: 25 },
              1: { cellWidth: 15 },
              2: { cellWidth: 20, halign: 'right' }
            }
          : {
              0: { cellWidth: 25 },
              1: { cellWidth: 15 },
              2: { cellWidth: 15 },
              3: { cellWidth: 35 },
              4: { cellWidth: 20, halign: 'right' }
            }
      });
    }

    doc.save(`${staff.name.replace(/\s+/g, '_')}_report.pdf`);
    showSnackbar('PDF downloaded successfully.', 'success');
  };

  // Print
  const handlePrint = () => {
    if (!staff) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totals = calculateTotals();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Report - ${staff.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            margin: 0;
            background: #fff;
          }
          @media print {
            body { padding: 10px; }
          }
          @media (max-width: 768px) {
            body { padding: 15px; }
            h1 { font-size: 24px; }
            h2 { font-size: 20px; }
          }
          @media (max-width: 480px) {
            body { padding: 10px; }
            h1 { font-size: 20px; }
            h2 { font-size: 18px; }
            table { font-size: 12px; }
            .info-grid { grid-template-columns: 1fr !important; }
          }
          h1 { 
            color: #667eea; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 10px;
            margin-top: 0;
          }
          h2 { 
            color: #4a5568; 
            margin-top: 30px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            margin: 20px 0; 
          }
          .info-item { 
            border-bottom: 1px solid #e2e8f0; 
            padding: 8px 0; 
          }
          .label { 
            font-weight: bold; 
            color: #718096; 
          }
          .value { 
            float: right; 
            color: #2d3748; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 14px;
          }
          th { 
            background: #667eea; 
            color: white; 
            padding: 10px; 
            text-align: left; 
          }
          td { 
            padding: 8px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          tr:nth-child(even) { 
            background: #f7fafc; 
          }
          .summary-cards { 
            display: flex; 
            flex-wrap: wrap;
            gap: 15px; 
            margin: 30px 0; 
          }
          .card { 
            flex: 1;
            min-width: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
          }
          .card-title { 
            font-size: 14px; 
            opacity: 0.9; 
          }
          .card-value { 
            font-size: 20px; 
            font-weight: bold; 
            margin-top: 8px; 
          }
          @media (max-width: 768px) {
            .summary-cards { flex-direction: column; }
            .card { min-width: auto; }
          }
        </style>
      </head>
      <body>
        <h1>Staff Report - ${staff.name}</h1>
        
        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Total Salary</div>
            <div class="card-value">${formatCurrency(totals.totalSalary)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses</div>
            <div class="card-value">${formatCurrency(totals.totalExpenses)}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Profit</div>
            <div class="card-value">${formatCurrency(totals.totalNetProfit)}</div>
          </div>
        </div>

        <h2>Staff Information</h2>
        <div class="info-grid">
          <div class="info-item"><span class="label">Name:</span> <span class="value">${staff.name}</span></div>
          <div class="info-item"><span class="label">Email:</span> <span class="value">${staff.email}</span></div>
          <div class="info-item"><span class="label">Role:</span> <span class="value">${staff.role}</span></div>
          <div class="info-item"><span class="label">Phone:</span> <span class="value">${staff.phone || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Department:</span> <span class="value">${staff.department || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Position:</span> <span class="value">${staff.position || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Status:</span> <span class="value">${staff.is_active ? 'Active' : 'Inactive'}</span></div>
          <div class="info-item"><span class="label">Joined:</span> <span class="value">${staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'N/A'}</span></div>
        </div>

        <h2>Salary History</h2>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Service</th>
                <th>Base</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSalaries.map(s => {
                const formattedMonth = formatSalaryMonth(s.salary_month);
                return `
                  <tr>
                    <td>${formattedMonth}</td>
                    <td>${s.service_type || 'N/A'}</td>
                    <td>${formatCurrency(s.amount)}</td>
                    <td>${formatCurrency(s.bonus)}</td>
                    <td>${formatCurrency(s.deductions)}</td>
                    <td><strong>${formatCurrency(s.net_amount)}</strong></td>
                    <td>${s.payment_method}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <h2>Expense History</h2>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${new Date(e.expense_date).toLocaleDateString()}</td>
                  <td>${e.service_type || 'N/A'}</td>
                  <td>${e.expense_type}</td>
                  <td>${e.description || '-'}</td>
                  <td>${formatCurrency(e.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    showSnackbar('Print dialog opened.', 'info');
  };

  if (!staff) return null;

  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths();

  // Get role color
  const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'success' | 'primary' | 'secondary' => {
    switch(role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'technician': return 'info';
      case 'staff': return 'success';
      case 'sales': return 'primary';
      default: return 'secondary';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'admin': return <BadgeIcon />;
      case 'manager': return <WorkIcon />;
      case 'technician': return <BuildIcon />;
      case 'staff': return <PersonIcon />;
      case 'sales': return <MoneyIcon />;
      default: return <PersonIcon />;
    }
  };

  // Get expense type icon
  const getExpenseTypeIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'petrol': return '⛽';
      case 'food': return '🍔';
      case 'travel': return '🚗';
      case 'tools': return '🔧';
      case 'maintenance': return '🔨';
      case 'uniform': return '👕';
      case 'training': return '📚';
      case 'communication': return '📱';
      default: return '📝';
    }
  };

  // Get service type icon
  const getServiceTypeIcon = (serviceType: string) => {
    switch(serviceType?.toLowerCase()) {
      case 'water': return <WaterDropIcon sx={{ color: '#1976d2', fontSize: isMobile ? 14 : 18 }} />;
      case 'inverter': return <BoltIcon sx={{ color: '#f57c00', fontSize: isMobile ? 14 : 18 }} />;
      default: return null;
    }
  };

  const years = availableYears.length > 0 ? availableYears : Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = availableMonths.length > 0 ? availableMonths : Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      transitionDuration={500}
    >
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: snackbarType === 'success' ? '#10b981' : snackbarType === 'error' ? '#ef4444' : '#3b82f6',
            borderRadius: 2,
            fontWeight: 600,
            fontSize: isMobile ? '0.85rem' : '0.9rem'
          }
        }}
      />

      {/* Gradient Header */}
      <GradientHeader>
        <Box 
          display="flex" 
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent="space-between" 
          alignItems={isMobile ? 'flex-start' : 'center'}
          gap={isMobile ? 2 : 0}
          position="relative" 
          zIndex={2}
        >
          <Box display="flex" alignItems="center" gap={isMobile ? 2 : 3} flexWrap={isMobile ? 'wrap' : 'nowrap'}>
            <AnimatedAvatar
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              src={staff.avatar}
            >
              {staff.name?.charAt(0).toUpperCase()}
            </AnimatedAvatar>
            
            <Box>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Typography 
                  variant={isMobile ? "h5" : isTablet ? "h4" : "h3"} 
                  fontWeight="800" 
                  letterSpacing="-0.02em"
                >
                  {staff.name}
                </Typography>
              </motion.div>
              
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Box 
                  display="flex" 
                  alignItems="center" 
                  gap={isMobile ? 0.5 : 1.5} 
                  mt={1}
                  flexWrap="wrap"
                >
                  <Chip
                    icon={getRoleIcon(staff.role)}
                    label={staff.role}
                    color={getRoleColor(staff.role)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      fontWeight: 600,
                      px: isMobile ? 0.5 : 1,
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                  />
                  
                  <Chip
                    icon={staff.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                    label={staff.is_active ? 'Active' : 'Inactive'}
                    color={staff.is_active ? 'success' : 'error'}
                    size={isMobile ? "small" : "medium"}
                    variant="outlined"
                    sx={{ 
                      fontWeight: 600,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  
                  {staff.department && (
                    <Chip
                      icon={<BusinessIcon />}
                      label={staff.department}
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  )}
                </Box>
              </motion.div>
            </Box>
          </Box>

          <Box 
            display="flex" 
            gap={isMobile ? 0.5 : 1} 
            alignSelf={isMobile ? 'flex-end' : 'center'}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Tooltip title="Refresh" arrow>
              <IconButton
                onClick={handleRefresh}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'rotate(180deg)'
                  },
                  transition: 'all 0.5s ease',
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36
                }}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                <RefreshIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download CSV" arrow>
              <IconButton
                onClick={handleDownloadCSV}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)'
                  },
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36
                }}
                size={isMobile ? "small" : "medium"}
              >
                <CsvIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download PDF" arrow>
              <IconButton
                onClick={handleDownloadPDF}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)'
                  },
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36
                }}
                size={isMobile ? "small" : "medium"}
              >
                <PdfIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print" arrow>
              <IconButton
                onClick={handlePrint}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)'
                  },
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36
                }}
                size={isMobile ? "small" : "medium"}
              >
                <PrintIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            {onEdit && (
              <Tooltip title="Edit Profile" arrow>
                <IconButton
                  onClick={onEdit}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      transform: 'scale(1.1)'
                    },
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36
                  }}
                  size={isMobile ? "small" : "medium"}
                >
                  <EditIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Close" arrow>
              <IconButton
                onClick={onClose}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'rotate(90deg)'
                  },
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36
                }}
                size={isMobile ? "small" : "medium"}
              >
                <CloseIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </GradientHeader>

      <DialogContent sx={{ 
        p: isMobile ? 2 : isTablet ? 3 : 4, 
        bgcolor: '#f8fafc',
        overflowY: 'auto',
        maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(90vh - 140px)'
      }}>
        {(onAddSalary || onAddExpense || onEdit || onDelete) && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              mb: isMobile ? 2 : 3,
            }}
          >
            {onAddSalary && (
              <Button
                variant="contained"
                startIcon={<AttachMoneyIcon />}
                onClick={onAddSalary}
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Add Salary
              </Button>
            )}
            {onAddExpense && (
              <Button
                variant="contained"
                startIcon={<ReceiptLongIcon />}
                onClick={onAddExpense}
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#f59e0b',
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                Add Expense
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                Edit Staff
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                Delete Staff
              </Button>
            )}
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Fade in={loading}>
            <Box sx={{ mb: isMobile ? 2 : 4 }}>
              <LinearProgress 
                sx={{ 
                  height: isMobile ? 6 : 8, 
                  borderRadius: 4,
                  bgcolor: alpha('#667eea', 0.1),
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  }
                }} 
              />
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center" 
                sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
              >
                <CircularProgress size={16} sx={{ color: '#667eea' }} />
                Loading staff financial data...
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  mb: isMobile ? 2 : 4, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': { fontSize: isMobile ? 20 : 24 }
                }}
                action={
                  <Button color="inherit" size={isMobile ? "small" : "medium"} onClick={handleRefresh}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Information Cards */}
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 2 : 4 }}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <InfoCard>
                <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 2 : 3}>
                  <Avatar sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                    <EmailIcon fontSize={isMobile ? "small" : "medium"} />
                  </Avatar>
                  <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="700">
                    Contact Info
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={isMobile ? 1.5 : 2.5}>
                  <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                    <Avatar sx={{ bgcolor: alpha('#667eea', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                      <EmailIcon sx={{ color: '#667eea', fontSize: isMobile ? 14 : 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Email Address
                      </Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ wordBreak: 'break-all' }}>
                        {staff.email}
                      </Typography>
                    </Box>
                  </Box>

                  {staff.phone && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <PhoneIcon sx={{ color: '#f59e0b', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {staff.phone}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.emergency_contact && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#ef4444', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <PhoneIcon sx={{ color: '#ef4444', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Emergency Contact
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {staff.emergency_contact}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.address && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#10b981', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <LocationIcon sx={{ color: '#10b981', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Address
                        </Typography>
                        <Typography variant="body2">
                          {staff.address}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </InfoCard>
            </motion.div>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <InfoCard>
                <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 2 : 3}>
                  <Avatar sx={{ bgcolor: alpha('#764ba2', 0.1), color: '#764ba2', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                    <PersonIcon fontSize={isMobile ? "small" : "medium"} />
                  </Avatar>
                  <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="700">
                    Personal Info
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={isMobile ? 1.5 : 2.5}>
                  {staff.date_of_birth && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#ec4899', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <EventIcon sx={{ color: '#ec4899', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {new Date(staff.date_of_birth).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.blood_group && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#ef4444', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <FavoriteIcon sx={{ color: '#ef4444', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Blood Group
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {staff.blood_group}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.aadhar_number && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <BadgeIcon sx={{ color: '#3b82f6', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Aadhar Number
                        </Typography>
                        <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                          •••• {staff.aadhar_number.slice(-4)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.pan_number && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <ReceiptIcon sx={{ color: '#f59e0b', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          PAN Number
                        </Typography>
                        <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                          {staff.pan_number}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </InfoCard>
            </motion.div>
          </Grid>

          {/* Work Information */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InfoCard>
                <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 2 : 3}>
                  <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                    <WorkIcon fontSize={isMobile ? "small" : "medium"} />
                  </Avatar>
                  <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="700">
                    Work Info
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={isMobile ? 1.5 : 2.5}>
                  {staff.joining_date && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#10b981', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <CalendarTodayIcon sx={{ color: '#10b981', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Joining Date
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {new Date(staff.joining_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.position && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <AssignmentIcon sx={{ color: '#8b5cf6', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Position
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {staff.position}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {staff.salary && (
                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                      <Avatar sx={{ bgcolor: alpha('#10b981', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                        <MoneyIcon sx={{ color: '#10b981', fontSize: isMobile ? 14 : 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Base Salary
                        </Typography>
                        <Typography variant="body2" fontWeight="600" color="#10b981">
                          {formatCurrency(staff.salary)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                    <Avatar sx={{ bgcolor: alpha('#667eea', 0.05), width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }}>
                      <AccessTimeIcon sx={{ color: '#667eea', fontSize: isMobile ? 14 : 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Last Login
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {formatDate(staff.last_login)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </InfoCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Bank Information */}
        {(staff.bank_account || staff.ifsc_code || staff.pan_number) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InfoCard sx={{ mb: isMobile ? 2 : 4 }}>
              <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 2 : 3}>
                <Avatar sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                  <AccountBalanceWalletIcon fontSize={isMobile ? "small" : "medium"} />
                </Avatar>
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="700">
                  Bank Details
                </Typography>
              </Box>

              <Grid container spacing={isMobile ? 1.5 : 2}>
                {staff.bank_account && (
                  <Grid item xs={12} md={4}>
                    <Box p={isMobile ? 1.5 : 2} bgcolor={alpha('#667eea', 0.02)} borderRadius={2}>
                      <Typography variant="caption" color="textSecondary">
                        Account Number
                      </Typography>
                      <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                        •••• {staff.bank_account.slice(-4)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {staff.ifsc_code && (
                  <Grid item xs={12} md={4}>
                    <Box p={isMobile ? 1.5 : 2} bgcolor={alpha('#667eea', 0.02)} borderRadius={2}>
                      <Typography variant="caption" color="textSecondary">
                        IFSC Code
                      </Typography>
                      <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                        {staff.ifsc_code}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {staff.pan_number && (
                  <Grid item xs={12} md={4}>
                    <Box p={isMobile ? 1.5 : 2} bgcolor={alpha('#667eea', 0.02)} borderRadius={2}>
                      <Typography variant="caption" color="textSecondary">
                        PAN Number
                      </Typography>
                      <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                        {staff.pan_number}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </InfoCard>
          </motion.div>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: isMobile ? 2 : 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <StatCard>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="caption" fontWeight="600" gutterBottom>
                        Total Salary
                      </Typography>
                      <AnimatedNumber sx={{ color: '#10b981' }} fontWeight="800">
                        {formatCurrency(totals.totalSalary)}
                      </AnimatedNumber>
                      <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                        {filteredSalaries.length} payments
                      </Typography>
                      <Typography variant="caption" display="block" mt={0.75} sx={{ color: '#0f766e', fontWeight: 600 }}>
                        Sun Water Service: {formatCurrency(totals.sunOfficeSalary)}
                        {totals.rajElectricalsSalary > 0 ? ' +' : ''}
                      </Typography>
                      {totals.rajElectricalsSalary > 0 && (
                        <Typography variant="caption" display="block" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                          Raj Electricals: {formatCurrency(totals.rajElectricalsSalary)}
                        </Typography>
                      )}
                      {totals.otherFundingSalary > 0 && (
                        <Typography variant="caption" display="block" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                          Other Support: {formatCurrency(totals.otherFundingSalary)}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" sx={{ color: '#111827', fontWeight: 700 }}>
                        Total: {formatCurrency(totals.totalSalary)}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}>
                      <MoneyIcon sx={{ fontSize: isMobile ? 20 : 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <StatCard>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="caption" fontWeight="600" gutterBottom>
                        Total Expenses
                      </Typography>
                      <AnimatedNumber sx={{ color: '#f59e0b' }} fontWeight="800">
                        {formatCurrency(totals.totalExpenses)}
                      </AnimatedNumber>
                      <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                        {filteredExpenses.length} transactions
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}>
                      <ReceiptIcon sx={{ fontSize: isMobile ? 20 : 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <StatCard>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="caption" fontWeight="600" gutterBottom>
                        Net Profit
                      </Typography>
                      <AnimatedNumber 
                        sx={{ 
                          color: totals.totalNetProfit >= 0 ? '#10b981' : '#ef4444',
                          fontWeight: '800'
                        }}
                      >
                        {formatCurrency(totals.totalNetProfit)}
                      </AnimatedNumber>
                      <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                        Total balance
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}>
                      <TrendingUpIcon sx={{ fontSize: isMobile ? 20 : 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <StatCard>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="caption" fontWeight="600" gutterBottom>
                        Average Salary
                      </Typography>
                      <AnimatedNumber sx={{ color: '#3b82f6' }} fontWeight="800">
                        {formatCurrency(totals.averageSalary)}
                      </AnimatedNumber>
                      <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                        Per payment
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}>
                      <BarChartIcon sx={{ fontSize: isMobile ? 20 : 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Service Type Filter and Date Selector */}
        <Box sx={{ 
          mb: isMobile ? 2 : 3, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 2 : 0
        }}>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={isMobile ? 1 : 2}
            flexDirection={isMobile ? 'column' : 'row'}
          >
            <Typography variant="subtitle1" fontWeight="700" color="textSecondary">
              Filter by Service:
            </Typography>
            <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1, flexWrap: 'wrap' }}>
              {(['all', 'water', 'inverter'] as const).map((filter) => (
                <Chip
                  key={filter}
                  label={filter === 'all' ? 'All Services' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  onClick={() => setServiceFilter(filter)}
                  color={serviceFilter === filter ? 'primary' : 'default'}
                  icon={filter === 'water' ? <WaterDropIcon /> : filter === 'inverter' ? <BoltIcon /> : undefined}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 5px 15px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box 
            display="flex" 
            gap={isMobile ? 1 : 1.5}
            flexDirection={isMobile ? 'row' : 'row'}
            width={isMobile ? '100%' : 'auto'}
          >
            <FormControl size="small" sx={{ flex: isMobile ? 1 : 'none', minWidth: isMobile ? 'auto' : 100 }}>
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Year"
                sx={{ borderRadius: 2 }}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: isMobile ? 1 : 'none', minWidth: isMobile ? 'auto' : 120 }}>
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                label="Month"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Months</MenuItem>
                {months.map((month) => (
                  <MenuItem key={month} value={month}>{getMonthName(month)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ borderRadius: isMobile ? 2 : 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              bgcolor: 'white',
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                height: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          >
            <StyledTab
              icon={<MoneyIcon sx={{ fontSize: isMobile ? 16 : 20 }} />}
              iconPosition="start"
              label={isMobile ? "Salary" : "Salary History"}
            />
            <StyledTab
              icon={<ReceiptIcon sx={{ fontSize: isMobile ? 16 : 20 }} />}
              iconPosition="start"
              label={isMobile ? "Expenses" : "Expense History"}
            />
            <StyledTab
              icon={<WaterDropIcon sx={{ fontSize: isMobile ? 16 : 20 }} />}
              iconPosition="start"
              label={isMobile ? "Water" : "Water Payments"}
            />
          </Tabs>

          {/* Salary History Tab */}
          <Box sx={{ p: isMobile ? 1.5 : 3 }}>
            {tabValue === 0 && (
              <Fade in={tabValue === 0} timeout={500}>
                <div>
                  {loading ? (
                    <Box sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
                      <CircularProgress size={isMobile ? 36 : 48} sx={{ color: '#667eea' }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Loading salary history...
                      </Typography>
                    </Box>
                  ) : filteredSalaries.length === 0 ? (
                    <Box sx={{ p: isMobile ? 4 : 6, textAlign: 'center' }}>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Avatar sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea', width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, margin: '0 auto 16px' }}>
                          <MoneyIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
                        </Avatar>
                      </motion.div>
                      <Typography variant={isMobile ? "body1" : "h6"} color="textSecondary" gutterBottom>
                        No salary records found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {serviceFilter !== 'all' 
                          ? `No ${serviceFilter} service salary records found for ${getSelectedMonthLabel()} ${selectedYear}`
                          : `No salary records found for ${getSelectedMonthLabel()} ${selectedYear}`}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: isMobile ? 300 : 400, borderRadius: 2 }}>
                      <Table stickyHeader size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            {!isMobile && <StyledTableCell className="header">Service</StyledTableCell>}
                            <StyledTableCell className="header">Month</StyledTableCell>
                            {!isMobile && (
                              <>
                                <StyledTableCell className="header" align="right">Base</StyledTableCell>
                                <StyledTableCell className="header" align="right">Bonus</StyledTableCell>
                                <StyledTableCell className="header" align="right">Deductions</StyledTableCell>
                              </>
                            )}
                            <StyledTableCell className="header" align="right">Net</StyledTableCell>
                            {!isMobile && <StyledTableCell className="header" align="right">Sun Water Service</StyledTableCell>}
                            <StyledTableCell className="header">Method</StyledTableCell>
                            {!isMobile && (
                              <>
                                <StyledTableCell className="header">Transaction ID</StyledTableCell>
                                <StyledTableCell className="header">Paid By</StyledTableCell>
                                <StyledTableCell className="header">Funding Notes</StyledTableCell>
                                <StyledTableCell className="header">Payment Notes</StyledTableCell>
                                <StyledTableCell className="header">Paid At</StyledTableCell>
                              </>
                            )}
                            <StyledTableCell className="header" align="center">Actions</StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSalaries.map((salary, index) => {
                            const formattedMonth = formatSalaryMonth(getSalaryMonthKey(salary));
                            const rajElectricalsAmount = salary.funding_source === 'raj_communication' ? (salary.funding_amount || 0) : 0;
                            const sunWaterServiceAmount = salary.net_amount - rajElectricalsAmount;
                            return (
                              <TableRow
                                key={salary.id}
                                hover
                                sx={{
                                  animation: `slideIn 0.3s ease ${index * 0.05}s`,
                                  '@keyframes slideIn': {
                                    '0%': { opacity: 0, transform: 'translateX(-20px)' },
                                    '100%': { opacity: 1, transform: 'translateX(0)' }
                                  }
                                }}
                              >
                                {!isMobile && (
                                  <TableCell>
                                    <ServiceBadge type={salary.service_type}>
                                      {getServiceTypeIcon(salary.service_type)}
                                      <span style={{ textTransform: 'capitalize' }}>
                                        {salary.service_type}
                                      </span>
                                    </ServiceBadge>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <CalendarTodayIcon sx={{ color: '#9CA3AF', fontSize: isMobile ? 12 : 14 }} />
                                    <Typography variant="body2" fontWeight="500">
                                      {formattedMonth}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                {!isMobile && (
                                  <>
                                    <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                      {formatCurrency(salary.amount)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                                      +{formatCurrency(salary.bonus)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                                      -{formatCurrency(salary.deductions)}
                                    </TableCell>
                                  </>
                                )}
                                <TableCell align="right">
                                  <Typography 
                                    fontWeight="800" 
                                    sx={{ 
                                      color: salary.net_amount >= 0 ? '#10b981' : '#ef4444',
                                      fontSize: isMobile ? '0.85rem' : '1rem'
                                    }}
                                  >
                                    {formatCurrency(salary.net_amount)}
                                  </Typography>
                                </TableCell>
                                {!isMobile && (
                                  <TableCell align="right">
                                    <Typography
                                      fontWeight="700"
                                      sx={{
                                        color: '#0f766e',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {formatCurrency(sunWaterServiceAmount)}
                                    </Typography>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Box display="flex" gap={0.75} flexWrap="wrap">
                                    <Chip
                                      label={salary.payment_method.replace(/_/g, ' ').toUpperCase()}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontWeight: 600,
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        fontSize: isMobile ? '0.65rem' : '0.7rem'
                                      }}
                                    />
                                    <Chip
                                      label={formatFundingSource(salary.funding_source)}
                                      size="small"
                                      sx={{
                                        fontWeight: 600,
                                        backgroundColor: salary.funding_source === 'raj_communication' ? '#fee2e2' : '#e0f2fe',
                                        color: salary.funding_source === 'raj_communication' ? '#b91c1c' : '#0369a1',
                                        fontSize: isMobile ? '0.65rem' : '0.7rem'
                                      }}
                                    />
                                    {(salary.funding_amount || 0) > 0 && (
                                      <Chip
                                        label={`Funded ${formatCurrency(salary.funding_amount || 0)}`}
                                        size="small"
                                        sx={{
                                          fontWeight: 600,
                                          backgroundColor: '#fef3c7',
                                          color: '#92400e',
                                          fontSize: isMobile ? '0.65rem' : '0.7rem'
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {isMobile && (
                                    <Box sx={{ mt: 1, display: 'grid', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700 }}>
                                        Sun Water Service: {formatCurrency(sunWaterServiceAmount)}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 600 }}>
                                        TXN: {salary.transaction_id || '-'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#4b5563' }}>
                                        Paid By: {salary.paid_by_name || '-'}
                                      </Typography>
                                      {salary.funding_notes && (
                                        <Typography variant="caption" sx={{ color: '#92400e' }}>
                                          Funding: {salary.funding_notes}
                                        </Typography>
                                      )}
                                      {salary.notes && (
                                        <Typography variant="caption" sx={{ color: '#4338ca' }}>
                                          Notes: {salary.notes}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </TableCell>
                                {!isMobile && (
                                  <>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        fontWeight="600"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                      >
                                        {salary.transaction_id || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="500">
                                        {salary.paid_by_name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        sx={{ color: salary.funding_notes ? '#92400e' : '#9CA3AF', maxWidth: 180 }}
                                      >
                                        {salary.funding_notes || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        sx={{ color: salary.notes ? '#4338ca' : '#9CA3AF', maxWidth: 180 }}
                                      >
                                        {salary.notes || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                        {formatDate(salary.paid_at)}
                                      </Typography>
                                    </TableCell>
                                  </>
                                )}
                                <TableCell align="center">
                                  <Box display="flex" justifyContent="center" gap={1}>
                                    <Tooltip title="Edit Salary" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => onEditSalary ? onEditSalary(salary) : openSalaryEditDialog(salary)}
                                        sx={{
                                          color: '#2563eb',
                                          bgcolor: alpha('#2563eb', 0.08),
                                          '&:hover': {
                                            bgcolor: alpha('#2563eb', 0.16)
                                          }
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Salary" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteSalary(salary)}
                                        sx={{
                                          color: '#dc2626',
                                          bgcolor: alpha('#dc2626', 0.08),
                                          '&:hover': {
                                            bgcolor: alpha('#dc2626', 0.16)
                                          }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>
              </Fade>
            )}

            {/* Expense History Tab */}
            {tabValue === 1 && (
              <Fade in={tabValue === 1} timeout={500}>
                <div>
                  {loading ? (
                    <Box sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
                      <CircularProgress size={isMobile ? 36 : 48} sx={{ color: '#f59e0b' }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Loading expense history...
                      </Typography>
                    </Box>
                  ) : filteredExpenses.length === 0 ? (
                    <Box sx={{ p: isMobile ? 4 : 6, textAlign: 'center' }}>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, margin: '0 auto 16px' }}>
                          <ReceiptIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
                        </Avatar>
                      </motion.div>
                      <Typography variant={isMobile ? "body1" : "h6"} color="textSecondary" gutterBottom>
                        No expense records found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {serviceFilter !== 'all' 
                          ? `No ${serviceFilter} service expense records found for ${getSelectedMonthLabel()} ${selectedYear}`
                          : `No expense records found for ${getSelectedMonthLabel()} ${selectedYear}`}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: isMobile ? 300 : 400, borderRadius: 2 }}>
                      <Table stickyHeader size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            {!isMobile && <StyledTableCell className="header">Service</StyledTableCell>}
                            <StyledTableCell className="header">Date</StyledTableCell>
                            <StyledTableCell className="header">Type</StyledTableCell>
                            {!isMobile && <StyledTableCell className="header">Description</StyledTableCell>}
                            <StyledTableCell className="header" align="right">Amount</StyledTableCell>
                            {!isMobile && <StyledTableCell className="header">Notes</StyledTableCell>}
                            <StyledTableCell className="header" align="center">Actions</StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredExpenses.map((expense, index) => (
                            <TableRow
                              key={expense.id}
                              hover
                              sx={{
                                animation: `slideIn 0.3s ease ${index * 0.05}s`,
                                '@keyframes slideIn': {
                                  '0%': { opacity: 0, transform: 'translateX(-20px)' },
                                  '100%': { opacity: 1, transform: 'translateX(0)' }
                                }
                              }}
                            >
                              {!isMobile && (
                                <TableCell>
                                  <ServiceBadge type={expense.service_type}>
                                    {getServiceTypeIcon(expense.service_type)}
                                    <span style={{ textTransform: 'capitalize' }}>
                                      {expense.service_type}
                                    </span>
                                  </ServiceBadge>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <EventIcon sx={{ color: '#9CA3AF', fontSize: isMobile ? 12 : 14 }} />
                                  <Typography variant="body2">
                                    {formatDate(expense.expense_date)}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${getExpenseTypeIcon(expense.expense_type)} ${expense.expense_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 500, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                                />
                              </TableCell>
                              {!isMobile && (
                                <TableCell>
                                  {expense.description || '-'}
                                </TableCell>
                              )}
                              <TableCell align="right">
                                <Typography fontWeight="700" color="#f59e0b" sx={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                                  {formatCurrency(expense.amount)}
                                </Typography>
                              </TableCell>
                              {!isMobile && (
                                <TableCell>
                                  <Tooltip title={expense.notes || 'No notes'}>
                                    <DescriptionIcon 
                                      sx={{ 
                                        color: expense.notes ? '#f59e0b' : '#E5E7EB', 
                                        fontSize: 16,
                                        cursor: 'help'
                                      }} 
                                    />
                                  </Tooltip>
                                </TableCell>
                              )}
                              <TableCell align="center">
                                <Box display="flex" justifyContent="center" gap={1}>
                                  <Tooltip title="Edit Expense" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => onEditExpense ? onEditExpense(expense) : openExpenseEditDialog(expense)}
                                      sx={{
                                        color: '#ea580c',
                                        bgcolor: alpha('#ea580c', 0.08),
                                        '&:hover': {
                                          bgcolor: alpha('#ea580c', 0.16)
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Expense" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteExpense(expense)}
                                      sx={{
                                        color: '#dc2626',
                                        bgcolor: alpha('#dc2626', 0.08),
                                        '&:hover': {
                                          bgcolor: alpha('#dc2626', 0.16)
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>
              </Fade>
            )}

            {/* Water Payments Tab */}
            {tabValue === 2 && (
              <Fade in={tabValue === 2} timeout={500}>
                <div>
                  {waterLoading ? (
                    <Box sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
                      <CircularProgress size={isMobile ? 36 : 48} sx={{ color: '#1976d2' }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Loading water payment history...
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
                        gap: 2,
                        mb: 2
                      }}>
                        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: alpha('#1976d2', 0.2) }}>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">Month Service Count</Typography>
                            <Typography variant="h6" fontWeight={700} color="#1976d2">{totalWaterCount}</Typography>
                          </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: alpha('#10b981', 0.2) }}>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">Month Total Amount</Typography>
                            <Typography variant="h6" fontWeight={700} color="#10b981">{formatCurrency(totalWaterAmount)}</Typography>
                          </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: alpha('#7c3aed', 0.2) }}>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">Year Service Count</Typography>
                            <Typography variant="h6" fontWeight={700} color="#7c3aed">{waterYearlyCount}</Typography>
                          </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: alpha('#ea580c', 0.2) }}>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">Year Total Amount</Typography>
                            <Typography variant="h6" fontWeight={700} color="#ea580c">{formatCurrency(waterYearlyTotal)}</Typography>
                          </CardContent>
                        </Card>
                      </Box>

                      {waterPayments.length === 0 ? (
                        <Box sx={{ p: isMobile ? 4 : 6, textAlign: 'center' }}>
                          <Avatar sx={{ bgcolor: alpha('#1976d2', 0.1), color: '#1976d2', width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, margin: '0 auto 16px' }}>
                            <WaterDropIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
                          </Avatar>
                          <Typography variant={isMobile ? "body1" : "h6"} color="textSecondary" gutterBottom>
                            No water payment records found
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            No water payment records for {getSelectedMonthLabel()} {selectedYear}
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer sx={{ maxHeight: isMobile ? 300 : 420, borderRadius: 2 }}>
                          <Table stickyHeader size={isMobile ? "small" : "medium"}>
                            <TableHead>
                              <TableRow>
                                <StyledTableCell className="header">Date</StyledTableCell>
                                <StyledTableCell className="header">Service</StyledTableCell>
                                {!isMobile && <StyledTableCell className="header">Customer</StyledTableCell>}
                                <StyledTableCell className="header" align="right">Amount</StyledTableCell>
                                {!isMobile && <StyledTableCell className="header">Notes</StyledTableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {waterPayments.map((payment, index) => (
                                <TableRow
                                  key={payment.id}
                                  hover
                                  sx={{
                                    animation: `slideIn 0.3s ease ${index * 0.05}s`,
                                    '@keyframes slideIn': {
                                      '0%': { opacity: 0, transform: 'translateX(-20px)' },
                                      '100%': { opacity: 1, transform: 'translateX(0)' }
                                    }
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body2">{formatDate(payment.service_date)}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="600">
                                      {payment.service_code || `#${payment.service_id}`}
                                    </Typography>
                                  </TableCell>
                                  {!isMobile && (
                                    <TableCell>
                                      <Typography variant="body2">{payment.customer_name || '-'}</Typography>
                                    </TableCell>
                                  )}
                                  <TableCell align="right">
                                    <Typography fontWeight="700" color="#10b981" sx={{ fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                                      {formatCurrency(payment.amount)}
                                    </Typography>
                                  </TableCell>
                                  {!isMobile && (
                                    <TableCell>
                                      <Tooltip title={payment.notes || 'No notes'}>
                                        <DescriptionIcon
                                          sx={{
                                            color: payment.notes ? '#1976d2' : '#E5E7EB',
                                            fontSize: 16,
                                            cursor: 'help'
                                          }}
                                        />
                                      </Tooltip>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </>
                  )}
                </div>
              </Fade>
            )}
          </Box>
        </Paper>
      </DialogContent>

      <Dialog open={!!editingSalaryRecord} onClose={() => setEditingSalaryRecord(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Edit Salary</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">Service</Typography>
              <select value={salaryEditForm.service_type} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, service_type: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option value="water">Water</option>
                <option value="inverter">Inverter</option>
                <option value="both">Both</option>
              </select>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Salary Month</Typography>
              <input type="month" value={salaryEditForm.salary_month} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, salary_month: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Amount</Typography>
              <input type="number" value={salaryEditForm.amount} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, amount: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Bonus</Typography>
              <input type="number" value={salaryEditForm.bonus} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, bonus: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Deductions</Typography>
              <input type="number" value={salaryEditForm.deductions} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, deductions: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Payment Method</Typography>
              <select value={salaryEditForm.payment_method} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, payment_method: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Transaction ID</Typography>
              <input type="text" value={salaryEditForm.transaction_id} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, transaction_id: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Amount Source</Typography>
              <select value={salaryEditForm.funding_source} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, funding_source: e.target.value, funding_amount: e.target.value === 'business_income' ? '0' : salaryEditForm.funding_amount })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option value="raj_communication">Raj Electricals</option>
                <option value="business_income">Sun Water Service</option>
                <option value="owner_cash">Owner Cash</option>
                <option value="other_borrowing">Other Borrowing</option>
              </select>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Support Amount</Typography>
              <input type="number" value={salaryEditForm.funding_amount} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, funding_amount: e.target.value })} disabled={salaryEditForm.funding_source === 'business_income'} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: salaryEditForm.funding_source === 'business_income' ? '#f9fafb' : '#fff' }} />
            </Box>
            <Box sx={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <Typography variant="caption" color="textSecondary">Funding Notes</Typography>
              <textarea value={salaryEditForm.funding_notes} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, funding_notes: e.target.value })} rows={2} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }} />
            </Box>
            <Box sx={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <Typography variant="caption" color="textSecondary">Notes</Typography>
              <textarea value={salaryEditForm.notes} onChange={(e) => setSalaryEditForm({ ...salaryEditForm, notes: e.target.value })} rows={3} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
            <Button variant="outlined" onClick={() => setEditingSalaryRecord(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSalaryUpdate} sx={{ bgcolor: '#2563eb' }}>Update Salary</Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExpenseRecord} onClose={() => setEditingExpenseRecord(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Edit Expense</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">Expense Type</Typography>
              <input type="text" value={expenseEditForm.expense_type} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, expense_type: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Amount</Typography>
              <input type="number" value={expenseEditForm.amount} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, amount: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Expense Date</Typography>
              <input type="date" value={expenseEditForm.expense_date} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, expense_date: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Payment Method</Typography>
              <select value={expenseEditForm.payment_method} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, payment_method: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Description</Typography>
              <textarea value={expenseEditForm.description} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, description: e.target.value })} rows={2} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Receipt Number</Typography>
              <input type="text" value={expenseEditForm.receipt_number} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, receipt_number: e.target.value })} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Notes</Typography>
              <textarea value={expenseEditForm.notes} onChange={(e) => setExpenseEditForm({ ...expenseEditForm, notes: e.target.value })} rows={3} style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
            <Button variant="outlined" onClick={() => setEditingExpenseRecord(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleExpenseUpdate} sx={{ bgcolor: '#ea580c' }}>Update Expense</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </GlassDialog>
  );
};

export default StaffDetailModal;
