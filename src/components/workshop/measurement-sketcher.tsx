'use client';

import { Download, Eraser, Loader2, Pencil, RotateCcw, Save, Scissors } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MeasurementSketcherProps {
  id: string; // ClientMeasurement ID
  initialSketch?: string;
  onSave?: (dataUrl: string) => Promise<void>;
  onSaveSuccess?: () => void;
}

export function MeasurementSketcher({
  id,
  initialSketch,
  onSave,
  onSaveSuccess,
}: MeasurementSketcherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, _setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load initial sketch if exists
    if (initialSketch) {
      const img = new Image();
      img.src = initialSketch;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }

    // Set context defaults
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [initialSketch]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toast.info('Canvas cleared');
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    const dataUrl = canvas.toDataURL('image/png');

    try {
      if (onSave) {
        await onSave(dataUrl);
      } else {
        // Default save behavior if no onSave provided
        const res = await fetch(`/api/measurements/${id}/sketch`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sketch: dataUrl }),
        });
        if (!res.ok) throw new Error('Failed to save sketch');
        if (onSaveSuccess) onSaveSuccess();
        toast.success('Sketch saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save sketch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border rounded-lg">
        <div className="flex gap-1">
          <Button
            variant={tool === 'pencil' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('pencil')}
          >
            <Pencil className="h-4 w-4 mr-2" /> Pencil
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('eraser')}
          >
            <Eraser className="h-4 w-4 mr-2" /> Eraser
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded border-none cursor-pointer"
          />
          <div className="h-4 w-px bg-slate-200" />
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a');
              link.download = `sketch-${id}.png`;
              link.href = canvasRef.current?.toDataURL() || '';
              link.click();
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Sketch
          </Button>
        </div>
      </div>

      <div className="relative aspect-[4/3] bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!initialSketch && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <Scissors className="h-24 w-24 text-slate-300" />
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Use this canvas to sketch style details or annotate specific measurement notes.
      </p>
    </div>
  );
}
