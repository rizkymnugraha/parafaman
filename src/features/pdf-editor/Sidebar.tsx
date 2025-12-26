import React from 'react';
import {
  Plus,
  CornerDownRight,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  FolderOpen,
  X,
  Lock,
} from 'lucide-react';
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { Footer } from '@/components/Footer';
import type { SavedItem, ModalMode } from '@/types';

interface SidebarProps {
  savedSignatures: SavedItem[];
  savedStamps: SavedItem[];
  loading: boolean;
  isOpen: boolean;
  isPasswordProtected?: boolean;
  hasPlacedItems?: boolean;
  onClose: () => void;
  onOpenModal: (mode: ModalMode, editingId?: number | null) => void;
  onPlaceItem: (type: ModalMode, itemId: number) => void;
  onDeleteItem: (type: ModalMode, itemId: number) => void;
  onSavePdf: () => void;
  onCloseFile: () => void;
  onReplaceFile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  savedSignatures,
  savedStamps,
  loading,
  isOpen,
  isPasswordProtected = false,
  hasPlacedItems = false,
  onClose,
  onOpenModal,
  onPlaceItem,
  onDeleteItem,
  onSavePdf,
  onCloseFile,
  onReplaceFile,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed md:relative right-0 top-0 h-full w-72 bg-background border-l border-border flex flex-col z-40 md:z-20 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b flex border-border bg-zinc-50/50 dark:bg-zinc-900/50 space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="flex-1 gap-2 font-bold"
                onClick={onSavePdf}
                disabled={loading || !hasPlacedItems}
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Simpan PDF
                {isPasswordProtected && <Lock className="w-3 h-3" />}
              </Button>
            </TooltipTrigger>
            {isPasswordProtected && (
              <TooltipContent>Password file ini akan tetap terjaga</TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-xs text-zinc-500 p-4 rounded-full"
                onClick={onReplaceFile}
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pilih File Lain</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-xs text-zinc-500 p-4 rounded-full"
                onClick={onCloseFile}
              >
                <ArrowLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kembali</TooltipContent>
          </Tooltip>
        </div>

        {/* Library Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Signatures Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tanda Tangan
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onOpenModal('signature')}
                title="Tambah Baru"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {savedSignatures.length === 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-dashed text-xs h-12 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => onOpenModal('signature')}
              >
                + Buat Tanda Tangan
              </Button>
            ) : (
              <div className="space-y-3">
                {savedSignatures.map((sig) => (
                  <ItemCard
                    key={sig.id}
                    item={sig}
                    type="signature"
                    onPlace={() => onPlaceItem('signature', sig.id)}
                    onEdit={() => onOpenModal('signature', sig.id)}
                    onDelete={() => onDeleteItem('signature', sig.id)}
                    showEdit
                  />
                ))}
                <Button
                  variant="outline"
                  className="w-full border-dashed text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 h-8"
                  onClick={() => onOpenModal('signature')}
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Buat Baru
                </Button>
              </div>
            )}
          </div>

          {/* Stamps Section */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stempel & Materai
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onOpenModal('stamp')}
                title="Tambah Baru"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {savedStamps.length === 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-dashed text-xs h-12 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => onOpenModal('stamp')}
              >
                + Tambah Stempel
              </Button>
            ) : (
              <div className="space-y-3">
                {savedStamps.map((stamp) => (
                  <ItemCard
                    key={stamp.id}
                    item={stamp}
                    type="stamp"
                    onPlace={() => onPlaceItem('stamp', stamp.id)}
                    onDelete={() => onDeleteItem('stamp', stamp.id)}
                  />
                ))}
                <Button
                  variant="outline"
                  className="w-full border-dashed text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 h-8"
                  onClick={() => onOpenModal('stamp')}
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Tambah Stempel
                </Button>
              </div>
            )}
          </div>
        </div>

        <Footer className="border-t border-border py-3 px-4" />
      </aside>
    </>
  );
};

interface ItemCardProps {
  item: SavedItem;
  type: ModalMode;
  onPlace: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  showEdit?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  type,
  onPlace,
  onEdit,
  onDelete,
  showEdit = false,
}) => {
  return (
    <div className="group relative border rounded-lg bg-card p-0 hover:border-brand-500/50 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer">
      <div
        className={`${type === 'stamp' ? 'h-20 p-2' : 'h-16'} flex items-center justify-center bg-white relative rounded-lg overflow-hidden`}
      >
        <img
          src={item.dataUrl}
          className={`${type === 'stamp' ? 'max-h-full max-w-full' : 'max-h-full max-w-[80%]'} object-contain`}
          alt={type === 'stamp' ? 'Stamp' : 'Sig'}
        />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[1px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white border-none shadow-lg hover:scale-110 transition-transform"
                onClick={onPlace}
              >
                <CornerDownRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pasang</TooltipContent>
          </Tooltip>
          {showEdit && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white text-zinc-800 hover:bg-zinc-100 border-none shadow-lg hover:scale-110 transition-transform"
                  onClick={onEdit}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ubah</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
