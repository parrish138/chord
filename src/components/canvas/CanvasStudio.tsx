import React, { useState } from 'react';
import { CanvasWidgetConfig, CanvasWidgetId } from '../../types/canvas';
import { GuitarNeckScaleStudio } from '../scale/GuitarNeckScaleStudio';
import { ScalePresetsSelector } from '../scale/ScalePresetsSelector';
import { UnifiedGuitarSequencer } from './UnifiedGuitarSequencer';
import { TabEditor } from '../tab/TabEditor';
import { AudioToneWidget } from '../audio/AudioToneWidget';
import { AudioStrummer } from '../chord/AudioStrummer';
import { ChordLibrary, PRESET_CHORDS } from '../chord/ChordLibrary';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Layers, ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid, Sparkles, Sliders, Timer, Volume2, Disc, Music, MoveUp, MoveDown, FileText } from 'lucide-react';

const INITIAL_WIDGET_CONFIGS: CanvasWidgetConfig[] = [
  {
    id: 'scale-presets',
    name: 'Scale Presets Selector',
    category: 'neck',
    iconName: 'Music',
    description: 'Select from 16 Diatonic, Non-Diatonic & Exotic scale formulas',
    isEnabled: true,
    isExpanded: true,
    order: 1,
  },
  {
    id: 'neck-diagram',
    name: '24-Fret Neck Diagram',
    category: 'neck',
    iconName: 'Layers',
    description: 'Interactive 24-fret guitar fretboard note map',
    isEnabled: true,
    isExpanded: true,
    order: 2,
  },
  {
    id: 'guitar-sequencer',
    name: 'Unified Guitar Sequencer',
    category: 'rhythm',
    iconName: 'Sparkles',
    description: 'Main master timeline sequence player for chords and notes',
    isEnabled: true,
    isExpanded: true,
    order: 3,
  },
  {
    id: 'tablature',
    name: 'Notation & TAB Score Studio',
    category: 'chords',
    iconName: 'FileText',
    description: 'Dual 5-line musical notation staff + 6-line guitar TAB editor',
    isEnabled: true,
    isExpanded: true,
    order: 4,
  },
  {
    id: 'metronome',
    name: 'Precision Metronome',
    category: 'rhythm',
    iconName: 'Timer',
    description: 'WebAudio lookahead clock, Tap Tempo & beat LED indicators',
    isEnabled: true,
    isExpanded: true,
    order: 5,
  },
  {
    id: 'tone-engine',
    name: 'Tone Engine & FX',
    category: 'audio',
    iconName: 'Volume2',
    description: 'Instrument presets, sustain, room reverb & brightness cutoff',
    isEnabled: true,
    isExpanded: true,
    order: 6,
  },
  {
    id: 'drum-machine',
    name: 'Acoustic Drum Kit Machine',
    category: 'rhythm',
    iconName: 'Disc',
    description: '8 synthesized drum kit instruments & 16-step matrix grid',
    isEnabled: true,
    isExpanded: true,
    order: 7,
  },
];

