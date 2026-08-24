import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPhone,
  FiPhoneCall,
  FiMapPin,
  FiMail,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiX,
  FiHome,
  FiMessageCircle,
  FiTrendingUp,
  FiUsers,
  FiActivity,
  FiPieChart,
  FiDownload,
  FiPrinter,
  FiCheckSquare,
  FiSquare,
  FiAward
} from "react-icons/fi";
import "./css/PendingCallsTab.css";

// Add jsPDF and autoTable for PDF generation
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL as DEFAULT_API_BASE_URL } from "../config/api";

interface WaterService {
  id: number;
  service_id: number;
  service_code: string;
  amount: number;
  service_date: string;
  notes: string;
}

interface ActiveService {
  service_code: string;
  battery_model: string;
  created_date: string;
}

interface ActiveServices {
  count: number;
  list: ActiveService[];
}

interface WaterServiceStatus {
  has_service_this_month: boolean;
  current_month: string;
  last_service: WaterService | null;
  days_since_last_service: number | null;
  pending_status: string;
}

interface PendingCall {
  id: number;
  customer_code: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  active_services: ActiveServices;
  water_service_status: WaterServiceStatus;
  priority: string;
}

interface PendingCallsResponse {
  success: boolean;
  city: string;
  current_month: string;
  total_pending_calls: number;
  pending_calls: PendingCall[];
  message: string;
}

const normalizePendingCall = (call: Partial<PendingCall>): PendingCall => ({
  id: Number(call.id || 0),
  customer_code: call.customer_code || "",
  full_name: call.full_name || "",
  email: call.email || "",
  phone: call.phone || "",
  address: call.address || "",
  city: call.city || "",
  state: call.state || "",
  zip_code: call.zip_code || "",
  notes: call.notes ?? null,
  created_at: call.created_at || "",
  updated_at: call.updated_at || "",
  active_services: {
    count: Number(call.active_services?.count || 0),
    list: Array.isArray(call.active_services?.list) ? call.active_services.list : []
  },
  water_service_status: {
    has_service_this_month: Boolean(call.water_service_status?.has_service_this_month),
    current_month: call.water_service_status?.current_month || "",
    last_service: call.water_service_status?.last_service || null,
    days_since_last_service: call.water_service_status?.days_since_last_service ?? null,
    pending_status: call.water_service_status?.pending_status || "unknown"
  },
  priority: call.priority || "medium"
});

interface City {
  id: number;
  name: string;
  state: string;
  count?: number;
}

interface PendingCallsTabProps {
  onCallCustomer?: (customer: PendingCall) => void;
  onViewDetails?: (customer: PendingCall) => void;
  onMessageCustomer?: (customer: PendingCall) => void;
  apiBaseUrl?: string;
}

