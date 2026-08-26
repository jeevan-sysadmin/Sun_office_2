// src/components/ProductsTab.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiBattery,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiX,
  FiCheckSquare,
  FiSquare,
  FiSearch,
  FiCalendar,
  FiClock,
  FiMenu,
  FiPrinter,
  FiFilter,
  FiZap,
  FiDollarSign,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import types
import type { Battery, Inverter } from './types';

// Create motion components properly
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionTr = motion.tr;

interface ProductsTabProps {
  // Battery props
  batteries: Battery[];
  filteredBatteries: Battery[];
  filterBatteryType: string;
  filterSpareStatus: string;
  filterWarrantyStatus: string;
  searchTerm: string;
  onViewBattery: (battery: Battery) => void;
  onEditBattery: (battery: Battery) => void;
  onDeleteBattery: (id: number) => void;
  onNewBattery: () => void;
  onFilterBatteryTypeChange: (type: string) => void;
  onFilterSpareStatusChange: (status: string) => void;
  onFilterWarrantyStatusChange: (status: string) => void;
  
  // Inverter props
  inverters?: Inverter[];
  filteredInverters?: Inverter[];
  filterInverterBrand?: string;
  filterInverterStatus?: string;
  filterInverterType?: string;
  onViewInverter?: (inverter: Inverter) => void;
  onEditInverter?: (inverter: Inverter) => void;
  onDeleteInverter?: (id: number) => void;
  onNewInverter?: () => void;
  onFilterInverterBrandChange?: (brand: string) => void;
  onFilterInverterStatusChange?: (status: string) => void;
  onFilterInverterTypeChange?: (type: string) => void;
  
  // Common props
  getBatteryTypeColor: (type: string) => string;
  getInverterTypeColor?: (type: string) => string;
  getWaveTypeColor?: (waveType: string) => string;
  getConditionColor: (condition: string) => string;
  getSpareStatusColor?: (status: string) => string;
  getWarrantyColor?: (status: string) => string;
  loading: boolean;
  activeTab?: 'batteries' | 'inverters';
  onTabChange?: (tab: 'batteries' | 'inverters') => void;
  scanningBatterySerial?: boolean;
  scanningInverterSerial?: boolean;
  scannedBarcode?: string;
}

// Helper function to parse is_spare field consistently
const parseIsSpare = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const str = value.toLowerCase().trim();
    return str === 'true' || str === '1' || str === 'yes' || str === 'y' || str === 'on' || str === 'active';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

