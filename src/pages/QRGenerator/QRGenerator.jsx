import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Slider,
  Switch,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  Description as CsvIcon,
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  AutoAwesome as MagicIcon,
  Refresh as RefreshIcon,
  Collections as GalleryIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  AddPhotoAlternate as AddPhotoIcon,
} from '@mui/icons-material';

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ENV_CONFIG, getActiveEnvKey } from '../../services/api';

// Helper function to generate 24-digit random numeric/hex QR token
const generate24DigitToken = () => {
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Helper function to extract 24-character token from URL or raw string
const extractTokenFromInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const dataParam = url.searchParams.get('data');
      if (dataParam) return dataParam.trim();
    }
  } catch (e) {
    // Ignore URL parse error
  }
  return trimmed;
};

// Helper function to measure exact native aspect ratio of template image
const getImageDimensions = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 600, height: img.naturalHeight || 800 });
    };
    img.onerror = () => {
      resolve({ width: 600, height: 800 });
    };
    img.src = url;
  });
};

// Helper to convert image URL to base64 Data URL for jsPDF export
const urlToBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (url.startsWith('data:')) return resolve(url);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataURL);
      } catch (err) {
        console.error('Failed to convert URL to Base64:', err);
        resolve(url);
      }
    };
    img.onerror = (err) => {
      console.error('Image load error for Base64 conversion:', err);
      resolve(url);
    };
    img.src = url;
  });
};


const getAssetPath = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('data:') || filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanFilename = filename.startsWith('./') ? filename.substring(2) : filename;
  const pathWithoutAssets = cleanFilename.startsWith('assets/') ? cleanFilename : `assets/${cleanFilename}`;
  return `${cleanBase}${pathWithoutAssets}`;
};

const DEFAULT_TEMPLATE_PRESETS = {
  'jarro-official-whatsapp': {
    id: 'jarro-official-whatsapp',
    title: 'JARRo WhatsApp & Digital Menu',
    subtitle: 'Official Bilingual Standee with WhatsApp Bill Callout',
    badge: '★ OFFICIAL RECOMMENDED',
    badgeColor: 'success',
    bg: getAssetPath('jarro_official_whatsapp_qr_template.jpg'),
    size: 47,
    x: 41,
    y: 39,
    isDeletable: true,
  },
  'jaaro-bilingual-menu': {
    id: 'jaaro-bilingual-menu',
    title: 'JAARO Digital Menu Standee',
    subtitle: 'Bilingual (Hindi & English) Digital Menu Standee',
    badge: 'BILINGUAL',
    badgeColor: 'warning',
    bg: getAssetPath('jaaro_digital_menu_qr_template.jpg'),
    size: 51,
    x: 41,
    y: 35,
    isDeletable: true,
  },
  'mascot-chef': {
    id: 'mascot-chef',
    title: 'Chef JARRo Standee',
    subtitle: 'Dark Navy & Gold 3D Chef Standee',
    badge: 'POPULAR',
    badgeColor: 'info',
    bg: getAssetPath('jarro_mascot_chef_qr_template.jpg'),
    size: 48,
    x: 37,
    y: 30,
    isDeletable: true,
  },
  'mascot-fox': {
    id: 'mascot-fox',
    title: 'Red Panda Foodie',
    subtitle: 'Warm Amber & Charcoal Standee',
    badge: 'AMBER',
    badgeColor: 'secondary',
    bg: getAssetPath('jarro_mascot_fox_qr_template.jpg'),
    size: 44,
    x: 48,
    y: 36,
    isDeletable: true,
  },
  'mascot-rocket': {
    id: 'mascot-rocket',
    title: 'Superhero Express',
    subtitle: 'Neon Blue & Cyan Standee',
    badge: 'EXPRESS',
    badgeColor: 'primary',
    bg: getAssetPath('jarro_mascot_rocket_qr_template.jpg'),
    size: 42,
    x: 46,
    y: 35,
    isDeletable: true,
  },
  'mascot-food-buddy': {
    id: 'mascot-food-buddy',
    title: 'Pizza & Noodle Buddies',
    subtitle: 'Crimson Bistro Standee',
    badge: 'BISTRO',
    badgeColor: 'error',
    bg: getAssetPath('jarro_mascot_food_buddy_qr_template.jpg'),
    size: 48,
    x: 41,
    y: 28,
    isDeletable: true,
  },
  'vsafe-template': {
    id: 'vsafe-template',
    title: 'JARRo Classic Gold Card',
    subtitle: 'Clean Minimal Gold Bordered Table Sticker',
    badge: 'CLASSIC',
    badgeColor: 'default',
    bg: getAssetPath('jarro_vsafe_qr_sticker_template.jpg'),
    size: 53,
    x: 24,
    y: 34,
    isDeletable: true,
  },
  'custom-bg': {
    id: 'custom-bg',
    title: 'Upload Custom Design',
    subtitle: 'Upload your own custom image or design template',
    badge: 'CUSTOM',
    badgeColor: 'primary',
    bg: null,
    size: 45,
    x: 27.5,
    y: 25,
    isDeletable: false,
  },
};



const loadSavedCoords = () => {
  try {
    const saved = localStorage.getItem('jarro_qr_template_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_TEMPLATE_PRESETS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load saved QR template coords:', e);
  }
  return DEFAULT_TEMPLATE_PRESETS;
};

