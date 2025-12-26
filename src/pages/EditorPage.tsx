import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import { usePdfRenderer, useSignaturePad, useDragResize, useOpenPdf } from '@/hooks';

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
  ReplaceFileModal,
  PasswordModal,
  RemovePasswordModal,
} from '@/features/pdf-editor';
import { PasswordInputModal } from '@/components/PasswordInputModal';

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Store ---
  const {
    pdfFile,
    pdfDoc,
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

  // --- Selected Item State (for mobile tap-to-select) ---
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- Sidebar State (from context) ---
  const { isOpen: isSidebarOpen, closeSidebar } = useSidebar();

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
    onSuccess: (arrayBuffer, doc, newNumPages, password) => {
      // Clear placed items only, keep signatures and stamps
      setPlacedItems([]);
      setPageNum(1);
      // Update PDF data with password
      setPdfData(arrayBuffer, doc, newNumPages, password);
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

  // --- Redirect if no PDF ---
  useEffect(() => {
    if (!pdfFile || !pdfDoc) {
      navigate('/');
    }
  }, [pdfFile, pdfDoc, navigate]);

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

      const newPlacement: PlacedItem = {
        id: Date.now() + Math.random(),
        type,
        itemId,
        x: 50,
        y: 50,
        width: type === 'stamp' ? DEFAULT_STAMP_WIDTH : DEFAULT_SIGNATURE_WIDTH,
        pageNum,
      };
      setPlacedItems((prev) => [...prev, newPlacement]);
    },
    [getItemImageWrapper, pageNum, setPlacedItems]
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

      const newPlacement: PlacedItem = {
        id: newId + 1,
        type: modalMode,
        itemId: newId,
        x: 100,
        y: 100,
        width: modalMode === 'stamp' ? DEFAULT_STAMP_WIDTH : DEFAULT_SIGNATURE_WIDTH,
        pageNum,
      };
      setPlacedItems((prev) => [...prev, newPlacement]);
    }
    setIsModalOpen(false);
  }, [
    isCanvasEmpty,
    getCanvasDataUrl,
    editingItemId,
    modalMode,
    pageNum,
    setSavedSignatures,
    setSavedStamps,
    setPlacedItems,
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

  const savePdf = useCallback(async () => {
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
      downloadBlob(blob, `ParafAman_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Save error:', err);
      setError('Gagal menyimpan PDF.');
    } finally {
      setLoading(false);
    }
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

  const handleOpenPasswordModal = useCallback(() => {
    if (placedItems.length === 0 || !pdfFile) return;
    setIsPasswordModalOpen(true);
  }, [placedItems.length, pdfFile]);

  const savePdfWithPassword = useCallback(
    async (password: string) => {
      if (placedItems.length === 0 || !pdfFile || !canvasRef.current) return;
      setLoading(true);

      try {
        const baseCanvasWidth = canvasRef.current.width / zoomLevel;
        const blob = await savePdfWithItems(
          pdfFile,
          placedItems,
          savedSignatures,
          savedStamps,
          baseCanvasWidth,
          { password },
          pdfDoc || undefined,
          numPages
        );
        downloadBlob(blob, `ParafAman_${Date.now()}_protected.pdf`);
        setIsPasswordModalOpen(false);
      } catch (err) {
        console.error('Save error:', err);
        setError('Gagal menyimpan PDF dengan password.');
      } finally {
        setLoading(false);
      }
    },
    [pdfFile, placedItems, savedSignatures, savedStamps, zoomLevel, pdfDoc, numPages]
  );

  const handleOpenRemovePasswordModal = useCallback(() => {
    if (placedItems.length === 0 || !pdfFile) return;
    setIsRemovePasswordModalOpen(true);
  }, [placedItems.length, pdfFile]);

  const savePdfWithoutPassword = useCallback(async () => {
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
      downloadBlob(blob, `ParafAman_${Date.now()}.pdf`);
      setIsRemovePasswordModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      setError('Gagal menyimpan PDF.');
    } finally {
      setLoading(false);
    }
  }, [pdfFile, placedItems, savedSignatures, savedStamps, zoomLevel, pdfDoc, numPages]);

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
          savePdf();
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
    savePdf,
    removePlacedItem,
    zoomIn,
    zoomOut,
    resetZoom,
    handleCloseFile,
  ]);

  // Don't render if no PDF
  if (!pdfFile || !pdfDoc) {
    return null;
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
        onSavePdf={savePdf}
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
            handleGlobalEnd();
            // Deselect item after drag ends on desktop
            setSelectedId(null);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            handleGlobalMove(e);
          }}
          onTouchEnd={handleGlobalEnd}
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
        onConfirm={savePdfWithPassword}
      />

      <RemovePasswordModal
        isOpen={isRemovePasswordModalOpen}
        loading={loading}
        onClose={() => setIsRemovePasswordModalOpen(false)}
        onConfirm={savePdfWithoutPassword}
      />

      {/* Password modal for opening password-protected files when replacing */}
      <PasswordInputModal
        isOpen={isReplacePasswordModalOpen}
        loading={replacePasswordLoading}
        error={replacePasswordError}
        onClose={handleReplacePasswordModalClose}
        onSubmit={handleReplacePasswordSubmit}
      />

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