export const CanvasStudio: React.FC = () => {
  const [widgets, setWidgets] = useState<CanvasWidgetConfig[]>(INITIAL_WIDGET_CONFIGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Shared Scale State across Canvas Widgets
  const [rootNote, setRootNote] = useState<string>('C');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('major');
  const [displayMode, setDisplayMode] = useState<'interval' | 'noteName' | 'fingering'>('interval');

  // Toggle widget enabled state
  const handleToggleWidget = (id: CanvasWidgetId) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, isEnabled: !w.isEnabled } : w))
    );
  };

  // Toggle widget accordion expansion state
  const handleToggleExpand = (id: CanvasWidgetId) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, isExpanded: !w.isExpanded } : w))
    );
  };

  // Move widget up/down in vertical order
  const handleMoveWidget = (id: CanvasWidgetId, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(w => w.id === id);
      if (idx < 0) return prev;

      if (direction === 'up' && idx > 0) {
        const tempOrder = sorted[idx].order;
        sorted[idx].order = sorted[idx - 1].order;
        sorted[idx - 1].order = tempOrder;
      } else if (direction === 'down' && idx < sorted.length - 1) {
        const tempOrder = sorted[idx].order;
        sorted[idx].order = sorted[idx + 1].order;
        sorted[idx + 1].order = tempOrder;
      }

      return [...sorted];
    });
  };

  const enabledWidgets = widgets
    .filter(w => w.isEnabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start min-h-[80vh]">
      {/* Left-Hand Widget Manager Sidebar (Far-Left Edge) */}
      <aside className={`transition-all duration-300 shrink-0 ${isSidebarOpen ? 'w-full lg:w-72' : 'w-full lg:w-16'}`}>
        <div className="p-5 rounded-2xl glass-panel border border-border/40 space-y-5 sticky top-20 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className={`flex items-center gap-2 ${!isSidebarOpen && 'lg:hidden'}`}>
              <LayoutGrid className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Widget Manager</h4>
                <p className="text-[10px] text-muted-foreground">Composable Canvas Control</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xs gap-1"
            >
              {isSidebarOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="lg:hidden">{isSidebarOpen ? 'Hide Manager' : 'Show Manager'}</span>
            </Button>
          </div>

          {/* List of Widget Toggles & Vertical Reordering */}
          {isSidebarOpen && (
            <div className="space-y-3 animate-in fade-in-0">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Canvas Components ({enabledWidgets.length} Active):
              </label>

              <div className="space-y-2">
                {widgets.map((widget, idx) => (
                  <div
                    key={`mgr-${widget.id}`}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      widget.isEnabled
                        ? 'border-primary/40 bg-primary/10 text-foreground shadow-sm'
                        : 'border-border/40 bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs truncate">{widget.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={widget.isEnabled}
                          onCheckedChange={() => handleToggleWidget(widget.id)}
                        />
                      </div>
                    </div>

                    {/* Re-order buttons if enabled */}
                    {widget.isEnabled && (
                      <div className="flex items-center justify-between border-t border-border/20 pt-1.5 text-[10px] text-muted-foreground">
                        <span>Order #{widget.order}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveWidget(widget.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                            title="Move Up"
                          >
                            <MoveUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMoveWidget(widget.id, 'down')}
                            disabled={idx === widgets.length - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                            title="Move Down"
                          >
                            <MoveDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleToggleExpand(widget.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground ml-1"
                            title={widget.isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {widget.isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas Workspace Area */}
      <div className="flex-1 space-y-6">
        {enabledWidgets.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-border/40 rounded-2xl glass-panel space-y-3">
            <LayoutGrid className="h-10 w-10 mx-auto text-primary/40" />
            <h4 className="font-extrabold text-lg">Canvas Workspace is Empty</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Enable components in the left-hand Widget Manager menu to build your custom guitar workspace!
            </p>
          </div>
        ) : (
          enabledWidgets.map(widget => (
            <div
              key={`canvas-widget-${widget.id}`}
              className="rounded-2xl glass-panel border border-border/40 shadow-xl overflow-hidden transition-all duration-300"
            >
              {/* Accordion Header */}
              <div className="p-4 bg-muted/30 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-xs font-bold font-mono border-primary/30 text-primary bg-primary/10">
                    {widget.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{widget.description}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleExpand(widget.id)}
                    className="h-8 text-xs gap-1"
                  >
                    {widget.isExpanded ? 'Collapse' : 'Expand'}
                    {widget.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleWidget(widget.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Remove from Canvas"
                  >
                    &times;
                  </Button>
                </div>
              </div>

              {/* Accordion Body Content */}
              {widget.isExpanded && (
                <div className="p-6">
                  {widget.id === 'scale-presets' && (
                    <ScalePresetsSelector
                      rootNote={rootNote}
                      onRootNoteChange={setRootNote}
                      selectedScaleId={selectedScaleId}
                      onSelectedScaleIdChange={setSelectedScaleId}
                      displayMode={displayMode}
                      onDisplayModeChange={setDisplayMode}
                    />
                  )}

                  {widget.id === 'neck-diagram' && (
                    <GuitarNeckScaleStudio
                      rootNote={rootNote}
                      onRootNoteChange={setRootNote}
                      selectedScaleId={selectedScaleId}
                      onSelectedScaleIdChange={setSelectedScaleId}
                      displayMode={displayMode}
                      onDisplayModeChange={setDisplayMode}
                      showPresetSelectorHeader={false}
                    />
                  )}

                  {widget.id === 'guitar-sequencer' && <UnifiedGuitarSequencer />}

                  {widget.id === 'tablature' && <TabEditor />}

                  {widget.id === 'tone-engine' && <AudioStrummer chord={PRESET_CHORDS[0]} />}

                  {widget.id === 'metronome' && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-xs text-muted-foreground">The precision Metronome clock is accessible via the floating bottom-right sidebar widget or global tone panel.</p>
                    </div>
                  )}

                  {widget.id === 'drum-machine' && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-xs text-muted-foreground">The acoustic Drum Machine kit & 16-step matrix grid are loaded in the floating bottom-right sidebar panel.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
