'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { WardleyMap, MapLink } from '@/lib/types';
import MapNodeComponent from './MapNode';

type MapCanvasProps = {
  map: WardleyMap;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  setMap: React.Dispatch<React.SetStateAction<WardleyMap>>;
  onNodeNameChange: (nodeId: string, newName: string) => void;
};

const EvolutionStages = ['Genesis', 'Custom-Built', 'Product', 'Commodity'];

export default function MapCanvas({
  map,
  selectedNodeId,
  setSelectedNodeId,
  canvasRef,
  setMap,
  onNodeNameChange,
}: MapCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'map-canvas-drop-area',
  });

  // This state will trigger re-renders on resize to update SVG links
  const [, setTick] = React.useState(0);

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      setNodeRef(node);
    },
    [canvasRef, setNodeRef]
  );
  
  React.useEffect(() => {
    // We need to know when the canvas resizes to redraw SVG links.
    if (!canvasRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      // Force a re-render
      setTick(t => t + 1);
    });

    resizeObserver.observe(canvasRef.current);

    // Cleanup observer on unmount
    return () => {
      if (canvasRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, [canvasRef]);

  const getNodePosition = (nodeId: string) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const node = map.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const canvasRect = canvasRef.current.getBoundingClientRect();
    return {
      x: (node.x / 100) * canvasRect.width,
      y: (node.y / 100) * canvasRect.height,
    };
  };

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId && selectedNodeId !== nodeId) {
      const newLink: MapLink = { from: selectedNodeId, to: nodeId };

      const linkExists = map.links.some(
        (link) =>
          (link.from === newLink.from && link.to === newLink.to) ||
          (link.from === newLink.to && link.to === newLink.from)
      );

      if (!linkExists) {
        setMap((prevMap) => ({
          ...prevMap,
          links: [...prevMap.links, newLink],
        }));
      }
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking the background of the canvas
    const target = e.target as HTMLElement;
    if (target.id === 'map-canvas-container' || target.id === 'map-canvas-drop-area' || target.classList.contains('map-background')) {
      setSelectedNodeId(null);
    }
  };

  return (
    <div
      id="map-canvas-container"
      className="h-full w-full p-4 md:p-8 flex flex-col"
      onClick={handleCanvasClick}
    >
        <div className="flex-1 flex flex-row items-stretch">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between items-center w-12 text-sm font-medium text-muted-foreground mr-2">
                <div className="-rotate-90 whitespace-nowrap">Visible</div>
                <div className="flex items-center justify-center flex-1">
                <span className="-rotate-90 whitespace-nowrap text-base font-semibold text-foreground tracking-wider">
                    Value Chain
                </span>
                </div>
                <div className="-rotate-90 whitespace-nowrap">Invisible</div>
            </div>

            {/* Drop area */}
            <div ref={combinedRef} id="map-canvas-drop-area" className="flex-1 relative w-full h-full map-background">
                {/* Vertical Evolution Lines */}
                <div className="absolute top-0 bottom-0 left-1/4 w-0 border-l border-dashed border-border"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-0 border-l border-dashed border-border"></div>
                <div className="absolute top-0 bottom-0 left-3/4 w-0 border-l border-dashed border-border"></div>

                {/* Solid Axis Lines */}
                <div className="absolute top-0 bottom-0 left-0 w-0 border-l border-foreground"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0 border-b border-foreground"></div>

                {/* Links */}
                <svg
                    width="100%"
                    height="100%"
                    className="absolute pointer-events-none"
                >
                    {map.links.map((link, index) => {
                    const fromPos = getNodePosition(link.from);
                    const toPos = getNodePosition(link.to);
                    return (
                        <line
                        key={index}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="2"
                        />
                    );
                    })}
                </svg>

                {/* Nodes */}
                {map.nodes.map((node) => (
                    <MapNodeComponent
                    key={node.id}
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    onClick={() => handleNodeClick(node.id)}
                    onNameChange={(newName) => onNodeNameChange(node.id, newName)}
                    />
                ))}
            </div>
        </div>

        {/* Evolution Axis Footer */}
        <div className="flex pt-2 pl-14">
            {EvolutionStages.map((stage) => (
            <div
                key={stage}
                className="w-1/4 text-center text-sm font-semibold text-muted-foreground"
            >
                {stage}
            </div>
            ))}
        </div>
    </div>
  );
}
