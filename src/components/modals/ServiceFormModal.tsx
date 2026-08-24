// src/components/modals/ServiceFormModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiPhone,
  FiBattery,
  FiFileText,
  FiX,
  FiSave,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiChevronDown,
  FiPower,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiClock,
  FiCalendar,
  FiTag
} from "react-icons/fi";

// Import types using 'import type' for verbatimModuleSyntax
import type { Customer, Battery, Inverter } from '../types';
import { API_BASE_URL } from "../../config/api";

// Enhanced Searchable Dropdown Component with better UX
interface SearchableDropdownProps {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: any) => void;
  options: any[];
  optionLabel: (option: any) => string;
  optionValue: (option: any) => string | number;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  hint?: string;
  success?: boolean;
  isMobile: boolean;
  allowEmpty?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  optionLabel,
  optionValue,
  placeholder,
  label,
  icon,
  required = false,
  disabled = false,
  loading = false,
  error,
  hint,
  success = false,
  isMobile,
  allowEmpty = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const hasValue = value !== null && value !== undefined && value !== '';

  // Get selected option display text
  const getSelectedDisplayText = () => {
    if (!value || value === "") return placeholder;
    const selected = options.find(opt => optionValue(opt).toString() === value.toString());
    return selected ? optionLabel(selected) : placeholder;
  };

  // Get selected option object
  const getSelectedOption = () => {
    if (!value || value === "") return null;
    return options.find(opt => optionValue(opt).toString() === value.toString());
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    optionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelectOption = (option: any) => {
    const syntheticEvent = {
      target: {
        name: name,
        value: optionValue(option).toString()
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name: name,
        value: ''
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
  };

  const selectedOption = getSelectedOption();

  return (
    <div 
      className="form-group" 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        width: '100%',
        marginBottom: '20px'
      }}
    >
      <motion.label 
        htmlFor={id} 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          fontWeight: '600',
          color: error ? '#ef4444' : '#374151',
          fontSize: isMobile ? '14px' : '14px',
          letterSpacing: '0.3px'
        }}
      >
        <span style={{ color: error ? '#ef4444' : '#6b7280' }}>{icon}</span>
        {label} {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </motion.label>
      
      <div className="dropdown-container" style={{ position: 'relative' }}>
        {/* Dropdown Button */}
        <motion.button
          type="button"
          className="dropdown-button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !isOpen && setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setSearchTerm('');
              setIsFocused(false);
            }
            if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={describedBy}
          whileTap={{ scale: 0.98 }}
          animate={{
            borderColor: error ? '#ef4444' : isFocused ? '#8b5cf6' : success ? '#10b981' : '#e5e7eb',
            boxShadow: isFocused ? '0 0 0 4px rgba(139, 92, 246, 0.1)' : 'none'
          }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            padding: isMobile ? '14px 16px' : '12px 16px',
            paddingRight: hasValue && allowEmpty ? '80px' : '48px',
            borderRadius: '12px',
            border: '2px solid',
            fontSize: isMobile ? '15px' : '14px',
            backgroundColor: disabled ? '#f9fafb' : '#fff',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: hasValue ? '#111827' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            transition: 'all 0.2s ease',
            fontWeight: hasValue ? '500' : '400',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {selectedOption && (
              <span style={{ color: '#8b5cf6', fontSize: '16px' }}>
                {icon}
              </span>
            )}
            {getSelectedDisplayText()}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasValue && allowEmpty && !disabled && (
              <motion.button
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={handleClearSelection}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: 'none',
                  padding: 0
                }}
                whileHover={{ backgroundColor: '#fee2e2', color: '#ef4444', rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                title="Clear selection"
                aria-label="Clear selection"
              >
                <FiX size={12} />
              </motion.button>
            )}
            
            {loading ? (
              <FiLoader className="spinning" style={{ color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />
            ) : (
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FiChevronDown style={{ color: '#9ca3af', fontSize: '18px' }} />
              </motion.div>
            )}
          </div>
        </motion.button>

        {/* Success/Error Icons */}
        {!loading && success && !error && hasValue && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              right: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#10b981'
            }}
          >
            <FiCheckCircle size={18} />
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              right: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#ef4444'
            }}
          >
            <FiAlertCircle size={18} />
          </motion.div>
        )}

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && !disabled && !loading && (
            <motion.div
              className="dropdown-menu"
              id={listboxId}
              role="listbox"
              aria-label={label}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                backgroundColor: '#fff',
                border: '1px solid #f3f4f6',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                zIndex: 1000,
                maxHeight: '350px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Search Input */}
              <div style={{
                padding: '12px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#f9fafb'
              }}>
                <FiSearch style={{ color: '#9ca3af', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Search ${label}`}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: isMobile ? '15px' : '14px',
                    padding: '6px 0',
                    backgroundColor: 'transparent',
                    color: '#111827'
                  }}
                />
                {searchTerm && (
                  <motion.button
                    type="button"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setSearchTerm('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    aria-label="Clear search"
                  >
                    <FiX size={12} />
                  </motion.button>
                )}
              </div>

              {/* Options Count */}
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{filteredOptions.length} options found</span>
                {allowEmpty && (
                  <span style={{ color: '#8b5cf6', fontSize: '11px' }}>Optional field</span>
                )}
              </div>

              {/* Options List */}
              <div style={{
                overflowY: 'auto',
                maxHeight: '250px',
                padding: '4px'
              }}>
                {/* Empty option */}
                {allowEmpty && (
                  <motion.div
                    className="dropdown-option"
                    role="option"
                    aria-selected={!value}
                    onClick={() => {
                      const syntheticEvent = {
                        target: {
                          name: name,
                          value: ''
                        }
                      } as React.ChangeEvent<HTMLSelectElement>;
                      onChange(syntheticEvent);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
                    style={{
                      padding: isMobile ? '14px 16px' : '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: !value ? '#f5f3ff' : 'transparent',
                      borderRadius: '10px',
                      margin: '2px 0',
                      fontSize: isMobile ? '14px' : '14px',
                      transition: 'all 0.2s',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <FiInfo size={14} />
                    -- None --
                  </motion.div>
                )}
                
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const optionVal = optionValue(option).toString();
                    const isSelected = Boolean(value && value.toString() === optionVal);
                    
                    return (
                      <motion.div
                        key={index}
                        className="dropdown-option"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(option)}
                        whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
                        style={{
                          padding: isMobile ? '14px 16px' : '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                          borderRadius: '10px',
                          margin: '2px 0',
                          fontSize: isMobile ? '14px' : '14px',
                          transition: 'all 0.2s',
                          color: isSelected ? '#6d28d9' : '#374151',
                          fontWeight: isSelected ? '600' : '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          border: isSelected ? '1px solid #8b5cf6' : '1px solid transparent'
                        }}
                      >
                        <span style={{ color: isSelected ? '#8b5cf6' : '#9ca3af' }}>
                          {icon}
                        </span>
                        <span style={{ flex: 1 }}>{optionLabel(option)}</span>
                        {isSelected && (
                          <FiCheckCircle style={{ color: '#8b5cf6' }} />
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: isMobile ? '24px 16px' : '20px 16px',
                      color: '#9ca3af',
                      textAlign: 'center',
                      fontSize: isMobile ? '14px' : '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiSearch size={24} style={{ opacity: 0.5 }} />
                    <span>No results found for "{searchTerm}"</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message with Animation */}
      <AnimatePresence>
        {error && (
          <motion.small
            id={errorId}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          style={{
              marginTop: '6px',
              color: '#ef4444',
              fontSize: isMobile ? '12px' : '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FiAlertCircle size={12} /> {error}
          </motion.small>
        )}
      </AnimatePresence>

      {/* Hint */}
      {hint && !error && (
        <motion.small
          id={hintId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="form-hint"
          style={{
            marginTop: '6px',
            color: '#6b7280',
            fontSize: isMobile ? '12px' : '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiInfo size={12} /> {hint}
        </motion.small>
      )}
    </div>
  );
};

interface ServiceForm {
  id?: number | null;
  customer_id: number | null;
  customer_phone: string;
  battery_id: number | null;
  battery_ids?: number[];
  inverter_id?: number | null;
  inverter_ids?: number[];
  service_staff_id: number | null;
  issue_description: string;
  warranty_status: string;
  amc_status: string;
  notes: string;
  status?: string;
  priority?: string;
  payment_status?: string;
  amount?: string;
  estimated_cost?: string;
  final_cost?: string;
  deposit_amount?: string;
  estimated_completion_date?: string;
  battery_claim?: string;
  service_type?: string;
  showReplacementForm?: boolean;
  replacement_battery_model?: string;
  replacement_battery_serial?: string;
  replacement_battery_brand?: string;
  replacement_battery_capacity?: string;
  replacement_battery_type?: string;
  replacement_battery_voltage?: string;
  replacement_battery_price?: string;
  replacement_battery_warranty?: string;
  replacement_installation_date?: string;
  replacement_battery_notes?: string;
  [key: string]: any;
}

interface ServiceFormModalProps {
  showForm: boolean;
  editMode: boolean;
  formType: string;
  serviceForm: ServiceForm;
  customers: Customer[];
  batteries: Battery[];
  inverters?: Inverter[];
  staffUsers: any[];
  loading: {
    services: boolean;
  };
  onClose: () => void;
  onServiceInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onServiceSubmit: (e: React.FormEvent) => void;
  editingServiceId?: number | null;
  onFetchServiceData?: (serviceId: number) => Promise<any>;
}

// Helper function to format inverter label
const getInverterLabel = (inverter: Inverter): string => {
  const model = inverter.inverter_model || 'Unknown Model';
  const brand = inverter.inverter_brand || 'Unknown Brand';
  const serial = inverter.inverter_serial ? ` (${inverter.inverter_serial})` : '';
  const code = inverter.inverter_code ? ` [${inverter.inverter_code}]` : '';
  const power = inverter.power_rating ? ` - ${inverter.power_rating}VA` : '';
  
  return `${brand} ${model}${power}${serial}${code}`;
};

// Helper function to get staff label
const getStaffLabel = (staff: any): string => {
  return `${staff.name}${staff.role ? ` (${staff.role})` : ''}`;
};

interface MultiSelectDropdownProps {
  id: string;
  name: string;
  values: number[];
  onChange: (values: number[]) => void;
  options: any[];
  optionLabel: (option: any) => string;
  optionValue: (option: any) => number;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  isMobile: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  name,
  values,
  onChange,
  options,
  optionLabel,
  optionValue,
  placeholder,
  label,
  icon,
  disabled = false,
  loading = false,
  hint,
  isMobile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  const selectedCount = values.length;
  const selectedOptions = options.filter((option) => values.includes(optionValue(option)));
  const filteredOptions = options.filter((option) =>
    optionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleValue = (id: number) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredOptions.map((opt) => optionValue(opt));
    const merged = Array.from(new Set([...values, ...filteredIds]));
    onChange(merged);
  };

  const clearAll = () => onChange([]);
  const removeOne = (id: number) => onChange(values.filter((v) => v !== id));

  return (
    <div className="form-group" style={{ marginBottom: '20px' }} ref={dropdownRef}>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
        {icon} {label}
      </label>

      <button
        id={id}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          minHeight: isMobile ? '48px' : '50px',
          border: isOpen ? '1px solid #2563eb' : '1px solid #d1d5db',
          borderRadius: '12px',
          background: '#fff',
          padding: selectedCount > 0 ? '8px 12px' : '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', flex: 1 }}>
          {selectedCount === 0 && (
            <span style={{ color: '#6b7280', fontSize: '14px' }}>{placeholder}</span>
          )}
          {selectedCount > 0 && (
            <>
              {selectedOptions.slice(0, 2).map((opt) => (
                <span
                  key={optionValue(opt)}
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '999px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    maxWidth: isMobile ? '110px' : '170px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {optionLabel(opt)}
                </span>
              ))}
              {selectedCount > 2 && (
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>+{selectedCount - 2} more</span>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
          {selectedCount > 0 && (
            <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700, background: '#dbeafe', borderRadius: '999px', padding: '3px 8px' }}>
              {selectedCount}
            </span>
          )}
          <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6b7280' }} />
        </div>
      </button>

      {selectedCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {selectedOptions.slice(0, 5).map((opt) => (
            <button
              key={`chip-${optionValue(opt)}`}
              type="button"
              onClick={() => removeOne(optionValue(opt))}
              style={{
                border: '1px solid #bfdbfe',
                background: '#f8fbff',
                color: '#1d4ed8',
                borderRadius: '999px',
                padding: '4px 8px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Remove selection"
            >
              <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {optionLabel(opt)}
              </span>
              <FiX size={12} />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              marginTop: '8px',
              border: '1px solid #dbeafe',
              borderRadius: '12px',
              background: '#fff',
              boxShadow: '0 16px 40px rgba(30,41,59,0.16)',
              maxHeight: '340px',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '10px', borderBottom: '1px solid #eef2ff', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiSearch style={{ color: '#64748b' }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={`Search ${name}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{filteredOptions.length} options</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={selectAllFiltered} style={{ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' }}>
                    Select All
                  </button>
                  <button type="button" onClick={clearAll} style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' }}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div role="listbox" aria-multiselectable="true" style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px' }}>
              {filteredOptions.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No matching options</div>
              )}
              {filteredOptions.map((option) => {
                const idValue = optionValue(option);
                const checked = values.includes(idValue);
                return (
                  <button
                    type="button"
                    key={idValue}
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleValue(idValue)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 8px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      background: checked ? '#eff6ff' : 'transparent',
                      border: checked ? '1px solid #bfdbfe' : '1px solid transparent',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '999px',
                      border: checked ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: checked ? '#1d4ed8' : '#fff',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {checked ? <FiCheckCircle size={12} /> : null}
                    </span>
                    <span style={{ fontSize: '13px', color: checked ? '#1e3a8a' : '#1f2937', fontWeight: checked ? 600 : 500 }}>
                      {optionLabel(option)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '8px 10px', borderTop: '1px solid #eef2ff', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>{selectedCount} selected</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && <small style={{ color: '#6b7280', fontSize: '12px' }}>{hint}</small>}
    </div>
  );
};

interface BatteryBoxSelectorProps {
  values: number[];
  onChange: (values: number[]) => void;
  options: Battery[];
  disabled?: boolean;
  loading?: boolean;
  isMobile: boolean;
}

const BatteryBoxSelector: React.FC<BatteryBoxSelectorProps> = ({
  values,
  onChange,
  options,
  disabled = false,
  loading = false,
  isMobile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = options.filter((battery) => {
    const model = battery.battery_model || '';
    const serial = battery.battery_serial || '';
    const code = battery.battery_code || '';
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      model.toLowerCase().includes(q) ||
      serial.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    );
  });

  const toggle = (id: number) => {
    if (disabled || loading) return;
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  const selectedBatteries = options.filter((b) => values.includes(b.id));

  return (
    <div style={{ marginBottom: '20px', position: 'relative' }} ref={dropdownRef}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#374151',
        fontSize: isMobile ? '14px' : '14px'
      }}>
        <FiBattery style={{ color: '#6b7280' }} />
        Select Battery Products (multiple)
      </label>

      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: isMobile ? '14px 16px' : '12px 16px',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          background: '#fff',
          textAlign: 'left',
          fontSize: isMobile ? '14px' : '14px',
          color: values.length ? '#111827' : '#9ca3af',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{values.length > 0 ? `${values.length} battery selected` : 'Select battery products'}</span>
        <FiChevronDown style={{ color: '#9ca3af' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          background: '#ffffff',
          padding: '10px',
          zIndex: 30,
          boxShadow: '0 14px 30px -18px rgba(15,23,42,0.45)'
        }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search battery by model / serial / code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled || loading}
              style={{
                width: '100%',
                padding: isMobile ? '12px 12px 12px 36px' : '10px 12px 10px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                outline: 'none',
                fontSize: isMobile ? '14px' : '13px'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '8px',
            maxHeight: '240px',
            overflowY: 'auto'
          }}>
            {filtered.map((battery) => {
              const active = values.includes(battery.id);
              return (
                <button
                  key={battery.id}
                  type="button"
                  onClick={() => toggle(battery.id)}
                  disabled={disabled || loading}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: active ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                    background: active ? '#f5f3ff' : '#fff',
                    cursor: disabled || loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                    {battery.battery_model || 'Unknown Model'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4b5563' }}>
                    Serial: {battery.battery_serial || 'N/A'}
                  </div>
                </button>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: '13px', padding: '8px 4px' }}>
                No battery products found.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBatteries.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '10px',
          marginTop: '10px'
        }}>
          {selectedBatteries.map((battery) => {
            return (
              <div
                key={battery.id}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #7c3aed',
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                    {battery.battery_model || 'Unknown Model'}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(battery.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove"
                  >
                    <FiX size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563' }}>
                  Serial: {battery.battery_serial || 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  Code: {battery.battery_code || `BAT${battery.id}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <small style={{ marginTop: '6px', color: '#6b7280', fontSize: '12px', display: 'block' }}>
        Selected: {values.length} product(s). Shows product model and serial number.
      </small>
    </div>
  );
};

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  showForm,
  editMode,
  formType,
  serviceForm,
  customers,
  batteries,
  inverters = [],
  staffUsers,
  loading,
  onClose,
  onServiceInputChange,
  onServiceSubmit,
  editingServiceId = null,
  onFetchServiceData
}) => {
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [activeTab, setActiveTab] = useState<'main' | 'additional'>('main');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

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
  
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [localBatteries, setLocalBatteries] = useState<Battery[]>(batteries);
  const [localInverters, setLocalInverters] = useState<Inverter[]>(inverters);
  const [localStaff, setLocalStaff] = useState<any[]>(staffUsers);
  const [loadingData, setLoadingData] = useState({
    customers: false,
    batteries: false,
    inverters: false,
    staff: false,
    service: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Set default AMC status to 'active' when form is initialized and not in edit mode
  // AND when the form is first shown
  useEffect(() => {
    if (showForm && !editMode) {
      // Check if amc_status is empty, undefined, null, or 'no_amc' (to ensure we change it to active)
      if (!serviceForm.amc_status || serviceForm.amc_status === '' || serviceForm.amc_status === 'no_amc') {
        const amcStatusEvent = {
          target: {
            name: 'amc_status',
            value: 'active'
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        onServiceInputChange(amcStatusEvent);
      }
    }
  }, [showForm, editMode, serviceForm.amc_status, onServiceInputChange]);

  // Validate form before submit
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!serviceForm.customer_id) {
      errors.customer_id = 'Client is required';
    }
    
    if (serviceForm.customer_phone && !/^[0-9]{10}$/.test(serviceForm.customer_phone)) {
      errors.customer_phone = 'Please enter a valid 10-digit mobile number';
    }
    
    if (!serviceForm.warranty_status) {
      errors.warranty_status = 'Warranty status is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmitWithValidation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // For edit mode, ensure the ID is included in the form data
      if (editMode && editingServiceId) {
        if (!serviceForm.id) {
          const idEvent = {
            target: {
              name: 'id',
              value: editingServiceId.toString()
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onServiceInputChange(idEvent);
        }
      }
      
      onServiceSubmit(e);
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoadingData(prev => ({ ...prev, customers: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/customers.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.customers && Array.isArray(data.customers)) {
        const formattedCustomers: Customer[] = data.customers.map((customer: any) => ({
          id: parseInt(customer.id) || customer.id,
          customer_code: customer.customer_code || `CUST${String(customer.id).padStart(3, '0')}`,
          full_name: customer.full_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip_code: customer.zip_code || '',
          notes: customer.notes || '',
          created_at: customer.created_at || new Date().toISOString(),
          updated_at: customer.updated_at || new Date().toISOString(),
          service_count: parseInt(customer.total_services || '0'),
          total_services: parseInt(customer.total_services || '0')
        }));
        setLocalCustomers(formattedCustomers);
      } else {
        throw new Error(data.message || 'Invalid customers data format');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setError(`Failed to load customers: ${error.message}`);
      if (customers && customers.length > 0) {
        setLocalCustomers(customers);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, customers: false }));
    }
  };

  // Fetch batteries from API
  const fetchBatteries = async () => {
    try {
      setLoadingData(prev => ({ ...prev, batteries: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/batteries.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batteries: ${response.status}`);
      }
      
      const data = await response.json();
      
      let batteriesData: any[] = [];
      
      if (data.success && data.data?.batteries) {
        batteriesData = data.data.batteries;
      } else if (data.success && data.batteries) {
        batteriesData = data.batteries;
      } else if (data.success && Array.isArray(data.data)) {
        batteriesData = data.data;
      } else {
        throw new Error(data.message || 'Invalid batteries data format');
      }
      
      if (Array.isArray(batteriesData)) {
        const formattedBatteries: Battery[] = batteriesData.map((battery: any) => ({
          id: parseInt(battery.id) || battery.id,
          battery_code: battery.battery_code || `BAT${String(battery.id).padStart(3, '0')}`,
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
          is_spare: battery.is_spare === "1" || battery.is_spare === 1 || false,
          spare_status: battery.spare_status || 'available',
          created_at: battery.created_at || new Date().toISOString(),
          total_services: parseInt(battery.total_services || '0'),
          specifications: battery.specifications || '',
          purchase_date: battery.purchase_date || '',
          installation_date: battery.installation_date || '',
          last_service_date: battery.last_service_date || '',
          stock_quantity: battery.stock_quantity || '0',
          claim_type: battery.claim_type || '',
          status: battery.status || 'active',
          shop_stock_quantity: battery.shop_stock_quantity || '0',
          company_stock_quantity: battery.company_stock_quantity || '0',
          tracking_status: battery.tracking_status || 'active',
          warranty_expiry_date: battery.warranty_expiry_date || '',
          warranty_remarks: battery.warranty_remarks || ''
        }));
        setLocalBatteries(formattedBatteries);
      } else {
        throw new Error('Batteries data is not an array');
      }
    } catch (error: any) {
      console.error('Error fetching batteries:', error);
      setError(`Failed to load batteries: ${error.message}`);
      if (batteries && batteries.length > 0) {
        setLocalBatteries(batteries);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, batteries: false }));
    }
  };

  // Fetch inverters from API
  const fetchInverters = async () => {
    try {
      setLoadingData(prev => ({ ...prev, inverters: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/inverters.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inverters: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const formattedInverters: Inverter[] = data.data.map((inverter: any) => ({
          id: parseInt(inverter.id) || inverter.id,
          inverter_code: inverter.inverter_code || `INV${String(inverter.id).padStart(3, '0')}`,
          inverter_model: inverter.inverter_model || '',
          inverter_serial: inverter.inverter_serial || '',
          inverter_brand: inverter.inverter_brand || '',
          power_rating: inverter.power_rating || '',
          type: inverter.type || 'inverter',
          wave_type: inverter.wave_type || 'modified_sine',
          input_voltage: inverter.input_voltage || '',
          output_voltage: inverter.output_voltage || '',
          efficiency: inverter.efficiency || '',
          battery_voltage: inverter.battery_voltage || '12V',
          specifications: inverter.specifications || '',
          warranty_period: inverter.warranty_period || '',
          price: inverter.price || '0',
          status: inverter.status || 'active',
          purchase_date: inverter.purchase_date || '',
          installation_date: inverter.installation_date || '',
          inverter_condition: inverter.inverter_condition || 'good',
          created_at: inverter.created_at || new Date().toISOString(),
          updated_at: inverter.updated_at || new Date().toISOString()
        }));
        setLocalInverters(formattedInverters);
      } else {
        throw new Error(data.message || 'Invalid inverters data format');
      }
    } catch (error: any) {
      console.error('Error fetching inverters:', error);
      setError(`Failed to load inverters: ${error.message}`);
      if (inverters && inverters.length > 0) {
        setLocalInverters(inverters);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, inverters: false }));
    }
  };

  // Fetch staff/users from API
  const fetchStaff = async () => {
    try {
      setLoadingData(prev => ({ ...prev, staff: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch staff: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.users && Array.isArray(data.users)) {
        const formattedStaff = data.users.map((user: any) => ({
          id: parseInt(user.id) || user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'user',
          phone: user.phone || '',
          is_active: user.is_active === 1 || user.is_active === true || true,
          last_login: user.last_login || '',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        }));
        setLocalStaff(formattedStaff);
      } else {
        throw new Error(data.message || 'Invalid staff data format');
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      setError(`Failed to load staff: ${error.message}`);
      if (staffUsers && staffUsers.length > 0) {
        setLocalStaff(staffUsers);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, staff: false }));
    }
  };

  // Handle customer selection change
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value ? parseInt(e.target.value) : null;
    
    const customerIdEvent = {
      target: {
        name: 'customer_id',
        value: customerId ? customerId.toString() : ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onServiceInputChange(customerIdEvent);
    
    if (customerId && !isNaN(customerId)) {
      const selectedCustomer = localCustomers.find(c => c.id === customerId);
      if (selectedCustomer) {
        const normalizedPhone = String(selectedCustomer.phone || '').replace(/\D/g, '').slice(0, 10);
        const phoneEvent = {
          target: {
            name: 'customer_phone',
            value: normalizedPhone
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onServiceInputChange(phoneEvent);
        
        // Clear validation error for phone
        if (validationErrors.customer_phone) {
          setValidationErrors(prev => ({ ...prev, customer_phone: '' }));
        }
      }
    } else {
      const phoneEvent = {
        target: {
          name: 'customer_phone',
          value: ''
        }
      } as React.ChangeEvent<HTMLInputElement>;

      onServiceInputChange(phoneEvent);
    }
    
    // Clear validation error for customer
    if (validationErrors.customer_id) {
      setValidationErrors(prev => ({ ...prev, customer_id: '' }));
    }
  };

  // Handle phone input change with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    
    const phoneEvent = {
      target: {
        name: 'customer_phone',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onServiceInputChange(phoneEvent);
    
    // Validate phone
    if (value && !/^[0-9]{10}$/.test(value)) {
      setValidationErrors(prev => ({ ...prev, customer_phone: 'Please enter a valid 10-digit mobile number' }));
    } else {
      setValidationErrors(prev => ({ ...prev, customer_phone: '' }));
    }
  };

  // Handle battery multi-selection change
  const handleBatteryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let selectedBatteryIds: number[] = [];
    if (e.target.selectedOptions) {
      selectedBatteryIds = Array.from(e.target.selectedOptions)
        .map((o) => parseInt(o.value))
        .filter((id) => !isNaN(id) && id > 0);
    } else {
      try {
        const parsed = JSON.parse(e.target.value || '[]');
        if (Array.isArray(parsed)) {
          selectedBatteryIds = parsed.map((v: any) => parseInt(v)).filter((id: number) => !isNaN(id) && id > 0);
        }
      } catch {
        selectedBatteryIds = [];
      }
    }

    const batteryIdsEvent = {
      target: {
        name: 'battery_ids',
        value: JSON.stringify(selectedBatteryIds)
      }
    } as React.ChangeEvent<HTMLInputElement>;

    onServiceInputChange(batteryIdsEvent);

    const primaryBatteryId = selectedBatteryIds[0] || null;
    const batteryIdEvent = {
      target: {
        name: 'battery_id',
        value: primaryBatteryId ? primaryBatteryId.toString() : ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onServiceInputChange(batteryIdEvent);

    if (primaryBatteryId && !editMode) {
      const selectedBattery = localBatteries.find(b => b.id === primaryBatteryId);
      if (selectedBattery) {
        if (selectedBattery.purchase_date && selectedBattery.warranty_period) {
          const warrantyMatch = selectedBattery.warranty_period.match(/(\d+)/);
          if (warrantyMatch) {
            const warrantyYears = parseInt(warrantyMatch[1]);
            const purchaseDate = new Date(selectedBattery.purchase_date);
            const warrantyEndDate = new Date(purchaseDate);
            warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + warrantyYears);
            
            const today = new Date();
            let warrantyStatus = 'out_of_warranty';
            
            if (today <= warrantyEndDate) {
              warrantyStatus = 'in_warranty';
            }
            
            const warrantyEvent = {
              target: {
                name: 'warranty_status',
                value: warrantyStatus
              }
            } as React.ChangeEvent<HTMLSelectElement>;
            
            onServiceInputChange(warrantyEvent);
          }
        }
      }
    }
  };

  // Handle inverter multi-selection change
  const handleInverterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let selectedInverterIds: number[] = [];
    if (e.target.selectedOptions) {
      selectedInverterIds = Array.from(e.target.selectedOptions)
        .map((o) => parseInt(o.value))
        .filter((id) => !isNaN(id) && id > 0);
    } else {
      try {
        const parsed = JSON.parse(e.target.value || '[]');
        if (Array.isArray(parsed)) {
          selectedInverterIds = parsed.map((v: any) => parseInt(v)).filter((id: number) => !isNaN(id) && id > 0);
        }
      } catch {
        selectedInverterIds = [];
      }
    }

    const inverterIdsEvent = {
      target: {
        name: 'inverter_ids',
        value: JSON.stringify(selectedInverterIds)
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onServiceInputChange(inverterIdsEvent);

    const inverterId = selectedInverterIds[0] || null;
    const inverterIdEvent = {
      target: {
        name: 'inverter_id',
        value: inverterId ? inverterId.toString() : ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onServiceInputChange(inverterIdEvent);
  };

  // Handle warranty status change
  const handleWarrantyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onServiceInputChange(e);
    
    if (validationErrors.warranty_status) {
      setValidationErrors(prev => ({ ...prev, warranty_status: '' }));
    }
  };

  // Fetch service data when editing
  const fetchServiceData = async (serviceId: number) => {
    try {
      setLoadingData(prev => ({ ...prev, service: true }));
      setError(null);
      
      if (onFetchServiceData) {
        return await onFetchServiceData(serviceId);
      }
      
      const response = await fetch(`${API_BASE_URL}/services.php?id=${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const serviceData = data.data;
        
        const updateField = (name: string, value: any) => {
          const event = {
            target: {
              name,
              value: value !== null && value !== undefined ? value.toString() : ''
            }
          } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
          
          onServiceInputChange(event);
        };
        
        updateField('id', serviceData.id);
        updateField('customer_id', serviceData.customer_id);
        updateField('customer_phone', serviceData.customer_phone || '');
        updateField('battery_id', serviceData.battery_id);
        updateField('inverter_id', serviceData.inverter_id);
        updateField('battery_ids', JSON.stringify(serviceData.battery_ids || (serviceData.battery_id ? [serviceData.battery_id] : [])));
        updateField('inverter_ids', JSON.stringify(serviceData.inverter_ids || (serviceData.inverter_id ? [serviceData.inverter_id] : [])));
        updateField('service_staff_id', serviceData.service_staff_id || '');
        updateField('warranty_status', serviceData.warranty_status || 'out_of_warranty');
        // Set AMC status to active if not present or if it's no_amc
        const amcStatus = serviceData.amc_status;
        if (!amcStatus || amcStatus === '' || amcStatus === 'no_amc') {
          updateField('amc_status', 'active');
        } else {
          updateField('amc_status', amcStatus);
        }
        updateField('notes', serviceData.notes || '');
        
        return serviceData;
      } else {
        throw new Error('Service data not found');
      }
    } catch (error: any) {
      console.error('Error fetching service data:', error);
      setError(`Failed to load service data: ${error.message}`);
      throw error;
    } finally {
      setLoadingData(prev => ({ ...prev, service: false }));
    }
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (showForm && !isInitialized) {
      const initializeForm = async () => {
        try {
          await Promise.all([
            fetchCustomers(),
            fetchBatteries(),
            fetchInverters(),
            fetchStaff()
          ]);
          
          if (editMode && editingServiceId) {
            await fetchServiceData(editingServiceId);
          } else if (!editMode) {
            // For new service, ensure AMC status is set to active
            if (!serviceForm.amc_status || serviceForm.amc_status === '' || serviceForm.amc_status === 'no_amc') {
              const amcStatusEvent = {
                target: {
                  name: 'amc_status',
                  value: 'active'
                }
              } as React.ChangeEvent<HTMLSelectElement>;
              onServiceInputChange(amcStatusEvent);
            }
          }
          
          setIsInitialized(true);
        } catch (error: any) {
          console.error('Error initializing form:', error);
          setError(`Failed to load form data: ${error.message}`);
        }
      };
      
      initializeForm();
    }
    
    if (!showForm) {
      setIsInitialized(false);
      setError(null);
      setValidationErrors({});
      setActiveTab('main');
    }
  }, [showForm, editMode, editingServiceId]);

  // Update local data when props change
  useEffect(() => {
    if (customers && customers.length > 0) {
      setLocalCustomers(customers);
    }
  }, [customers]);

  useEffect(() => {
    if (batteries && batteries.length > 0) {
      setLocalBatteries(batteries);
    }
  }, [batteries]);

  useEffect(() => {
    if (inverters && inverters.length > 0) {
      setLocalInverters(inverters);
    }
  }, [inverters]);

  useEffect(() => {
    if (staffUsers && staffUsers.length > 0) {
      setLocalStaff(staffUsers);
    }
  }, [staffUsers]);

  const getFormTitle = (): string => {
    return editMode ? 'Edit Service Call' : 'New Service Call';
  };

  const getFormDescription = (): string => {
    return editMode ? 'Update the service call details below' : 'Fill in the details to create a new service call';
  };

  const resolveId = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const selectedCustomer = localCustomers.find((customer) => customer.id === resolveId(serviceForm.customer_id));
  const selectedBattery = localBatteries.find((battery) => battery.id === resolveId(serviceForm.battery_id));
  const selectedInverter = localInverters.find((inverter) => inverter.id === resolveId(serviceForm.inverter_id));
  const selectedBatteryIds = Array.isArray(serviceForm.battery_ids)
    ? serviceForm.battery_ids.map((id) => resolveId(id)).filter((id): id is number => id !== null)
    : (resolveId(serviceForm.battery_id) ? [resolveId(serviceForm.battery_id) as number] : []);
  const selectedInverterIds = Array.isArray(serviceForm.inverter_ids)
    ? serviceForm.inverter_ids.map((id) => resolveId(id)).filter((id): id is number => id !== null)
    : (resolveId(serviceForm.inverter_id) ? [resolveId(serviceForm.inverter_id) as number] : []);
  const selectedStaffMember = localStaff.find((staff) => staff.id === resolveId(serviceForm.service_staff_id));

  void selectedCustomer;
  void selectedBattery;
  void selectedInverter;
  void selectedStaffMember;

  // Handle refresh
  const handleRefresh = () => {
    setIsInitialized(false);
    setError(null);
    fetchCustomers();
    fetchBatteries();
    fetchInverters();
    fetchStaff();
  };

  const renderServiceForm = () => (
    <form onSubmit={handleFormSubmitWithValidation} className="service-form">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="error-alert"
            style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              padding: isMobile ? '16px' : '14px 18px',
              borderRadius: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              border: '1px solid #fee2e2',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)'
            }}
          >
            <FiAlertCircle size={20} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span style={{ flex: 1, fontSize: isMobile ? '14px' : '14px', fontWeight: '500' }}>{error}</span>
            <motion.button 
              type="button"
              onClick={() => setError(null)}
              whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                flexShrink: 0
              }}
              aria-label="Dismiss error"
              title="Dismiss error"
            >
              <FiX size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loadingData.service && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderRadius: '20px',
              backdropFilter: 'blur(4px)'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FiLoader size={48} color="#8b5cf6" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ 
                marginTop: '20px', 
                fontSize: isMobile ? '15px' : '16px', 
                color: '#374151',
                fontWeight: '500'
              }}
            >
              Loading service data...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden ID field for edit mode */}
      {editMode && (
        <input
          type="hidden"
          name="id"
          value={serviceForm.id || editingServiceId || ''}
        />
      )}

      {/* Tab Navigation for Mobile */}
      {isMobile && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          backgroundColor: '#f3f4f6',
          padding: '4px',
          borderRadius: '12px'
        }}>
          <motion.button
            type="button"
            onClick={() => setActiveTab('main')}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: activeTab === 'main' ? '#fff' : 'transparent',
              color: activeTab === 'main' ? '#8b5cf6' : '#6b7280',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: activeTab === 'main' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer'
            }}
          >
            Main Details
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setActiveTab('additional')}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: activeTab === 'additional' ? '#fff' : 'transparent',
              color: activeTab === 'additional' ? '#8b5cf6' : '#6b7280',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: activeTab === 'additional' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer'
            }}
          >
            Additional Info
          </motion.button>
        </div>
      )}

      {/* Form Grid */}
      <div className="form-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
        gap: isMobile ? '16px' : '20px',
        marginBottom: '20px'
      }}>
        {/* Main Details Section */}
        <div style={{
          gridColumn: '1 / -1',
          display: isMobile && activeTab === 'additional' ? 'none' : 'block'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-card" role="group" aria-labelledby="service-main-title">
              <div className="section-header">
                <div className="section-title">
                  <span className="section-icon">
                    <FiUser />
                  </span>
                  <div>
                    <h4 id="service-main-title">Client & Product</h4>
                    <p>Choose who the service is for and the related products.</p>
                  </div>
                </div>
                <span className="section-badge">Required: Client, Mobile</span>
              </div>
              <div className="section-content">
            {/* Customer Selection */}
            <SearchableDropdown
              id="customer_id"
              name="customer_id"
              value={serviceForm.customer_id || ""}
              onChange={handleCustomerChange}
              options={localCustomers}
              optionLabel={(customer) => `${customer.full_name} (${customer.phone})`}
              optionValue={(customer) => customer.id}
              placeholder="Select a client"
              label="Select Client"
              icon={<FiUser />}
              required={true}
              disabled={loadingData.service}
              loading={loadingData.customers}
              error={validationErrors.customer_id}
              hint="Mobile number will be auto-filled"
              success={!!serviceForm.customer_id && !validationErrors.customer_id}
              isMobile={isMobile}
            />

            {/* Customer Phone */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <motion.label 
                htmlFor="customer_phone"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: validationErrors.customer_phone ? '#ef4444' : '#374151',
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                <FiPhone style={{ color: validationErrors.customer_phone ? '#ef4444' : '#6b7280' }} />
                Mobile Number
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={serviceForm.customer_phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  autoComplete="tel"
                  disabled={loadingData.service}
                  aria-invalid={!!validationErrors.customer_phone}
                  aria-describedby={validationErrors.customer_phone ? 'customer_phone-error' : undefined}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${
                      validationErrors.customer_phone ? '#ef4444' :
                      serviceForm.customer_phone && /^[0-9]{10}$/.test(serviceForm.customer_phone) ? '#10b981' :
                      '#e5e7eb'
                    }`,
                    fontSize: isMobile ? '15px' : '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontWeight: serviceForm.customer_phone ? '500' : '400'
                  }}
                  onFocus={(e) => {
                    if (!validationErrors.customer_phone && !serviceForm.customer_phone) {
                      e.target.style.borderColor = '#8b5cf6';
                    }
                  }}
                  onBlur={(e) => {
                    if (!validationErrors.customer_phone) {
                      e.target.style.borderColor = serviceForm.customer_phone && /^[0-9]{10}$/.test(serviceForm.customer_phone) ? '#10b981' : '#e5e7eb';
                    }
                  }}
                />
              </motion.div>
              {validationErrors.customer_phone && (
                <motion.small
                  id="customer_phone-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FiAlertCircle size={12} /> {validationErrors.customer_phone}
                </motion.small>
              )}
              {!validationErrors.customer_phone && serviceForm.customer_phone && /^[0-9]{10}$/.test(serviceForm.customer_phone) && (
                <motion.small
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: '6px',
                    color: '#10b981',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FiCheckCircle size={12} /> Valid mobile number
                </motion.small>
              )}
              {!validationErrors.customer_phone && (
                <small style={{
                  marginTop: '6px',
                  color: '#6b7280',
                  fontSize: '12px',
                  display: 'block'
                }}>
                  Client selection auto-fills the number, and you can edit it if needed.
                </small>
              )}
            </div>

            <BatteryBoxSelector
              values={selectedBatteryIds}
              onChange={(values) => {
                const syntheticEvent = {
                  target: {
                    name: 'battery_ids',
                    value: JSON.stringify(values)
                  }
                } as React.ChangeEvent<HTMLSelectElement>;
                handleBatteryChange(syntheticEvent);
              }}
              options={localBatteries}
              disabled={loadingData.service}
              loading={loadingData.batteries}
              isMobile={isMobile}
            />

            <MultiSelectDropdown
              id="inverter_ids"
              name="inverters"
              values={selectedInverterIds}
              onChange={(values) => {
                const syntheticEvent = {
                  target: {
                    name: 'inverter_ids',
                    value: JSON.stringify(values)
                  }
                } as React.ChangeEvent<HTMLSelectElement>;
                handleInverterChange(syntheticEvent);
              }}
              options={localInverters}
              optionLabel={getInverterLabel}
              optionValue={(inverter) => inverter.id}
              placeholder="Select inverter products"
              label="Select Inverter Products (multiple)"
              icon={<FiPower />}
              disabled={loadingData.service}
              loading={loadingData.inverters}
              hint="Dropdown multi-select"
              isMobile={isMobile}
            />

            {/* Service Staff Selection */}
            <SearchableDropdown
              id="service_staff_id"
              name="service_staff_id"
              value={serviceForm.service_staff_id || ""}
              onChange={onServiceInputChange}
              options={localStaff}
              optionLabel={getStaffLabel}
              optionValue={(staff) => staff.id}
              placeholder="Select service staff (optional)"
              label="Assign Staff"
              icon={<FiUser />}
              required={false}
              disabled={loadingData.service}
              loading={loadingData.staff}
              hint="Assign a technician to this service"
              success={!!serviceForm.service_staff_id}
              isMobile={isMobile}
              allowEmpty={true}
            />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info Section */}
        <div style={{
          gridColumn: '1 / -1',
          display: isMobile && activeTab === 'main' ? 'none' : 'block'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-card" role="group" aria-labelledby="service-additional-title">
              <div className="section-header">
                <div className="section-title">
                  <span className="section-icon">
                    <FiTag />
                  </span>
                  <div>
                    <h4 id="service-additional-title">Service Details</h4>
                    <p>Warranty, AMC status, expected completion, and notes.</p>
                  </div>
                </div>
                <span className="section-badge">Required: Warranty</span>
              </div>
              <div className="section-content">
            {/* Warranty Status */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <motion.label 
                htmlFor="warranty_status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: validationErrors.warranty_status ? '#ef4444' : '#374151',
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                <FiTag style={{ color: validationErrors.warranty_status ? '#ef4444' : '#6b7280' }} />
                Warranty Status *
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <select
                  id="warranty_status"
                  name="warranty_status"
                  value={serviceForm.warranty_status}
                  onChange={handleWarrantyChange}
                  required
                  disabled={loadingData.service}
                  aria-invalid={!!validationErrors.warranty_status}
                  aria-describedby={validationErrors.warranty_status ? 'warranty_status-error' : undefined}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${
                      validationErrors.warranty_status ? '#ef4444' :
                      serviceForm.warranty_status ? '#10b981' :
                      '#e5e7eb'
                    }`,
                    fontSize: isMobile ? '15px' : '14px',
                    backgroundColor: '#fff',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: serviceForm.warranty_status ? '500' : '400',
                    color: serviceForm.warranty_status ? '#111827' : '#9ca3af'
                  }}
                  onFocus={(e) => {
                    if (!validationErrors.warranty_status) {
                      e.target.style.borderColor = '#8b5cf6';
                    }
                  }}
                  onBlur={(e) => {
                    if (!validationErrors.warranty_status) {
                      e.target.style.borderColor = serviceForm.warranty_status ? '#10b981' : '#e5e7eb';
                    }
                  }}
                >
                  <option value="" disabled>Select warranty status</option>
                  <option value="in_warranty">In Warranty</option>
                  <option value="extended_warranty">Extended Warranty</option>
                  <option value="out_of_warranty">Out of Warranty</option>
                </select>
              </motion.div>
              {validationErrors.warranty_status && (
                <motion.small
                  id="warranty_status-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FiAlertCircle size={12} /> {validationErrors.warranty_status}
                </motion.small>
              )}
            </div>

            {/* AMC Status - Defaulted to "active" */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <motion.label 
                htmlFor="amc_status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                <FiClock style={{ color: '#6b7280' }} />
                AMC Status
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <select
                  id="amc_status"
                  name="amc_status"
                  value={serviceForm.amc_status || 'active'}
                  onChange={onServiceInputChange}
                  disabled={loadingData.service}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: isMobile ? '15px' : '14px',
                    backgroundColor: '#fff',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    color: (serviceForm.amc_status || 'active') ? '#111827' : '#9ca3af'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="no_amc">No AMC</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </motion.div>
              <motion.small
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: '6px',
                  color: '#10b981',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiCheckCircle size={12} /> AMC status set to Active by default
              </motion.small>
            </div>

            {/* Estimated Completion Date */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <motion.label 
                htmlFor="estimated_completion_date"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                <FiCalendar style={{ color: '#6b7280' }} />
                Estimated Completion Date
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <input
                  type="date"
                  id="estimated_completion_date"
                  name="estimated_completion_date"
                  value={serviceForm.estimated_completion_date || ''}
                  onChange={onServiceInputChange}
                  disabled={loadingData.service}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: isMobile ? '15px' : '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: serviceForm.estimated_completion_date ? '#111827' : '#9ca3af'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </motion.div>
            </div>

            {/* Notes */}
            <div className="form-group full-width" style={{ 
              gridColumn: '1 / -1',
              marginBottom: '20px'
            }}>
              <motion.label 
                htmlFor="notes"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                <FiFileText style={{ color: '#6b7280' }} />
                Additional Notes
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <textarea
                  id="notes"
                  name="notes"
                  value={serviceForm.notes}
                  onChange={onServiceInputChange}
                  placeholder="Enter any additional notes, special instructions, or remarks..."
                  rows={isMobile ? 5 : 4}
                  disabled={loadingData.service}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: isMobile ? '15px' : '14px',
                    backgroundColor: '#fff',
                    resize: 'vertical',
                    minHeight: isMobile ? '120px' : '100px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </motion.div>
            </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="form-actions"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          justifyContent: 'flex-end',
          gap: isMobile ? '12px' : '16px',
          paddingTop: '24px',
          paddingBottom: isMobile ? '16px' : '20px',
          borderTop: '2px solid #f3f4f6',
          marginTop: '20px',
          position: 'sticky',
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          boxShadow: '0 -12px 24px -22px rgba(15, 23, 42, 0.45)'
        }}
      >
        <motion.button
          type="button"
          className="btn outline"
          onClick={onClose}
          whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
          whileTap={{ scale: 0.98 }}
          disabled={loading.services || loadingData.service}
          style={{
            padding: isMobile ? '16px 24px' : '14px 28px',
            borderRadius: '14px',
            border: '2px solid #e5e7eb',
            backgroundColor: '#fff',
            color: '#4b5563',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '15px',
            fontWeight: '600',
            width: isMobile ? '100%' : 'auto',
            opacity: (loading.services || loadingData.service) ? 0.5 : 1,
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          Cancel
        </motion.button>
        
        <motion.button
          type="submit"
          className="btn primary"
          whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          disabled={loading.services || loadingData.service}
          style={{
            padding: isMobile ? '16px 24px' : '14px 32px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: isMobile ? '100%' : 'auto',
            opacity: (loading.services || loadingData.service) ? 0.5 : 1,
            boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)',
            transition: 'all 0.2s'
          }}
        >
          <FiSave size={isMobile ? 20 : 18} />
          {editMode ? 'Update Service' : 'Create Service'}
          {loading.services && (
            <FiLoader className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </motion.button>
      </motion.div>
    </form>
  );

  const renderFormContent = () => {
    switch(formType) {
      case 'service':
        return renderServiceForm();
      default:
        return null;
    }
  };

  if (!showForm) return null;

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
        backgroundColor: 'rgba(15,23,42,0.62)',
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
          maxWidth: isMobile ? '100%' : isTablet ? '700px' : '850px',
          width: '100%',
          maxHeight: isMobile ? '95vh' : '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{
          padding: isMobile ? '20px 20px' : '24px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 48%, #06b6d4 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 15,
          borderRadius: isMobile ? '24px 24px 0 0' : '24px 24px 0 0',
          color: '#ffffff'
        }}>
          <div className="modal-title">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                margin: 0, 
                fontSize: isMobile ? '22px' : '26px', 
                color: '#ffffff',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <FiFileText style={{ color: '#ffffff' }} />
              {getFormTitle()}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{ 
                margin: '8px 0 0 0', 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: isMobile ? '13px' : '14px' 
              }}
            >
              {getFormDescription()}
            </motion.p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Refresh Button */}
            {!isMobile && (
              <motion.button
                onClick={handleRefresh}
                whileHover={{ rotate: 180, backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.9 }}
                disabled={loadingData.service}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  opacity: loadingData.service ? 0.5 : 1
                }}
                title="Refresh data"
              >
                <FiRefreshCw />
              </motion.button>
            )}
            
            {/* Close Button */}
            <motion.button 
              className="close-btn"
              onClick={onClose}
              whileHover={{ rotate: 90, backgroundColor: '#fee2e2', color: '#ef4444' }}
              whileTap={{ scale: 0.9 }}
              disabled={loadingData.service}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '22px' : '24px',
                  color: '#ffffff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: isMobile ? '44px' : '40px',
                height: isMobile ? '44px' : '40px',
                opacity: loadingData.service ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <FiX />
            </motion.button>
          </div>
        </div>
        
        {/* Form Content */}
        <div style={{ 
          padding: isMobile ? '20px' : '28px', 
          position: 'relative',
          background:
            'radial-gradient(circle at 12% 0%, rgba(99,102,241,0.10), transparent 35%), radial-gradient(circle at 90% 10%, rgba(6,182,212,0.10), transparent 28%), #f8fbff'
        }}>
          {renderFormContent()}
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

        .service-summary {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 18px 18px 16px;
          margin-bottom: 24px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.04)), #ffffff;
          box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.4);
          position: relative;
          overflow: hidden;
        }

        .service-summary::after {
          content: '';
          position: absolute;
          right: -40px;
          top: -40px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 65%);
          opacity: 0.6;
          pointer-events: none;
        }

        .summary-header {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .summary-title {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .summary-title h3 {
          margin: 0;
          font-size: 18px;
          color: #111827;
        }

        .summary-title p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .summary-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #ede9fe;
          color: #7c3aed;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px -12px rgba(124, 58, 237, 0.45);
        }

        .summary-progress {
          margin-top: 12px;
          display: grid;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .summary-progress-bar {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .summary-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
        }

        .summary-progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }

        .summary-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .summary-item {
          background: #ffffff;
          border: 1px solid #f3f4f6;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 8px 18px -16px rgba(15, 23, 42, 0.4);
          min-height: 78px;
        }

        .summary-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .summary-item-icon {
          color: #8b5cf6;
          display: inline-flex;
          font-size: 14px;
        }

        .summary-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .summary-value.muted {
          color: #9ca3af;
          font-weight: 500;
        }

        .summary-sub {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .summary-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid transparent;
          background: #f3f4f6;
          color: #374151;
          white-space: nowrap;
        }

        .summary-pill--ok {
          background: #ecfdf3;
          color: #065f46;
          border-color: #a7f3d0;
        }

        .summary-pill--warn {
          background: #fff7ed;
          color: #9a3412;
          border-color: #fed7aa;
        }

        .summary-pill--danger {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .summary-pill--muted {
          background: #f3f4f6;
          color: #6b7280;
          border-color: #e5e7eb;
        }

        .section-card {
          border: 1px solid #dbeafe;
          border-radius: 18px;
          padding: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
          box-shadow: 0 14px 24px -20px rgba(30, 64, 175, 0.4);
        }

        .section-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-title h4 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }

        .section-title p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .section-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
          color: #4f46e5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 14px -12px rgba(79, 70, 229, 0.7);
        }

        .section-badge {
          font-size: 12px;
          font-weight: 600;
          color: #3730a3;
          background: #eef2ff;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #c7d2fe;
          white-space: nowrap;
        }

        .dropdown-container .dropdown-button {
          border-color: #dbeafe !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
        }

        .section-content .form-group:last-child {
          margin-bottom: 0;
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
          select, input, textarea, button, .dropdown-button {
            min-height: 48px;
          }
          
          .form-group {
            margin-bottom: 16px;
          }

          .service-summary {
            padding: 16px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .section-card {
            padding: 16px;
          }
        }
        
        /* Animations */
        .dropdown-option {
          transition: all 0.2s ease;
        }
        
        /* Focus styles */
        input:focus, select:focus, textarea:focus {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1) !important;
        }
        
        /* Hover effects */
        .btn:hover {
          transform: translateY(-1px);
        }
        
        /* Loading animation */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .loading-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default ServiceFormModal;
