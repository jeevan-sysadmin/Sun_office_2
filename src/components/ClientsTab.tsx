import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiSearch,
  FiDownload,
  FiFilter,
  FiClock,
  FiX,
  FiCheckSquare,
  FiSquare,
  FiMenu,
  FiShoppingBag,
  FiStar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CustomerFormModal from './modals/CustomerFormModal';
import CustomerDetailModal from './modals/CustomerDetailModal';
import "./css/Clients.css";
import type { Customer } from "./types";

// Create motion components properly
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionTr = motion.tr;

interface ClientsTabProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onNewCustomer: () => void;
  onRefreshCustomers?: () => Promise<void> | void;
  onSaveCustomer?: (customerData: any, isEdit: boolean) => Promise<void>;
  loading?: boolean;
  showSnackbar?: (message: string, severity: 'success' | 'error') => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({
  customers,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onNewCustomer,
  onRefreshCustomers,
  loading = false,
  showSnackbar
}) => {
  void onViewCustomer;
  // Date filter states
  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Selection states - initialize as empty Set
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Last refreshed state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Mobile menu state
  const [showMobileActions, setShowMobileActions] = useState<boolean>(false);
  
  // Modal states - all initialized to false
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter states
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterServices, setFilterServices] = useState<string>("all");
  
  // Sort states
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'city' | 'services'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination - Updated to default 20 items per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  
  // Export menu states
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  
  // Action state to prevent double clicks
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  
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

  // Check if mobile view
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Update last refreshed when data changes
  useEffect(() => {
    if (customers.length > 0) {
      setLastRefreshed(new Date());
    }
  }, [customers]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = customers
      .map(c => c.city)
      .filter(city => city && city !== 'null' && city !== 'undefined' && city.trim() !== '');
    return ['all', ...Array.from(new Set(cities))];
  }, [customers]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = customers
      .map(c => c.state)
      .filter(state => state && state !== 'null' && state !== 'undefined' && state.trim() !== '');
    return ['all', ...Array.from(new Set(states))];
  }, [customers]);

  // Format date
  const formatDate = (dateString: string): string => {
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

  const getContactNumber = (customer: Customer): string => {
    const mobile = customer.phone?.toString().trim();
    const landline = customer.alternate_phone?.toString().trim();
    return mobile || landline || 'N/A';
  };

  // Format date for filename
  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Set default from and to dates for custom range
  const setDefaultCustomRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Get date filtered customers with search - FIXED SEARCH FUNCTION
  const getFilteredCustomers = () => {
    let filtered = [...customers];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply date filters
    switch (dateFilterType) {
      case "today":
        filtered = filtered.filter(customer => {
          const customerDate = new Date(customer.created_at);
          customerDate.setHours(0, 0, 0, 0);
          return customerDate.getTime() === today.getTime();
        });
        break;
      
      case "this_week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(customer => {
          const customerDate = new Date(customer.created_at);
          return customerDate >= weekStart;
        });
        break;
      
      case "this_month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(customer => {
          const customerDate = new Date(customer.created_at);
          return customerDate >= monthStart;
        });
        break;
      
      case "this_year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter(customer => {
          const customerDate = new Date(customer.created_at);
          return customerDate >= yearStart;
        });
        break;
      
      case "custom":
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          
          filtered = filtered.filter(customer => {
            const customerDate = new Date(customer.created_at);
            return customerDate >= from && customerDate <= to;
          });
        }
        break;
      
      default:
        break;
    }

    // Apply search - FIXED SEARCH LOGIC
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(customer => {
        // Search across all key client fields
        return (
          (customer.customer_code && customer.customer_code.toLowerCase().includes(term)) ||
          (customer.full_name && customer.full_name.toLowerCase().includes(term)) ||
          (customer.phone && customer.phone.toLowerCase().includes(term)) ||
          (customer.alternate_phone && customer.alternate_phone.toLowerCase().includes(term)) ||
          (customer.email && customer.email.toLowerCase().includes(term)) ||
          (customer.city && customer.city.toLowerCase().includes(term)) ||
          (customer.state && customer.state.toLowerCase().includes(term)) ||
          (customer.address && customer.address.toLowerCase().includes(term))
        );
      });
    }

    // Apply city filter
    if (filterCity && filterCity !== 'all') {
      filtered = filtered.filter(customer => customer.city === filterCity);
    }

    // Apply state filter
    if (filterState && filterState !== 'all') {
      filtered = filtered.filter(customer => customer.state === filterState);
    }

    // Apply services filter
    if (filterServices && filterServices !== 'all') {
      if (filterServices === '0') {
        filtered = filtered.filter(customer => Number(customer.total_services || 0) === 0);
      } else if (filterServices === '1-5') {
        filtered = filtered.filter(customer => {
          const count = Number(customer.total_services || 0);
          return count >= 1 && count <= 5;
        });
      } else if (filterServices === '6-10') {
        filtered = filtered.filter(customer => {
          const count = Number(customer.total_services || 0);
          return count >= 6 && count <= 10;
        });
      } else if (filterServices === '10+') {
        filtered = filtered.filter(customer => Number(customer.total_services || 0) > 10);
      }
    }

    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'services':
          aValue = Number(a.total_services || 0);
          bValue = Number(b.total_services || 0);
          break;
        default:
          aValue = a.full_name || '';
          bValue = b.full_name || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredCustomers, sortBy, sortOrder]);

  // Pagination - Updated with 20 items per page default
  const totalItems = sortedCustomers.length;
  const totalPages = totalItems > 0 ? 1 : 0;
  const indexOfLastItem = totalItems;
  const indexOfFirstItem = 0;
  const paginatedCustomers = sortedCustomers;

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    // Scroll to top of table
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);

  // Get page numbers to display
  const getPageNumbers = () => {
    const delta = isMobile ? 1 : 2; // Show fewer pages on mobile
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l !== undefined) {
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilterType, fromDate, toDate, filterCity, filterState, filterServices, sortBy, sortOrder]);

  // Update select all when selection changes
  useEffect(() => {
    if (paginatedCustomers.length > 0) {
      const allSelected = paginatedCustomers.every(customer => selectedItems.has(customer.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, paginatedCustomers]);

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
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFilterType("all");
    setFromDate("");
    setToDate("");
    setShowDatePicker(false);
    setSearchTerm("");
    setFilterCity("all");
    setFilterState("all");
    setFilterServices("all");
    setSortBy('date');
    setSortOrder('desc');
    setSelectedItems(new Set());
    setSelectAll(false);
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilterType !== "all" || 
    (searchTerm && searchTerm.trim() !== "") || 
    filterCity !== "all" || 
    filterState !== "all" || 
    filterServices !== "all";

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
      const allIds = new Set(paginatedCustomers.map(customer => customer.id));
      setSelectedItems(allIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  // Handle delete - REMOVED CONFIRMATION DIALOG
  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    // Directly call delete without confirmation
    onDeleteCustomer(id);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    // Show success message
    setSuccessMessage('Customer deleted successfully!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Handle bulk delete - REMOVED CONFIRMATION DIALOG
  const handleBulkDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItems.size === 0) return;
    
    // Directly call delete without confirmation
    selectedItems.forEach(id => onDeleteCustomer(id));
    setSelectedItems(new Set());
    setSelectAll(false);
    setShowMobileActions(false);
    
    // Show success message
    setSuccessMessage(`${selectedItems.size} customer(s) deleted successfully!`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // FIXED: Handle view customer - prevents double opening
  const handleViewCustomer = (customer: Customer, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Prevent multiple clicks
    if (actionInProgress) return;
    setActionInProgress(true);
    
    // Close any other modals first
    setShowFormModal(false);
    
    // Set selected customer and open detail modal
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    
    // Reset action in progress after a short delay
    setTimeout(() => {
      setActionInProgress(false);
    }, 300);
  };

  // FIXED: Handle edit customer - directly opens edit modal
  const handleEditCustomer = (customer: Customer, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (actionInProgress) return;
    setActionInProgress(true);
    
    // Close detail modal if open
    setShowDetailModal(false);
    
    // Set the customer and mode directly, then open form modal
    setSelectedCustomer(customer);
    setFormMode('edit');
    
    // Small timeout to ensure state updates
    setTimeout(() => {
      setShowFormModal(true);
      onEditCustomer(customer);
      setActionInProgress(false);
    }, 100);
  };

  // Handle new customer
  const handleNewCustomer = () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    
    // Close detail modal if open
    setShowDetailModal(false);
    
    // Clear selected customer, set mode to add, then open form modal
    setSelectedCustomer(null);
    setFormMode('add');
    // Small timeout to ensure state updates
    setTimeout(() => {
      setShowFormModal(true);
      onNewCustomer();
      setActionInProgress(false);
    }, 50);
  };

  // Handle close form modal
  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setSelectedCustomer(null);
    setActionInProgress(false);
  };

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
    setActionInProgress(false);
  };

  // Handle success from form modal
  const handleFormSuccess = async () => {
    if (onRefreshCustomers) {
      await onRefreshCustomers();
    }
    setShowFormModal(false);
    setSelectedCustomer(null);
    setActionInProgress(false);
  };

  // Handle edit from detail modal
  const handleEditFromDetail = (customer: Customer) => {
    handleCloseDetailModal();
    handleEditCustomer(customer);
  };

  // Get selected items data
  const getSelectedItems = () => {
    return sortedCustomers.filter(customer => selectedItems.has(customer.id));
  };

  // Export to CSV
  const exportToCSV = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : sortedCustomers;
      
      if (dataToExport.length === 0) {
        alert('No clients to export');
        return;
      }

      const exportData = dataToExport.map(customer => ({
        'Client Code': customer.customer_code,
        'Full Name': customer.full_name,
        'Phone Number': getContactNumber(customer),
        'Alternate Phone': customer.alternate_phone || '',
        'Email': customer.email || '',
        'Address': customer.address || '',
        'City': customer.city || '',
        'State': customer.state || '',
        'Zip Code': customer.zip_code || '',
        'Total Services': customer.total_services || '0',
        'Last Service': customer.last_service_date ? formatDate(customer.last_service_date) : '',
        'Created Date': formatDate(customer.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      
      const fileName = selectedOnly
        ? `selected_clients_${formatDateForFilename()}.csv`
        : `clients_export_${formatDateForFilename()}.csv`;
      
      XLSX.writeFile(wb, fileName);
      
      if (selectedOnly) setShowMobileActions(false);
      setShowExportMenu(false);
    } catch (error) {
      console.error('CSV Export Error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF
  const exportToPDF = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : sortedCustomers;
      
      if (dataToExport.length === 0) {
        alert('No clients to export');
        return;
      }

      const doc = new jsPDF({
        orientation: isMobile ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFillColor(25, 118, 210);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('New Account', 14, 13);

      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(isMobile ? 14 : 16);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedOnly ? 'Selected Clients Report' : 'Clients Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
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
      doc.text(`Total Clients: ${dataToExport.length}`, 14, yPos);
      
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);

      // Prepare table data
      let tableColumn: string[];
      let tableRows: any[][];

      if (isMobile) {
        tableColumn = ['Code', 'Name', 'Phone Number', 'Alternate Phone', 'Services'];
        tableRows = dataToExport.map(customer => [
          customer.customer_code,
          customer.full_name,
          getContactNumber(customer),
          customer.alternate_phone || '-',
          customer.total_services || '0'
        ]);
      } else {
        tableColumn = ['Code', 'Name', 'Phone Number', 'Alternate Phone', 'Email', 'City', 'State', 'Services', 'Created'];
        tableRows = dataToExport.map(customer => [
          customer.customer_code,
          customer.full_name,
          getContactNumber(customer),
          customer.alternate_phone || '-',
          customer.email || '-',
          customer.city || '-',
          customer.state || '-',
          customer.total_services || '0',
          formatDate(customer.created_at)
        ]);
      }

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
          fillColor: [25, 118, 210],
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
        ? `selected_clients_${formatDateForFilename()}.pdf`
        : `clients_export_${formatDateForFilename()}.pdf`;
      
      doc.save(fileName);
      
      if (selectedOnly) setShowMobileActions(false);
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Render mobile card view - FIXED to prevent double opening
  const renderMobileCard = (customer: Customer) => (
    <div
      key={customer.id}
      onClick={(e) => handleViewCustomer(customer, e)}
      style={{
        backgroundColor: selectedItems.has(customer.id) ? '#eff6ff' : '#fff',
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
            onClick={(e) => {
              e.stopPropagation();
              handleSelectItem(customer.id, e);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedItems.has(customer.id) ? '#1976d2' : '#6b7280'
            }}
          >
            {selectedItems.has(customer.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
          </MotionDiv>
          <div>
            <div style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>{customer.customer_code}</div>
            <div style={{ fontSize: '12px', color: '#1976d2', fontWeight: '500' }}>#{customer.id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewCustomer(customer, e);
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
              handleEditCustomer(customer, e);
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
            <FiEdit size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Name</div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>{customer.full_name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiPhone size={10} /> {getContactNumber(customer)}
          </div>
          {customer.alternate_phone && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Alt: {customer.alternate_phone}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Location</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              <FiMapPin size={14} />
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{customer.city || 'N/A'}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>{customer.state || 'No state'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Services</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiShoppingBag size={12} color="#6b7280" />
            <span style={{ fontSize: '12px' }}>{customer.total_services || '0'} services</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Created</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCalendar size={12} color="#6b7280" />
            <span style={{ fontSize: '12px' }}>{formatDate(customer.created_at)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(e, customer.id);
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FiTrash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="clients-section" style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      padding: '0',
      width: '100%'
    }}>
      {/* Customer Form Modal - Only shown when showFormModal is true */}
      {showFormModal && (
        <CustomerFormModal
          open={showFormModal}
          onClose={handleCloseFormModal}
          mode={formMode}
          data={selectedCustomer}
          customers={customers}
          onSuccess={handleFormSuccess}
          showSnackbar={showSnackbar}
        />
      )}

      {/* Customer Detail Modal - Only shown when showDetailModal is true */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          open={showDetailModal}
          onClose={handleCloseDetailModal}
          customer={selectedCustomer}
          onEdit={() => handleEditFromDetail(selectedCustomer)}
          onDelete={() => onDeleteCustomer(selectedCustomer.id)}
        />
      )}

      {/* Hero Section */}
      <div className="clients-hero" style={{
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
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
            <FiUsers />
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
              New Account
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
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} clients
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
            <motion.button 
              className="btn mobile-menu-btn"
              onClick={() => setShowMobileActions(!showMobileActions)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'white',
                color: '#1976d2',
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
              {/* Create New Button */}
              <motion.button 
                className="btn new-order-btn"
                onClick={handleNewCustomer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Create New Client"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#1976d2',
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
                <FiPlus size={isMobile ? 16 : 18} />
                <span>{isMobile ? 'New' : 'New Client'}</span>
              </motion.button>

              {/* CSV Button */}
              <motion.button 
                className="btn csv-btn"
                onClick={() => {
                  exportToCSV(false);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={sortedCustomers.length === 0}
                title="Export to CSV"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#10b981',
                  cursor: sortedCustomers.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: sortedCustomers.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDownload size={isMobile ? 14 : 16} />
                <span>CSV</span>
              </motion.button>
              
              {/* PDF Button */}
              <motion.button 
                className="btn pdf-btn"
                onClick={() => {
                  exportToPDF(false);
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={sortedCustomers.length === 0}
                title="Export to PDF"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#ef4444',
                  cursor: sortedCustomers.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: sortedCustomers.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDownload size={isMobile ? 14 : 16} />
                <span>PDF</span>
              </motion.button>
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
            placeholder={isMobile ? "Search..." : "Search clients..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedItems(new Set());
              setSelectAll(false);
              setCurrentPage(1);
            }}
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
            onFocus={(e) => e.target.style.borderColor = '#1976d2'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {searchTerm && (
            <motion.button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
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
            </motion.button>
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

        {/* City Filter */}
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
            value={filterCity}
            onChange={(e) => {
              setFilterCity(e.target.value);
              setSelectedItems(new Set());
              setSelectAll(false);
              setCurrentPage(1);
            }}
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
              outline: 'none'
            }}
          >
            <option value="all">All Cities</option>
            {uniqueCities.filter(c => c !== 'all').map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* State Filter */}
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
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setSelectedItems(new Set());
              setSelectAll(false);
              setCurrentPage(1);
            }}
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
              outline: 'none'
            }}
          >
            <option value="all">All States</option>
            {uniqueStates.filter(s => s !== 'all').map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Services Filter */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiShoppingBag className="filter-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1
          }} />
          <select
            value={filterServices}
            onChange={(e) => {
              setFilterServices(e.target.value);
              setSelectedItems(new Set());
              setSelectAll(false);
              setCurrentPage(1);
            }}
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
              outline: 'none'
            }}
          >
            <option value="all">All Services</option>
            <option value="0">No Services</option>
            <option value="1-5">1 - 5 Services</option>
            <option value="6-10">6 - 10 Services</option>
            <option value="10+">10+ Services</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '1',
          width: isMobile ? '100%' : 'auto'
        }}>
          <FiStar className="filter-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1
          }} />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
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
              outline: 'none'
            }}
          >
            <option value="date">Sort by: Date</option>
            <option value="name">Sort by: Name</option>
            <option value="city">Sort by: City</option>
            <option value="services">Sort by: Services</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '0.5',
          width: isMobile ? '100%' : 'auto'
        }}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
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
              outline: 'none'
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
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

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              padding: "16px 24px",
              margin: "0 24px 20px 24px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              border: "2px solid #a7f3d0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white"
              }}>
                <FiCheckCircle size={18} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              style={{
                background: "none",
                border: "none",
                color: "#065f46",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          <FiUsers className="info-icon" style={{ color: '#1976d2', fontSize: isMobile ? '16px' : '18px' }} />
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Total Clients</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{customers.length}</span>
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
          gap: '10px'
        }}>
          <FiShoppingBag className="info-icon" style={{ color: '#10b981', fontSize: isMobile ? '16px' : '18px' }} />
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Total Services</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>
              {customers.reduce((sum, c) => sum + Number(c.total_services || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Results Info with Selection Controls */}
      {sortedCustomers.length > 0 && (
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
                    color: '#1976d2',
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
                  
                  {/* Bulk Delete Button */}
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

                  {/* Export Selected Buttons */}
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
              Showing <strong>all {totalItems}</strong> clients
            </span>
            
            <div className="results-per-page" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <label style={{ fontSize: isMobile ? '12px' : '12px', color: '#6b7280' }}>Show:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: isMobile ? '12px' : '12px',
                  outline: 'none'
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            {searchTerm && (
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
                Filtered by: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} style={{
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
        {loading ? (
          <div className="loading-state" style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div className="loading-spinner" style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ margin: '0', fontSize: isMobile ? '14px' : '14px' }}>Loading clients...</p>
          </div>
        ) : sortedCustomers.length > 0 ? (
          <>
            {/* Mobile Card View */}
            {isMobile && (
              <div style={{ padding: '16px' }}>
                {paginatedCustomers.map((customer) => renderMobileCard(customer))}
              </div>
            )}

            {/* Tablet and Desktop Table View */}
            {!isMobile && (
              <table className="orders-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: isTablet ? '13px' : '14px',
                minWidth: isTablet ? '800px' : '1000px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#1976d2',
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
                          color: '#ffffff'
                        }}
                      >
                        {selectAll ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                      </MotionDiv>
                    </th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Code</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Client</th>
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
                    }}>Location</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Services</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Created</th>
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
                  {paginatedCustomers.map((customer, index) => (
                    <MotionTr 
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={(e) => handleViewCustomer(customer, e)}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: selectedItems.has(customer.id) ? '#eff6ff' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ 
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'center',
                        width: '40px'
                      }}>
                        <MotionDiv
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(customer.id, e);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedItems.has(customer.id) ? '#1976d2' : '#6b7280'
                          }}
                        >
                          {selectedItems.has(customer.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        </MotionDiv>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ fontWeight: '600', color: '#1976d2', fontSize: isTablet ? '13px' : '14px', fontFamily: 'monospace' }}>
                          {customer.customer_code}
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: isTablet ? '32px' : '36px',
                            height: isTablet ? '32px' : '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: isTablet ? '14px' : '16px',
                            flexShrink: 0
                          }}>
                            {customer.full_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px', fontSize: isTablet ? '13px' : '14px' }}>
                              {customer.full_name}
                            </div>
                            <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#6b7280' }}>
                              {customer.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiPhone style={{ color: '#10b981', fontSize: isTablet ? '12px' : '13px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px' }}>{getContactNumber(customer)}</span>
                        </div>
                        {customer.alternate_phone && (
                          <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#94a3b8', marginTop: '4px' }}>
                            Alt: {customer.alternate_phone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiMapPin style={{ color: '#ef4444', fontSize: isTablet ? '12px' : '13px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px' }}>
                            {customer.city || 'N/A'}, {customer.state || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: isTablet ? '11px' : '12px',
                          fontWeight: '500',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1'
                        }}>
                          {customer.total_services || '0'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar style={{ color: '#6b7280', fontSize: isTablet ? '11px' : '12px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#4b5563' }}>
                            {formatDate(customer.created_at)}
                          </span>
                        </div>
                        {customer.last_service_date && (
                          <div style={{ fontSize: isTablet ? '9px' : '10px', color: '#94a3b8', marginTop: '2px' }}>
                            Last: {formatDate(customer.last_service_date)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{
                          display: 'flex',
                          gap: isTablet ? '4px' : '6px',
                          justifyContent: 'center'
                        }}>
                          <MotionButton 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomer(customer, e);
                            }}
                            whileHover={{ scale: 1.1, backgroundColor: '#e0f2fe' }}
                            whileTap={{ scale: 0.9 }}
                            title="View Details"
                            style={{
                              width: isTablet ? '30px' : '32px',
                              height: isTablet ? '30px' : '32px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#fff',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isTablet ? '13px' : '14px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FiEye />
                          </MotionButton>
                          <MotionButton 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer, e);
                            }}
                            whileHover={{ scale: 1.1, backgroundColor: '#fef3c7' }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit Client"
                            style={{
                              width: isTablet ? '30px' : '32px',
                              height: isTablet ? '30px' : '32px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#fff',
                              color: '#f59e0b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isTablet ? '13px' : '14px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FiEdit />
                          </MotionButton>
                          <MotionButton 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(e, customer.id);
                            }}
                            whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
                            whileTap={{ scale: 0.9 }}
                            title="Delete Client"
                            style={{
                              width: isTablet ? '30px' : '32px',
                              height: isTablet ? '30px' : '32px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fff',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isTablet ? '13px' : '14px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FiTrash2 />
                          </MotionButton>
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
              <FiUsers />
            </div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#374151'
            }}>No clients found</h3>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? '14px' : '14px',
              color: '#6b7280',
              padding: '0 16px'
            }}>
              {customers.length === 0 
                ? 'Create your first client to get started'
                : 'No results match your search or filters. Try adjusting your criteria.'
              }
            </p>
            <MotionButton 
              className="btn primary"
              onClick={handleNewCustomer}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={actionInProgress}
              style={{
                padding: isMobile ? '10px 20px' : '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1976d2',
                color: '#fff',
                cursor: actionInProgress ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: actionInProgress ? 0.5 : 1
              }}
            >
              <FiPlus />
              Create New Client
            </MotionButton>
          </div>
        )}
      </div>

      {/* Pagination - Improved with better navigation */}
      {!loading && sortedCustomers.length > 0 && totalPages > 1 && (
        <div className="pagination" style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{
            color: '#6b7280',
            fontSize: isMobile ? '13px' : '14px',
            order: isMobile ? 2 : 1
          }}>
            Showing <strong>all {totalItems}</strong> results
          </div>
          
          <div style={{
            display: 'flex',
            gap: isMobile ? '6px' : '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            order: isMobile ? 1 : 2
          }}>
            {/* First Page Button */}
            <MotionButton
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '8px 12px' : '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
                color: currentPage === 1 ? '#9ca3af' : '#4b5563',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '13px' : '14px',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
              title="First Page"
            >
              <FiChevronsLeft size={isMobile ? 14 : 16} />
              {!isMobile && <span>First</span>}
            </MotionButton>

            {/* Previous Page Button */}
            <MotionButton
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '8px 12px' : '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
                color: currentPage === 1 ? '#9ca3af' : '#4b5563',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '13px' : '14px',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
              title="Previous Page"
            >
              <FiChevronLeft size={isMobile ? 14 : 16} />
              {!isMobile && <span>Prev</span>}
            </MotionButton>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span
                  key={`dots-${index}`}
                  style={{
                    padding: isMobile ? '8px 10px' : '8px 12px',
                    color: '#6b7280',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  ...
                </span>
              ) : (
                <MotionButton
                  key={page}
                  onClick={() => goToPage(page as number)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: currentPage === page ? '#1976d2' : '#e5e7eb',
                    backgroundColor: currentPage === page ? '#1976d2' : '#fff',
                    color: currentPage === page ? '#fff' : '#4b5563',
                    cursor: 'pointer',
                    minWidth: isMobile ? '36px' : '40px',
                    fontWeight: currentPage === page ? '600' : '400',
                    fontSize: isMobile ? '13px' : '14px',
                    boxShadow: currentPage === page ? '0 2px 4px rgba(25,118,210,0.3)' : 'none'
                  }}
                >
                  {page}
                </MotionButton>
              )
            ))}

            {/* Next Page Button */}
            <MotionButton
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '8px 12px' : '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
                color: currentPage === totalPages ? '#9ca3af' : '#4b5563',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '13px' : '14px',
                opacity: currentPage === totalPages ? 0.6 : 1
              }}
              title="Next Page"
            >
              {!isMobile && <span>Next</span>}
              <FiChevronRight size={isMobile ? 14 : 16} />
            </MotionButton>

            {/* Last Page Button */}
            <MotionButton
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '8px 12px' : '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
                color: currentPage === totalPages ? '#9ca3af' : '#4b5563',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '13px' : '14px',
                opacity: currentPage === totalPages ? 0.6 : 1
              }}
              title="Last Page"
            >
              {!isMobile && <span>Last</span>}
              <FiChevronsRight size={isMobile ? 14 : 16} />
            </MotionButton>
          </div>
        </div>
      )}

      {/* Click outside handlers for menus */}
      {showExportMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowExportMenu(false)}
        />
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
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25,118,210,0.1);
        }
        
        .date-range-picker input:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25,118,210,0.1);
        }
        
        .btn.csv-btn:hover {
          background-color: #10b981 !important;
          color: white !important;
        }
        
        .btn.pdf-btn:hover {
          background-color: #ef4444 !important;
          color: white !important;
        }
        
        .btn.new-order-btn:hover {
          background-color: #1976d2 !important;
          color: white !important;
        }

        @media (max-width: 768px) {
          .orders-table {
            min-width: 600px;
          }
        }

        @media (max-width: 480px) {
          .orders-table {
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
          borderRadius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Pagination button hover effect */
        .pagination button:hover:not(:disabled) {
          border-color: #1976d2;
          box-shadow: 0 2px 4px rgba(25,118,210,0.2);
        }
      `}</style>
    </div>
  );
};

export default ClientsTab;
