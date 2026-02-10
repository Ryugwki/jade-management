import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps = {
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  emptyState?: React.ReactNode;
  className?: string;
};

export function DataTable({
  headers,
  rows,
  emptyState,
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/80 overflow-hidden",
        className,
      )}
    >
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={`header-${index}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((cells, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {cells.map((cell, cellIndex) => (
                  <TableCell key={`cell-${rowIndex}-${cellIndex}`}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyState}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