const ProductsTab: React.FC<ProductsTabProps> = ({
  batteries,
  filteredBatteries,
  filterBatteryType,
  filterSpareStatus,
  filterWarrantyStatus,
  searchTerm: _searchTerm,
  onViewBattery,
  onEditBattery,
  onDeleteBattery,
  onNewBattery,
  onFilterBatteryTypeChange,
  onFilterSpareStatusChange,
  onFilterWarrantyStatusChange,
  
  inverters = [],
  filteredInverters = [],
  filterInverterBrand = 'all',
  filterInverterStatus = 'all',
  filterInverterType = 'all',
  onViewInverter = () => {},
  onEditInverter = () => {},
  onDeleteInverter = () => {},
  onNewInverter = () => {},
  onFilterInverterBrandChange = () => {},
  onFilterInverterStatusChange = () => {},
  onFilterInverterTypeChange = () => {},
  
  getBatteryTypeColor: _getBatteryTypeColor,
  loading,
  activeTab = 'batteries',
  onTabChange = () => {}
}) => {
  // Date filter states
  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

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
    const currentItems = activeTab === 'batteries' ? batteries : inverters;
    if (currentItems.length > 0) {
      setLastRefreshed(new Date());
    }
  }, [batteries, inverters, activeTab]);

  // Get current items based on active tab
  const currentItems = activeTab === 'batteries' ? filteredBatteries : filteredInverters;
  const allItems = activeTab === 'batteries' ? batteries : inverters;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchTerm, dateFilterType, fromDate, toDate, filterBatteryType, filterSpareStatus, filterInverterBrand, filterInverterStatus, activeTab]);

  // Pagination logic
  const totalItems = currentItems.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;
  const indexOfFirstItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage : 0;
  const indexOfLastItem = totalItems > 0 ? Math.min(indexOfFirstItem + itemsPerPage, totalItems) : 0;
  const displayItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
  const getPageNumbers = (): (number | string)[] => {
    const delta = isMobile ? 1 : 2;
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

  // Format currency
  const formatCurrency = (amount: string | number) => {
    if (!amount) return '₹0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '₹0.00' : `₹${num.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
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

  // Update select all when selection changes
  useEffect(() => {
    if (displayItems.length > 0) {
      const allSelected = displayItems.every(item => selectedItems.has(item.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, displayItems]);

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
    setLocalSearchTerm("");
    if (activeTab === 'batteries') {
      onFilterBatteryTypeChange('all');
      onFilterSpareStatusChange('all');
      onFilterWarrantyStatusChange('all');
    } else {
      onFilterInverterBrandChange('all');
      onFilterInverterStatusChange('all');
      onFilterInverterTypeChange('all');
    }
    setSelectedItems(new Set());
    setSelectAll(false);
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilterType !== "all" || 
    localSearchTerm !== "" || 
    (activeTab === 'batteries' ? 
      (filterBatteryType !== 'all' || filterSpareStatus !== 'all' || filterWarrantyStatus !== 'all') :
      (filterInverterBrand !== 'all' || filterInverterStatus !== 'all' || filterInverterType !== 'all')
    );

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
      const allIds = new Set(displayItems.map(item => item.id));
      setSelectedItems(allIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  // Handle delete
  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (activeTab === 'batteries') {
      onDeleteBattery(id);
    } else {
      onDeleteInverter(id);
    }
  };

  // Handle bulk delete
  const handleBulkDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected ${activeTab}?`)) {
      selectedItems.forEach(id => {
        if (activeTab === 'batteries') {
          onDeleteBattery(id);
        } else {
          onDeleteInverter(id);
        }
      });
      setSelectedItems(new Set());
      setSelectAll(false);
      setShowMobileActions(false);
      setCurrentPage(1);
    }
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, item: Battery | Inverter) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeTab === 'batteries') {
      onEditBattery(item as Battery);
    } else {
      onEditInverter(item as Inverter);
    }
  };

  // Handle view click
  const handleViewClick = (e: React.MouseEvent, item: Battery | Inverter) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeTab === 'batteries') {
      onViewBattery(item as Battery);
    } else {
      onViewInverter(item as Inverter);
    }
  };

  // Handle print function
  const handlePrint = () => {
    const selectedData = displayItems.filter(item => selectedItems.has(item.id));
    const dataToPrint = selectedData.length > 0 ? selectedData : displayItems;
    
    if (dataToPrint.length === 0) {
      alert(`No ${activeTab} to print`);
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeTab === 'batteries' ? 'Battery' : 'Inverter'} Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: ${activeTab === 'batteries' ? '#3b82f6' : '#f59e0b'}; }
          .header { margin-bottom: 20px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: ${activeTab === 'batteries' ? '#3b82f6' : '#f59e0b'}; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          @media print {
            body { margin: 0.5in; }
            .no-print { display: none; }
          }
          @media (max-width: 768px) {
            body { margin: 10px; }
            h1 { font-size: 20px; }
            table { font-size: 12px; }
            th, td { padding: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${activeTab === 'batteries' ? 'Battery' : 'Inverter'} Report</h1>
          <div class="metadata">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Records:</strong> ${dataToPrint.length}</p>
            <p><strong>Date Range:</strong> ${dateFilterType === 'today' ? 'Today' : dateFilterType === 'this_week' ? 'This Week' : dateFilterType === 'this_month' ? 'This Month' : dateFilterType === 'this_year' ? 'This Year' : dateFilterType === 'custom' ? `${formatDate(fromDate)} to ${formatDate(toDate)}` : 'All Time'}</p>
          </div>
        </div>
        
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Model</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Condition</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${dataToPrint.map(item => {
                if (activeTab === 'batteries') {
                  const battery = item as Battery;
                  return `
                    <tr>
                      <td>${battery.battery_code || `BATT${battery.id}`}</td>
                      <td>${battery.battery_model || 'N/A'}</td>
                      <td>${battery.brand || 'N/A'}</td>
                      <td>${formatCurrency(battery.price)}</td>
                      <td>${(battery.battery_condition || 'N/A').toUpperCase()}</td>
                      <td>${formatDate(battery.created_at)}</td>
                    </tr>
                  `;
                } else {
                  const inverter = item as Inverter;
                  return `
                    <tr>
                      <td>${inverter.inverter_code || `INV${inverter.id}`}</td>
                      <td>${inverter.inverter_model || 'N/A'}</td>
                      <td>${inverter.inverter_brand || 'N/A'}</td>
                      <td>${formatCurrency(inverter.price)}</td>
                      <td>${(inverter.inverter_condition || 'N/A').toUpperCase()}</td>
                      <td>${formatDate(inverter.created_at)}</td>
                    </tr>
                  `;
                }
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Report generated from Sun Water Service System</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: ${activeTab === 'batteries' ? '#3b82f6' : '#f59e0b'}; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Get selected items data
  const getSelectedItems = () => {
    return displayItems.filter(item => selectedItems.has(item.id));
  };

  // Export to CSV
  const exportToCSV = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : displayItems;
      
      if (dataToExport.length === 0) {
        alert(`No ${activeTab} to export`);
        return;
      }

      let exportData: any[] = [];
      
      if (activeTab === 'batteries') {
        exportData = (dataToExport as Battery[]).map(item => ({
          'Battery Code': item.battery_code || `BATT${item.id.toString().padStart(3, '0')}`,
          'Model': item.battery_model || '',
          'Serial': item.battery_serial || '',
          'Brand': item.brand || '',
          'Type': item.battery_type || '',
          'Capacity': item.capacity || '',
          'Voltage': item.voltage || '',
          'Price': formatCurrency(item.price),
          'Warranty': item.warranty_period || '',
          'Condition': item.battery_condition || '',
          'Is Spare': parseIsSpare(item.is_spare) ? 'Yes' : 'No',
          'Created Date': formatDate(item.created_at)
        }));
      } else {
        exportData = (dataToExport as Inverter[]).map(item => ({
          'Inverter Code': item.inverter_code || `INV${item.id.toString().padStart(3, '0')}`,
          'Model': item.inverter_model || '',
          'Brand': item.inverter_brand || '',
          'Type': item.type || '',
          'Power Rating': item.power_rating || '',
          'Wave Type': item.wave_type || '',
          'Price': formatCurrency(item.price),
          'Condition': item.inverter_condition || '',
          'Warranty': item.warranty_period || '',
          'Created Date': formatDate(item.created_at)
        }));
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
      
      const fileName = selectedOnly
        ? `selected_${activeTab}_${formatDateForFilename()}.csv`
        : `${activeTab}_export_${formatDateForFilename()}.csv`;
      
      XLSX.writeFile(wb, fileName);
      
      if (selectedOnly) setShowMobileActions(false);
    } catch (error) {
      console.error('CSV Export Error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF
  const exportToPDF = (selectedOnly: boolean = false) => {
    try {
      const dataToExport = selectedOnly ? getSelectedItems() : displayItems;
      
      if (dataToExport.length === 0) {
        alert(`No ${activeTab} to export`);
        return;
      }

      const doc = new jsPDF({
        orientation: isMobile ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFillColor(activeTab === 'batteries' ? 59 : 245, activeTab === 'batteries' ? 130 : 158, activeTab === 'batteries' ? 246 : 11);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(activeTab === 'batteries' ? 'Battery Management' : 'Inverter Management', 14, 13);

      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(isMobile ? 14 : 16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${activeTab === 'batteries' ? 'Battery' : 'Inverter'} Report`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
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
      let tableColumn: string[];
      let tableRows: any[][];

      if (activeTab === 'batteries') {
        tableColumn = isMobile 
          ? ['Code', 'Model', 'Brand', 'Price']
          : ['Code', 'Model', 'Brand', 'Type', 'Capacity', 'Price', 'Condition', 'Created'];

        tableRows = (dataToExport as Battery[]).map(item => {
          if (isMobile) {
            return [
              item.battery_code || `BATT${item.id}`,
              item.battery_model || '',
              item.brand || '',
              formatCurrency(item.price)
            ];
          }
          return [
            item.battery_code || `BATT${item.id}`,
            item.battery_model || '',
            item.brand || '',
            item.battery_type || '',
            item.capacity || '',
            formatCurrency(item.price),
            item.battery_condition || '',
            formatDate(item.created_at)
          ];
        });
      } else {
        tableColumn = isMobile 
          ? ['Code', 'Model', 'Brand', 'Price']
          : ['Code', 'Model', 'Brand', 'Type', 'Power', 'Price', 'Condition', 'Created'];

        tableRows = (dataToExport as Inverter[]).map(item => {
          if (isMobile) {
            return [
              item.inverter_code || `INV${item.id}`,
              item.inverter_model || '',
              item.inverter_brand || '',
              formatCurrency(item.price)
            ];
          }
          return [
            item.inverter_code || `INV${item.id}`,
            item.inverter_model || '',
            item.inverter_brand || '',
            item.type || '',
            item.power_rating || '',
            formatCurrency(item.price),
            item.inverter_condition || '',
            formatDate(item.created_at)
          ];
        });
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
          fillColor: activeTab === 'batteries' ? [59, 130, 246] : [245, 158, 11],
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
        ? `selected_${activeTab}_${formatDateForFilename()}.pdf`
        : `${activeTab}_export_${formatDateForFilename()}.pdf`;
      
      doc.save(fileName);
      
      if (selectedOnly) setShowMobileActions(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Render mobile card view
  const renderMobileCard = (item: Battery | Inverter) => (
    <div
      key={item.id}
      onClick={(e) => handleViewClick(e, item)}
      style={{
        backgroundColor: selectedItems.has(item.id) ? '#eff6ff' : '#fff',
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
            onClick={(e) => handleSelectItem(item.id, e)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedItems.has(item.id) ? (activeTab === 'batteries' ? '#3b82f6' : '#f59e0b') : '#6b7280'
            }}
          >
            {selectedItems.has(item.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
          </MotionDiv>
          <div>
            <div style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>
              {activeTab === 'batteries' 
                ? (item as Battery).battery_code || `BATT${item.id}`
                : (item as Inverter).inverter_code || `INV${item.id}`}
            </div>
            <div style={{ fontSize: '12px', color: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b', fontWeight: '500' }}>
              #{item.id}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewClick(e, item);
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
              handleEditClick(e, item);
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
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Model</div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>
            {activeTab === 'batteries' 
              ? (item as Battery).battery_model || 'N/A'
              : (item as Inverter).inverter_model || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTag size={10} /> 
            {activeTab === 'batteries' 
              ? (item as Battery).brand || 'No Brand'
              : (item as Inverter).inverter_brand || 'No Brand'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Price</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'batteries' ? '#eff6ff' : '#fef3c7',
              color: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              <FiDollarSign size={14} />
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{formatCurrency(item.price)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Created Date</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCalendar size={12} color="#6b7280" />
            <span style={{ fontSize: '12px' }}>{formatDate(item.created_at)}</span>
          </div>
        </div>
        <div>
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: item.status === 'active' ? '#d1fae5' : '#fee2e2',
            color: item.status === 'active' ? '#065f46' : '#991b1b'
          }}>
            {item.status?.toUpperCase() || 'ACTIVE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => handleDeleteClick(e, item.id)}
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
    <div className="products-section" style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      padding: '0',
      width: '100%'
    }}>
      {/* Hero Section */}
      <div className="products-hero" style={{
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
            {activeTab === 'batteries' ? <FiBattery /> : <FiZap />}
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
              {activeTab === 'batteries' ? 'Battery Management' : 'Inverter Management'}
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
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} {activeTab}
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
            </motion.button>
          )}

          {/* Actions */}
          {(!isMobile || showMobileActions) && (
            <>
              {/* Tab Switcher */}
              <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
                <motion.button 
                  className="btn"
                  onClick={() => {
                    onTabChange('batteries');
                    setSelectedItems(new Set());
                    setSelectAll(false);
                    setCurrentPage(1);
                    if (isMobile) setShowMobileActions(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'batteries' ? 'white' : 'rgba(255,255,255,0.2)',
                    color: activeTab === 'batteries' ? '#667eea' : 'white',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '8px',
                    boxShadow: activeTab === 'batteries' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                    flex: isMobile ? '1' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <FiBattery size={isMobile ? 16 : 18} />
                  <span>Batteries</span>
                </motion.button>
                <motion.button 
                  className="btn"
                  onClick={() => {
                    onTabChange('inverters');
                    setSelectedItems(new Set());
                    setSelectAll(false);
                    setCurrentPage(1);
                    if (isMobile) setShowMobileActions(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'inverters' ? 'white' : 'rgba(255,255,255,0.2)',
                    color: activeTab === 'inverters' ? '#667eea' : 'white',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '8px',
                    boxShadow: activeTab === 'inverters' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                    flex: isMobile ? '1' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <FiZap size={isMobile ? 16 : 18} />
                  <span>Inverters</span>
                </motion.button>
              </div>

              {/* Create New Button */}
              <motion.button 
                className="btn new-order-btn"
                onClick={() => {
                  if (activeTab === 'batteries') {
                    onNewBattery();
                  } else {
                    onNewInverter();
                  }
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`Create New ${activeTab === 'batteries' ? 'Battery' : 'Inverter'}`}
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
                <FiPlus size={isMobile ? 16 : 18} />
                <span>{isMobile ? 'New' : `New ${activeTab === 'batteries' ? 'Battery' : 'Inverter'}`}</span>
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
                disabled={displayItems.length === 0}
                title="Export to CSV"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#10b981',
                  cursor: displayItems.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayItems.length === 0 ? 0.5 : 1,
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
                disabled={displayItems.length === 0}
                title="Export to PDF"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#ef4444',
                  cursor: displayItems.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayItems.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiDownload size={isMobile ? 14 : 16} />
                <span>PDF</span>
              </motion.button>
              
              {/* Print Button */}
              <motion.button 
                className="btn print-btn"
                onClick={() => {
                  handlePrint();
                  if (isMobile) setShowMobileActions(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={displayItems.length === 0}
                title="Print"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  color: '#3b82f6',
                  cursor: displayItems.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: displayItems.length === 0 ? 0.5 : 1,
                  flex: isMobile ? '1' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <FiPrinter size={isMobile ? 14 : 16} />
                <span>Print</span>
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
            placeholder={isMobile ? "Search..." : `Search by code, model, brand...`}
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
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
            <motion.button 
              className="clear-search"
              onClick={() => setLocalSearchTerm('')}
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

        {/* Category Filter */}
        {activeTab === 'batteries' ? (
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
              value={filterBatteryType}
              onChange={(e) => onFilterBatteryTypeChange(e.target.value)}
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
              <option value="all">All Types</option>
              <option value="tubular">Tubular</option>
              <option value="flat_plate">Flat Plate</option>
              <option value="smf">SMF</option>
              <option value="gel">Gel</option>
            </select>
          </div>
        ) : (
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
              value={filterInverterBrand}
              onChange={(e) => onFilterInverterBrandChange(e.target.value)}
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
              <option value="all">All Brands</option>
              <option value="luminous">Luminous</option>
              <option value="microtek">Microtek</option>
              <option value="su-kam">Su-Kam</option>
              <option value="exide">Exide</option>
            </select>
          </div>
        )}

        {/* Status Filter */}
        {activeTab === 'batteries' ? (
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
              value={filterSpareStatus}
              onChange={(e) => onFilterSpareStatusChange(e.target.value)}
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
              <option value="all">All Batteries</option>
              <option value="regular">Regular</option>
              <option value="spare">Spare</option>
            </select>
          </div>
        ) : (
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
              value={filterInverterStatus}
              onChange={(e) => onFilterInverterStatusChange(e.target.value)}
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under_maintenance">Under Maintenance</option>
            </select>
          </div>
        )}

        {/* Items Per Page Dropdown */}
        <div className="filter-box" style={{
          position: 'relative',
          flex: isMobile ? 'auto' : '0.5',
          width: isMobile ? '100%' : 'auto'
        }}>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
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
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
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
          {activeTab === 'batteries' ? (
            <FiBattery className="info-icon" style={{ color: '#3b82f6', fontSize: isMobile ? '16px' : '18px' }} />
          ) : (
            <FiZap className="info-icon" style={{ color: '#f59e0b', fontSize: isMobile ? '16px' : '18px' }} />
          )}
          <div className="info-text">
            <span className="info-label" style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Total {activeTab === 'batteries' ? 'Batteries' : 'Inverters'}</span>
            <span className="info-value" style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#111827' }}>{allItems.length}</span>
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
      </div>

      {/* Results Info with Selection Controls */}
      {currentItems.length > 0 && (
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
                    color: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b',
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
              Showing <strong>{totalItems === 0 ? 0 : indexOfFirstItem + 1}-{indexOfLastItem}</strong> of <strong>{totalItems}</strong> {activeTab}
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
                <button onClick={() => setLocalSearchTerm('')} style={{
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
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ margin: '0', fontSize: isMobile ? '14px' : '14px' }}>Loading {activeTab} data...</p>
          </div>
        ) : displayItems.length > 0 ? (
          <>
            {/* Mobile Card View */}
            {isMobile && (
              <div style={{ padding: '16px' }}>
                {displayItems.map((item) => renderMobileCard(item))}
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
                    backgroundColor: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b',
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
                    }}>Model</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Brand</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {activeTab === 'batteries' ? 'Type' : 'Power'}
                    </th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {activeTab === 'batteries' ? 'Capacity' : 'Wave Type'}
                    </th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Price</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Condition</th>
                    <th style={{
                      padding: isTablet ? '12px' : '14px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontSize: isTablet ? '11px' : '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Created Date</th>
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
                  {displayItems.map((item, index) => (
                    <MotionTr 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={(e) => handleViewClick(e, item)}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: selectedItems.has(item.id) ? '#eff6ff' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ 
                        padding: isTablet ? '12px' : '14px',
                        textAlign: 'center',
                        width: '40px'
                      }}>
                        <MotionDiv
                          onClick={(e) => handleSelectItem(item.id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedItems.has(item.id) ? (activeTab === 'batteries' ? '#3b82f6' : '#f59e0b') : '#6b7280'
                          }}
                        >
                          {selectedItems.has(item.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        </MotionDiv>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: isTablet ? '13px' : '14px' }}>
                          {activeTab === 'batteries' 
                            ? (item as Battery).battery_code || `BATT${item.id}`
                            : (item as Inverter).inverter_code || `INV${item.id}`}
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: isTablet ? '32px' : '36px',
                            height: isTablet ? '32px' : '36px',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'batteries' ? '#eff6ff' : '#fef3c7',
                            color: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isTablet ? '16px' : '18px',
                            flexShrink: 0
                          }}>
                            {activeTab === 'batteries' ? <FiBattery /> : <FiZap />}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px', fontSize: isTablet ? '13px' : '14px' }}>
                              {activeTab === 'batteries' 
                                ? (item as Battery).battery_model || 'N/A'
                                : (item as Inverter).inverter_model || 'N/A'}
                            </div>
                            <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#6b7280' }}>
                              {activeTab === 'batteries' 
                                ? (item as Battery).battery_serial || 'No serial'
                                : (item as Inverter).inverter_serial || 'No serial'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{ fontSize: isTablet ? '13px' : '14px', color: '#4b5563' }}>
                          {activeTab === 'batteries' 
                            ? (item as Battery).brand || 'N/A'
                            : (item as Inverter).inverter_brand || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: isTablet ? '11px' : '12px',
                          fontWeight: '500',
                          backgroundColor: activeTab === 'batteries' ? '#e0f2fe' : '#fed7aa',
                          color: activeTab === 'batteries' ? '#0369a1' : '#9a3412'
                        }}>
                          {activeTab === 'batteries' 
                            ? (item as Battery).battery_type || 'N/A'
                            : (item as Inverter).power_rating || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#4b5563' }}>
                          {activeTab === 'batteries' 
                            ? (item as Battery).capacity || 'N/A'
                            : (item as Inverter).wave_type || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{ fontWeight: '600', color: '#059669' }}>
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: isTablet ? '11px' : '12px',
                          fontWeight: '500',
                          backgroundColor: 
                            (activeTab === 'batteries' 
                              ? (item as Battery).battery_condition 
                              : (item as Inverter).inverter_condition) === 'excellent' ? '#d1fae5' :
                            (activeTab === 'batteries' 
                              ? (item as Battery).battery_condition 
                              : (item as Inverter).inverter_condition) === 'good' ? '#dbeafe' : '#fee2e2',
                          color: 
                            (activeTab === 'batteries' 
                              ? (item as Battery).battery_condition 
                              : (item as Inverter).inverter_condition) === 'excellent' ? '#065f46' :
                            (activeTab === 'batteries' 
                              ? (item as Battery).battery_condition 
                              : (item as Inverter).inverter_condition) === 'good' ? '#1e40af' : '#991b1b'
                        }}>
                          {activeTab === 'batteries' 
                            ? ((item as Battery).battery_condition || 'N/A').toUpperCase()
                            : ((item as Inverter).inverter_condition || 'N/A').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: isTablet ? '12px' : '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar style={{ color: '#6b7280', fontSize: isTablet ? '11px' : '12px' }} />
                          <span style={{ fontSize: isTablet ? '12px' : '13px', color: '#4b5563' }}>
                            {formatDate(item.created_at)}
                          </span>
                        </div>
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
                              handleViewClick(e, item);
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
                            onClick={(e) => handleEditClick(e, item)}
                            whileHover={{ scale: 1.1, backgroundColor: '#fef3c7' }}
                            whileTap={{ scale: 0.9 }}
                            title={`Edit ${activeTab === 'batteries' ? 'Battery' : 'Inverter'}`}
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
                            onClick={(e) => handleDeleteClick(e, item.id)}
                            whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
                            whileTap={{ scale: 0.9 }}
                            title={`Delete ${activeTab === 'batteries' ? 'Battery' : 'Inverter'}`}
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
              {activeTab === 'batteries' ? <FiBattery /> : <FiZap />}
            </div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#374151'
            }}>No {activeTab} found</h3>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? '14px' : '14px',
              color: '#6b7280',
              padding: '0 16px'
            }}>
              {allItems.length === 0 
                ? `Create your first ${activeTab === 'batteries' ? 'battery' : 'inverter'} to get started`
                : 'No results match your search or filters. Try adjusting your criteria.'
              }
            </p>
            <MotionButton 
              className="btn primary"
              onClick={activeTab === 'batteries' ? onNewBattery : onNewInverter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '10px 20px' : '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'batteries' ? '#3b82f6' : '#f59e0b',
                color: '#fff',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiPlus />
              Create New {activeTab === 'batteries' ? 'Battery' : 'Inverter'}
            </MotionButton>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && currentItems.length > 0 && totalPages > 1 && (
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
            Showing <strong>{totalItems === 0 ? 0 : indexOfFirstItem + 1}-{indexOfLastItem}</strong> of <strong>{totalItems}</strong> results
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
                    borderColor: currentPage === page ? (activeTab === 'batteries' ? '#3b82f6' : '#f59e0b') : '#e5e7eb',
                    backgroundColor: currentPage === page ? (activeTab === 'batteries' ? '#3b82f6' : '#f59e0b') : '#fff',
                    color: currentPage === page ? '#fff' : '#4b5563',
                    cursor: 'pointer',
                    minWidth: isMobile ? '36px' : '40px',
                    fontWeight: currentPage === page ? '600' : '400',
                    fontSize: isMobile ? '13px' : '14px',
                    boxShadow: currentPage === page ? `0 2px 4px ${activeTab === 'batteries' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}` : 'none'
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
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Pagination button hover effect */
        .pagination button:hover:not(:disabled) {
          border-color: #667eea;
          box-shadow: 0 2px 4px rgba(102,126,234,0.2);
        }
      `}</style>
    </div>
  );
};

export default ProductsTab;
