import { ChordDefinition } from '../types/chord';

/**
 * Downloads a string content as a file with specified filename and mime type
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports SVG element to PNG download
 */
export function exportSvgToPng(svgElement: SVGElement, filename: string = 'chord.png'): void {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = svgElement.clientWidth * 2 || 600;
    canvas.height = svgElement.clientHeight * 2 || 800;
    if (ctx) {
      ctx.fillStyle = '#121218'; // Background fill
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

/**
 * Generates a clean React TSX snippet for rendering this chord definition with ChordDiagram component
 */
export function generateReactCodeSnippet(chord: ChordDefinition): string {
  return `import { ChordDiagram } from '@/components/chord/ChordDiagram';

export const My${chord.name.replace(/[^a-zA-Z0-9]/g, '')}Chord = () => {
  const chordData = ${JSON.stringify(chord, null, 2)};

  return (
    <ChordDiagram 
      chord={chordData}
      options={{
        theme: "sleek-dark",
        showFingerNumbers: true,
        showNoteNames: false,
        size: "md"
      }}
    />
  );
};`;
}
