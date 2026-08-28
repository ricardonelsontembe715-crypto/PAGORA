import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${className}`}>
      <span className="text-xs text-slate-500">
        Página <span className="font-semibold text-slate-800">{currentPage}</span> de{' '}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Seguinte
        </Button>
      </div>
    </div>
  );
};
