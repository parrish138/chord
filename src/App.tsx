import React, { useState } from 'react';
import { CanvasStudio } from './components/canvas/CanvasStudio';
import { ChordEditor } from './components/chord/ChordEditor';
import { ChordLibrary, PRESET_CHORDS } from './components/chord/ChordLibrary';
import { ChordSongbook } from './components/chord/ChordSongbook';
import { CAGEDMatrix } from './components/chord/CAGEDMatrix';
import { TabEditor } from './components/tab/TabEditor';
import { NashvilleStudio } from './components/nashville/NashvilleStudio';
import { GuitarNeckScaleStudio } from './components/scale/GuitarNeckScaleStudio';
import { ChordTheoryCard } from './components/chord/ChordTheoryCard';
import { ExportModal } from './components/chord/ExportModal';
import { AudioToneWidget } from './components/audio/AudioToneWidget';
import { ChordDefinition } from './types/chord';
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Music2, Sliders, Library, BookOpen, Download, Sun, Moon, Sparkles, Code2, Layers, Music, Hash, GitCommit, LayoutGrid } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'scale-neck' | 'nashville' | 'caged' | 'tab' | 'designer' | 'library' | 'songbook' | 'docs'>('canvas');
  const [currentChord, setCurrentChord] = useState<ChordDefinition>(PRESET_CHORDS[0]); // C Major
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSelectChordFromLibrary = (chord: ChordDefinition) => {
    setCurrentChord(chord);
    setActiveTab('designer');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  ChordLab
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Composable Canvas Studio & Unified Guitar Sequencer
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="glass"
              onClick={() => setIsExportOpen(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4 text-purple-400" />
              <span className="hidden sm:inline">Export Code</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner & Subheading */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-semibold text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Composable Canvas Studio & Unified Sequencer
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Interactive Composable Workspace
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Activate, deactivate, and re-order widgets on your custom guitar canvas with our unified master sequencer!
          </p>
        </div>

        {/* Primary Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 sm:grid-cols-9 w-full max-w-6xl">
              <TabsTrigger value="canvas" className="gap-1.5 text-xs font-extrabold text-primary">
                <LayoutGrid className="h-4 w-4 text-pink-400" />
                <span>Canvas</span>
              </TabsTrigger>
              <TabsTrigger value="scale-neck" className="gap-1.5 text-xs font-bold">
                <GitCommit className="h-4 w-4 text-amber-400" />
                <span>Scale Neck</span>
              </TabsTrigger>
              <TabsTrigger value="nashville" className="gap-1.5 text-xs">
                <Hash className="h-4 w-4" />
                <span>Nashville</span>
              </TabsTrigger>
              <TabsTrigger value="caged" className="gap-1.5 text-xs">
                <Layers className="h-4 w-4" />
                <span>CAGED</span>
              </TabsTrigger>
              <TabsTrigger value="tab" className="gap-1.5 text-xs">
                <Music className="h-4 w-4" />
                <span>Tablature</span>
              </TabsTrigger>
              <TabsTrigger value="designer" className="gap-1.5 text-xs">
                <Sliders className="h-4 w-4" />
                <span>Designer</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-1.5 text-xs">
                <Library className="h-4 w-4" />
                <span>Library</span>
              </TabsTrigger>
              <TabsTrigger value="songbook" className="gap-1.5 text-xs">
                <BookOpen className="h-4 w-4" />
                <span>Songbook</span>
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-1.5 text-xs">
                <Code2 className="h-4 w-4" />
                <span>Docs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 0: Composable Canvas Studio (Default Landing Page) */}
          <TabsContent value="canvas" className="pt-6">
            <CanvasStudio />
          </TabsContent>

          {/* Tab 1: Scale Neck Studio */}
          <TabsContent value="scale-neck" className="pt-6">
            <GuitarNeckScaleStudio />
          </TabsContent>

          {/* Tab 2: Nashville Number System */}
          <TabsContent value="nashville" className="pt-6">
            <NashvilleStudio />
          </TabsContent>

          {/* Tab 3: CAGED System Matrix */}
          <TabsContent value="caged" className="pt-6">
            <CAGEDMatrix onSelectChord={handleSelectChordFromLibrary} />
          </TabsContent>

          {/* Tab 4: Tablature Studio */}
          <TabsContent value="tab" className="pt-6">
            <TabEditor />
          </TabsContent>

          {/* Tab 5: Designer */}
          <TabsContent value="designer" className="pt-6">
            <ChordEditor
              initialChord={currentChord}
              onSaveChord={chord => setCurrentChord(chord)}
            />
          </TabsContent>

          {/* Tab 6: Preset Library */}
          <TabsContent value="library" className="pt-6">
            <ChordLibrary onSelectChord={handleSelectChordFromLibrary} />
          </TabsContent>

          {/* Tab 7: Songbook Sheet Creator */}
          <TabsContent value="songbook" className="pt-6">
            <ChordSongbook />
          </TabsContent>

          {/* Tab 8: Comprehensive Component Suite Documentation */}
          <TabsContent value="docs" className="pt-6">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="p-8 rounded-2xl glass-panel border border-border/40 space-y-4">
                <div className="border-b border-border/40 pb-4">
                  <h3 className="text-3xl font-extrabold tracking-tight">Component Suite & API Documentation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete integration guide and prop reference for every component in the ChordLab library.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <a href="#doc-canvas" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">0. CanvasStudio</a>
                  <a href="#doc-seq" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">1. UnifiedGuitarSequencer</a>
                  <a href="#doc-scale-neck" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">2. GuitarNeckScaleStudio</a>
                  <a href="#doc-nashville" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">3. NashvilleStudio</a>
                  <a href="#doc-caged" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">4. CAGEDMatrix</a>
                  <a href="#doc-theory" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">5. ChordTheoryCard</a>
                  <a href="#doc-tab" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">6. TabEditor</a>
                  <a href="#doc-designer" className="p-2 rounded bg-muted/50 hover:bg-muted font-bold text-primary">7. ChordEditor</a>
                </div>
              </div>

              {/* Doc 0: CanvasStudio */}
              <div id="doc-canvas" className="p-6 rounded-2xl glass-panel border border-border/40 space-y-4">
                <h4 className="text-xl font-bold text-pink-400">0. &lt;CanvasStudio /&gt;</h4>
                <p className="text-xs text-muted-foreground">
                  Composable canvas page with Left-Hand Widget Manager sidebar, widget activate/deactivate toggles, vertical reordering, and accordion expand/collapse.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                  <pre>{`import { CanvasStudio } from '@/components/canvas/CanvasStudio';

export default function CanvasPage() {
  return <CanvasStudio />;
}`}</pre>
                </div>
              </div>

              {/* Doc 1: UnifiedGuitarSequencer */}
              <div id="doc-seq" className="p-6 rounded-2xl glass-panel border border-border/40 space-y-4">
                <h4 className="text-xl font-bold text-amber-400">1. &lt;UnifiedGuitarSequencer /&gt;</h4>
                <p className="text-xs text-muted-foreground">
                  Main master guitar sequencer timeline consolidating chords and single neck notes with loop playback & BPM tempo slider.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                  <pre>{`import { UnifiedGuitarSequencer } from '@/components/canvas/UnifiedGuitarSequencer';

export default function SequencerPage() {
  return <UnifiedGuitarSequencer />;
}`}</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Global Floating Audio Tone Engine Sidebar Widget */}
      <AudioToneWidget />

      {/* Export Modal */}
      <ExportModal
        chord={currentChord}
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
      />
    </div>
  );
}
