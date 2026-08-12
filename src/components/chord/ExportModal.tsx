import React, { useState } from 'react';
import { ChordDefinition } from '../../types/chord';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { generateReactCodeSnippet, downloadFile } from '../../utils/exporter';
import { Download, Copy, Check, Code, FileText, Image as ImageIcon } from 'lucide-react';

export interface ExportModalProps {
  chord: ChordDefinition;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ chord, isOpen, onOpenChange }) => {
  const [copied, setCopied] = useState(false);
  const reactCode = generateReactCodeSnippet(chord);
  const jsonCode = JSON.stringify(chord, null, 2);

  const handleCopyReactCode = () => {
    navigator.clipboard.writeText(reactCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    downloadFile(jsonCode, `${chord.name.toLowerCase().replace(/\s+/g, '-')}-chord.json`, 'application/json');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Code className="h-5 w-5 text-primary" />
            Export Chord: {chord.name}
          </DialogTitle>
          <DialogDescription>
            Export as React TypeScript code, JSON configuration, or vector graphics for your project.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="react" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="react" className="gap-1.5 text-xs">
              <Code className="h-3.5 w-3.5" />
              React TSX Code
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              JSON Data
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5 text-xs">
              <ImageIcon className="h-3.5 w-3.5" />
              Image & Vector
            </TabsTrigger>
          </TabsList>

          <TabsContent value="react" className="space-y-4 pt-3">
            <div className="relative rounded-xl bg-slate-950 p-4 border font-mono text-xs overflow-x-auto text-slate-100 max-h-64">
              <pre>{reactCode}</pre>
            </div>
            <Button onClick={handleCopyReactCode} className="w-full gap-2">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Component Code'}
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 pt-3">
            <div className="relative rounded-xl bg-slate-950 p-4 border font-mono text-xs overflow-x-auto text-slate-100 max-h-64">
              <pre>{jsonCode}</pre>
            </div>
            <Button onClick={handleDownloadJSON} variant="secondary" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download .json File
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 pt-3">
            <div className="p-6 rounded-xl border glass-panel text-center space-y-3">
              <ImageIcon className="h-10 w-10 text-primary mx-auto opacity-80" />
              <h4 className="font-semibold text-sm">Download High Resolution Graphics</h4>
              <p className="text-xs text-muted-foreground">
                Export vector SVG or high-res PNG directly from the main designer interface.
              </p>
              <Button onClick={() => window.print()} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