const PendingCallsTab: React.FC<PendingCallsTabProps> = ({ 
  onCallCustomer, 
  onMessageCustomer,
  apiBaseUrl = DEFAULT_API_BASE_URL
}) => {
  // State for cities data
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  
  // State for pending calls data
  const [pendingCalls, setPendingCalls] = useState<PendingCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<PendingCall[]>([]);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  
  // Selection state
  const [selectedCalls, setSelectedCalls] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [selectedCall, setSelectedCall] = useState<PendingCall | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const citySearchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // API Base URL
  const API_BASE_URL = apiBaseUrl;
  
  // Load cities from customers API on component mount
  useEffect(() => {
    loadCities();
  }, []);
  
  // Load pending calls when city is selected
  useEffect(() => {
    if (selectedCity) {
      loadPendingCalls(selectedCity);
    }
  }, [selectedCity]);
  
  // Filter calls based on search term and priority
  useEffect(() => {
    filterCalls();
  }, [pendingCalls, searchTerm, priorityFilter]);
  
  // Update select all state when selection changes
  useEffect(() => {
    if (filteredCalls.length > 0) {
      const allSelected = filteredCalls.every(call => selectedCalls.has(call.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedCalls, filteredCalls]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
        setCitySearchTerm("");
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCityDropdown && citySearchInputRef.current) {
      citySearchInputRef.current.focus();
    }
  }, [showCityDropdown]);
  
  // Filter cities based on search
  const filteredCities = React.useMemo(() => {
    if (!citySearchTerm.trim()) return cities;
    
    const searchLower = citySearchTerm.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(searchLower) ||
      city.state.toLowerCase().includes(searchLower)
    );
  }, [cities, citySearchTerm]);
  
  // Load unique cities from customers API
  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      const data = await response.json();
      
      if (data.success && data.customers) {
        // Extract unique cities with state and count pending calls
        const cityMap = new Map<string, City>();
        
        // First pass: collect all cities
        data.customers.forEach((customer: any) => {
          if (customer.city && customer.city.trim() !== '') {
            const cityKey = `${customer.city}|${customer.state || 'Unknown'}`;
            if (!cityMap.has(cityKey)) {
              cityMap.set(cityKey, {
                id: cityMap.size + 1,
                name: customer.city,
                state: customer.state || 'Unknown',
                count: 0
              });
            }
          }
        });
        
        const uniqueCities = Array.from(cityMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setCities(uniqueCities);
        
        // Auto-select first city if available
        if (uniqueCities.length > 0 && !selectedCity) {
          setSelectedCity(uniqueCities[0].name);
        }
      }
      
    } catch (error: any) {
      console.error('Error loading cities:', error);
      setError('Failed to load cities. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load pending calls for selected city
  const loadPendingCalls = async (city: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCalls(new Set());
      setSelectAll(false);
      
      const encodedCity = encodeURIComponent(city);
      const response = await fetch(`${API_BASE_URL}/pending_calls.php?city=${encodedCity}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PendingCallsResponse = await response.json();
      
      if (data.success) {
        const normalizedCalls = Array.isArray(data.pending_calls)
          ? data.pending_calls.map(normalizePendingCall)
          : [];
        setPendingCalls(normalizedCalls);
        setTotalCalls(data.total_pending_calls || normalizedCalls.length || 0);
        setCurrentMonth(data.current_month || '');
        setLastRefreshed(new Date());
        setSelectedCall(null);
        
        // Update city count
        setCities(prev => prev.map(city => 
          city.name === data.city 
            ? { ...city, count: data.total_pending_calls }
            : city
        ));
      } else {
        throw new Error(data.message || 'Failed to load pending calls');
      }
      
    } catch (error: any) {
      console.error('Error loading pending calls:', error);
      setError(error.message || 'Failed to load pending calls');
      setPendingCalls([]);
      setTotalCalls(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter calls based on search and priority
  const filterCalls = () => {
    let filtered = [...pendingCalls];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(call => 
        call.full_name.toLowerCase().includes(searchLower) ||
        call.phone.includes(searchTerm) ||
        call.customer_code.toLowerCase().includes(searchLower) ||
        call.email.toLowerCase().includes(searchLower) ||
        call.address.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(call => 
        call.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }
    
    setFilteredCalls(filtered);
  };
  
  // Handle city selection
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCityDropdown(false);
    setCitySearchTerm("");
    setSearchTerm('');
    setPriorityFilter('all');
    setSelectedCalls(new Set());
    setSelectAll(false);
  };
  
  // Handle call customer
  const handleCallCustomer = (customer: PendingCall, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onCallCustomer) {
      onCallCustomer(customer);
    } else {
      // Default behavior - simulate phone call
      window.location.href = `tel:${customer.phone}`;
    }
  };
  
  // Handle message customer
  const handleMessageCustomer = (customer: PendingCall, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onMessageCustomer) {
      onMessageCustomer(customer);
    } else {
      // Default behavior - simulate WhatsApp message
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank');
    }
  };
  
  // Handle view details - now just toggles expansion
  const handleViewDetails = (customer: PendingCall, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Toggle expansion
    setSelectedCall(selectedCall?.id === customer.id ? null : customer);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCalls(new Set());
    } else {
      const newSelected = new Set<number>();
      filteredCalls.forEach(call => newSelected.add(call.id));
      setSelectedCalls(newSelected);
    }
    setSelectAll(!selectAll);
  };
  
  // Handle select single call
  const handleSelectCall = (callId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };
  
  // Clear all selections
  const handleClearSelection = () => {
    setSelectedCalls(new Set());
    setSelectAll(false);
  };
  
  // Get selected calls data
  const getSelectedCallsData = (): PendingCall[] => {
    return filteredCalls.filter(call => selectedCalls.has(call.id));
  };
  
  // Export to CSV
  const exportToCSV = () => {
    const selectedData = getSelectedCallsData();
    const dataToExport = selectedData.length > 0 ? selectedData : filteredCalls;
    
    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Define CSV headers
    const headers = [
      'Customer Code',
      'Full Name',
      'Phone',
      'Email',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Priority',
      'Days Since Last Service',
      'Pending Status',
      'Active Services Count',
      'Last Service Date',
      'Notes'
    ];
    
    // Convert data to CSV rows
    const rows = dataToExport.map(call => [
      call.customer_code,
      call.full_name,
      call.phone,
      call.email,
      call.address,
      call.city,
      call.state,
      call.zip_code,
      call.priority,
      call.water_service_status.days_since_last_service?.toString() || 'N/A',
      call.water_service_status.pending_status,
      call.active_services.count.toString(),
      call.water_service_status.last_service ? formatDate(call.water_service_status.last_service.service_date) : 'No service',
      call.notes || ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pending_calls_${selectedCity}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export to PDF
  const exportToPDF = () => {
    const selectedData = getSelectedCallsData();
    const dataToExport = selectedData.length > 0 ? selectedData : filteredCalls;
    
    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Pending Calls Report - ${selectedCity}`, 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Records: ${dataToExport.length}`, 14, 35);
    doc.text(`Current Month: ${currentMonth}`, 14, 40);
    
    if (selectedData.length > 0) {
      doc.text(`Showing ${selectedData.length} selected records`, 14, 45);
    }
    
    // Prepare table data
    const tableHeaders = [['Code', 'Name', 'Phone', 'Priority', 'Days', 'Status', 'Services']];
    const tableData = dataToExport.map(call => [
      call.customer_code,
      call.full_name,
      call.phone,
      call.priority,
      call.water_service_status.days_since_last_service?.toString() || 'N/A',
      call.water_service_status.pending_status,
      call.active_services.count.toString()
    ]);
    
    // Generate table
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: selectedData.length > 0 ? 50 : 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Save PDF
    doc.save(`pending_calls_${selectedCity}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Print function
  const handlePrint = () => {
    const selectedData = getSelectedCallsData();
    const dataToPrint = selectedData.length > 0 ? selectedData : filteredCalls;
    
    if (dataToPrint.length === 0) {
      alert('No data to print');
      return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    // Generate print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pending Calls Report - ${selectedCity}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .header { margin-bottom: 20px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4F46E5; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .priority-high { color: #DC2626; font-weight: bold; }
          .priority-medium { color: #F59E0B; font-weight: bold; }
          .priority-low { color: #10B981; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          @media print {
            body { margin: 0.5in; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Pending Calls Report - ${selectedCity}</h1>
          <div class="metadata">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Records:</strong> ${dataToPrint.length}</p>
            <p><strong>Current Month:</strong> ${currentMonth}</p>
            ${selectedData.length > 0 ? `<p><strong>Showing:</strong> ${selectedData.length} selected records</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Services</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map(call => `
              <tr>
                <td>${call.customer_code}</td>
                <td>${call.full_name}</td>
                <td>${call.phone}</td>
                <td>${call.email}</td>
                <td>${call.city}</td>
                <td class="priority-${call.priority.toLowerCase()}">${call.priority}</td>
                <td>${call.water_service_status.pending_status}</td>
                <td>${call.active_services.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Report generated from Sun Water Service System</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch(priority.toLowerCase()) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Get urgency level - FIXED: Removed "Unknown"
  const getUrgencyLevel = (daysSinceLastService: number | null, hasService: boolean): { label: string; color: string } => {
    if (!hasService || daysSinceLastService === null) {
      return { label: 'No Service', color: '#6B7280' };
    }
    
    if (daysSinceLastService > 45) return { label: 'Critical', color: '#DC2626' };
    if (daysSinceLastService > 30) return { label: 'Urgent', color: '#F59E0B' };
    if (daysSinceLastService > 20) return { label: 'Due Soon', color: '#3B82F6' };
    return { label: 'On Time', color: '#10B981' };
  };
  
  // Calculate stats
  const stats = React.useMemo(() => {
    const highPriority = filteredCalls.filter(c => c.priority.toLowerCase() === 'high').length;
    const mediumPriority = filteredCalls.filter(c => c.priority.toLowerCase() === 'medium').length;
    const lowPriority = filteredCalls.filter(c => c.priority.toLowerCase() === 'low').length;
    
    const criticalCount = filteredCalls.filter(c => {
      const days = c.water_service_status.days_since_last_service;
      return days && days > 45;
    }).length;
    
    const urgentCount = filteredCalls.filter(c => {
      const days = c.water_service_status.days_since_last_service;
      return days && days > 30 && days <= 45;
    }).length;
    
    const dueSoonCount = filteredCalls.filter(c => {
      const days = c.water_service_status.days_since_last_service;
      return days && days > 20 && days <= 30;
    }).length;
    
    const noServiceCount = filteredCalls.filter(c => 
      !c.water_service_status.last_service
    ).length;
    
    return {
      highPriority,
      mediumPriority,
      lowPriority,
      criticalCount,
      urgentCount,
      dueSoonCount,
      noServiceCount,
      total: filteredCalls.length,
      selectedCount: selectedCalls.size
    };
  }, [filteredCalls, selectedCalls]);
  
  return (
    <div className="pending-calls-tab">
      {/* Hero Section */}
      <div className="pending-calls-hero">
        <div className="hero-content">
          <motion.div 
            className="hero-icon-wrapper"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <FiPhoneCall className="hero-icon" />
          </motion.div>
          <div className="hero-text">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Pending Service Calls
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Customers with active AMC who haven't received water service this month
            </motion.p>
          </div>
        </div>
        
        <motion.div 
          className="hero-actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Separate Export Buttons */}
          <motion.button 
            className="btn csv-btn"
            onClick={exportToCSV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedCity || filteredCalls.length === 0}
            title="Export to CSV"
          >
            <FiDownload />
            <span>CSV</span>
          </motion.button>
          
          <motion.button 
            className="btn pdf-btn"
            onClick={exportToPDF}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedCity || filteredCalls.length === 0}
            title="Export to PDF"
          >
            <FiDownload />
            <span>PDF</span>
          </motion.button>
          
          <motion.button 
            className="btn print-btn"
            onClick={handlePrint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedCity || filteredCalls.length === 0}
            title="Print"
          >
            <FiPrinter />
            <span>Print</span>
          </motion.button>
        </motion.div>
      </div>
      
      {/* City Selector with Search */}
      <div className="city-selector-container">
        <div className="city-selector-wrapper" ref={dropdownRef}>
          <div className="city-label">
            <FiMapPin className="label-icon" />
            <span>Service Area</span>
          </div>
          
          <div className="custom-dropdown">
            <motion.button
              className={`dropdown-button ${showCityDropdown ? 'active' : ''} ${selectedCity ? 'has-selection' : ''}`}
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="selected-city-content">
                <FiMapPin className="city-icon" />
                <span className="selected-city">
                  {selectedCity || 'Choose a service area'}
                </span>
                {selectedCity && cities.find(c => c.name === selectedCity)?.count !== undefined && (
                  <motion.span 
                    className="city-count-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {cities.find(c => c.name === selectedCity)?.count || 0}
                  </motion.span>
                )}
              </div>
              <FiChevronDown className={`dropdown-icon ${showCityDropdown ? 'rotated' : ''}`} />
            </motion.button>
            
            <AnimatePresence>
              {showCityDropdown && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Search input inside dropdown */}
                  <div className="dropdown-search">
                    <FiSearch className="search-icon" />
                    <input
                      ref={citySearchInputRef}
                      type="text"
                      placeholder="Search cities..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {citySearchTerm && (
                      <button 
                        className="clear-search"
                        onClick={() => setCitySearchTerm('')}
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                  
                  <div className="dropdown-cities-list">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city, index) => (
                        <motion.button
                          key={city.id}
                          className={`dropdown-item ${selectedCity === city.name ? 'active' : ''}`}
                          onClick={() => handleCitySelect(city.name)}
                          whileHover={{ backgroundColor: '#F3F4F6', x: 4 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="city-info">
                            <span className="city-name">{city.name}</span>
                            <span className="city-state">{city.state}</span>
                          </div>
                          {city.count !== undefined && city.count > 0 && (
                            <motion.span 
                              className="city-count"
                              whileHover={{ scale: 1.2 }}
                            >
                              {city.count}
                            </motion.span>
                          )}
                        </motion.button>
                      ))
                    ) : (
                      <div className="dropdown-empty">
                        <FiAlertCircle />
                        <p>No cities found matching "{citySearchTerm}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {selectedCity && (
          <motion.div 
            className="city-info-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="info-item">
              <FiCalendar className="info-icon" />
              <div className="info-text">
                <span className="info-label">Current Month</span>
                <span className="info-value">{currentMonth}</span>
              </div>
            </div>
            
            <div className="info-item">
              <FiPhoneCall className="info-icon" />
              <div className="info-text">
                <span className="info-label">Pending Calls</span>
                <span className="info-value">{totalCalls}</span>
              </div>
            </div>
            
            <div className="info-item">
              <FiClock className="info-icon" />
              <div className="info-text">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{lastRefreshed.toLocaleTimeString()}</span>
              </div>
            </div>
            
            <motion.button 
              className="stats-toggle"
              onClick={() => setShowStats(!showStats)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPieChart />
              <span>Statistics</span>
              {showStats ? <FiChevronUp /> : <FiChevronDown />}
            </motion.button>
          </motion.div>
        )}
      </div>
      
      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && selectedCity && (
          <motion.div 
            className="stats-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <FiAlertCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-label">High Priority</span>
                  <span className="stat-value">{stats.highPriority}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                  <FiClock />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Medium Priority</span>
                  <span className="stat-value">{stats.mediumPriority}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>
                  <FiCheckCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Low Priority</span>
                  <span className="stat-value">{stats.lowPriority}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Critical (45+ days)</span>
                  <span className="stat-value">{stats.criticalCount}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                  <FiActivity />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Urgent (31-45 days)</span>
                  <span className="stat-value">{stats.urgentCount}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}>
                  <FiClock />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Due Soon (21-30 days)</span>
                  <span className="stat-value">{stats.dueSoonCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#E5E7EB', color: '#6B7280' }}>
                  <FiXCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-label">No Service</span>
                  <span className="stat-value">{stats.noServiceCount}</span>
                </div>
              </div>
              
              <div className="stat-card total">
                <div className="stat-icon" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
                  <FiUsers />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Filtered</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              </div>
              
              {stats.selectedCount > 0 && (
                <div className="stat-card selected">
                  <div className="stat-icon" style={{ background: '#10B981', color: 'white' }}>
                    <FiCheckSquare />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Selected</span>
                    <span className="stat-value">{stats.selectedCount}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search and Filter Bar */}
      {selectedCity && totalCalls > 0 && (
        <motion.div 
          className="search-filter-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <motion.button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FiX />
              </motion.button>
            )}
          </div>
          
          <div className="filter-box">
            <FiFilter className="filter-icon" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </motion.div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <motion.div 
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading pending calls for {selectedCity}...
          </motion.p>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <motion.div 
          className="error-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <FiAlertCircle className="error-icon" />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <motion.button
            className="btn retry-btn"
            onClick={() => selectedCity && loadPendingCalls(selectedCity)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      )}
      
      {/* No City Selected */}
      {!selectedCity && !loading && !error && (
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiMapPin className="empty-icon" />
          <h3>Select a Service Area</h3>
          <p>Choose a city from the dropdown above to view pending calls</p>
          <div className="empty-decoration">
            <FiPhoneCall />
            <FiUsers />
            <FiHome />
          </div>
        </motion.div>
      )}
      
      {/* No Pending Calls */}
      {selectedCity && !loading && !error && totalCalls === 0 && (
        <motion.div 
          className="empty-state success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="success-icon-wrapper">
            <FiCheckCircle className="empty-icon success" />
          </div>
          <h3>All Caught Up!</h3>
          <p>No pending calls for {selectedCity} this month</p>
          <p className="empty-subtext">All customers with active AMC have received water service</p>
          <div className="empty-badge">
            <FiAward />
            <span>Great job!</span>
          </div>
        </motion.div>
      )}
      
      {/* Results Info with Selection Controls */}
      {selectedCity && !loading && !error && filteredCalls.length > 0 && (
        <motion.div 
          className="results-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="results-left">
            <div className="selection-controls">
              <button 
                className="select-all-btn"
                onClick={handleSelectAll}
                title={selectAll ? "Deselect all" : "Select all"}
              >
                {selectAll ? <FiCheckSquare /> : <FiSquare />}
                <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
              </button>
              
              {selectedCalls.size > 0 && (
                <>
                  <span className="selection-count">
                    {selectedCalls.size} selected
                  </span>
                  <button 
                    className="clear-selection-btn"
                    onClick={handleClearSelection}
                    title="Clear selection"
                  >
                    <FiX />
                  </button>
                </>
              )}
            </div>
            
            <span className="results-count">
              Showing <strong>{filteredCalls.length}</strong> of <strong>{totalCalls}</strong> pending calls
            </span>
            
            {searchTerm && (
              <span className="search-term">
                Filtered by: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <FiX />
                </button>
              </span>
            )}
          </div>
          
          <div className="results-right">
            <span className="urgency-info">
              <span className="dot critical"></span> Critical (45+)
              <span className="dot urgent"></span> Urgent (31-45)
              <span className="dot due"></span> Due Soon (21-30)
              <span className="dot no-service"></span> No Service
            </span>
          </div>
        </motion.div>
      )}
      
      {/* List View with Checkboxes - REMOVED View Details button */}
      {selectedCity && !loading && !error && filteredCalls.length > 0 && (
        <div className="pending-calls-list" ref={printRef}>
          {filteredCalls.map((call, index) => {
            const hasService = !!call.water_service_status.last_service;
            const urgency = getUrgencyLevel(call.water_service_status.days_since_last_service, hasService);
            const isSelected = selectedCall?.id === call.id;
            const isChecked = selectedCalls.has(call.id);
            
            return (
              <motion.div
                key={call.id}
                className={`pending-call-list-item priority-${call.priority.toLowerCase()} ${isSelected ? 'expanded' : ''} ${isChecked ? 'selected' : ''}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ x: 8, backgroundColor: '#F9FAFB' }}
                onClick={() => handleViewDetails(call)}
              >
                <div className="list-item-content">
                  {/* Checkbox */}
                  <div className="list-checkbox" onClick={(e) => handleSelectCall(call.id, e)}>
                    {isChecked ? (
                      <FiCheckSquare className="checkbox checked" />
                    ) : (
                      <FiSquare className="checkbox" />
                    )}
                  </div>
                  
                  {/* Priority Indicator */}
                  <div 
                    className="priority-indicator"
                    style={{ backgroundColor: getPriorityColor(call.priority) }}
                  />
                  
                  {/* Customer Info */}
                  <div className="customer-mini-avatar">
                    {call.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  
                  <div className="list-customer-info">
                    <div className="list-customer-name">{call.full_name}</div>
                    <div className="list-customer-code">{call.customer_code}</div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="list-contact">
                    <div className="list-contact-item">
                      <FiPhone className="list-icon" />
                      <span>{call.phone}</span>
                    </div>
                    <div className="list-contact-item">
                      <FiMapPin className="list-icon" />
                      <span>{call.city}</span>
                    </div>
                  </div>
                  
                  {/* Service Status - FIXED: Removed "0 days" display */}
                  <div className="list-service-status">
                    <div className="list-status-badge" style={{ backgroundColor: urgency.color + '20', color: urgency.color }}>
                      {urgency.label}
                    </div>
                    {hasService && call.water_service_status.days_since_last_service ? (
                      <div className="list-days">
                        <FiClock />
                        <span>{call.water_service_status.days_since_last_service} days</span>
                      </div>
                    ) : (
                      <div className="list-days no-service">
                        <FiXCircle />
                        <span>No service</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions - REMOVED View button, kept only Call and Message */}
                  <div className="list-actions">
                    <motion.button
                      className="list-action-btn call"
                      onClick={(e) => handleCallCustomer(call, e)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      title="Call Customer"
                    >
                      <FiPhone />
                    </motion.button>
                    
                    <motion.button
                      className="list-action-btn message"
                      onClick={(e) => handleMessageCustomer(call, e)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      title="Send Message"
                    >
                      <FiMessageCircle />
                    </motion.button>
                  </div>
                </div>
                
                {/* Expanded Details - Still accessible by clicking the card */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      className="list-expanded-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="expanded-details-grid">
                        <div className="detail-section">
                          <h4>Contact Information</h4>
                          <p><FiMail /> {call.email}</p>
                          <p><FiMapPin /> {call.address}</p>
                          <p>{call.city}, {call.state} - {call.zip_code}</p>
                        </div>
                        
                        <div className="detail-section">
                          <h4>Water Service Status</h4>
                          <p><FiCalendar /> Last: {call.water_service_status.last_service ? formatDate(call.water_service_status.last_service.service_date) : 'No service'}</p>
                          {call.water_service_status.days_since_last_service ? (
                            <p><FiClock /> Days since: {call.water_service_status.days_since_last_service}</p>
                          ) : null}
                          <p><FiAlertCircle /> Status: {call.water_service_status.pending_status}</p>
                        </div>
                        
                        <div className="detail-section">
                          <h4>Active Services ({call.active_services.count})</h4>
                          {call.active_services.list.map((service, idx) => (
                            <div key={idx} className="detail-service-item">
                              <span className="service-code">{service.service_code}</span>
                              <span className="service-model">{service.battery_model}</span>
                              <span className="service-date">{formatDate(service.created_date)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {call.notes && (
                          <div className="detail-section">
                            <h4>Notes</h4>
                            <p className="customer-notes">{call.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* No Results Found */}
      {selectedCity && !loading && !error && filteredCalls.length === 0 && pendingCalls.length > 0 && (
        <motion.div 
          className="no-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiSearch className="no-results-icon" />
          <h3>No matching results</h3>
          <p>Try adjusting your search or filter criteria</p>
          <motion.button
            className="btn clear-btn"
            onClick={() => {
              setSearchTerm('');
              setPriorityFilter('all');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear All Filters
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default PendingCallsTab;
