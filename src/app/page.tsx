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
import EditorSidebar from '@/components/wardley/EditorSidebar';

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
      const { active, over } = event;

      // Handle dropping a new node from the toolbox
      if (active.data.current?.type === 'new-node') {
        if (over && over.id === 'map-canvas-drop-area' && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          if (!active.rect.current.translated) return;

          const dropX =
            active.rect.current.translated.left -
            canvasRect.left +
            active.rect.current.width / 2;
          const dropY =
            active.rect.current.translated.top -
            canvasRect.top +
            active.rect.current.height / 2;

          const xPercent = Math.max(
            0,
            Math.min(100, (dropX / canvasRect.width) * 100)
          );
          const yPercent = Math.max(
            0,
            Math.min(100, (dropY / canvasRect.height) * 100)
          );

          let stage: MapNode['stage'] = 'genesis';
          if (xPercent > 75) stage = 'commodity';
          else if (xPercent > 50) stage = 'product';
          else if (xPercent > 25) stage = 'custom';

          const newNodeName = `Component ${map.nodes.length + 1}`;
          const newNode: MapNode = {
            id: `node_${Date.now()}`,
            name: newNodeName,
            x: xPercent,
            y: yPercent,
            stage: stage,
          };

          setMap((prevMap) => ({
            ...prevMap,
            nodes: [...prevMap.nodes, newNode],
          }));
          toast({
            title: 'Component Added',
            description: `"${newNodeName}" was added. Double-click to rename.`,
          });
        }
        return;
      }

      // Handle dragging an existing node
      const nodeId = active.id as string;
      setMap((prevMap) => {
        const node = prevMap.nodes.find((n) => n.id === nodeId);
        if (!node || !canvasRef.current || !active.rect.current.translated) {
          return prevMap;
        }

        const canvasRect = canvasRef.current.getBoundingClientRect();

        const dropX =
          active.rect.current.translated.left -
          canvasRect.left +
          active.rect.current.width / 2;
        const dropY =
          active.rect.current.translated.top -
          canvasRect.top +
          active.rect.current.height / 2;

        const newXPercent = Math.max(
          0,
          Math.min(100, (dropX / canvasRect.width) * 100)
        );
        const newYPercent = Math.max(
          0,
          Math.min(100, (dropY / canvasRect.height) * 100)
        );

        let stage: MapNode['stage'] = 'genesis';
        if (newXPercent > 75) stage = 'commodity';
        else if (newXPercent > 50) stage = 'product';
        else if (newXPercent > 25) stage = 'custom';

        return {
          ...prevMap,
          nodes: prevMap.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, x: newXPercent, y: newYPercent, stage }
              : n
          ),
        };
      });
    },
    [map.nodes, toast]
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
  };

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

  const handleNodeNameChange = (nodeId: string, newName: string) => {
    setMap((prevMap) => ({
      ...prevMap,
      nodes: prevMap.nodes.map((n) =>
        n.id === nodeId ? { ...n, name: newName } : n
      ),
    }));
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
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <MapCanvas
              map={map}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
              canvasRef={canvasRef}
              setMap={setMap}
              onNodeNameChange={handleNodeNameChange}
            />
          </main>
          <EditorSidebar />
        </div>

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