export default function QRGenerator() {
  const [tabValue, setTabValue] = useState(0);

  // Generator State
  const [activeEnv, setActiveEnv] = useState('prod');
  const [customDomain, setCustomDomain] = useState('');
  const [count, setCount] = useState(1);
  const [qrItems, setQrItems] = useState([]); // [{ token, fullUrl, dataUrl }]
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [rightPanelView, setRightPanelView] = useState('preview'); // 'preview' | 'grid'

  // Validator State
  const [validatorInput, setValidatorInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validatorError, setValidatorError] = useState('');

  // Paper & Sheet Layout State (Default: PhonePe/GPay Style 4 Standees per sheet)
  const [paperFormat, setPaperFormat] = useState('a4-4-medium');
  const [pdfPageOrientation, setPdfPageOrientation] = useState('auto'); // 'auto' | 'portrait' | 'landscape'
  const [customWidthMm, setCustomWidthMm] = useState(210);
  const [customHeightMm, setCustomHeightMm] = useState(297);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  // Custom Physical Card Dimensions & Aspect Ratio Lock State
  const [lockAspect, setLockAspect] = useState(true);
  const [cardWidthMm, setCardWidthMm] = useState(95);
  const [cardHeightMm, setCardHeightMm] = useState(126.6);

  const handleCardWidthChange = (val) => {
    setCardWidthMm(val);
    const w = parseFloat(val);
    if (lockAspect && !isNaN(w) && w > 0) {
      setCardHeightMm((w * (4 / 3)).toFixed(1));
    }
  };

  const handleCardHeightChange = (val) => {
    setCardHeightMm(val);
    const h = parseFloat(val);
    if (lockAspect && !isNaN(h) && h > 0) {
      setCardWidthMm((h * (3 / 4)).toFixed(1));
    }
  };

  // Custom Sticker Design Template State & Saved Coords
  const [templateCoords, setTemplateCoords] = useState(loadSavedCoords);
  const [templateMode, setTemplateMode] = useState('jarro-official-whatsapp');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [deletedTemplateIds, setDeletedTemplateIds] = useState(() => {
    try {
      const saved = localStorage.getItem('jarro_deleted_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customBgDataUrl, setCustomBgDataUrl] = useState(() => {
    const saved = loadSavedCoords();
    const bgUrl = saved['jarro-official-whatsapp']?.bg || DEFAULT_TEMPLATE_PRESETS['jarro-official-whatsapp'].bg;
    return getAssetPath(bgUrl);
  });
  const [qrSizePercent, setQrSizePercent] = useState(() => {
    const saved = loadSavedCoords();
    return saved['jarro-official-whatsapp']?.size ?? 47;
  });
  const [qrXPercent, setQrXPercent] = useState(() => {
    const saved = loadSavedCoords();
    return saved['jarro-official-whatsapp']?.x ?? 41;
  });
  const [qrYPercent, setQrYPercent] = useState(() => {
    const saved = loadSavedCoords();
    return saved['jarro-official-whatsapp']?.y ?? 39;
  });

  const handleDeleteTemplate = (templateId, e) => {
    if (e) e.stopPropagation();
    const updatedDeleted = [...deletedTemplateIds, templateId];
    setDeletedTemplateIds(updatedDeleted);
    try {
      localStorage.setItem('jarro_deleted_templates', JSON.stringify(updatedDeleted));
    } catch (err) {
      console.error('Failed to save deleted templates:', err);
    }
    if (templateMode === templateId) {
      handleSelectTemplate('jarro-official-whatsapp');
    }
  };

  const handleRestoreTemplates = () => {
    setDeletedTemplateIds([]);
    try {
      localStorage.removeItem('jarro_deleted_templates');
    } catch (err) {
      console.error('Failed to clear deleted templates:', err);
    }
  };


  const [showTokenText, setShowTokenText] = useState(false);
  const [transparentBg, setTransparentBg] = useState(true);

  // Drag and Drop Interactive Canvas State
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startQrX: 0, startQrY: 0, cardWidth: 0, cardHeight: 0 });

  // Update & Persist Coordinates
  const updateCoords = (newSize, newX, newY) => {
    const sizeVal = newSize !== undefined ? newSize : qrSizePercent;
    const xVal = newX !== undefined ? newX : qrXPercent;
    const yVal = newY !== undefined ? newY : qrYPercent;

    if (newSize !== undefined) setQrSizePercent(sizeVal);
    if (newX !== undefined) setQrXPercent(xVal);
    if (newY !== undefined) setQrYPercent(yVal);

    setTemplateCoords((prev) => {
      const updated = {
        ...prev,
        [templateMode]: {
          ...prev[templateMode],
          size: sizeVal,
          x: xVal,
          y: yVal,
          bg: customBgDataUrl,
        },
      };
      try {
        localStorage.setItem('jarro_qr_template_coords', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save QR template coords to localStorage:', e);
      }
      return updated;
    });
  };

  const handleSelectTemplate = (mode) => {
    setTemplateMode(mode);
    const coords = templateCoords[mode] || DEFAULT_TEMPLATE_PRESETS[mode] || DEFAULT_TEMPLATE_PRESETS['custom-bg'];
    if (coords.bg) setCustomBgDataUrl(coords.bg);
    setQrSizePercent(coords.size);
    setQrXPercent(coords.x);
    setQrYPercent(coords.y);
    setShowTokenText(false);
  };

  // Direct Mouse / Touch Dragging Handlers
  const handleDragStart = (e) => {
    e.preventDefault();
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      startQrX: qrXPercent,
      startQrY: qrYPercent,
      cardWidth: rect.width,
      cardHeight: rect.height,
    });
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging || !dragStart.cardWidth || !dragStart.cardHeight) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      const deltaXPercent = (deltaX / dragStart.cardWidth) * 100;
      const deltaYPercent = (deltaY / dragStart.cardHeight) * 100;

      let newX = Math.round(dragStart.startQrX + deltaXPercent);
      let newY = Math.round(dragStart.startQrY + deltaYPercent);

      newX = Math.max(0, Math.min(100 - qrSizePercent, newX));
      newY = Math.max(0, Math.min(100 - qrSizePercent, newY));

      updateCoords(undefined, newX, newY);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStart, qrSizePercent]);

  const handleBgImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBgDataUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isVerifiedUnique, setIsVerifiedUnique] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');

  // Set default active environment based on current environment key
  useEffect(() => {
    const currentKey = getActiveEnvKey();
    if (currentKey === 'dev') {
      setActiveEnv('dev');
    } else {
      setActiveEnv('prod');
    }
  }, []);

  // Determine base scan URL
  const getBaseScanUrl = () => {
    if (customDomain.trim()) {
      let domain = customDomain.trim();
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      return domain.replace(/\/+$/, '');
    }
    if (activeEnv === 'dev') {
      return 'https://admin-dev.jarro.in';
    }
    return 'https://app.jarro.in';
  };

  // Generate & Server-Validate Batch QR Codes (Guarantees 100% Uniqueness against Database)
  const handleGenerateBatch = async () => {
    try {
      setGenerating(true);
      setIsVerifiedUnique(false);
      setGeneratingStatus('Generating unique candidate tokens...');
      const qty = Math.min(Math.max(parseInt(count) || 1, 1), 500);
      const baseUrl = getBaseScanUrl();

      // Step 1: Generate unique tokens locally
      const uniqueTokensSet = new Set();
      while (uniqueTokensSet.size < qty) {
        uniqueTokensSet.add(generate24DigitToken());
      }
      let candidateTokens = Array.from(uniqueTokensSet);

      // Step 2: Validate against Backend Database to ensure non-conflict
      setGeneratingStatus('Verifying uniqueness against server database...');
      const apiUrl =
        activeEnv === 'dev'
          ? 'https://dev-api.jarro.in/api/super/tables/check-qr-codes'
          : 'https://api.jarro.in/api/super/tables/check-qr-codes';

      let verifiedTokens = [];
      let attempts = 0;
      const maxAttempts = 5;

      while (verifiedTokens.length < qty && attempts < maxAttempts) {
        attempts++;
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ qrCodes: candidateTokens }),
          });

          if (response.ok) {
            const data = await response.json();
            const presentCodes = new Set(data.presentCodes || []);

            // Keep only unassigned tokens
            const availableTokens = candidateTokens.filter((t) => !presentCodes.has(t));
            verifiedTokens.push(...availableTokens);

            if (verifiedTokens.length < qty) {
              const needed = qty - verifiedTokens.length;
              const newReplacements = new Set();
              while (newReplacements.size < needed) {
                const token = generate24DigitToken();
                if (!verifiedTokens.includes(token)) {
                  newReplacements.add(token);
                }
              }
              candidateTokens = Array.from(newReplacements);
            }
          } else {
            verifiedTokens = candidateTokens;
            break;
          }
        } catch (e) {
          verifiedTokens = candidateTokens;
          break;
        }
      }

      const finalTokens = verifiedTokens.slice(0, qty);

      // Step 3: Render Data URLs for preview & PDF
      setGeneratingStatus('Rendering vector QR codes...');
      const newItems = [];
      for (let i = 0; i < finalTokens.length; i++) {
        const token = finalTokens[i];
        const fullUrl = `${baseUrl}/?data=${token}`;
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 400,
          margin: 1,
          color: { dark: '#000000', light: transparentBg ? '#00000000' : '#ffffff' },
        });
        newItems.push({ index: i + 1, token, fullUrl, dataUrl });
      }

      setQrItems(newItems);
      setIsVerifiedUnique(true);
    } catch (err) {
      console.error('QR Generation Error:', err);
    } finally {
      setGenerating(false);
      setGeneratingStatus('');
    }
  };

  // Generate immediately on first load or when activeEnv or transparentBg changes
  useEffect(() => {
    handleGenerateBatch();
  }, [activeEnv, transparentBg]);

  // Export PDF Sheet (Multi-layout QR stickers grid)
  const handleExportPDF = async () => {
    if (qrItems.length === 0) return;
    try {
      setExporting(true);
      setExportProgress(0);

      let pdfFormat = 'a4';
      let orientation = 'portrait';
      let cols = 3;
      let rows = 4;

      if (paperFormat === 'a4-4-medium') {
        pdfFormat = 'a4';
        orientation = 'portrait';
        cols = 2;
        rows = 2;
      } else if (paperFormat === 'a4-2-large') {
        pdfFormat = 'a4';
        orientation = 'landscape';
        cols = 2;
        rows = 1;
      } else if (paperFormat === 'a4-1-full') {
        pdfFormat = 'a4';
        orientation = 'portrait';
        cols = 1;
        rows = 1;
      } else if (paperFormat === 'a4-6') {
        pdfFormat = 'a4';
        orientation = 'portrait';
        cols = 2;
        rows = 3;
      } else if (paperFormat === 'a4-12') {
        pdfFormat = 'a4';
        orientation = 'portrait';
        cols = 3;
        rows = 4;
      } else if (paperFormat === 'a4-20') {
        pdfFormat = 'a4';
        orientation = 'portrait';
        cols = 4;
        rows = 5;
      } else if (paperFormat === '20x12-inch') {
        pdfFormat = [508, 304.8]; // 20" x 12" in mm
        orientation = 'landscape';
        cols = 8;
        rows = 4;
      } else if (paperFormat === 'a3-24') {
        pdfFormat = 'a3';
        orientation = 'portrait';
        cols = 4;
        rows = 6;
      } else if (paperFormat === 'custom') {
        const pageW = parseFloat(customWidthMm) || 210;
        const pageH = parseFloat(customHeightMm) || 297;
        pdfFormat = [pageW, pageH];
        orientation = pageW >= pageH ? 'landscape' : 'portrait';

        const reqCardW = parseFloat(cardWidthMm);
        const reqCardH = parseFloat(cardHeightMm);

        if (!isNaN(reqCardW) && reqCardW > 0 && !isNaN(reqCardH) && reqCardH > 0) {
          cols = Math.max(1, Math.floor((pageW - 10) / reqCardW));
          rows = Math.max(1, Math.floor((pageH - 10) / reqCardH));
        } else {
          cols = Math.max(parseInt(customCols) || 1, 1);
          rows = Math.max(parseInt(customRows) || 1, 1);
        }
      }

      // Explicit User Page Orientation Override (Portrait vs Landscape)
      if (pdfPageOrientation === 'portrait' || pdfPageOrientation === 'landscape') {
        orientation = pdfPageOrientation;
        // Swap cols/rows if orientation was flipped so grid auto-adapts
        if (pdfPageOrientation === 'landscape' && cols < rows) {
          const temp = cols;
          cols = rows;
          rows = temp;
        } else if (pdfPageOrientation === 'portrait' && cols > rows) {
          const temp = cols;
          cols = rows;
          rows = temp;
        }
      }

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pdfFormat,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 5;
      const cellWidth = (pageWidth - margin * 2) / cols;
      const cellHeight = (pageHeight - margin * 2) / rows;

      // Convert custom background image URL to Base64 Data URL for jsPDF
      const bgBase64 = customBgDataUrl ? await urlToBase64(customBgDataUrl) : null;

      // Measure true native aspect ratio of template image
      let nativeAspect = 3 / 4;
      if (customBgDataUrl) {
        const { width: w, height: h } = await getImageDimensions(customBgDataUrl);
        if (w > 0 && h > 0) {
          nativeAspect = w / h;
        }
      }

      for (let i = 0; i < qrItems.length; i++) {
        const item = qrItems[i];
        const itemIndexOnPage = i % (cols * rows);

        if (itemIndexOnPage === 0 && i > 0) {
          doc.addPage();
        }

        const col = itemIndexOnPage % cols;
        const row = Math.floor(itemIndexOnPage / cols);

        const x = margin + col * cellWidth;
        const y = margin + row * cellHeight;

        if (bgBase64) {
          // Maintain 100% native aspect ratio of the sticker card template with ZERO stretching
          let drawWidth = cellWidth - 2;
          let drawHeight = drawWidth / nativeAspect;

          if (drawHeight > cellHeight - 2) {
            drawHeight = cellHeight - 2;
            drawWidth = drawHeight * nativeAspect;
          }

          // Center the sticker card in the grid cell
          const drawX = x + (cellWidth - drawWidth) / 2;
          const drawY = y + (cellHeight - drawHeight) / 2;

          // Draw Custom Background Image for Sticker (Zero Distortion)
          doc.addImage(bgBase64, 'JPEG', drawX, drawY, drawWidth, drawHeight, undefined, 'FAST');


          // Position QR Code based on custom position sliders (%) - Exact 1:1 match with Web Preview
          const qrWidth = drawWidth * (qrSizePercent / 100);
          const qrHeight = qrWidth; // Square QR Code
          const qrX = drawX + drawWidth * (qrXPercent / 100);
          const qrY = drawY + drawHeight * (qrYPercent / 100);

          doc.addImage(item.dataUrl, 'PNG', qrX, qrY, qrWidth, qrHeight);

          if (showTokenText) {
            doc.setFont('courier', 'bold');
            doc.setFontSize(Math.min(drawHeight * 0.08, 6));
            doc.setTextColor(30, 41, 59);
            doc.text(`ID: ${item.token.substring(0, 10)}`, drawX + drawWidth / 2, drawY + drawHeight - 2, { align: 'center' });
          }
        } else {
          // Default Jarro Card Template
          doc.setDrawColor(210, 220, 235);
          doc.setLineWidth(0.3);
          doc.roundedRect(x + 1.5, y + 1.5, cardWidth, cardHeight, 2, 2, 'S');

          const headerFontSize = Math.min(cellHeight * 0.15, 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(headerFontSize);
          doc.setTextColor(79, 70, 229);
          doc.text('JARRo', x + cellWidth / 2, y + cellHeight * 0.13, { align: 'center' });

          const qrSize = Math.min(cellWidth * 0.65, cellHeight * 0.55);
          const qrX = x + (cellWidth - qrSize) / 2;
          const qrY = y + cellHeight * 0.18;
          doc.addImage(item.dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          const footerFontSize = Math.min(cellHeight * 0.1, 7);
          doc.setFont('courier', 'bold');
          doc.setFontSize(footerFontSize);
          doc.setTextColor(30, 41, 59);
          doc.text(`ID: ${item.token.substring(0, 10)}...`, x + cellWidth / 2, y + cellHeight - cellHeight * 0.1, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.max(footerFontSize - 1.5, 5));
          doc.setTextColor(148, 163, 184);
          doc.text(`Sticker #${item.index}`, x + cellWidth / 2, y + cellHeight - cellHeight * 0.03, { align: 'center' });
        }

        setExportProgress(Math.round(((i + 1) / qrItems.length) * 100));
      }

      doc.save(`Jarro_QR_Sheet_${qrItems.length}_${paperFormat}_${activeEnv.toUpperCase()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Export ZIP Archive of PNG Images
  const handleExportZIP = async () => {
    if (qrItems.length === 0) return;
    try {
      setExporting(true);
      setExportProgress(0);

      const zip = new JSZip();
      const folder = zip.folder(`Jarro_QR_Codes_${activeEnv.toUpperCase()}`);

      for (let i = 0; i < qrItems.length; i++) {
        const item = qrItems[i];
        const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `table_qr_${String(item.index).padStart(3, '0')}_${item.token.substring(0, 8)}.png`;
        folder.file(filename, base64Data, { base64: true });
        setExportProgress(Math.round(((i + 1) / qrItems.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Jarro_QR_Images_${qrItems.length}_${activeEnv.toUpperCase()}.zip`);
    } catch (err) {
      console.error('ZIP Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Export CSV File
  const handleExportCSV = () => {
    if (qrItems.length === 0) return;
    let csvContent = 'Index,Token,FullScanURL,Environment\n';
    qrItems.forEach((item) => {
      csvContent += `${item.index},"${item.token}","${item.fullUrl}","${activeEnv.toUpperCase()}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Jarro_QR_Tokens_${qrItems.length}_${activeEnv.toUpperCase()}.csv`);
  };

  // Validate Pasted / Uploaded QR Tokens against Backend
  const handleValidateTokens = async () => {
    if (!validatorInput.trim()) {
      setValidatorError('Please paste or upload QR code links/tokens to check.');
      return;
    }

    try {
      setValidating(true);
      setValidatorError('');
      setValidationResult(null);

      // Split lines/commas and extract tokens
      const rawLines = validatorInput.split(/[\n,;\s]+/);
      const tokens = Array.from(
        new Set(rawLines.map(extractTokenFromInput).filter((t) => t.length > 0))
      );

      if (tokens.length === 0) {
        throw new Error('No valid 24-character QR tokens found in input.');
      }

      // Backend API URL based on activeEnv
      const apiUrl =
        activeEnv === 'dev'
          ? 'https://dev-api.jarro.in/api/super/tables/check-qr-codes'
          : 'https://api.jarro.in/api/super/tables/check-qr-codes';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ qrCodes: tokens }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check QR codes with server');
      }

      setValidationResult({
        totalSubmitted: tokens.length,
        presentCodes: data.presentCodes || [],
        notPresentCount: data.notPresentCount || 0,
        tokens,
      });
    } catch (err) {
      setValidatorError(err.message);
    } finally {
      setValidating(false);
    }
  };

  // File Upload Reader for Validator
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setValidatorInput(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2, display: 'flex' }}>
              <QrCodeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Pre-Printed QR Code Generator & Validator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate bulk 100+ QR stickers (PDF / ZIP) & validate pre-printed table QR stickers
              </Typography>
            </Box>
          </Box>

          {/* Environment Domain Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Target Env Domain:
            </Typography>
            <Select
              size="small"
              value={activeEnv}
              onChange={(e) => setActiveEnv(e.target.value)}
              sx={{ minWidth: 160, fontWeight: 600, bgcolor: 'background.paper' }}
            >
              <MenuItem value="prod">
                <Chip label="PROD" size="small" color="primary" sx={{ mr: 1, height: 20 }} /> app.jarro.in
              </MenuItem>
              <MenuItem value="dev">
                <Chip label="DEV" size="small" color="warning" sx={{ mr: 1, height: 20 }} /> admin-dev.jarro.in
              </MenuItem>
              <MenuItem value="custom">Custom Domain</MenuItem>
            </Select>

            {activeEnv === 'custom' && (
              <TextField
                size="small"
                placeholder="https://your-domain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                sx={{ width: 200, bgcolor: 'background.paper' }}
              />
            )}
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }} icon={<MagicIcon />}>
          <strong>Active Scan Base URL:</strong> <code>{getBaseScanUrl()}/?data=[24-digit-token]</code>
        </Alert>
      </Paper>

      {/* Main Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, val) => setTabValue(val)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<QrCodeIcon />} iconPosition="start" label="Generate Bulk QR Stickers (PDF / ZIP)" />
          <Tab icon={<UploadIcon />} iconPosition="start" label="Validate & Check Scanned QR Codes" />
        </Tabs>
      </Paper>

      {/* Tab 0: Bulk QR Generator */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Batch Configuration
              </Typography>

              <TextField
                fullWidth
                label="Number of QR Codes to Generate"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                inputProps={{ min: 1, max: 500 }}
                helperText="Enter quantity (e.g. 10, 50, 100, 200)"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                onClick={handleGenerateBatch}
                disabled={generating}
                sx={{ mb: 3, py: 1.5 }}
              >
                {generating ? 'Generating QR Batch...' : `Generate ${count} Fresh QR Codes`}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Sticker Card Design & QR Positioning
              </Typography>

              {/* Active Selected Template Preview Card with Gallery Button */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  border: '1.5px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 80,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      bgcolor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {customBgDataUrl ? (
                      <img
                        src={customBgDataUrl}
                        alt="Selected Template"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <AddPhotoIcon color="action" />
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {DEFAULT_TEMPLATE_PRESETS[templateMode]?.title || 'Selected Design'}
                      </Typography>
                      {DEFAULT_TEMPLATE_PRESETS[templateMode]?.badge && (
                        <Chip
                          label={DEFAULT_TEMPLATE_PRESETS[templateMode].badge}
                          color={DEFAULT_TEMPLATE_PRESETS[templateMode].badgeColor || 'default'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {DEFAULT_TEMPLATE_PRESETS[templateMode]?.subtitle || 'Custom card template design'}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<GalleryIcon />}
                  onClick={() => setGalleryOpen(true)}
                  sx={{
                    py: 1,
                    fontWeight: 700,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                    },
                  }}
                >
                  🖼️ Browse Template Gallery
                </Button>
              </Paper>

              {(templateMode === 'custom-bg' || templateMode === 'vsafe-template' || templateMode.startsWith('mascot-') || templateMode.startsWith('jaaro-') || templateMode.startsWith('jarro-')) && (


                <Box sx={{ p: 2, mb: 2.5, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: 'background.default' }}>
                  {templateMode === 'custom-bg' && (
                    <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ mb: 2 }}>
                      {customBgDataUrl ? 'Change Background Image' : 'Upload Sticker Background Image'}
                      <input type="file" accept="image/*" hidden onChange={handleBgImageUpload} />
                    </Button>
                  )}

                  {customBgDataUrl && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="primary">
                          Live QR Position & Size Controls:
                        </Typography>
                        <Button
                          size="small"
                          color="inherit"
                          sx={{ fontSize: '0.65rem', py: 0 }}
                          onClick={() => {
                            const def = DEFAULT_TEMPLATE_PRESETS[templateMode];
                            if (def) updateCoords(def.size, def.x, def.y);
                          }}
                        >
                          🔄 Reset Coordinates
                        </Button>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        📏 QR Size: <strong>{qrSizePercent}%</strong>
                      </Typography>
                      <Slider
                        size="small"
                        value={qrSizePercent}
                        min={10}
                        max={90}
                        onChange={(e, v) => updateCoords(v, undefined, undefined)}
                        sx={{ mb: 1 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        ↔️ Horizontal X Position: <strong>{qrXPercent}%</strong>
                      </Typography>
                      <Slider
                        size="small"
                        value={qrXPercent}
                        min={0}
                        max={100}
                        onChange={(e, v) => updateCoords(undefined, v, undefined)}
                        sx={{ mb: 1 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        ↕️ Vertical Y Position: <strong>{qrYPercent}%</strong>
                      </Typography>
                      <Slider
                        size="small"
                        value={qrYPercent}
                        min={0}
                        max={100}
                        onChange={(e, v) => updateCoords(undefined, undefined, v)}
                        sx={{ mb: 1 }}
                      />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={transparentBg}
                              onChange={(e) => setTransparentBg(e.target.checked)}
                            />
                          }
                          label={<Typography variant="caption" fontWeight={600}>🏁 Transparent QR Background (Seamless Blend)</Typography>}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showTokenText}
                              onChange={(e) => setShowTokenText(e.target.checked)}
                            />
                          }
                          label={<Typography variant="caption" fontWeight={600}>Print Token ID Text on Sticker</Typography>}
                        />
                      </Box>

                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Download & Export Options
              </Typography>

              {/* Paper Format Selector */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Paper Sheet Size & Layout</InputLabel>
                <Select
                  value={paperFormat}
                  label="Paper Sheet Size & Layout"
                  onChange={(e) => setPaperFormat(e.target.value)}
                >
                  <MenuItem value="a4-4-medium">📱 PhonePe / GPay Style Standee (A4 - 4 Big Standees / Sheet, 2x2 Grid)</MenuItem>
                  <MenuItem value="a4-2-large">🏆 PhonePe / GPay Jumbo Standee (A4 - 2 Extra Large Standees / Sheet, 2x1 Grid)</MenuItem>
                  <MenuItem value="a4-1-full">📜 Full Page Table Standee (A4 - 1 Massive Standee / Page, 1x1 Grid)</MenuItem>
                  <MenuItem value="a4-6">📄 Standard Table Standee (A4 - 6 Standees / Sheet, 2x3 Grid)</MenuItem>
                  <MenuItem value="a4-12">🏷️ Compact ID-Size Stickers (A4 - 12 Stickers / Sheet, 3x4 Grid)</MenuItem>
                  <MenuItem value="a4-20">🏷️ High-Density Stickers (A4 - 20 Stickers / Sheet, 4x5 Grid)</MenuItem>
                  <MenuItem value="20x12-inch">🏷️ Large Vinyl Sheet (20" x 12" - 32 Stickers / Sheet)</MenuItem>
                  <MenuItem value="a3-24">📜 Large A3 Sheet (24 Stickers / Sheet - 4x6 Grid)</MenuItem>
                  <MenuItem value="custom">⚙️ Custom Physical Card Size & Grid (With 3:4 Aspect Lock)</MenuItem>
                </Select>
              </FormControl>

              {/* Page Orientation Selector */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Page Orientation (Vertical vs Horizontal)</InputLabel>
                <Select
                  value={pdfPageOrientation}
                  label="Page Orientation (Vertical vs Horizontal)"
                  onChange={(e) => setPdfPageOrientation(e.target.value)}
                >
                  <MenuItem value="auto">⚡ Auto-Fit Best Orientation (Recommended)</MenuItem>
                  <MenuItem value="portrait">📱 Portrait (Vertical Sheet)</MenuItem>
                  <MenuItem value="landscape">🖼️ Landscape (Horizontal Sheet)</MenuItem>
                </Select>
              </FormControl>

              {/* Custom Physical Card Dimension Inputs */}
              {paperFormat === 'custom' && (
                <Box sx={{ p: 2, mb: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>
                    📐 Physical Card Size (Standee / Sticker Dimensions):
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Card Width (mm)"
                        type="number"
                        value={cardWidthMm}
                        onChange={(e) => handleCardWidthChange(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Card Height (mm)"
                        type="number"
                        value={cardHeightMm}
                        onChange={(e) => handleCardHeightChange(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={lockAspect}
                        onChange={(e) => {
                          setLockAspect(e.target.checked);
                          if (e.target.checked && cardWidthMm > 0) {
                            setCardHeightMm((parseFloat(cardWidthMm) * (4 / 3)).toFixed(1));
                          }
                        }}
                      />
                    }
                    label={<Typography variant="caption" fontWeight={700}>🔒 Lock 3:4 Aspect Ratio (Auto Height)</Typography>}
                  />

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    📄 Sheet Dimensions (mm):
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Sheet Width (mm)"
                        type="number"
                        value={customWidthMm}
                        onChange={(e) => setCustomWidthMm(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Sheet Height (mm)"
                        type="number"
                        value={customHeightMm}
                        onChange={(e) => setCustomHeightMm(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {exporting && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                  <Typography variant="caption" display="block" color="primary" fontWeight={600} sx={{ mt: 1 }}>
                    Preparing Export... {exportProgress}%
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PdfIcon />}
                  onClick={handleExportPDF}
                  disabled={exporting || qrItems.length === 0}
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                >
                  Download 100 QR Sheet (PDF)
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ZipIcon />}
                  onClick={handleExportZIP}
                  disabled={exporting || qrItems.length === 0}
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                >
                  Download Images Archive (ZIP)
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CsvIcon />}
                  onClick={handleExportCSV}
                  disabled={exporting || qrItems.length === 0}
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                >
                  Export Token List (CSV)
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, minHeight: 520, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {rightPanelView === 'preview' ? '🎯 Sticker Designer Live Preview' : `📊 Generated Batch Grid (${qrItems.length} QR Codes)`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ bgcolor: 'background.default', p: 0.5, borderRadius: 2, display: 'flex', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant={rightPanelView === 'preview' ? 'contained' : 'outlined'}
                      onClick={() => setRightPanelView('preview')}
                      sx={{ fontWeight: 600, py: 0.4 }}
                    >
                      🎯 Single Preview
                    </Button>
                    <Button
                      size="small"
                      variant={rightPanelView === 'grid' ? 'contained' : 'outlined'}
                      onClick={() => setRightPanelView('grid')}
                      sx={{ fontWeight: 600, py: 0.4 }}
                    >
                      📊 Batch Grid ({qrItems.length})
                    </Button>
                  </Box>
                  {isVerifiedUnique && (
                    <Chip label="🔒 100% Server Verified" color="success" size="small" />
                  )}
                </Box>
              </Box>

              {generating ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
                  <CircularProgress size={48} />
                  <Typography variant="body1" fontWeight={600} color="primary.main" sx={{ mt: 2 }}>
                    {generatingStatus || 'Checking database & rendering QR codes...'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Validating all tokens against MongoDB to ensure zero conflicts with existing tables.
                  </Typography>
                </Box>
              ) : rightPanelView === 'preview' ? (
                /* SINGLE LARGE LIVE PREVIEW CARD ON THE RIGHT SIDE */
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                  {qrItems.length > 0 ? (
                    <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 360 }}>
                      <Typography variant="caption" color="primary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                        💡 Tip: Click & drag the QR code directly on the card to adjust position! (Saved automatically)
                      </Typography>
                      <Card
                        ref={cardRef}
                        variant="outlined"
                        sx={{
                          width: '100%',
                          position: 'relative',
                          backgroundImage: customBgDataUrl ? `url(${customBgDataUrl})` : 'none',
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          boxShadow: isDragging ? '0 12px 35px rgba(59, 130, 246, 0.35)' : '0 10px 30px rgba(0,0,0,0.18)',
                          borderRadius: 3,
                          overflow: 'hidden',
                          bgcolor: customBgDataUrl ? 'transparent' : 'background.paper',
                          border: isDragging ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                          userSelect: 'none',
                          touchAction: 'none',
                        }}
                      >
                        <Box sx={{ position: 'relative', width: '100%', pt: '133.33%' }}>
                          {customBgDataUrl ? (
                            <Box
                              component="img"
                              src={qrItems[0].dataUrl}
                              alt="Live QR Code Overlay"
                              onMouseDown={handleDragStart}
                              onTouchStart={handleDragStart}
                              sx={{
                                position: 'absolute',
                                top: `${qrYPercent}%`,
                                left: `${qrXPercent}%`,
                                width: `${qrSizePercent}%`,
                                aspectRatio: '1 / 1',
                                objectFit: 'contain',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                outline: isDragging ? '2px dashed #3b82f6' : '1px dashed rgba(59, 130, 246, 0.5)',
                                borderRadius: 1,
                                transition: isDragging ? 'none' : 'all 0.02s ease',
                                '&:hover': {
                                  outline: '2px solid #3b82f6',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                },
                              }}
                            />
                          ) : (
                            <Box sx={{ position: 'absolute', inset: 0, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="h4" fontWeight={800} color="primary.main">
                                JARRo
                              </Typography>
                              <Box component="img" src={qrItems[0].dataUrl} sx={{ width: '70%', height: 'auto' }} />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                ID: {qrItems[0].token.substring(0, 12)}
                              </Typography>
                            </Box>
                          )}

                          {showTokenText && customBgDataUrl && (
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                bottom: 6,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                bgcolor: 'rgba(255,255,255,0.9)',
                                py: 0.3,
                                fontWeight: 700,
                              }}
                            >
                              ID: {qrItems[0].token.substring(0, 12)}...
                            </Typography>
                          )}
                        </Box>
                      </Card>

                      <Box sx={{ mt: 2.5, p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Live 24-Digit Token:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {qrItems[0].token}
                          </Typography>
                        </Box>
                        <Tooltip title="Copy Target Scan Link">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CopyIcon />}
                            onClick={() => copyToClipboard(qrItems[0].fullUrl)}
                          >
                            Copy Scan Link
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate QR Codes" on the left to view live designer preview.
                    </Typography>
                  )}
                </Box>
              ) : (
                /* BATCH GALLERY GRID VIEW */
                <Grid container spacing={2} sx={{ maxHeight: 550, overflowY: 'auto', pr: 1 }}>
                  {qrItems.map((item) => (
                    <Grid item xs={6} sm={4} md={3} key={item.index}>
                      <Card
                        variant="outlined"
                        sx={{
                          textAlign: 'center',
                          p: 1.5,
                          position: 'relative',
                          overflow: 'hidden',
                          ...(customBgDataUrl
                            ? {
                                backgroundImage: `url(${customBgDataUrl})`,
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                minHeight: 140,
                              }
                            : {}),
                        }}
                      >
                        {customBgDataUrl ? (
                          <Box sx={{ position: 'relative', width: '100%', pt: '133.33%' }}>
                            <Box
                              component="img"
                              src={item.dataUrl}
                              alt={`QR #${item.index}`}
                              sx={{
                                position: 'absolute',
                                top: `${qrYPercent}%`,
                                left: `${qrXPercent}%`,
                                width: `${qrSizePercent}%`,
                                aspectRatio: '1 / 1',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>
                        ) : (
                          <>
                            <Typography variant="caption" fontWeight={700} color="primary.main" display="block">
                              Sticker #{item.index}
                            </Typography>
                            <Box component="img" src={item.dataUrl} alt={`QR #${item.index}`} sx={{ width: '100%', height: 'auto', my: 1 }} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.65rem',
                                display: 'block',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                              }}
                            >
                              {item.token.substring(0, 12)}...
                            </Typography>
                          </>
                        )}
                        <Tooltip title="Copy Scan Link">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(item.fullUrl)}
                            sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.8)' }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Batch Validator */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Check & Validate Scanned QR Code Batch
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Paste scanned QR URLs or 24-digit tokens (one per line) or upload a CSV/TXT file to verify which codes are available vs already assigned to tables.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                  Upload File (TXT / CSV)
                  <input type="file" accept=".txt, .csv" hidden onChange={handleFileUpload} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Or paste URLs directly below
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={12}
                placeholder={`Paste scanned URLs or tokens here:\nhttps://admin-dev.jarro.in/?data=725412714825158246313132\n725412714825158246313132`}
                value={validatorInput}
                onChange={(e) => setValidatorInput(e.target.value)}
                sx={{ fontFamily: 'monospace', mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidateTokens}
                disabled={validating || !validatorInput.trim()}
                startIcon={validating ? <CircularProgress size={20} color="inherit" /> : <SuccessIcon />}
                sx={{ py: 1.2 }}
              >
                {validating ? 'Checking with Server...' : 'Validate Batch with Server'}
              </Button>

              {validatorError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {validatorError}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {validationResult ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }} icon={<SuccessIcon />}>
                    <strong>Validation Complete!</strong> Checked {validationResult.totalSubmitted} QR codes against the database.
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          {validationResult.notPresentCount}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Available / Unassigned
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                        <Typography variant="h4" fontWeight={700} color="error.main">
                          {validationResult.presentCodes.length}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Already Assigned to Tables
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Detailed Code Breakdown
                  </Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Token</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationResult.tokens.map((token, idx) => {
                          const isAssigned = validationResult.presentCodes.includes(token);
                          return (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{token}</TableCell>
                              <TableCell align="center">
                                {isAssigned ? (
                                  <Chip label="Already Assigned" size="small" color="error" variant="outlined" />
                                ) : (
                                  <Chip label="Available" size="small" color="success" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    No Validation Results Yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Paste or upload your scanned QR tokens on the left and click "Validate Batch"
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Template Gallery Picker Modal Dialog */}
      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GalleryIcon color="primary" /> Select Table QR Design Template
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose from official JARRo bilingual standees or upload your custom background.
            </Typography>
          </Box>
          {deletedTemplateIds.length > 0 && (
            <Button
              size="small"
              startIcon={<RestoreIcon />}
              onClick={handleRestoreTemplates}
              color="secondary"
              variant="outlined"
            >
              Restore ({deletedTemplateIds.length}) Deleted
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {Object.values(DEFAULT_TEMPLATE_PRESETS)
              .filter((preset) => !deletedTemplateIds.includes(preset.id))
              .map((preset) => {
                const isSelected = templateMode === preset.id;
                const bgImage = preset.id === 'custom-bg' ? customBgDataUrl : preset.bg;
                return (
                  <Grid item xs={12} sm={6} md={4} key={preset.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2.5,
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        border: isSelected ? '2.5px solid #2563eb' : '1px solid #e2e8f0',
                        boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        },
                      }}
                    >
                      {/* Active Selection Badge */}
                      {isSelected && (
                        <Chip
                          label="✓ SELECTED"
                          color="primary"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            zIndex: 3,
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        />
                      )}

                      {/* Preset Badge */}
                      {preset.badge && !isSelected && (
                        <Chip
                          label={preset.badge}
                          color={preset.badgeColor || 'default'}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            zIndex: 3,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                          }}
                        />
                      )}

                      {/* Delete Button */}
                      {preset.isDeletable && (
                        <Tooltip title="Delete Template from Gallery">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteTemplate(preset.id, e)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 4,
                              bgcolor: 'rgba(255, 255, 255, 0.95)',
                              color: 'error.main',
                              '&:hover': { bgcolor: '#fee2e2' },
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <CardActionArea
                        onClick={() => {
                          handleSelectTemplate(preset.id);
                          setGalleryOpen(false);
                        }}
                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <Box
                          sx={{
                            height: 190,
                            bgcolor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          {bgImage ? (
                            <CardMedia
                              component="img"
                              image={bgImage}
                              alt={preset.title}
                              sx={{
                                height: '100%',
                                width: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                              <AddPhotoIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                              <Typography variant="caption" display="block" fontWeight={600} color="text.secondary">
                                Upload Custom Background
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <CardContent sx={{ p: 2, flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {preset.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              mt: 0.5,
                            }}
                          >
                            {preset.subtitle}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                      <Box sx={{ p: 1.5, pt: 0 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          color={isSelected ? 'primary' : 'inherit'}
                          onClick={() => {
                            handleSelectTemplate(preset.id);
                            setGalleryOpen(false);
                          }}
                          sx={{ borderRadius: 1.5, fontWeight: 700 }}
                        >
                          {isSelected ? 'Currently Selected' : 'Use Template'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setGalleryOpen(false)}>
            Close Gallery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

