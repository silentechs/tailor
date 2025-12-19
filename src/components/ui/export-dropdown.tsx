'use client';

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportDropdownProps {
    apiEndpoint: string;
    filename: string;
    disabled?: boolean;
}

export function ExportDropdown({ apiEndpoint, filename, disabled }: ExportDropdownProps) {
    const [isExporting, setIsExporting] = useState<'csv' | 'xlsx' | null>(null);

    const handleExport = async (format: 'csv' | 'xlsx') => {
        setIsExporting(format);
        try {
            const res = await fetch(`${apiEndpoint}?format=${format}`);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const date = new Date().toISOString().split('T')[0];
            const ext = format === 'xlsx' ? 'xls' : 'csv';
            a.download = `${filename}-${date}.${ext}`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export');
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled || isExporting !== null}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    CSV File (.csv)
                    <span className="ml-auto text-xs text-muted-foreground">Spreadsheet</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel File (.xls)
                    <span className="ml-auto text-xs text-muted-foreground">Microsoft Excel</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
