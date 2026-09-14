import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
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
  Close as CloseIcon,
  Check as CheckIcon,
  Add as AddIcon,
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

// Helper to convert image URL to base64 Data URL for jsPDF export (CORS & same-origin safe)
const urlToBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Fetch urlToBase64 failed, falling back to Image element:', err);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
};



// Helper to render full composite sticker card PNG/JPG (Template BG + QR Code Overlay + Token Text)
const renderCompositeStickerCard = async (item, bgUrl, qrSizePct, qrXPct, qrYPct, showToken, outputMimeType = 'image/png') => {
  if (!bgUrl) return item.dataUrl;
  try {
    const bgBase64 = await urlToBase64(bgUrl);
    if (!bgBase64) return item.dataUrl;

    const bgImg = new Image();
    await new Promise((resolve, reject) => {
      bgImg.onload = resolve;
      bgImg.onerror = reject;
      bgImg.src = bgBase64;
    });

    const canvas = document.createElement('canvas');
    const width = bgImg.naturalWidth || 1200;
    const height = bgImg.naturalHeight || 1600;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (outputMimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // 1. Draw Template Background Image
    ctx.drawImage(bgImg, 0, 0, width, height);

    // 2. Draw QR Code PNG Overlay
    const qrImg = new Image();
    await new Promise((resolve, reject) => {
      qrImg.onload = resolve;
      qrImg.onerror = reject;
      qrImg.src = item.dataUrl;
    });

    const qrW = width * (qrSizePct / 100);
    const qrH = qrW;
    const qrX = width * (qrXPct / 100);
    const qrY = height * (qrYPct / 100);

    ctx.drawImage(qrImg, qrX, qrY, qrW, qrH);

    // 3. Optional Token Text
    if (showToken) {
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${Math.round(height * 0.022)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`ID: ${item.token.substring(0, 10)}`, width / 2, height - height * 0.015);
    }

    return canvas.toDataURL(outputMimeType, 0.95);
  } catch (err) {
    console.error('Failed to render composite sticker card:', err);
    return item.dataUrl;
  }
};




const PRESET_TEMPLATE_FILES = [
  'jarro_official_whatsapp_qr_template.jpg',
  'jaaro_digital_menu_qr_template.jpg',
  'jaaro_slogan_bilingual_qr_template.jpg',
  'jarro_mascot_chef_qr_template.jpg',
  'jarro_mascot_fox_qr_template.jpg',
  'jarro_mascot_rocket_qr_template.jpg',
  'jarro_mascot_food_buddy_qr_template.jpg',
  'jarro_vsafe_qr_sticker_template.jpg',
];

const getAssetPath = (filename) => {
  if (!filename) return null;

  for (const presetFile of PRESET_TEMPLATE_FILES) {
    if (filename.includes(presetFile)) {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : base + '/';
      return `${cleanBase}assets/${presetFile}`;
    }
  }

  if (filename.startsWith('data:') || filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanFilename = filename.startsWith('./') ? filename.substring(2) : filename;
  const pathWithoutAssets = cleanFilename.startsWith('assets/') ? cleanFilename.substring(7) : cleanFilename;
  return `${cleanBase}assets/${pathWithoutAssets}`;
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
    size: 47,
    x: 41,
    y: 39,
    isDeletable: true,
  },
  'mascot-chef-4x6': {
    id: 'mascot-chef-4x6',
    title: 'Chef JARRo 4x6 Premium Standee',
    subtitle: 'Ultra High-Res 4x6 Inch Navy & Gold 3D Chef Poster',
    badge: '★ 4x6 HQ',
    badgeColor: 'success',
    bg: getAssetPath('jarro_mascot_chef_4x6_template.jpg'),
    size: 47,
    x: 41.5,
    y: 38.5,
    isDeletable: true,
  },
  'mascot-fox': {
    id: 'mascot-fox',
    title: 'Red Panda Foodie',
    subtitle: 'Warm Amber & Charcoal Standee',
    badge: 'AMBER',
    badgeColor: 'secondary',
    bg: getAssetPath('jarro_mascot_fox_qr_template.jpg'),
    size: 47,
    x: 41,
    y: 39,
    isDeletable: true,
  },
  'mascot-rocket': {
    id: 'mascot-rocket',
    title: 'Superhero Express',
    subtitle: 'Neon Blue & Cyan Standee',
    badge: 'EXPRESS',
    badgeColor: 'primary',
    bg: getAssetPath('jarro_mascot_rocket_qr_template.jpg'),
    size: 47,
    x: 41,
    y: 39,
    isDeletable: true,
  },
  'mascot-food-buddy': {
    id: 'mascot-food-buddy',
    title: 'Pizza & Noodle Buddies',
    subtitle: 'Crimson Bistro Standee',
    badge: 'BISTRO',
    badgeColor: 'error',
    bg: getAssetPath('jarro_mascot_food_buddy_qr_template.jpg'),
    size: 47,
    x: 41,
    y: 39,
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

  // Paper & Sheet Layout Custom System State (Default: 12" x 18" Sheet, 3.5" x 4.66" Card)
  const [paperFormat, setPaperFormat] = useState('custom');
  const [dimensionUnit, setDimensionUnit] = useState('in'); // 'in' (Inches) or 'mm' (Millimeters)
  const [customWidthVal, setCustomWidthVal] = useState(12);
  const [customHeightVal, setCustomHeightVal] = useState(18);
  const [customCols, setCustomCols] = useState(3);
  const [customRows, setCustomRows] = useState(4);

  // Custom Physical Card Dimensions & Aspect Ratio Lock State
  const [lockAspect, setLockAspect] = useState(true);
  const [cardWidthVal, setCardWidthVal] = useState(3.5);
  const [cardHeightVal, setCardHeightVal] = useState(4.66);
  const [cardGapVal, setCardGapVal] = useState(0.125); // Default 0.125 inch cutting gap

  const handleUnitToggle = (newUnit) => {
    if (!newUnit || newUnit === dimensionUnit) return;
    const isToMm = newUnit === 'mm';
    const mult = isToMm ? 25.4 : 1 / 25.4;

    setCustomWidthVal((prev) => {
      const v = parseFloat(prev);
      return !isNaN(v) ? (isToMm ? (v * mult).toFixed(1) : (v * mult).toFixed(2)) : prev;
    });
    setCustomHeightVal((prev) => {
      const v = parseFloat(prev);
      return !isNaN(v) ? (isToMm ? (v * mult).toFixed(1) : (v * mult).toFixed(2)) : prev;
    });
    setCardWidthVal((prev) => {
      const v = parseFloat(prev);
      return !isNaN(v) ? (isToMm ? (v * mult).toFixed(1) : (v * mult).toFixed(2)) : prev;
    });
    setCardHeightVal((prev) => {
      const v = parseFloat(prev);
      return !isNaN(v) ? (isToMm ? (v * mult).toFixed(1) : (v * mult).toFixed(2)) : prev;
    });
    setCardGapVal((prev) => {
      const v = parseFloat(prev);
      return !isNaN(v) ? (isToMm ? (v * mult).toFixed(1) : (v * mult).toFixed(3)) : prev;
    });

    setDimensionUnit(newUnit);
  };

  const handleCardWidthChange = (val) => {
    setCardWidthVal(val);
    const w = parseFloat(val);
    if (lockAspect && !isNaN(w) && w > 0) {
      setCardHeightVal((w * (4 / 3)).toFixed(2));
    }
  };

  const handleCardHeightChange = (val) => {
    setCardHeightVal(val);
    const h = parseFloat(val);
    if (lockAspect && !isNaN(h) && h > 0) {
      setCardWidthVal((h * (3 / 4)).toFixed(2));
    }
  };

  // Auto-calculate Grid Cols & Rows whenever sheet, card dimensions or cutting gap change
  useEffect(() => {
    const unitMult = dimensionUnit === 'in' ? 25.4 : 1;
    const sW = (parseFloat(customWidthVal) || 0) * unitMult;
    const sH = (parseFloat(customHeightVal) || 0) * unitMult;
    const cW = (parseFloat(cardWidthVal) || 0) * unitMult;
    const cH = (parseFloat(cardHeightVal) || 0) * unitMult;
    const gap = (parseFloat(cardGapVal) || 0) * unitMult;

    if (sW > 0 && sH > 0 && cW > 0 && cH > 0) {
      const autoCols = Math.max(1, Math.floor((sW + gap) / (cW + gap)));
      const autoRows = Math.max(1, Math.floor((sH + gap) / (cH + gap)));
      setCustomCols(autoCols);
      setCustomRows(autoRows);
    }
  }, [customWidthVal, customHeightVal, cardWidthVal, cardHeightVal, cardGapVal, dimensionUnit]);


  // Custom Sticker Design Template State & Saved Coords
  const [templateCoords, setTemplateCoords] = useState(loadSavedCoords);
  const [templateMode, setTemplateMode] = useState('jarro-official-whatsapp');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateImage, setNewTemplateImage] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);

  const [customTemplates, setCustomTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('jarro_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const allTemplates = useMemo(() => {
    const combined = { ...DEFAULT_TEMPLATE_PRESETS };
    customTemplates.forEach((ct) => {
      combined[ct.id] = ct;
    });
    return combined;
  }, [customTemplates]);

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

  const handleSaveNewCustomTemplate = () => {
    if (!newTemplateImage) return;
    const id = `custom-${Date.now()}`;
    const newPreset = {
      id,
      title: newTemplateTitle.trim() || 'Custom Uploaded Standee',
      subtitle: 'User Custom Template Design',
      badge: 'CUSTOM',
      badgeColor: 'primary',
      bg: newTemplateImage,
      size: 47,
      x: 41,
      y: 39,
      isDeletable: true,
    };

    const updated = [...customTemplates, newPreset];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('jarro_custom_templates', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save custom template to localStorage:', err);
    }

    setTemplateCoords((prev) => {
      const up = { ...prev, [id]: newPreset };
      try {
        localStorage.setItem('jarro_qr_template_coords', JSON.stringify(up));
      } catch (_) {}
      return up;
    });

    setTemplateMode(id);
    setCustomBgDataUrl(newTemplateImage);
    setQrSizePercent(47);
    setQrXPercent(41);
    setQrYPercent(39);

    setUploadDialogOpen(false);
    setNewTemplateTitle('');
    setNewTemplateImage(null);
  };

  const handleDeleteTemplate = (templateId, e) => {
    if (e) e.stopPropagation();

    const isCustom = templateId.startsWith('custom-') && templateId !== 'custom-bg';

    let updatedDeleted = deletedTemplateIds;

    if (isCustom) {
      // Completely remove custom template from customTemplates state & localStorage
      const updatedCustom = customTemplates.filter((ct) => ct.id !== templateId);
      setCustomTemplates(updatedCustom);
      try {
        localStorage.setItem('jarro_custom_templates', JSON.stringify(updatedCustom));
      } catch (err) {
        console.error('Failed to update custom templates in localStorage:', err);
      }

      // Ensure custom template ID is removed from deletedTemplateIds if present
      updatedDeleted = deletedTemplateIds.filter((id) => id !== templateId);
      setDeletedTemplateIds(updatedDeleted);
      try {
        localStorage.setItem('jarro_deleted_templates', JSON.stringify(updatedDeleted));
      } catch (_) {}
    } else {
      // For built-in preset templates, add to deletedTemplateIds to hide from gallery
      updatedDeleted = Array.from(new Set([...deletedTemplateIds, templateId]));
      setDeletedTemplateIds(updatedDeleted);
      try {
        localStorage.setItem('jarro_deleted_templates', JSON.stringify(updatedDeleted));
      } catch (err) {
        console.error('Failed to save deleted templates:', err);
      }
    }

    // Completely remove saved coordinates for this template
    try {
      const savedCoords = loadSavedCoords();
      if (savedCoords[templateId]) {
        delete savedCoords[templateId];
        localStorage.setItem('jarro_qr_template_coords', JSON.stringify(savedCoords));
      }
    } catch (_) {}

    // Fallback if currently selected template was deleted
    if (templateMode === templateId) {
      const remainingCustom = customTemplates.filter((ct) => ct.id !== templateId);
      const combined = { ...DEFAULT_TEMPLATE_PRESETS };
      remainingCustom.forEach((ct) => {
        combined[ct.id] = ct;
      });

      const availableKeys = Object.keys(combined).filter(
        (k) => k !== templateId && !updatedDeleted.includes(k)
      );
      const fallbackMode = availableKeys[0] || 'jarro-official-whatsapp';
      handleSelectTemplate(fallbackMode);
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
    const coords = templateCoords[mode] || allTemplates[mode] || DEFAULT_TEMPLATE_PRESETS['custom-bg'];
    if (coords.bg) setCustomBgDataUrl(getAssetPath(coords.bg));
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
  const handleGenerateBatch = async (overrideCount) => {
    try {
      setGenerating(true);
      setIsVerifiedUnique(false);
      setGeneratingStatus('Generating unique candidate tokens...');
      const targetQty = overrideCount !== undefined ? overrideCount : count;
      const qty = Math.min(Math.max(parseInt(targetQty) || 1, 1), 500);
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

  // Export PDF Sheet (Multi-layout QR stickers grid using exact Custom Dimensions)
  const handleExportPDF = async () => {
    if (qrItems.length === 0) return;
    try {
      setExporting(true);
      setExportProgress(0);

      const unitMultiplier = dimensionUnit === 'in' ? 25.4 : 1;
      const rawW = parseFloat(customWidthVal) || (dimensionUnit === 'in' ? 12 : 304.8);
      const rawH = parseFloat(customHeightVal) || (dimensionUnit === 'in' ? 18 : 457.2);
      const pageW = rawW * unitMultiplier; // mm
      const pageH = rawH * unitMultiplier; // mm

      const pdfFormat = [pageW, pageH];
      const orientation = pageW >= pageH ? 'landscape' : 'portrait';

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pdfFormat,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const rawCardW = (parseFloat(cardWidthVal) || 0) * unitMultiplier;
      const rawCardH = (parseFloat(cardHeightVal) || 0) * unitMultiplier;
      const cardGap = (parseFloat(cardGapVal) || 0) * unitMultiplier;

      // Determine max columns and rows that fit without scaling down cards
      const maxColsThatFit = Math.max(1, Math.floor((pageWidth + cardGap) / (rawCardW + cardGap)));
      const maxRowsThatFit = Math.max(1, Math.floor((pageHeight + cardGap) / (rawCardH + cardGap)));

      const cols = Math.min(Math.max(parseInt(customCols) || 1, 1), maxColsThatFit);
      const rows = Math.min(Math.max(parseInt(customRows) || 1, 1), maxRowsThatFit);

      // Outer margin is 0 (flush to sheet top-left corner so outer sides require no cutting)
      const marginX = 0;
      const marginY = 0;

      // Convert custom background image URL to Base64 Data URL for jsPDF
      const bgBase64 = customBgDataUrl ? await urlToBase64(customBgDataUrl) : null;

      for (let i = 0; i < qrItems.length; i++) {
        const item = qrItems[i];
        const itemIndexOnPage = i % (cols * rows);

        if (itemIndexOnPage === 0 && i > 0) {
          doc.addPage();
        }

        const col = itemIndexOnPage % cols;
        const row = Math.floor(itemIndexOnPage / cols);

        const x = marginX + col * (rawCardW + cardGap);
        const y = marginY + row * (rawCardH + cardGap);

        if (bgBase64) {
          // Fill exact requested Card Width & Card Height specified by user
          const drawWidth = rawCardW;
          const drawHeight = rawCardH;

          const drawX = x;
          const drawY = y;

          // Draw Custom Background Image
          doc.addImage(bgBase64, 'JPEG', drawX, drawY, drawWidth, drawHeight, undefined, 'FAST');

          // Position QR Code based on sliders (%)
          const qrWidth = drawWidth * (qrSizePercent / 100);
          const qrHeight = qrWidth;
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
          const cardWidth = rawCardW;
          const cardHeight = rawCardH;
          doc.setDrawColor(210, 220, 235);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

          const headerFontSize = Math.min(cardHeight * 0.15, 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(headerFontSize);
          doc.setTextColor(79, 70, 229);
          doc.text('JARRo', x + cardWidth / 2, y + cardHeight * 0.13, { align: 'center' });

          const qrSize = Math.min(cardWidth * 0.65, cardHeight * 0.55);
          const qrX = x + (cardWidth - qrSize) / 2;
          const qrY = y + cardHeight * 0.18;
          doc.addImage(item.dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          const footerFontSize = Math.min(cardHeight * 0.1, 7);
          doc.setFont('courier', 'bold');
          doc.setFontSize(footerFontSize);
          doc.setTextColor(30, 41, 59);
          doc.text(`ID: ${item.token.substring(0, 10)}...`, x + cardWidth / 2, y + cardHeight - cardHeight * 0.1, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.max(footerFontSize - 1.5, 5));
          doc.setTextColor(148, 163, 184);
          doc.text(`Sticker #${item.index}`, x + cellWidth / 2, y + cellHeight - cellHeight * 0.03, { align: 'center' });
        }

        setExportProgress(Math.round(((i + 1) / qrItems.length) * 100));
      }

      doc.save(`Jarro_QR_Sheet_${qrItems.length}_Custom_${customWidthVal}x${customHeightVal}${dimensionUnit}_${activeEnv.toUpperCase()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Export ZIP Archive of PNG / JPG Images (Full Composite Standee Designs)
  const handleExportZIP = async (format = 'png') => {
    if (qrItems.length === 0) return;
    try {
      setExporting(true);
      setExportProgress(0);

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpg' ? 'jpg' : 'png';

      const zip = new JSZip();
      const folder = zip.folder(`Jarro_QR_Codes_${activeEnv.toUpperCase()}`);

      for (let i = 0; i < qrItems.length; i++) {
        const item = qrItems[i];
        const compositeDataUrl = customBgDataUrl
          ? await renderCompositeStickerCard(item, customBgDataUrl, qrSizePercent, qrXPercent, qrYPercent, showTokenText, mimeType)
          : item.dataUrl;

        const base64Data = compositeDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
        const filename = `jarro_standee_${String(item.index).padStart(3, '0')}_${item.token.substring(0, 8)}.${ext}`;
        folder.file(filename, base64Data, { base64: true });
        setExportProgress(Math.round(((i + 1) / qrItems.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Jarro_QR_Sticker_Images_${format.toUpperCase()}_${qrItems.length}_${activeEnv.toUpperCase()}.zip`);
    } catch (err) {
      console.error('ZIP Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadSinglePNG = async (item, format = 'png') => {
    if (!item) return;
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const compositeDataUrl = customBgDataUrl
      ? await renderCompositeStickerCard(item, customBgDataUrl, qrSizePercent, qrXPercent, qrYPercent, showTokenText, mimeType)
      : item.dataUrl;
    saveAs(compositeDataUrl, `jarro_standee_${item.token.substring(0, 8)}.${ext}`);
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

              <Box sx={{ mb: 2.5 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="QR Batch Quantity"
                      type="number"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      inputProps={{ min: 1, max: 500 }}
                      helperText={`Active batch: ${qrItems.length} QRs generated`}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => {
                        const fitCols = Math.max(1, Math.floor(((parseFloat(customWidthVal) || 12) * (dimensionUnit === 'in' ? 25.4 : 1) + (parseFloat(cardGapVal) || 0.125) * (dimensionUnit === 'in' ? 25.4 : 1)) / ((parseFloat(cardWidthVal) || 3.5) * (dimensionUnit === 'in' ? 25.4 : 1) + (parseFloat(cardGapVal) || 0.125) * (dimensionUnit === 'in' ? 25.4 : 1))));
                        const fitRows = Math.max(1, Math.floor(((parseFloat(customHeightVal) || 18) * (dimensionUnit === 'in' ? 25.4 : 1) + (parseFloat(cardGapVal) || 0.125) * (dimensionUnit === 'in' ? 25.4 : 1)) / ((parseFloat(cardHeightVal) || 4.66) * (dimensionUnit === 'in' ? 25.4 : 1) + (parseFloat(cardGapVal) || 0.125) * (dimensionUnit === 'in' ? 25.4 : 1))));
                        const gridFit = Math.min(parseInt(customCols) || fitCols, fitCols) * Math.min(parseInt(customRows) || fitRows, fitRows);
                        setCount(gridFit);
                        handleGenerateBatch(gridFit);
                      }}
                      sx={{ py: 1, whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.72rem', borderColor: '#2563eb' }}
                    >
                      ⚡ Fill Sheet
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                onClick={() => handleGenerateBatch()}
                disabled={generating}
                sx={{ mb: 3, py: 1.5, fontWeight: 700 }}
              >
                {generating ? 'Generating QR Batch...' : `⚡ Generate ${count} Fresh QR Codes`}
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
                        {allTemplates[templateMode]?.title || 'Selected Design'}
                      </Typography>
                      {allTemplates[templateMode]?.badge && (
                        <Chip
                          label={allTemplates[templateMode].badge}
                          color={allTemplates[templateMode].badgeColor || 'default'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {allTemplates[templateMode]?.subtitle || 'Custom card template design'}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<GalleryIcon />}
                      onClick={() => setGalleryOpen(true)}
                      sx={{
                        py: 1,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                        },
                      }}
                    >
                      Browse Gallery
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                      sx={{
                        py: 1,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        '&:hover': {
                          borderColor: '#1d4ed8',
                          bgcolor: '#eff6ff',
                        },
                      }}
                    >
                      Upload New
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {(templateMode === 'custom-bg' || templateMode === 'vsafe-template' || templateMode.startsWith('mascot-') || templateMode.startsWith('jaaro-') || templateMode.startsWith('jarro-') || templateMode.startsWith('custom-')) && (


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
                            const def = allTemplates[templateMode];
                            if (def) updateCoords(def.size, def.x, def.y);
                          }}
                        >
                          🔄 Reset Coordinates
                        </Button>
                      </Box>

                      {/* QR Size Control */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          📏 QR Code Size (% of Card):
                        </Typography>
                        <TextField
                          size="small"
                          type="number"
                          value={qrSizePercent}
                          inputProps={{ min: 10, max: 95, step: 1 }}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(95, parseInt(e.target.value) || 10));
                            updateCoords(val, undefined, undefined);
                          }}
                          sx={{ width: '80px', '& input': { py: 0.3, px: 1, fontSize: '0.8rem', textAlign: 'center' } }}
                        />
                      </Box>
                      <Slider
                        size="small"
                        value={qrSizePercent}
                        min={10}
                        max={95}
                        onChange={(e, v) => updateCoords(v, undefined, undefined)}
                        sx={{ mb: 1.5 }}
                      />

                      {/* Horizontal X Position Control */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          ↔️ Horizontal X Position (%):
                        </Typography>
                        <TextField
                          size="small"
                          type="number"
                          value={qrXPercent}
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                            updateCoords(undefined, val, undefined);
                          }}
                          sx={{ width: '80px', '& input': { py: 0.3, px: 1, fontSize: '0.8rem', textAlign: 'center' } }}
                        />
                      </Box>
                      <Slider
                        size="small"
                        value={qrXPercent}
                        min={0}
                        max={100}
                        onChange={(e, v) => updateCoords(undefined, v, undefined)}
                        sx={{ mb: 1.5 }}
                      />

                      {/* Vertical Y Position Control */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          ↕️ Vertical Y Position (%):
                        </Typography>
                        <TextField
                          size="small"
                          type="number"
                          value={qrYPercent}
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                            updateCoords(undefined, undefined, val);
                          }}
                          sx={{ width: '80px', '& input': { py: 0.3, px: 1, fontSize: '0.8rem', textAlign: 'center' } }}
                        />
                      </Box>
                      <Slider
                        size="small"
                        value={qrYPercent}
                        min={0}
                        max={100}
                        onChange={(e, v) => updateCoords(undefined, undefined, v)}
                        sx={{ mb: 1.5 }}
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

              {/* Custom Dimensions System */}
              <Box sx={{ p: 2, mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary">
                    📐 Dimension System:
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    value={dimensionUnit}
                    exclusive
                    onChange={(e, val) => handleUnitToggle(val)}
                  >
                    <ToggleButton value="in" sx={{ py: 0.3, px: 1.5, fontWeight: 700, fontSize: '0.75rem' }}>
                      Inches (in)
                    </ToggleButton>
                    <ToggleButton value="mm" sx={{ py: 0.3, px: 1.5, fontWeight: 700, fontSize: '0.75rem' }}>
                      Millimeters (mm)
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  📄 1. Full Printing Sheet Size ({dimensionUnit}):
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Sheet Width (${dimensionUnit})`}
                      type="number"
                      value={customWidthVal}
                      onChange={(e) => setCustomWidthVal(e.target.value)}
                      inputProps={{ step: 'any', min: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Sheet Height (${dimensionUnit})`}
                      type="number"
                      value={customHeightVal}
                      onChange={(e) => setCustomHeightVal(e.target.value)}
                      inputProps={{ step: 'any', min: 0.1 }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  🏷️ 2. Standee Card / QR Sticker Size ({dimensionUnit}):
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Card Width (${dimensionUnit})`}
                      type="number"
                      value={cardWidthVal}
                      onChange={(e) => handleCardWidthChange(e.target.value)}
                      inputProps={{ step: 'any', min: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Card Height (${dimensionUnit})`}
                      type="number"
                      value={cardHeightVal}
                      onChange={(e) => handleCardHeightChange(e.target.value)}
                      inputProps={{ step: 'any', min: 0.1 }}
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
                        if (e.target.checked && cardWidthVal > 0) {
                          setCardHeightVal((parseFloat(cardWidthVal) * (4 / 3)).toFixed(2));
                        }
                      }}
                    />
                  }
                  label={<Typography variant="caption" fontWeight={700}>🔒 Lock 3:4 Aspect Ratio (Auto Height)</Typography>}
                  sx={{ mb: 1.5 }}
                />

                <Grid container spacing={1.5} sx={{ mb: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`✂️ Inter-Card Cutting Gap (${dimensionUnit})`}
                      type="number"
                      value={cardGapVal}
                      onChange={(e) => setCardGapVal(e.target.value)}
                      inputProps={{ step: 'any', min: 0 }}
                      helperText="Spacing between cards for blade cutting (0 outer margin on sides)"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 0.5, display: 'block' }}>
                  📊 Calculated Grid Fit: {customCols} Cols × {customRows} Rows ({customCols * customRows} Standees / Sheet)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontSize: '0.7rem' }}>
                  ✓ Flush 0 Outer Margin (Cards align to outer sheet borders)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Grid Cols"
                      type="number"
                      value={customCols}
                      onChange={(e) => setCustomCols(e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Grid Rows"
                      type="number"
                      value={customRows}
                      onChange={(e) => setCustomRows(e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </Grid>
              </Box>


              {exporting && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                  <Typography variant="caption" display="block" color="primary" fontWeight={600} sx={{ mt: 1 }}>
                    Preparing Export... {exportProgress}%
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(() => {
                  const sW = parseFloat(customWidthVal) || 12;
                  const sH = parseFloat(customHeightVal) || 18;
                  const cW = parseFloat(cardWidthVal) || 3.5;
                  const cH = parseFloat(cardHeightVal) || 4.66;
                  const gap = parseFloat(cardGapVal) || 0.125;

                  const maxColsThatFit = Math.max(1, Math.floor((sW + gap) / (cW + gap)));
                  const maxRowsThatFit = Math.max(1, Math.floor((sH + gap) / (cH + gap)));
                  const fitCols = Math.min(Math.max(parseInt(customCols) || 1, 1), maxColsThatFit);
                  const fitRows = Math.min(Math.max(parseInt(customRows) || 1, 1), maxRowsThatFit);
                  const perPage = fitCols * fitRows;
                  const pages = Math.max(1, Math.ceil(qrItems.length / perPage));

                  return (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PdfIcon />}
                      onClick={handleExportPDF}
                      disabled={exporting || qrItems.length === 0}
                      sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700 }}
                    >
                      Export PDF Sheet ({qrItems.length} QRs • {pages} {pages === 1 ? 'Page' : 'Pages'})
                    </Button>
                  );
                })()}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<ZipIcon />}
                    onClick={() => handleExportZIP('jpg')}
                    disabled={exporting || qrItems.length === 0}
                    sx={{ py: 1.2, fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Download JPG (ZIP)
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<ZipIcon />}
                    onClick={() => handleExportZIP('png')}
                    disabled={exporting || qrItems.length === 0}
                    sx={{ py: 1.2, fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Download PNG (ZIP)
                  </Button>
                </Box>

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
                      🎯 Single Designer
                    </Button>
                    <Button
                      size="small"
                      variant={rightPanelView === 'sheet' ? 'contained' : 'outlined'}
                      onClick={() => setRightPanelView('sheet')}
                      sx={{ fontWeight: 600, py: 0.4 }}
                    >
                      🖨️ Print Sheet Preview
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
                        {(() => {
                          const cW = parseFloat(cardWidthVal) || 3.5;
                          const cH = parseFloat(cardHeightVal) || 4.66;
                          const cardAspectPct = (cW > 0 && cH > 0) ? (cH / cW) * 100 : 133.33;

                          return (
                            <Box sx={{ position: 'relative', width: '100%', pt: `${cardAspectPct}%` }}>
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
                          );
                        })()}
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<UploadIcon sx={{ transform: 'rotate(180deg)' }} />}
                            onClick={() => handleDownloadSinglePNG(qrItems[0])}
                          >
                            Download Standee PNG
                          </Button>
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
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate QR Codes" on the left to view live designer preview.
                    </Typography>
                  )}
                </Box>
              ) : rightPanelView === 'sheet' ? (
                /* LIVE 1:1 PRINT SHEET PREVIEW */
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  {qrItems.length > 0 ? (
                    <Box sx={{ width: '100%', maxWidth: 540, textAlign: 'center' }}>
                      <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" color="primary" fontWeight={700}>
                          📄 Custom Printing Sheet: {customWidthVal} × {customHeightVal} {dimensionUnit} ({customCols} Cols × {customRows} Rows)
                        </Typography>
                        <Chip
                          label={`${Math.min(qrItems.length, (parseInt(customCols) || 3) * (parseInt(customRows) || 4))} Standees on Page 1`}
                          size="small"
                          color="info"
                        />
                      </Box>

                      {/* Sheet Canvas Container */}
                      {(() => {
                        const sW = parseFloat(customWidthVal) || 12;
                        const sH = parseFloat(customHeightVal) || 18;
                        const cW = parseFloat(cardWidthVal) || 3.5;
                        const cH = parseFloat(cardHeightVal) || 4.66;
                        const gap = parseFloat(cardGapVal) || 0.125;

                        const maxColsThatFit = Math.max(1, Math.floor((sW + gap) / (cW + gap)));
                        const maxRowsThatFit = Math.max(1, Math.floor((sH + gap) / (cH + gap)));

                        const activeCols = Math.min(Math.max(parseInt(customCols) || 1, 1), maxColsThatFit);
                        const activeRows = Math.min(Math.max(parseInt(customRows) || 1, 1), maxRowsThatFit);
                        const itemsPerPage = activeCols * activeRows;
                        const totalPages = Math.max(1, Math.ceil(qrItems.length / itemsPerPage));
                        const curPage = Math.min(previewPage, totalPages);

                        const pageItems = qrItems.slice((curPage - 1) * itemsPerPage, curPage * itemsPerPage);

                        return (
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="caption" color="primary" fontWeight={700}>
                                📄 Sheet: {customWidthVal} × {customHeightVal} {dimensionUnit} ({activeCols} Cols × {activeRows} Rows = {itemsPerPage}/page)
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={`Total: ${qrItems.length} QRs (${totalPages} PDF ${totalPages === 1 ? 'Page' : 'Pages'})`}
                                  size="small"
                                  color="info"
                                />

                                {totalPages > 1 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 2 }}>
                                    <Button
                                      size="small"
                                      disabled={curPage <= 1}
                                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                                      sx={{ minWidth: 24, p: 0, fontSize: '0.75rem', fontWeight: 800 }}
                                    >
                                      ◀
                                    </Button>
                                    <Typography variant="caption" fontWeight={700}>
                                      Page {curPage} / {totalPages}
                                    </Typography>
                                    <Button
                                      size="small"
                                      disabled={curPage >= totalPages}
                                      onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                                      sx={{ minWidth: 24, p: 0, fontSize: '0.75rem', fontWeight: 800 }}
                                    >
                                      ▶
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </Box>

                            <Card
                              variant="outlined"
                              sx={{
                                width: '100%',
                                aspectRatio: `${sW} / ${sH}`,
                                maxHeight: 540,
                                bgcolor: '#cbd5e1', // Slate background representing cutting gap lanes
                                boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
                                p: 0,
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                position: 'relative',
                                mx: 'auto',
                                border: '2px solid #475569',
                              }}
                            >
                              {pageItems.map((item, idx) => {
                                const col = idx % activeCols;
                                const row = Math.floor(idx / activeCols);

                                const leftPct = (col * (cW + gap) / sW) * 100;
                                const topPct = (row * (cH + gap) / sH) * 100;
                                const widthPct = (cW / sW) * 100;
                                const heightPct = (cH / sH) * 100;

                                return (
                                  <Box
                                    key={item.index}
                                    sx={{
                                      position: 'absolute',
                                      left: `${leftPct}%`,
                                      top: `${topPct}%`,
                                      width: `${widthPct}%`,
                                      height: `${heightPct}%`,
                                      boxSizing: 'border-box',
                                      outline: '1px dashed rgba(37,99,235,0.5)',
                                      bgcolor: '#ffffff',
                                      overflow: 'hidden',
                                      ...(customBgDataUrl
                                        ? {
                                            backgroundImage: `url(${customBgDataUrl})`,
                                            backgroundSize: '100% 100%',
                                            backgroundRepeat: 'no-repeat',
                                          }
                                        : {}),
                                    }}
                                  >
                                    {customBgDataUrl ? (
                                      <>
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
                                        {showTokenText && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              position: 'absolute',
                                              bottom: 2,
                                              left: 0,
                                              right: 0,
                                              textAlign: 'center',
                                              fontFamily: 'monospace',
                                              fontSize: '0.55rem',
                                              bgcolor: 'rgba(255,255,255,0.85)',
                                              fontWeight: 700,
                                            }}
                                          >
                                            ID: {item.token.substring(0, 8)}
                                          </Typography>
                                        )}
                                      </>
                                    ) : (
                                      <Box sx={{ p: 0.5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ fontSize: '0.6rem' }}>
                                          JARRo
                                        </Typography>
                                        <Box component="img" src={item.dataUrl} sx={{ width: '60%', mx: 'auto' }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.5rem', fontFamily: 'monospace' }}>
                                          #{item.index}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </Card>

                            {totalPages > 1 && (
                              <Alert severity="info" sx={{ mt: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.72rem' }}>
                                💡 <strong>Multi-Page PDF Layout</strong>: Based on card size {cW}"×{cH}", <strong>{itemsPerPage} standees fit per page</strong>. All <strong>{qrItems.length} generated QR codes</strong> are in the PDF across <strong>{totalPages} pages</strong>. Use ◀ ▶ buttons above to preview each page.
                              </Alert>
                            )}
                          </Box>
                        );
                      })()}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate QR Codes" on the left to view print sheet preview.
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              color="primary"
              variant="contained"
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            >
              ➕ Upload Template
            </Button>
            {deletedTemplateIds.length > 0 && (
              <Button
                size="small"
                startIcon={<RestoreIcon />}
                onClick={handleRestoreTemplates}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              >
                Restore ({deletedTemplateIds.length})
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {Object.values(allTemplates)
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

      {/* Upload Custom Template Modal Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              Upload & Save Custom QR Template
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setUploadDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Template Name / Title"
              placeholder="e.g. Restaurant Entrance Standee (13x19 in)"
              value={newTemplateTitle}
              onChange={(e) => setNewTemplateTitle(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              helperText="Give your custom design template a recognizable name"
            />

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                SELECT TEMPLATE BACKGROUND IMAGE
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 2.5,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' },
                }}
                component="label"
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      setNewTemplateImage(evt.target.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {newTemplateImage ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <img
                      src={newTemplateImage}
                      alt="Uploaded Preview"
                      style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Typography variant="caption" color="primary" fontWeight={700}>
                      ✓ Image Selected (Click to change file)
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ py: 2 }}>
                    <UploadIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      Click to Browse & Upload Image
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Supports JPG, PNG, WEBP high-resolution card artwork
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newTemplateImage}
            onClick={handleSaveNewCustomTemplate}
            startIcon={<CheckIcon />}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Save & Apply Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

