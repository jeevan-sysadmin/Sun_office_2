import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiCamera, 
  FiVideo, 
  FiVideoOff, 
  FiZap, 
  FiZapOff, 
  FiZoomIn, 
  FiZoomOut,
  FiGrid,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiKey
} from 'react-icons/fi';
import '../css/BarcodeScannerModal.css';

interface BarcodeScanResult {
  code: string;
  format: string;
  type: 'battery' | 'customer' | 'service' | 'delivery' | 'spare';
  timestamp: Date;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  isScanning: boolean;
  scanResult: BarcodeScanResult | null;
  scanMode: 'auto' | 'manual';
  flashOn: boolean;
  zoomLevel: number;
  scanHistory: BarcodeScanResult[];
  scanError: string | null;
  activeTab: string;
  onClose: () => void;
  onStartScan: () => void;
  onStopScan: () => void;
  onToggleMode: () => void;
  onToggleFlash: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onManualInput: (code: string) => void;
  onClearHistory: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  isScanning,
  scanResult,
  scanMode,
  flashOn,
  zoomLevel,
  scanHistory,
  scanError,
  activeTab,
  onClose,
  onStartScan,
  onStopScan,
  onToggleMode,
  onToggleFlash,
  onZoomIn,
  onZoomOut,
  onManualInput,
  onClearHistory,
  videoRef,
  canvasRef
}) => {
  const [manualCode, setManualCode] = useState<string>('');

  useEffect(() => {
    if (isOpen && isScanning) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
        if (e.key === ' ') {
          if (isScanning) {
            onStopScan();
          } else {
            onStartScan();
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, isScanning, onClose, onStartScan, onStopScan]);

  const getActiveTabName = () => {
    const tabNames: Record<string, string> = {
      'services': 'Service Orders',
      'customers': 'Customers',
      'batteries': 'Batteries',
      'delivery': 'Deliveries',
      'replacement': 'Replacements',
      'spare_batteries': 'Spare Batteries',
      'sun_powers_to_company': 'Sun Powers to Company',
      'company_to_sun_powers': 'Company to Sun Powers',
      'company_claims': 'Company Claims',
      'shop_claims': 'Shop Claims',
      'dashboard': 'Dashboard'
    };
    return tabNames[activeTab] || activeTab;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onManualInput(manualCode);
      setManualCode('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="barcode-scanner-modal-overlay">
          <motion.div 
            className="barcode-scanner-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Modal Header */}
            <div className="scanner-header">
              <div className="scanner-title">
                <FiCamera />
                <h3>Barcode Scanner</h3>
                <span className="active-tab-badge">{getActiveTabName()}</span>
              </div>
              <button className="close-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>

            {/* Scanner Content */}
            <div className="scanner-content">
              {/* Scanner Preview */}
              <div className="scanner-preview-container">
                <div className="scanner-preview">
                  <video 
                    ref={videoRef}
                    className={`scanner-video ${isScanning ? 'active' : ''}`}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="scanner-canvas" />
                  
                  {!isScanning && (
                    <div className="scanner-placeholder">
                      <FiCamera size={48} />
                      <p>Camera preview will appear here</p>
                      <small>Click "Start Scanning" to begin</small>
                    </div>
                  )}

                  {/* Scanner Overlay Grid */}
                  {isScanning && (
                    <div className="scanner-overlay">
                      <div className="scanner-grid">
                        <div className="grid-line horizontal top"></div>
                        <div className="grid-line horizontal middle"></div>
                        <div className="grid-line horizontal bottom"></div>
                        <div className="grid-line vertical left"></div>
                        <div className="grid-line vertical center"></div>
                        <div className="grid-line vertical right"></div>
                        
                        {/* Corner markers */}
                        <div className="corner-marker top-left"></div>
                        <div className="corner-marker top-right"></div>
                        <div className="corner-marker bottom-left"></div>
                        <div className="corner-marker bottom-right"></div>
                      </div>
                      
                      <div className="scanning-indicator">
                        <div className="scan-line"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanner Controls */}
                <div className="scanner-controls">
                  <div className="control-group">
                    <button 
                      className={`control-btn ${isScanning ? 'active' : ''}`}
                      onClick={isScanning ? onStopScan : onStartScan}
                    >
                      {isScanning ? <FiVideoOff /> : <FiVideo />}
                      <span>{isScanning ? 'Stop Scanning' : 'Start Scanning'}</span>
                    </button>
                    
                    <button 
                      className={`control-btn ${flashOn ? 'active' : ''}`}
                      onClick={onToggleFlash}
                      disabled={!isScanning}
                    >
                      {flashOn ? <FiZapOff /> : <FiZap />}
                      <span>{flashOn ? 'Flash Off' : 'Flash On'}</span>
                    </button>
                    
                    <button 
                      className={`control-btn ${scanMode === 'auto' ? 'active' : ''}`}
                      onClick={onToggleMode}
                    >
                      <FiGrid />
                      <span>{scanMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}</span>
                    </button>
                  </div>
                  
                  <div className="control-group">
                    <button 
                      className="control-btn"
                      onClick={onZoomOut}
                      disabled={!isScanning || zoomLevel <= 1}
                    >
                      <FiZoomOut />
                      <span>Zoom Out</span>
                    </button>
                    
                    <div className="zoom-display">
                      <span>{zoomLevel.toFixed(1)}x</span>
                    </div>
                    
                    <button 
                      className="control-btn"
                      onClick={onZoomIn}
                      disabled={!isScanning || zoomLevel >= 3}
                    >
                      <FiZoomIn />
                      <span>Zoom In</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Side Panel */}
              <div className="scanner-side-panel">
                {/* Manual Input */}
                <div className="manual-input-section">
                  <h4>
                    <FiKey />
                    <span>Manual Barcode Input</span>
                  </h4>
                  <form onSubmit={handleManualSubmit}>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter barcode manually"
                      className="manual-input"
                    />
                    <button type="submit" className="manual-submit-btn">
                      <FiCheck />
                      <span>Submit</span>
                    </button>
                  </form>
                </div>

                {/* Scan Result */}
                {scanResult && (
                  <div className="scan-result-section">
                    <h4>
                      <FiCheck />
                      <span>Last Scan Result</span>
                    </h4>
                    <div className="scan-result-card success">
                      <div className="result-header">
                        <span className="result-code">{scanResult.code}</span>
                        <span className="result-format">{scanResult.format.toUpperCase()}</span>
                      </div>
                      <div className="result-details">
                        <div className="result-type">
                          <span>Type:</span>
                          <span className={`type-badge ${scanResult.type}`}>
                            {scanResult.type.charAt(0).toUpperCase() + scanResult.type.slice(1)}
                          </span>
                        </div>
                        <div className="result-time">
                          <span>Time:</span>
                          <span>{formatTime(scanResult.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scan History */}
                <div className="scan-history-section">
                  <div className="history-header">
                    <h4>
                      <FiClock />
                      <span>Scan History</span>
                    </h4>
                    {scanHistory.length > 0 && (
                      <button className="clear-history-btn" onClick={onClearHistory}>
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="history-list">
                    {scanHistory.length === 0 ? (
                      <div className="empty-history">
                        <p>No scans yet</p>
                        <small>Scan barcodes to see history here</small>
                      </div>
                    ) : (
                      scanHistory.slice().reverse().map((scan, index) => (
                        <div key={index} className="history-item">
                          <div className="history-code">{scan.code}</div>
                          <div className="history-details">
                            <span className={`history-type ${scan.type}`}>
                              {scan.type.charAt(0).toUpperCase()}
                            </span>
                            <span className="history-time">{formatTime(scan.timestamp)}</span>
                            <span className="history-format">{scan.format}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {scanError && (
                  <div className="error-section">
                    <div className="error-message">
                      <FiAlertCircle />
                      <span>{scanError}</span>
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div className="help-section">
                  <h4>Tips:</h4>
                  <ul>
                    <li>Hold barcode steady in the center of the frame</li>
                    <li>Ensure good lighting for better detection</li>
                    <li>Use flash in low-light conditions</li>
                    <li>Press SPACE to start/stop scanning</li>
                    <li>Press ESC to close scanner</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BarcodeScannerModal;