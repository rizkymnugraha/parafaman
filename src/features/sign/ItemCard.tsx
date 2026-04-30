import React from 'react';
import { CornerDownRight, Edit, Trash2 } from 'lucide-react';
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import type { SavedItem, ModalMode } from '@/types';

interface ItemCardProps {
  item: SavedItem;
  type: ModalMode;
  onPlace: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  showEdit?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  type,
  onPlace,
  onEdit,
  onDelete,
  showEdit = false,
}) => {
  return (
    <div className="group relative border rounded-lg bg-card p-0 hover:border-brand-500/50 transition-all duration-200 md:hover:shadow-md md:hover:scale-[1.02] cursor-pointer">
      {/* Image container */}
      <div
        className={`${type === 'stamp' ? 'h-20 p-2' : 'h-16'} flex items-center justify-center bg-white relative md:rounded-lg rounded-t-lg overflow-hidden`}
      >
        <img
          src={item.dataUrl}
          className={`${type === 'stamp' ? 'max-h-full max-w-full' : 'max-h-full max-w-[80%]'} object-contain`}
          alt={type === 'stamp' ? 'Stamp' : 'Sig'}
        />
        {/* Desktop hover overlay */}
        <div className="absolute inset-0 bg-black/60 hidden md:flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[1px]">
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

      {/* Mobile buttons - always visible below image */}
      <div className="md:hidden flex items-center justify-center gap-2 p-2 border-t border-border bg-zinc-50 dark:bg-zinc-800 rounded-b-lg">
        <Button
          size="sm"
          className="flex-1 h-8 text-xs bg-brand-500 hover:bg-brand-600 text-white"
          onClick={onPlace}
        >
          <CornerDownRight className="w-3 h-3 mr-1" />
          Pasang
        </Button>
        {showEdit && onEdit && (
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={onEdit}>
            <Edit className="w-3 h-3" />
          </Button>
        )}
        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
