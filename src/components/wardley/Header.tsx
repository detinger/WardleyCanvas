'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  File,
  Save,
  FolderOpen,
  BookOpen,
  LayoutGrid,
  Download,
} from 'lucide-react';
import { Logo } from '../icons';

type HeaderProps = {
  onNewMap: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShowTemplates: () => void;
  onShowGuide: () => void;
};

export default function Header({
  onNewMap,
  onSave,
  onLoad,
  onShowTemplates,
  onShowGuide,
}: HeaderProps) {
  const handleExport = (format: 'PNG' | 'PDF') => {
    // In a real app, you'd use a library like html2canvas and jspdf
    // to capture the map element and export it.
    console.log(`Exporting as ${format}...`);
    alert(
      `Export to ${format} is a planned feature. For now, please use your system's screenshot tool.`
    );
  };

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight font-headline text-foreground">
          Wardley Canvas
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNewMap}>
          <File />
          New
        </Button>
        <Button variant="ghost" size="sm" onClick={onSave}>
          <Save />
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onLoad}>
          <FolderOpen />
          Load
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" onClick={onShowTemplates}>
          <LayoutGrid />
          Templates
        </Button>
        <Button variant="ghost" size="sm" onClick={onShowGuide}>
          <BookOpen />
          Guide
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="sm" onClick={() => handleExport('PNG')}>
          <Download />
          Export
        </Button>
      </div>
    </header>
  );
}
