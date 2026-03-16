'use client';

import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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

  const { saveMap, loadMap, getSavedMaps, deleteMap } = useWardleyMaps();
  const { toast } = useToast();

  const handleUpdateNodePosition = React.useCallback(
    (nodeId: string, x: number, y: number) => {
      setMap((prevMap) => {
        const newNodes = prevMap.nodes.map((node) => {
          if (node.id === nodeId) {
            let stage: MapNode['stage'] = 'genesis';
            if (x > 75) stage = 'commodity';
            else if (x > 50) stage = 'product';
            else if (x > 25) stage = 'custom';
            return { ...node, x, y, stage };
          }
          return node;
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
    <DndProvider backend={HTML5Backend}>
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
            onNodeMove={handleUpdateNodePosition}
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
    </DndProvider>
  );
}
