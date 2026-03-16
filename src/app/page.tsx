'use client';

import * as React from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { WardleyMap, MapNode } from '@/lib/types';
import Header from '@/components/wardley/Header';
import MapCanvas from '@/components/wardley/MapCanvas';
import ConceptsGuide from '@/components/wardley/ConceptsGuide';
import TemplatesGallery from '@/components/wardley/TemplatesGallery';
import SaveMapDialog from '@/components/wardley/SaveMapDialog';
import LoadMapDialog from '@/components/wardley/LoadMapDialog';
import { useWardleyMaps } from '@/hooks/use-wardley-maps';
import { templates } from '@/lib/templates';
import { useToast } from '@/hooks/use-toast';

const initialMap: WardleyMap = templates[0];

export default function WardleyCanvasPage() {
  const [map, setMap] = React.useState<WardleyMap>(initialMap);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null
  );
  const [isGuideOpen, setGuideOpen] = React.useState(false);
  const [isTemplatesOpen, setTemplatesOpen] = React.useState(false);
  const [isSaveOpen, setSaveOpen] = React.useState(false);
  const [isLoadOpen, setLoadOpen] = React.useState(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const { saveMap, loadMap, getSavedMaps, deleteMap } = useWardleyMaps();
  const { toast } = useToast();

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const nodeId = active.id as string;

      setMap((prevMap) => {
        const node = prevMap.nodes.find((n) => n.id === nodeId);
        if (!node || !canvasRef.current) return prevMap;

        const canvasRect = canvasRef.current.getBoundingClientRect();

        const currentXPixels = (node.x / 100) * canvasRect.width;
        const currentYPixels = (node.y / 100) * canvasRect.height;

        const newXPixels = currentXPixels + delta.x;
        const newYPixels = currentYPixels + delta.y;

        const newXPercent = (newXPixels / canvasRect.width) * 100;
        const newYPercent = (newYPixels / canvasRect.height) * 100;

        const newNodes = prevMap.nodes.map((n) => {
          if (n.id === nodeId) {
            let stage: MapNode['stage'] = 'genesis';
            if (newXPercent > 75) stage = 'commodity';
            else if (newXPercent > 50) stage = 'product';
            else if (newXPercent > 25) stage = 'custom';
            return { ...n, x: newXPercent, y: newYPercent, stage };
          }
          return n;
        });
        return { ...prevMap, nodes: newNodes };
      });
    },
    []
  );

  const handleSelectTemplate = (template: WardleyMap) => {
    setMap(template);
    setTemplatesOpen(false);
    toast({
      title: 'Template Loaded',
      description: `The "${template.name}" map is now ready to use.`,
    });
  };
  
  const handleSaveMap = (name: string) => {
    saveMap({ ...map, name });
    setSaveOpen(false);
    toast({
      title: 'Map Saved',
      description: `Your map "${name}" has been saved successfully.`,
    });
  };
  
  const handleLoadMap = (mapData: WardleyMap) => {
    setMap(mapData);
    setLoadOpen(false);
     toast({
      title: 'Map Loaded',
      description: `Your map "${mapData.name}" has been loaded.`,
    });
  }

  const handleNewMap = () => {
    setMap({
      name: 'New Map',
      nodes: [],
      links: [],
    });
    toast({
      title: 'New Map Created',
      description: 'Your new canvas is ready.',
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen w-screen flex-col bg-background font-body">
        <Header
          onNewMap={handleNewMap}
          onSave={() => setSaveOpen(true)}
          onLoad={() => setLoadOpen(true)}
          onShowGuide={() => setGuideOpen(true)}
          onShowTemplates={() => setTemplatesOpen(true)}
        />
        <main className="flex-1 overflow-hidden">
          <MapCanvas
            map={map}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            canvasRef={canvasRef}
          />
        </main>
        
        <ConceptsGuide open={isGuideOpen} onOpenChange={setGuideOpen} />
        <TemplatesGallery
          open={isTemplatesOpen}
          onOpenChange={setTemplatesOpen}
          onSelectTemplate={handleSelectTemplate}
        />
        <SaveMapDialog
          open={isSaveOpen}
          onOpenChange={setSaveOpen}
          onSave={handleSaveMap}
          currentName={map.name}
        />
        <LoadMapDialog
          open={isLoadOpen}
          onOpenChange={setLoadOpen}
          getMaps={getSavedMaps}
          loadMap={handleLoadMap}
          deleteMap={deleteMap}
        />
      </div>
    </DndContext>
  );
}
