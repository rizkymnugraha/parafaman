import React from 'react';
import {
  Plus,
  Save,
  ArrowLeft,
  FolderOpen,
  X,
  ChevronDown,
  Lock,
  LockOpen,
  KeyRound,
} from 'lucide-react';
import {
  Button,
  ButtonGroup,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ButtonGroupSeparator,
} from '@/components/ui';
import { Footer } from '@/components/Footer';
import { ItemCard } from './ItemCard';
import type { SavedItem, ModalMode } from '@/types';

interface SidebarProps {
  savedSignatures: SavedItem[];
  savedStamps: SavedItem[];
  loading: boolean;
  isOpen: boolean;
  isPasswordProtected: boolean;
  hasPlacedItems: boolean;
  onClose: () => void;
  onOpenModal: (mode: ModalMode, editingId?: number | null) => void;
  onPlaceItem: (type: ModalMode, itemId: number) => void;
  onDeleteItem: (type: ModalMode, itemId: number) => void;
  onSavePdf: () => void;
  onSavePdfWithNewPassword: () => void;
  onSavePdfWithoutPassword: () => void;
  onCloseFile: () => void;
  onReplaceFile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  savedSignatures,
  savedStamps,
  loading,
  isOpen,
  isPasswordProtected,
  hasPlacedItems,
  onClose,
  onOpenModal,
  onPlaceItem,
  onDeleteItem,
  onSavePdf,
  onSavePdfWithNewPassword,
  onSavePdfWithoutPassword,
  onCloseFile,
  onReplaceFile,
}) => {
  const isSaveDisabled = loading || !hasPlacedItems;
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
        <div className="p-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
          <div className="flex space-x-2">
            <ButtonGroup className="flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="flex-1 gap-2 font-bold"
                    onClick={onSavePdf}
                    disabled={isSaveDisabled}
                  >
                    {loading ? (
                      <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Simpan PDF
                  </Button>
                </TooltipTrigger>
                {isPasswordProtected && (
                  <TooltipContent className="hidden md:block">
                    <span className="flex items-center">
                      <Lock className="w-3 h-3 inline mr-1" /> Password di file ini akan tetap
                      terjaga
                    </span>
                  </TooltipContent>
                )}
              </Tooltip>
              <ButtonGroupSeparator className="bg-zinc-600" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="has-[>svg]:px-2" disabled={isSaveDisabled}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isPasswordProtected ? (
                    <>
                      <DropdownMenuItem onClick={onSavePdfWithNewPassword}>
                        <KeyRound className="w-4 h-4" />
                        Simpan dengan Password Baru
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onSavePdfWithoutPassword}
                        className="text-destructive focus:text-destructive"
                      >
                        <LockOpen className="w-4 h-4" />
                        Simpan tanpa Password
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={onSavePdfWithNewPassword}>
                      <Lock className="w-4 h-4" />
                      Simpan dengan Password
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
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

          {/* Mobile password protection message */}
          {isPasswordProtected && (
            <p className="md:hidden text-xs text-muted-foreground flex items-center">
              <Lock className="w-3 h-3 mr-1.5" />
              Password di file ini akan tetap terjaga
            </p>
          )}
        </div>

        {/* Library Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Signatures Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tanda Tangan
              </h3>
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
