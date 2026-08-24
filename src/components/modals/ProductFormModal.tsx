// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\components\modals\ProductFormModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FiX,
  FiSave,
  FiBattery,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiInfo,
  FiCheckCircle,
  FiZap,
  FiCpu,
  FiAlertCircle,
  FiLoader,
  FiRefreshCw,
  FiRadio,
  FiCamera,
  FiHash
} from "react-icons/fi";

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
  price: string | number;
  warranty_period: string;
  amc_period: string;
  battery_condition: string;
  status: string;
  specifications?: string;
  purchase_date?: string;
  installation_date?: string;
  inverter?: string;
  is_spare?: any;
  spare_status?: string;
  stock_quantity?: string;
}

interface Inverter {
  id: number;
  inverter_code: string;
  inverter_model: string;
  inverter_serial: string;
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
  price: string | number;
  status: string;
  purchase_date?: string;
  installation_date?: string;
  inverter_condition: string;
}

interface ProductFormModalProps {
  product: Battery | Inverter | null;
  productType: 'battery' | 'inverter';
  onClose: () => void;
  onSave: (productData: any, isEdit: boolean, productType: 'battery' | 'inverter') => Promise<void>;
  loading: boolean;
  scannedBarcode?: string;
  scanningActive?: boolean;
  onBarcodeScanned?: (barcode: string) => void;
}

// Helper function to parse barcode data
interface ParsedBarcodeData {
  model?: string;
  serial?: string;
  brand?: string;
  [key: string]: string | undefined;
}

