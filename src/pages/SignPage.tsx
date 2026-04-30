import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import { usePdfRenderer, useSignaturePad, useDragResize, useOpenPdf, useShareModal } from '@/hooks';

// Utils
import { getItemImage, savePdfWithItems, downloadBlob } from '@/utils';

// Constants
import { DEFAULT_SIGNATURE_WIDTH, DEFAULT_STAMP_WIDTH } from '@/constants';

// Types
import type { ModalMode, SavedItem, PlacedItem } from '@/types';

// Store
import { usePdfStore, useSidebar } from '@/store';

// Components
import {
  PdfCanvas,
  Sidebar,
  PageNavigation,
  CreateEditModal,
  DeleteConfirmModal,
  FilenameModal,
  ReplaceFileModal,
  PasswordModal,
  RemovePasswordModal,
  ShareModal,
} from '@/features/sign';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { PasswordInputModal } from '@/components/PasswordInputModal';
import { PenLine } from 'lucide-react';

export const SignPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Store ---
  const {
    pdfFile,
    pdfDoc,
    pdfFilename,
    numPages,
    openPassword,
    savedSignatures,
    savedStamps,
    placedItems,
    clearPdfData,
    setPdfData,
    setSavedSignatures,
    setSavedStamps,
    setPlacedItems,
  } = usePdfStore();

  // --- Local States ---
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('1');

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('signature');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<ModalMode | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRemovePasswordModalOpen, setIsRemovePasswordModalOpen] = useState(false);
  const [isFilenameModalOpen, setIsFilenameModalOpen] = useState(false);
  const [pendingSaveType, setPendingSaveType] = useState<
    'normal' | 'withPassword' | 'withoutPassword' | null
  >(null);

  // --- Selected Item State (for mobile tap-to-select) ---
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- Sidebar State (from context) ---
  const { isOpen: isSidebarOpen, closeSidebar } = useSidebar();

  // --- Share Modal State ---
  const {
    isOpen: isShareModalOpen,
    closeModal: closeShareModal,
    triggerAfterSave,
  } = useShareModal();

  // --- Close sidebar on unmount (page navigation) ---
  useEffect(() => {
    return () => {
      closeSidebar();
    };
  }, [closeSidebar]);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // --- Open PDF Hook (for replace file with password support) ---
  const {
    isPasswordModalOpen: isReplacePasswordModalOpen,
    passwordError: replacePasswordError,
    passwordLoading: replacePasswordLoading,
    openFile: openReplaceFile,
    handlePasswordSubmit: handleReplacePasswordSubmit,
    handlePasswordModalClose: handleReplacePasswordModalClose,
  } = useOpenPdf({
    onSuccess: (arrayBuffer, doc, newNumPages, password, filename) => {
      // Clear placed items only, keep signatures and stamps
      setPlacedItems([]);
      setPageNum(1);
      // Update PDF data with password and filename
      setPdfData(arrayBuffer, doc, newNumPages, password, filename);
      setIsReplaceModalOpen(false);
      // Reset file input
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    },
    onError: (err) => {
      setError(err.message);
      setIsReplaceModalOpen(false);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    },
  });

  // --- Custom Hooks ---
  const { zoomLevel, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = usePdfRenderer(
    pdfDoc,
    pageNum,
    canvasRef,
    containerRef
  );

  const {
    signaturePadRef,
    fileInputRef,
    isCanvasEmpty,
    setIsCanvasEmpty,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    handleImageUpload,
    downloadSignature,
    drawImageOnCanvas,
    getCanvasDataUrl,
    initializeCanvas,
  } = useSignaturePad(modalMode);

  const {
    draggingId,
    resizingId,
    handleDragStart,
    handleResizeStart,
    handleGlobalMove,
    handleGlobalEnd,
    removePlacedItem,
  } = useDragResize(placedItems, setPlacedItems, canvasRef, zoomLevel);

  // --- Effects ---
  useEffect(() => {
    if (isModalOpen && editingItemId) {
      setIsCanvasEmpty(false);
    } else if (isModalOpen) {
      setIsCanvasEmpty(true);
    }
  }, [isModalOpen, editingItemId, setIsCanvasEmpty]);

  useEffect(() => {
    setPageInput(String(pageNum));
  }, [pageNum]);

  useEffect(() => {
    if (isModalOpen && editingItemId && modalMode === 'signature') {
      const itemToEdit = savedSignatures.find((s) => s.id === editingItemId);
      if (itemToEdit) {
        setTimeout(() => drawImageOnCanvas(itemToEdit.dataUrl), 100);
      }
    }
  }, [isModalOpen, editingItemId, modalMode, savedSignatures, drawImageOnCanvas]);

  // --- Handlers ---
  const getItemImageWrapper = useCallback(
    (type: ModalMode, itemId: number) => {
      return getItemImage(type, itemId, savedSignatures, savedStamps);
    },
    [savedSignatures, savedStamps]
  );

  const placeItemOnPdf = useCallback(
    (type: ModalMode, itemId: number) => {
      const itemUrl = getItemImageWrapper(type, itemId);
      if (!itemUrl) return;

      const itemWidth = type === 'stamp' ? DEFAULT_STAMP_WIDTH : DEFAULT_SIGNATURE_WIDTH;

      // Calculate center position based on canvas size
      const canvas = canvasRef.current;
      let centerX = 100;
      let centerY = 100;

      if (canvas) {
        // Canvas dimensions are at current zoom, divide by zoomLevel to get base coordinates
        const baseCanvasWidth = canvas.width / zoomLevel;
        const baseCanvasHeight = canvas.height / zoomLevel;
        centerX = (baseCanvasWidth - itemWidth) / 2;
        centerY = (baseCanvasHeight - itemWidth * 0.5) / 2; // Assume aspect ratio ~2:1 for signatures
      }

      const newPlacement: PlacedItem = {
        id: Date.now() + Math.random(),
        type,
        itemId,
        x: centerX,
        y: centerY,
        width: itemWidth,
        pageNum,
      };
      setPlacedItems((prev) => [...prev, newPlacement]);
      closeSidebar();
    },
    [getItemImageWrapper, pageNum, setPlacedItems, zoomLevel, closeSidebar]
  );

  const saveAndPlace = useCallback(() => {
    if (isCanvasEmpty) {
      alert('Belum ada gambar/tanda tangan.');
      return;
    }

    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;

    if (editingItemId) {
      if (modalMode === 'signature') {
        setSavedSignatures((prev) =>
          prev.map((s) => (s.id === editingItemId ? { ...s, dataUrl } : s))
        );
      } else {
        setSavedStamps((prev) => prev.map((s) => (s.id === editingItemId ? { ...s, dataUrl } : s)));
      }
      setEditingItemId(null);
    } else {
      const newId = Date.now();
      const newItem: SavedItem = { id: newId, dataUrl };

      if (modalMode === 'signature') {
        setSavedSignatures((prev) => [...prev, newItem]);
      } else {
        setSavedStamps((prev) => [...prev, newItem]);
      }

      const itemWidth = modalMode === 'stamp' ? DEFAULT_STAMP_WIDTH : DEFAULT_SIGNATURE_WIDTH;

      // Calculate center position based on canvas size
      const canvas = canvasRef.current;
      let centerX = 100;
      let centerY = 100;

      if (canvas) {
        // Canvas dimensions are at current zoom, divide by zoomLevel to get base coordinates
        const baseCanvasWidth = canvas.width / zoomLevel;
        const baseCanvasHeight = canvas.height / zoomLevel;
        centerX = (baseCanvasWidth - itemWidth) / 2;
        centerY = (baseCanvasHeight - itemWidth * 0.5) / 2; // Assume aspect ratio ~2:1 for signatures
      }

      const newPlacement: PlacedItem = {
        id: newId + 1,
        type: modalMode,
        itemId: newId,
        x: centerX,
        y: centerY,
        width: itemWidth,
        pageNum,
      };
      setPlacedItems((prev) => [...prev, newPlacement]);
      closeSidebar();
    }
    setIsModalOpen(false);
  }, [
    isCanvasEmpty,
    getCanvasDataUrl,
    editingItemId,
    modalMode,
    pageNum,
    zoomLevel,
    setSavedSignatures,
    setSavedStamps,
    setPlacedItems,
    closeSidebar,
  ]);

  const handleOpenModal = useCallback((mode: ModalMode, editId: number | null = null) => {
    setEditingItemId(editId);
    setModalMode(mode);
    setIsModalOpen(true);
  }, []);

  const handleDeleteItem = useCallback((type: ModalMode, itemId: number) => {
    setDeletingItemId(itemId);
    setDeletingType(type);
  }, []);

  const confirmDeleteItem = useCallback(() => {
    if (!deletingItemId || !deletingType) return;

    if (deletingType === 'signature') {
      setSavedSignatures((prev) => prev.filter((s) => s.id !== deletingItemId));
    } else {
      setSavedStamps((prev) => prev.filter((s) => s.id !== deletingItemId));
    }

    setPlacedItems((prev) =>
      prev.filter((p) => !(p.type === deletingType && p.itemId === deletingItemId))
    );

    setDeletingItemId(null);
    setDeletingType(null);
  }, [deletingItemId, deletingType, setSavedSignatures, setSavedStamps, setPlacedItems]);

  const handlePageInputBlur = useCallback(() => {
    let page = parseInt(pageInput);
    if (isNaN(page) || page < 1) page = 1;
    if (page > numPages) page = numPages;
    setPageNum(page);
    setPageInput(String(page));
  }, [pageInput, numPages]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handlePageInputBlur();
        (e.target as HTMLInputElement).blur();
      }
    },
    [handlePageInputBlur]
  );

  // Get default filename from the original PDF file (without extension)
  const getDefaultFilename = useCallback(() => {
    if (!pdfFilename) return 'document';
    // Remove .pdf extension if present
    return pdfFilename.replace(/\.pdf$/i, '');
  }, [pdfFilename]);

  const handleOpenFilenameModal = useCallback(
    (saveType: 'normal' | 'withPassword' | 'withoutPassword') => {
      if (placedItems.length === 0 || !pdfFile) return;
      setPendingSaveType(saveType);
      setIsFilenameModalOpen(true);
    },
    [placedItems.length, pdfFile]
  );

  const savePdf = useCallback(
    async (filename: string) => {
      if (placedItems.length === 0 || !pdfFile || !canvasRef.current) return;
      setLoading(true);

      try {
        // Divide canvas width by zoomLevel to get base scale width
        // because item positions are stored at base scale (zoomLevel = 1.0)
        const baseCanvasWidth = canvasRef.current.width / zoomLevel;
        // If the original PDF was password-protected, preserve the password
        const saveOptions = openPassword ? { password: openPassword } : {};

        const blob = await savePdfWithItems(
          pdfFile,
          placedItems,
          savedSignatures,
          savedStamps,
          baseCanvasWidth,
          saveOptions,
          pdfDoc || undefined,
          numPages
        );
        downloadBlob(blob, `ParafAman_${filename}.pdf`);
        setIsFilenameModalOpen(false);
        setPendingSaveType(null);
        triggerAfterSave();
      } catch (err) {
        console.error('Save error:', err);
        setError('Gagal menyimpan PDF.');
      } finally {
        setLoading(false);
      }
    },
    [
      pdfFile,
      placedItems,
      savedSignatures,
      savedStamps,
      zoomLevel,
      pdfDoc,
      numPages,
      openPassword,
      triggerAfterSave,
    ]
  );

  // State for pending password when saving with new password
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  const handleOpenPasswordModal = useCallback(() => {
    if (placedItems.length === 0 || !pdfFile) return;
    setIsPasswordModalOpen(true);
  }, [placedItems.length, pdfFile]);

  const handlePasswordConfirm = useCallback(
    (password: string) => {
      setPendingPassword(password);
      setIsPasswordModalOpen(false);
      handleOpenFilenameModal('withPassword');
    },
    [handleOpenFilenameModal]
  );

  const savePdfWithPassword = useCallback(
    async (filename: string) => {
      if (placedItems.length === 0 || !pdfFile || !canvasRef.current || !pendingPassword) return;
      setLoading(true);

      try {
        const baseCanvasWidth = canvasRef.current.width / zoomLevel;
        const blob = await savePdfWithItems(
          pdfFile,
          placedItems,
          savedSignatures,
          savedStamps,
          baseCanvasWidth,
          { password: pendingPassword },
          pdfDoc || undefined,
          numPages
        );
        downloadBlob(blob, `ParafAman_${filename}.pdf`);
        setIsFilenameModalOpen(false);
        setPendingSaveType(null);
        setPendingPassword(null);
        triggerAfterSave();
      } catch (err) {
        console.error('Save error:', err);
        setError('Gagal menyimpan PDF dengan password.');
      } finally {
        setLoading(false);
      }
    },
    [
      pdfFile,
      placedItems,
      savedSignatures,
      savedStamps,
      zoomLevel,
      pdfDoc,
      numPages,
      pendingPassword,
      triggerAfterSave,
    ]
  );

  const handleOpenRemovePasswordModal = useCallback(() => {
    if (placedItems.length === 0 || !pdfFile) return;
    setIsRemovePasswordModalOpen(true);
  }, [placedItems.length, pdfFile]);

  const handleRemovePasswordConfirm = useCallback(() => {
    setIsRemovePasswordModalOpen(false);
    handleOpenFilenameModal('withoutPassword');
  }, [handleOpenFilenameModal]);

  const savePdfWithoutPassword = useCallback(
    async (filename: string) => {
      if (placedItems.length === 0 || !pdfFile || !canvasRef.current) return;
      setLoading(true);

      try {
        const baseCanvasWidth = canvasRef.current.width / zoomLevel;
        // Explicitly pass no password options to save without protection
        const blob = await savePdfWithItems(
          pdfFile,
          placedItems,
          savedSignatures,
          savedStamps,
          baseCanvasWidth,
          {}, // No password
          pdfDoc || undefined,
          numPages
        );
        downloadBlob(blob, `ParafAman_${filename}.pdf`);
        setIsFilenameModalOpen(false);
        setPendingSaveType(null);
        triggerAfterSave();
      } catch (err) {
        console.error('Save error:', err);
        setError('Gagal menyimpan PDF.');
      } finally {
        setLoading(false);
      }
    },
    [
      pdfFile,
      placedItems,
      savedSignatures,
      savedStamps,
      zoomLevel,
      pdfDoc,
      numPages,
      triggerAfterSave,
    ]
  );

  // Handle filename modal confirm based on pending save type
  const handleFilenameConfirm = useCallback(
    (filename: string) => {
      switch (pendingSaveType) {
        case 'normal':
          savePdf(filename);
          break;
        case 'withPassword':
          savePdfWithPassword(filename);
          break;
        case 'withoutPassword':
          savePdfWithoutPassword(filename);
          break;
      }
    },
    [pendingSaveType, savePdf, savePdfWithPassword, savePdfWithoutPassword]
  );

  const handleFilenameModalClose = useCallback(() => {
    setIsFilenameModalOpen(false);
    setPendingSaveType(null);
    setPendingPassword(null);
  }, []);

  const handleCloseFile = useCallback(() => {
    clearPdfData();
    navigate('/');
  }, [clearPdfData, navigate]);

  // --- Replace File Handlers ---
  const handleReplaceFile = useCallback(() => {
    setIsReplaceModalOpen(true);
  }, []);

  const handleReplaceFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await openReplaceFile(file);
    },
    [openReplaceFile]
  );

  const handleReplaceOnly = useCallback(() => {
    replaceFileInputRef.current?.click();
  }, []);

  const handleSaveAndReplace = useCallback(async () => {
    if (placedItems.length > 0 && pdfFile && canvasRef.current) {
      setLoading(true);
      try {
        // Divide canvas width by zoomLevel to get base scale width
        const baseCanvasWidth = canvasRef.current.width / zoomLevel;
        // If the original PDF was password-protected, preserve the password
        const saveOptions = openPassword ? { password: openPassword } : {};

        const blob = await savePdfWithItems(
          pdfFile,
          placedItems,
          savedSignatures,
          savedStamps,
          baseCanvasWidth,
          saveOptions,
          pdfDoc || undefined,
          numPages
        );
        downloadBlob(blob, `ParafAman_${Date.now()}.pdf`);
      } catch (err) {
        console.error('Save error:', err);
        setError('Gagal menyimpan PDF.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    replaceFileInputRef.current?.click();
  }, [
    pdfFile,
    placedItems,
    savedSignatures,
    savedStamps,
    zoomLevel,
    pdfDoc,
    numPages,
    openPassword,
  ]);

  // --- Background Click Handler (deselect items) ---
  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields or when modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isModalOpen
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S: Save PDF
      if (modKey && e.key === 's') {
        e.preventDefault();
        if (placedItems.length > 0 && !loading) {
          handleOpenFilenameModal('normal');
        }
        return;
      }

      // Ctrl/Cmd + Z: Undo (remove last placed item)
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const currentPageItems = placedItems.filter((item) => item.pageNum === pageNum);
        if (currentPageItems.length > 0) {
          const lastItem = currentPageItems[currentPageItems.length - 1];
          removePlacedItem(lastItem.id);
        }
        return;
      }

      // Arrow Left / Page Up: Previous page
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (pageNum > 1) {
          setPageNum((prev) => prev - 1);
        }
        return;
      }

      // Arrow Right / Page Down: Next page
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (pageNum < numPages) {
          setPageNum((prev) => prev + 1);
        }
        return;
      }

      // + or =: Zoom in
      if ((e.key === '+' || e.key === '=') && !modKey) {
        e.preventDefault();
        if (canZoomIn) {
          zoomIn();
        }
        return;
      }

      // -: Zoom out
      if (e.key === '-' && !modKey) {
        e.preventDefault();
        if (canZoomOut) {
          zoomOut();
        }
        return;
      }

      // 0: Reset zoom
      if (e.key === '0' && !modKey) {
        e.preventDefault();
        resetZoom();
        return;
      }

      // Escape: Close file / go back
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseFile();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalOpen,
    placedItems,
    pageNum,
    numPages,
    loading,
    canZoomIn,
    canZoomOut,
    handleOpenFilenameModal,
    removePlacedItem,
    zoomIn,
    zoomOut,
    resetZoom,
    handleCloseFile,
  ]);

  // Show file picker if no PDF loaded
  if (!pdfFile || !pdfDoc) {
    return (
      <ToolPageShell
        title="Tanda Tangan PDF"
        description="Tambahkan tanda tangan dan stempel ke dokumen PDF Anda."
        icon={<PenLine className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, password, filename }) => {
            setPdfData(arrayBuffer, doc, numPages, password, filename);
          }}
        />
      </ToolPageShell>
    );
  }

  return (
    <div className="h-screen flex flex-row overflow-hidden relative animate-in fade-in duration-500">
      <PdfCanvas
        ref={containerRef}
        canvasRef={canvasRef}
        placedItems={placedItems}
        pageNum={pageNum}
        draggingId={draggingId}
        resizingId={resizingId}
        zoomLevel={zoomLevel}
        selectedId={selectedId}
        getItemImage={getItemImageWrapper}
        onDragStart={handleDragStart}
        onResizeStart={handleResizeStart}
        onGlobalMove={handleGlobalMove}
        onGlobalEnd={handleGlobalEnd}
        onRemoveItem={removePlacedItem}
        onSelectItem={setSelectedId}
        onBackgroundClick={handleBackgroundClick}
      />

      <PageNavigation
        pageNum={pageNum}
        numPages={numPages}
        pageInput={pageInput}
        zoomLevel={zoomLevel}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onPageChange={setPageNum}
        onPageInputChange={setPageInput}
        onPageInputBlur={handlePageInputBlur}
        onPageInputKeyDown={handlePageInputKeyDown}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />

      <Sidebar
        savedSignatures={savedSignatures}
        savedStamps={savedStamps}
        loading={loading}
        isOpen={isSidebarOpen}
        isPasswordProtected={!!openPassword}
        hasPlacedItems={placedItems.length > 0}
        onClose={closeSidebar}
        onOpenModal={handleOpenModal}
        onPlaceItem={placeItemOnPdf}
        onDeleteItem={handleDeleteItem}
        onSavePdf={() => handleOpenFilenameModal('normal')}
        onSavePdfWithNewPassword={handleOpenPasswordModal}
        onSavePdfWithoutPassword={handleOpenRemovePasswordModal}
        onCloseFile={handleCloseFile}
        onReplaceFile={handleReplaceFile}
      />

      {(draggingId || resizingId) && (
        <div
          className="fixed inset-0 z-50 cursor-move touch-none"
          onMouseMove={handleGlobalMove}
          onMouseUp={() => {
            // Select the item that was being dragged/resized
            if (draggingId) setSelectedId(draggingId);
            if (resizingId) setSelectedId(resizingId);
            handleGlobalEnd();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            handleGlobalMove(e);
          }}
          onTouchEnd={() => {
            // Select the item that was being dragged/resized
            if (draggingId) setSelectedId(draggingId);
            if (resizingId) setSelectedId(resizingId);
            handleGlobalEnd();
          }}
        />
      )}

      {/* Modals */}
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        editingItemId={editingItemId}
        signaturePadRef={signaturePadRef}
        fileInputRef={fileInputRef}
        isCanvasEmpty={isCanvasEmpty}
        onStartDrawing={startDrawing}
        onDraw={draw}
        onStopDrawing={stopDrawing}
        onClearCanvas={clearCanvas}
        onImageUpload={handleImageUpload}
        onDownloadSignature={downloadSignature}
        onSaveAndPlace={saveAndPlace}
        onInitializeCanvas={initializeCanvas}
      />

      <DeleteConfirmModal
        isOpen={!!deletingItemId}
        onClose={() => {
          setDeletingItemId(null);
          setDeletingType(null);
        }}
        onConfirm={confirmDeleteItem}
      />

      <ReplaceFileModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        onReplaceOnly={handleReplaceOnly}
        onSaveAndReplace={handleSaveAndReplace}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        loading={loading}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirm}
      />

      <RemovePasswordModal
        isOpen={isRemovePasswordModalOpen}
        loading={loading}
        onClose={() => setIsRemovePasswordModalOpen(false)}
        onConfirm={handleRemovePasswordConfirm}
      />

      <FilenameModal
        isOpen={isFilenameModalOpen}
        loading={loading}
        defaultFilename={getDefaultFilename()}
        onClose={handleFilenameModalClose}
        onConfirm={handleFilenameConfirm}
      />

      {/* Password modal for opening password-protected files when replacing */}
      <PasswordInputModal
        isOpen={isReplacePasswordModalOpen}
        loading={replacePasswordLoading}
        error={replacePasswordError}
        onClose={handleReplacePasswordModalClose}
        onSubmit={handleReplacePasswordSubmit}
      />

      {/* Share modal - shown after first save */}
      <ShareModal isOpen={isShareModalOpen} onClose={closeShareModal} />

      {/* Hidden file input for replace file */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleReplaceFileInput}
      />
    </div>
  );
};
