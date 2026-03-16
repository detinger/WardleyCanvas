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

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      setNodeRef(node);
    },
    [canvasRef, setNodeRef]
  );

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
    // Deselect if clicking the background of the canvas or the axis labels container
    const target = e.target as HTMLElement;
    if (
      target.id === 'map-canvas-container' ||
      target.id === 'y-axis-container' ||
      target.parentElement?.id === 'y-axis-container'
    ) {
      setSelectedNodeId(null);
    }
  };

  return (
    <div
      id="map-canvas-container"
      className="h-full w-full p-4 md:p-8 flex flex-row items-stretch"
      onClick={handleCanvasClick}
    >
      {/* Value Chain Axis Labels */}
      <div id="y-axis-container" className="flex flex-col justify-between items-center w-8 mr-4 text-sm font-medium text-muted-foreground">
        <div>Visible</div>
        <div className="-rotate-90 whitespace-nowrap text-base font-semibold text-foreground tracking-wider">
          Value Chain
        </div>
        <div>Invisible</div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full flex flex-col border border-dashed rounded-lg">
        {/* Drop area */}
        <div ref={combinedRef} className="flex-1 relative w-full h-full">
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
        {/* Evolution Axis Footer */}
        <div className="flex border-t border-dashed">
          {EvolutionStages.map((stage) => (
            <div
              key={stage}
              className="w-1/4 py-2 text-center text-sm font-semibold text-muted-foreground border-r border-dashed last:border-r-0"
            >
              {stage}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}