const parseBarcodeData = (barcode: string): ParsedBarcodeData => {
  const result: ParsedBarcodeData = {};
  
  // Common barcode formats for batteries and inverters
  
  // Format 1: MODEL:ABC123|SERIAL:XYZ789|BRAND:Exide
  if (barcode.includes('|') || barcode.includes(',')) {
    const separator = barcode.includes('|') ? '|' : ',';
    const parts = barcode.split(separator);
    
    parts.forEach(part => {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key && value) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('model')) result.model = value;
        if (lowerKey.includes('serial')) result.serial = value;
        if (lowerKey.includes('brand')) result.brand = value;
      }
    });
  }
  
  // Format 2: Simple format - try to extract intelligently
  else if (barcode.length > 10) {
    // Try to detect patterns
    // Example: EXIDE-150AH-2025-001 or LUMINOUS-1100VA-SN12345
    const parts = barcode.split(/[-_]/);
    
    if (parts.length >= 3) {
      // First part might be brand
      if (parts[0].match(/^[A-Z]+$/i)) {
        result.brand = parts[0];
      }
      
      // Middle parts might contain model
      const possibleModel = parts.slice(1, -1).join('-');
      if (possibleModel) {
        result.model = possibleModel;
      }
      
      // Last part might be serial
      result.serial = parts[parts.length - 1];
    } else if (parts.length === 2) {
      // Format: MODEL-SERIAL
      result.model = parts[0];
      result.serial = parts[1];
    } else {
      // Just treat the whole thing as serial if it looks like one
      if (barcode.match(/^[A-Z0-9]{8,}$/i)) {
        result.serial = barcode;
      } else {
        result.model = barcode;
      }
    }
  }
  
  // Format 3: Just a serial number
  else if (barcode.length >= 5) {
    result.serial = barcode;
  }
  
  // If no parsing succeeded, treat as serial
  if (!result.model && !result.serial && !result.brand) {
    result.serial = barcode;
  }
  
  return result;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  productType,
  onClose,
  onSave,
  loading,
  scannedBarcode = "",
  scanningActive = false,
  onBarcodeScanned
}) => {
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Refs for input fields
  const batteryModelRef = useRef<HTMLInputElement>(null);
  const batterySerialRef = useRef<HTMLTextAreaElement>(null);
  const batteryBrandRef = useRef<HTMLInputElement>(null);
  const inverterModelRef = useRef<HTMLInputElement>(null);
  const inverterSerialRef = useRef<HTMLTextAreaElement>(null);
  const inverterBrandRef = useRef<HTMLInputElement>(null);
  const hiddenBarcodeInputRef = useRef<HTMLInputElement>(null);

  // State for barcode input
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(scanningActive);
  const [, setParsedData] = useState<ParsedBarcodeData>({});

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update scanning state when prop changes
  useEffect(() => {
    setIsScanning(scanningActive);
  }, [scanningActive]);

  // Handle scanned barcode
  useEffect(() => {
    if (scannedBarcode && scannedBarcode.trim() !== "") {
      handleBarcodeData(scannedBarcode);
    }
  }, [scannedBarcode]);

  // Focus hidden input when scanning starts
  useEffect(() => {
    if (isScanning && hiddenBarcodeInputRef.current) {
      hiddenBarcodeInputRef.current.focus();
    }
  }, [isScanning]);

  // Parse and apply barcode data
  const handleBarcodeData = (barcode: string) => {
    const parsed = parseBarcodeData(barcode);
    setParsedData(parsed);
    
    if (productType === 'battery') {
      // Update battery form fields
      const updates: Record<string, string> = {};
      
      if (parsed.model) {
        updates.battery_model = parsed.model;
      }
      if (parsed.serial) {
        updates.battery_serial = parsed.serial;
      }
      if (parsed.brand) {
        updates.brand = parsed.brand;
      }
      
      if (Object.keys(updates).length > 0) {
        setBatteryFormData(prev => ({ ...prev, ...updates }));
        
        // Focus the next empty field
        setTimeout(() => {
          if (!parsed.model && batteryModelRef.current) {
            batteryModelRef.current.focus();
          } else if (!parsed.serial && batterySerialRef.current) {
            batterySerialRef.current.focus();
          } else if (!parsed.brand && batteryBrandRef.current) {
            batteryBrandRef.current.focus();
          }
        }, 100);
      }
      
      // Show success message
      setBarcodeSuccess(`Barcode scanned successfully! ${Object.keys(updates).length} field(s) populated.`);
      setTimeout(() => setBarcodeSuccess(null), 3000);
    } else {
      // Update inverter form fields
      const updates: Record<string, string> = {};
      
      if (parsed.model) {
        updates.inverter_model = parsed.model;
      }
      if (parsed.serial) {
        updates.inverter_serial = parsed.serial;
      }
      if (parsed.brand) {
        updates.inverter_brand = parsed.brand;
      }
      
      if (Object.keys(updates).length > 0) {
        setInverterFormData(prev => ({ ...prev, ...updates }));
        
        // Focus the next empty field
        setTimeout(() => {
          if (!parsed.model && inverterModelRef.current) {
            inverterModelRef.current.focus();
          } else if (!parsed.serial && inverterSerialRef.current) {
            inverterSerialRef.current.focus();
          } else if (!parsed.brand && inverterBrandRef.current) {
            inverterBrandRef.current.focus();
          }
        }, 100);
      }
      
      // Show success message
      setBarcodeSuccess(`Barcode scanned successfully! ${Object.keys(updates).length} field(s) populated.`);
      setTimeout(() => setBarcodeSuccess(null), 3000);
    }
    
    // Reset barcode input
    setBarcodeInput("");
    
    // Notify parent if callback exists
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode);
    }
  };

  // Handle manual barcode input
  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = barcodeInput.trim();
      if (barcode) {
        handleBarcodeData(barcode);
      }
    }
  };

  // Start scanning mode
  const startScanning = () => {
    setIsScanning(true);
    setBarcodeInput("");
    if (hiddenBarcodeInputRef.current) {
      hiddenBarcodeInputRef.current.focus();
    }
    setBarcodeMessage("Scanning mode active. Please scan barcode...");
    setTimeout(() => setBarcodeMessage(null), 3000);
  };

  // Stop scanning mode
  const stopScanning = () => {
    setIsScanning(false);
    setBarcodeInput("");
    setBarcodeMessage(null);
  };

  // Check device type
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const isEdit = !!product;
  
  // Battery form state
  const [batteryFormData, setBatteryFormData] = useState({
    battery_model: "",
    battery_serial: "",
    brand: "",
    capacity: "",
    voltage: "12V",
    battery_type: "lead_acid",
    category: "inverter",
    status: "active",
    price: "",
    warranty_period: "1 year",
    amc_period: "0",
    battery_condition: "good",
    specifications: "",
    purchase_date: "",
    installation_date: ""
  });
  
  // Inverter form state
  const [inverterFormData, setInverterFormData] = useState({
    inverter_model: "",
    inverter_serial: "",
    inverter_brand: "",
    power_rating: "",
    type: "inverter",
    wave_type: "modified_sine",
    input_voltage: "230V",
    output_voltage: "230V",
    efficiency: "",
    battery_voltage: "12V",
    specifications: "",
    warranty_period: "1 year",
    price: "",
    status: "active",
    purchase_date: "",
    installation_date: "",
    inverter_condition: "good"
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [barcodeMessage, setBarcodeMessage] = useState<string | null>(null);
  const [barcodeSuccess, setBarcodeSuccess] = useState<string | null>(null);

  // Initialize form data based on product and type
  useEffect(() => {
    if (product && productType === 'battery') {
      const battery = product as Battery;
      setBatteryFormData({
        battery_model: battery.battery_model || "",
        battery_serial: battery.battery_serial || "",
        brand: battery.brand || "",
        capacity: battery.capacity || "",
        voltage: battery.voltage || "12V",
        battery_type: battery.battery_type || "lead_acid",
        category: battery.category || "inverter",
        status: battery.status || "active",
        price: typeof battery.price === 'number' ? battery.price.toString() : (battery.price || "0"),
        warranty_period: battery.warranty_period || "1 year",
        amc_period: battery.amc_period || "0",
        battery_condition: battery.battery_condition || "good",
        specifications: battery.specifications || "",
        purchase_date: battery.purchase_date || "",
        installation_date: battery.installation_date || ""
      });
    } else if (product && productType === 'inverter') {
      const inverter = product as Inverter;
      setInverterFormData({
        inverter_model: inverter.inverter_model || "",
        inverter_serial: inverter.inverter_serial || "",
        inverter_brand: inverter.inverter_brand || "",
        power_rating: inverter.power_rating || "",
        type: inverter.type || "inverter",
        wave_type: inverter.wave_type || "modified_sine",
        input_voltage: inverter.input_voltage || "230V",
        output_voltage: inverter.output_voltage || "230V",
        efficiency: inverter.efficiency || "",
        battery_voltage: inverter.battery_voltage || "12V",
        specifications: inverter.specifications || "",
        warranty_period: inverter.warranty_period || "1 year",
        price: typeof inverter.price === 'number' ? inverter.price.toString() : (inverter.price || "0"),
        status: inverter.status || "active",
        purchase_date: inverter.purchase_date || "",
        installation_date: inverter.installation_date || "",
        inverter_condition: inverter.inverter_condition || "good"
      });
    } else {
      // Reset forms for new product
      setBatteryFormData({
        battery_model: "",
        battery_serial: "",
        brand: "",
        capacity: "",
        voltage: "12V",
        battery_type: "lead_acid",
        category: "inverter",
        status: "active",
        price: "",
        warranty_period: "1 year",
        amc_period: "0",
        battery_condition: "good",
        specifications: "",
        purchase_date: "",
        installation_date: ""
      });
      
      setInverterFormData({
        inverter_model: "",
        inverter_serial: "",
        inverter_brand: "",
        power_rating: "",
        type: "inverter",
        wave_type: "modified_sine",
        input_voltage: "230V",
        output_voltage: "230V",
        efficiency: "",
        battery_voltage: "12V",
        specifications: "",
        warranty_period: "1 year",
        price: "",
        status: "active",
        purchase_date: "",
        installation_date: "",
        inverter_condition: "good"
      });
    }
  }, [product, productType]);

  // Handle battery form change
  const handleBatteryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setBatteryFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setBatteryFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setLocalError(null);
  };

  // Handle inverter form change
  const handleInverterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInverterFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setLocalError(null);
  };

  // Validate battery form - No required fields now
  const validateBatteryForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Price validation only
    if (batteryFormData.price && parseFloat(batteryFormData.price) < 0) {
      newErrors.price = "Price cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate inverter form - No required fields now
  const validateInverterForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Price validation only
    if (inverterFormData.price && parseFloat(inverterFormData.price) < 0) {
      newErrors.price = "Price cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || loading) return;
    
    setSubmitting(true);
    setLocalError(null);
    
    try {
      if (productType === 'battery') {
        if (!validateBatteryForm()) {
          setSubmitting(false);
          return;
        }
        
        const batteryData = {
          battery_model: batteryFormData.battery_model?.trim() || "",
          battery_serial: batteryFormData.battery_serial?.trim() || "",
          brand: batteryFormData.brand?.trim() || "",
          capacity: batteryFormData.capacity?.trim() || "",
          voltage: batteryFormData.voltage || "12V",
          battery_type: batteryFormData.battery_type || "lead_acid",
          category: batteryFormData.category || "inverter",
          status: batteryFormData.status || "active",
          price: parseFloat(batteryFormData.price || "0").toString(),
          warranty_period: batteryFormData.warranty_period || "1 year",
          amc_period: batteryFormData.amc_period || "0",
          battery_condition: batteryFormData.battery_condition || "good",
          specifications: batteryFormData.specifications?.trim() || "",
          purchase_date: batteryFormData.purchase_date || null,
          installation_date: batteryFormData.installation_date || null
        };
        
        // Add ID for edit mode
        if (isEdit && product) {
          (batteryData as any).id = product.id;
        }
        
        await onSave(batteryData, isEdit, 'battery');
        
      } else {
        if (!validateInverterForm()) {
          setSubmitting(false);
          return;
        }
        
        const inverterData = {
          inverter_model: inverterFormData.inverter_model?.trim() || "",
          inverter_serial: inverterFormData.inverter_serial?.trim() || "",
          inverter_brand: inverterFormData.inverter_brand?.trim() || "",
          power_rating: inverterFormData.power_rating?.trim() || "",
          type: inverterFormData.type || "inverter",
          wave_type: inverterFormData.wave_type || "modified_sine",
          input_voltage: inverterFormData.input_voltage || "230V",
          output_voltage: inverterFormData.output_voltage || "230V",
          efficiency: inverterFormData.efficiency?.trim() || "",
          battery_voltage: inverterFormData.battery_voltage || "12V",
          specifications: inverterFormData.specifications?.trim() || "",
          warranty_period: inverterFormData.warranty_period || "1 year",
          price: parseFloat(inverterFormData.price || "0").toString(),
          status: inverterFormData.status || "active",
          purchase_date: inverterFormData.purchase_date || null,
          installation_date: inverterFormData.installation_date || null,
          inverter_condition: inverterFormData.inverter_condition || "good"
        };
        
        // Add ID for edit mode
        if (isEdit && product) {
          (inverterData as any).id = product.id;
        }
        
        await onSave(inverterData, isEdit, 'inverter');
      }
      
    } catch (error: any) {
      console.error("Error saving product:", error);
      setLocalError(error.message || "Failed to save product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Battery form options
  const batteryTypes = [
    { value: "lead_acid", label: "Lead Acid" },
    { value: "lithium_ion", label: "Lithium Ion" },
    { value: "gel", label: "Gel" },
    { value: "agm", label: "AGM" },
    { value: "tubular", label: "Tubular" },
    { value: "other", label: "Other" }
  ];
  
  const batteryCategories = [
    { value: "inverter", label: "Inverter Battery" },
    { value: "solar", label: "Solar Battery" },
    { value: "ups", label: "UPS Battery" },
    { value: "automotive", label: "Automotive Battery" },
    { value: "other", label: "Other" }
  ];
  
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ];
  
  const voltageOptions = ["12V", "24V", "48V", "other"];
  const conditions = ["excellent", "good", "fair", "poor", "dead"];
  const warrantyPeriods = ["6 months", "1 year", "2 years", "3 years", "4 years", "5 years", "10 years", "other"];
  const amcPeriods = ["0", "1 year", "2 years", "3 years", "5 years"];

  // Inverter form options
  const inverterTypes = [
    { value: "inverter", label: "Inverter" },
    { value: "ups", label: "UPS" },
    { value: "solar", label: "Solar Inverter" },
    { value: "battery_charger", label: "Battery Charger" },
    { value: "stabilizer", label: "Stabilizer" },
    { value: "other", label: "Other" }
  ];

  const waveTypes = [
    { value: "pure_sine", label: "Pure Sine Wave" },
    { value: "modified_sine", label: "Modified Sine Wave" },
    { value: "square_wave", label: "Square Wave" }
  ];

  const batteryVoltageOptions = ["12V", "24V", "48V", "96V", "other"];
  const efficiencyOptions = ["90%", "95%", "98%", "other"];

  const isFormLoading = loading || submitting;

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
          width: isMobile ? '100%' : '90%',
          maxWidth: isMobile ? '100%' : isTablet ? '800px' : '1000px',
          maxHeight: isMobile ? '90vh' : '90vh',
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
      >
        {/* Hidden Barcode Input */}
        {isScanning && (
          <input
            type="text"
            ref={hiddenBarcodeInputRef}
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

        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0'
        }}>
          <div>
            <h2 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '8px' : '10px', 
              margin: 0, 
              fontSize: isMobile ? '20px' : '1.5rem', 
              color: 'white',
              flexWrap: 'wrap'
            }}>
              {productType === 'battery' ? <FiBattery size={isMobile ? 20 : 24} /> : <FiZap size={isMobile ? 20 : 24} />}
              {isEdit 
                ? `Edit ${productType === 'battery' ? 'Battery' : 'Inverter'}` 
                : `Add New ${productType === 'battery' ? 'Battery' : 'Inverter'}`}
            </h2>
            <p style={{ 
              margin: '5px 0 0', 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: isMobile ? '13px' : '0.875rem' 
            }}>
              {isEdit 
                ? `Update ${productType} information` 
                : `Add new ${productType} to inventory`}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            {/* Barcode Scanner Button */}
            <motion.button
              type="button"
              onClick={isScanning ? stopScanning : startScanning}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isFormLoading}
              style={{
                background: isScanning ? '#10B981' : 'rgba(255,255,255,0.2)',
                border: 'none',
                fontSize: '1rem',
                cursor: isFormLoading ? 'not-allowed' : 'pointer',
                color: 'white',
                padding: '8px',
                borderRadius: '8px',
                width: isMobile ? '44px' : '40px',
                height: isMobile ? '44px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isFormLoading ? 0.5 : 1,
                boxShadow: isScanning ? '0 0 0 3px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
              title={isScanning ? "Stop scanning" : "Start barcode scanner"}
            >
              {isScanning ? <FiCamera size={isMobile ? 20 : 18} /> : <FiRadio size={isMobile ? 20 : 18} />}
            </motion.button>
            
            {/* Clear Errors Button */}
            {isMobile && (
              <motion.button
                type="button"
                onClick={() => {
                  setErrors({});
                  setLocalError(null);
                }}
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                disabled={isFormLoading}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: isFormLoading ? 'not-allowed' : 'pointer',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isFormLoading ? 0.5 : 1
                }}
                title="Clear errors"
              >
                <FiRefreshCw size={20} />
              </motion.button>
            )}
            
            {/* Close Button */}
            <motion.button 
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isFormLoading}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                fontSize: isMobile ? '1.5rem' : '1.25rem',
                cursor: isFormLoading ? 'not-allowed' : 'pointer',
                color: 'white',
                padding: '8px',
                borderRadius: '8px',
                width: isMobile ? '44px' : '40px',
                height: isMobile ? '44px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isFormLoading ? 0.5 : 1
              }}
            >
              <FiX size={isMobile ? 24 : 20} />
            </motion.button>
          </div>
        </div>
        
        {/* Barcode Scanning Indicator */}
        {isScanning && (
          <div style={{
            padding: isMobile ? '12px 16px' : '12px 20px',
            margin: isMobile ? '16px 20px 0' : '20px 24px 0',
            backgroundColor: '#10B981',
            border: '1px solid #059669',
            borderRadius: '8px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <FiRadio style={{ fontSize: isMobile ? '20px' : '18px', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: isMobile ? '14px' : '14px', fontWeight: '500', flex: 1 }}>
              {barcodeMessage || "Barcode scanner active. Please scan barcode..."}
            </span>
            <button
              onClick={stopScanning}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: isMobile ? '20px' : '16px',
                padding: isMobile ? '8px 12px' : '4px 8px',
                borderRadius: '6px',
                flexShrink: 0
              }}
            >
              Stop
            </button>
          </div>
        )}

        {/* Barcode Success Message */}
        {barcodeSuccess && !isScanning && (
          <div style={{
            padding: isMobile ? '12px 16px' : '12px 20px',
            margin: isMobile ? '16px 20px 0' : '20px 24px 0',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FiCheckCircle style={{ fontSize: isMobile ? '20px' : '18px', flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? '14px' : '14px', fontWeight: '500', flex: 1 }}>{barcodeSuccess}</span>
            <button
              onClick={() => setBarcodeSuccess(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#065f46',
                cursor: 'pointer',
                fontSize: isMobile ? '20px' : '18px',
                padding: isMobile ? '8px' : '0 8px',
                flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Error Display */}
        {localError && (
          <div style={{
            padding: isMobile ? '12px 16px' : '12px 20px',
            margin: isMobile ? '16px 20px 0' : '20px 24px 0',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <FiAlertCircle style={{ fontSize: isMobile ? '20px' : '18px', flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? '14px' : '14px', fontWeight: '500', flex: 1 }}>{localError}</span>
            <button
              onClick={() => setLocalError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                cursor: 'pointer',
                fontSize: isMobile ? '20px' : '18px',
                padding: isMobile ? '8px' : '0 8px',
                flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px' }}>
          {productType === 'battery' ? (
            // Battery Form
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? '16px' : '20px'
            }}>
              {/* Battery fields - No asterisk for required */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiPackage size={isMobile ? 16 : 14} /> Battery Model
                </label>
                <input
                  ref={batteryModelRef}
                  type="text"
                  name="battery_model"
                  value={batteryFormData.battery_model}
                  onChange={handleBatteryChange}
                  placeholder="Enter battery model or scan barcode"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.battery_model ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.battery_model ? '#ef4444' : '#e5e7eb'}
                />
                {errors.battery_model && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.battery_model}</span>}
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiPackage size={isMobile ? 16 : 14} /> Serial Number(s)
                </label>
                <textarea
                  ref={batterySerialRef}
                  name="battery_serial"
                  value={batteryFormData.battery_serial}
                  onChange={handleBatteryChange}
                  placeholder={"Enter serial numbers separated by space / new line / comma\nExample:\n125301 125302 125303\nor\n125301\n125302\n125303"}
                  disabled={isFormLoading}
                  rows={isMobile ? 5 : 4}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.battery_serial ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.battery_serial ? '#ef4444' : '#e5e7eb'}
                />
                <small style={{ color: '#6b7280', fontSize: isMobile ? '11px' : '12px', marginTop: '6px', display: 'block' }}>
                  Each serial number will be created as a separate battery record.
                </small>
                {errors.battery_serial && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.battery_serial}</span>}
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiPackage size={isMobile ? 16 : 14} /> Brand
                </label>
                <input
                  ref={batteryBrandRef}
                  type="text"
                  name="brand"
                  value={batteryFormData.brand}
                  onChange={handleBatteryChange}
                  placeholder="Enter brand name or scan barcode"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.brand ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.brand ? '#ef4444' : '#e5e7eb'}
                />
                {errors.brand && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.brand}</span>}
              </div>

              {/* Rest of battery fields remain the same */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCheckCircle size={isMobile ? 16 : 14} /> Battery Status
                </label>
                <select
                  name="status"
                  value={batteryFormData.status}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Capacity</label>
                <input
                  type="text"
                  name="capacity"
                  value={batteryFormData.capacity}
                  onChange={handleBatteryChange}
                  placeholder="e.g., 150AH, 200AH"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Voltage</label>
                <select
                  name="voltage"
                  value={batteryFormData.voltage}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {voltageOptions.map(voltage => (
                    <option key={voltage} value={voltage}>{voltage}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Battery Type</label>
                <select
                  name="battery_type"
                  value={batteryFormData.battery_type}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {batteryTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Category</label>
                <select
                  name="category"
                  value={batteryFormData.category}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {batteryCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiDollarSign size={isMobile ? 16 : 14} /> Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={batteryFormData.price}
                  onChange={handleBatteryChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.price ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.price ? '#ef4444' : '#e5e7eb'}
                />
                {errors.price && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.price}</span>}
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Warranty Period</label>
                <select
                  name="warranty_period"
                  value={batteryFormData.warranty_period}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {warrantyPeriods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>AMC Period</label>
                <select
                  name="amc_period"
                  value={batteryFormData.amc_period}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {amcPeriods.map(period => (
                    <option key={period} value={period}>
                      {period === "0" ? "No AMC" : period}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Battery Condition</label>
                <select
                  name="battery_condition"
                  value={batteryFormData.battery_condition}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCalendar size={isMobile ? 16 : 14} /> Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={batteryFormData.purchase_date}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCalendar size={isMobile ? 16 : 14} /> Installation Date
                </label>
                <input
                  type="date"
                  name="installation_date"
                  value={batteryFormData.installation_date}
                  onChange={handleBatteryChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          ) : (
            // Inverter Form
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? '16px' : '20px'
            }}>
              {/* Inverter Model - No asterisk */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCpu size={isMobile ? 16 : 14} /> Inverter Model
                </label>
                <input
                  ref={inverterModelRef}
                  type="text"
                  name="inverter_model"
                  value={inverterFormData.inverter_model}
                  onChange={handleInverterChange}
                  placeholder="Enter inverter model or scan barcode"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.inverter_model ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.inverter_model ? '#ef4444' : '#e5e7eb'}
                />
                {errors.inverter_model && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.inverter_model}</span>}
              </div>

              {/* SERIAL NUMBER - No asterisk */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiHash size={isMobile ? 16 : 14} /> Serial Number
                </label>
                <textarea
                  ref={inverterSerialRef}
                  name="inverter_serial"
                  value={inverterFormData.inverter_serial}
                  onChange={handleInverterChange}
                  placeholder={"Enter serial numbers separated by space / new line / comma\nExample:\nINV001 INV002 INV003\nor\nINV001\nINV002\nINV003"}
                  disabled={isFormLoading}
                  rows={isMobile ? 5 : 4}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.inverter_serial ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.inverter_serial ? '#ef4444' : '#e5e7eb'}
                />
                <small style={{ color: '#6b7280', fontSize: isMobile ? '11px' : '12px', marginTop: '6px', display: 'block' }}>
                  Each serial number will be created as a separate inverter record.
                </small>
                {errors.inverter_serial && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.inverter_serial}</span>}
              </div>

              {/* Brand - No asterisk */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiPackage size={isMobile ? 16 : 14} /> Brand
                </label>
                <input
                  ref={inverterBrandRef}
                  type="text"
                  name="inverter_brand"
                  value={inverterFormData.inverter_brand}
                  onChange={handleInverterChange}
                  placeholder="Enter brand name or scan barcode"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.inverter_brand ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isScanning ? '#f0fdf4' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.inverter_brand ? '#ef4444' : '#e5e7eb'}
                />
                {errors.inverter_brand && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.inverter_brand}</span>}
              </div>

              {/* Status */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCheckCircle size={isMobile ? 16 : 14} /> Status
                </label>
                <select
                  name="status"
                  value={inverterFormData.status}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Power Rating */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Power Rating</label>
                <input
                  type="text"
                  name="power_rating"
                  value={inverterFormData.power_rating}
                  onChange={handleInverterChange}
                  placeholder="e.g., 1100VA, 875VA"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Type */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Type</label>
                <select
                  name="type"
                  value={inverterFormData.type}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {inverterTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Wave Type */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Wave Type</label>
                <select
                  name="wave_type"
                  value={inverterFormData.wave_type}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {waveTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Input Voltage */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Input Voltage</label>
                <input
                  type="text"
                  name="input_voltage"
                  value={inverterFormData.input_voltage}
                  onChange={handleInverterChange}
                  placeholder="e.g., 230V"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Output Voltage */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Output Voltage</label>
                <input
                  type="text"
                  name="output_voltage"
                  value={inverterFormData.output_voltage}
                  onChange={handleInverterChange}
                  placeholder="e.g., 230V"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Efficiency */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Efficiency</label>
                <select
                  name="efficiency"
                  value={inverterFormData.efficiency}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="">Select Efficiency</option>
                  {efficiencyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Battery Voltage */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Battery Voltage</label>
                <select
                  name="battery_voltage"
                  value={inverterFormData.battery_voltage}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {batteryVoltageOptions.map(voltage => (
                    <option key={voltage} value={voltage}>{voltage}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiDollarSign size={isMobile ? 16 : 14} /> Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={inverterFormData.price}
                  onChange={handleInverterChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: `2px solid ${errors.price ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.price ? '#ef4444' : '#e5e7eb'}
                />
                {errors.price && <span style={{ color: '#ef4444', fontSize: isMobile ? '12px' : '0.75rem', marginTop: '6px', display: 'block' }}>{errors.price}</span>}
              </div>

              {/* Warranty Period */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Warranty Period</label>
                <select
                  name="warranty_period"
                  value={inverterFormData.warranty_period}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {warrantyPeriods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>

              {/* Inverter Condition */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem',
                  display: 'block'
                }}>Inverter Condition</label>
                <select
                  name="inverter_condition"
                  value={inverterFormData.inverter_condition}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    backgroundColor: 'white',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Date */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCalendar size={isMobile ? 16 : 14} /> Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={inverterFormData.purchase_date}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Installation Date */}
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '6px' : '5px', 
                  marginBottom: '8px', 
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}>
                  <FiCalendar size={isMobile ? 16 : 14} /> Installation Date
                </label>
                <input
                  type="date"
                  name="installation_date"
                  value={inverterFormData.installation_date}
                  onChange={handleInverterChange}
                  disabled={isFormLoading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: isMobile ? '16px' : '0.875rem',
                    opacity: isFormLoading ? 0.7 : 1,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          )}

          {/* Specifications */}
          <div style={{ 
            marginTop: '24px',
            gridColumn: '1 / -1'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '6px' : '5px', 
              marginBottom: '8px', 
              fontWeight: 600,
              fontSize: isMobile ? '14px' : '0.875rem'
            }}>
              <FiInfo size={isMobile ? 16 : 14} /> Specifications
            </label>
            <textarea
              name="specifications"
              value={productType === 'battery' ? batteryFormData.specifications : inverterFormData.specifications}
              onChange={productType === 'battery' ? handleBatteryChange : handleInverterChange}
              placeholder={`Enter ${productType} specifications...`}
              rows={isMobile ? 5 : 4}
              disabled={isFormLoading}
              style={{
                width: '100%',
                padding: isMobile ? '14px 16px' : '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                resize: 'vertical',
                fontSize: isMobile ? '16px' : '0.875rem',
                opacity: isFormLoading ? 0.7 : 1,
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                minHeight: isMobile ? '120px' : '100px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            justifyContent: 'flex-end',
            gap: isMobile ? '12px' : '12px',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '2px solid #e5e7eb'
          }}>
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: isFormLoading ? 1 : 1.02 }}
              whileTap={{ scale: isFormLoading ? 1 : 0.98 }}
              disabled={isFormLoading}
              style={{
                padding: isMobile ? '16px 24px' : '12px 24px',
                backgroundColor: 'transparent',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                color: '#6b7280',
                cursor: isFormLoading ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '16px' : '0.875rem',
                fontWeight: 600,
                width: isMobile ? '100%' : 'auto',
                opacity: isFormLoading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: isFormLoading ? 1 : 1.02 }}
              whileTap={{ scale: isFormLoading ? 1 : 0.98 }}
              disabled={isFormLoading}
              style={{
                padding: isMobile ? '16px 24px' : '12px 32px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: isFormLoading ? 'not-allowed' : 'pointer',
                opacity: isFormLoading ? 0.7 : 1,
                fontSize: isMobile ? '16px' : '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '8px' : '8px',
                width: isMobile ? '100%' : 'auto',
                boxShadow: '0 4px 6px rgba(59,130,246,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isFormLoading ? (
                <>
                  <FiLoader className="spinning" style={{ animation: 'spin 1s linear infinite', fontSize: isMobile ? '18px' : '16px' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave size={isMobile ? 18 : 16} />
                  {isEdit 
                    ? `Update ${productType === 'battery' ? 'Battery' : 'Inverter'}` 
                    : `Add ${productType === 'battery' ? 'Battery' : 'Inverter'}`}
                </>
              )}
            </motion.button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
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
            select, input, textarea, button {
              min-height: 48px;
            }
            
            .modal-content {
              max-height: 90vh;
            }
          }
          
          /* Focus styles */
          input:focus, select:focus, textarea:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          /* Error state */
          input.error, select.error, textarea.error {
            border-color: #ef4444 !important;
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default ProductFormModal;
