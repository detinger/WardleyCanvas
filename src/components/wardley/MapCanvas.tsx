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

  return (
    <div
      className="h-full w-full p-4 md:p-8 flex flex-col relative"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedNodeId(null);
        }
      }}
    >
      {/* Value Chain Axis Labels */}
      <div className="absolute top-8 left-2 -translate-y-1/2 -rotate-90 origin-bottom-left text-sm font-medium text-muted-foreground">
        Visible
      </div>
      <div className="absolute bottom-8 left-2 translate-y-1/2 -rotate-90 origin-top-left text-sm font-medium text-muted-foreground">
        Invisible
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full flex flex-col border border-dashed rounded-lg">
        {/* Evolution Axis Header */}
        <div className="flex border-b border-dashed">
          {EvolutionStages.map((stage) => (
            <div
              key={stage}
              className="w-1/4 py-2 text-center text-sm font-semibold text-muted-foreground border-r border-dashed last:border-r-0"
            >
              {stage}
            </div>
          ))}
        </div>
        {/* Drop area */}
        <div ref={combinedRef} className="flex-1 relative w-full h-full">
          {/* Links */}
          <svg
            width="100%"
            height="100%"
            className="absolute pointer-events-none"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="hsl(var(--muted-foreground))"
                />
              </marker>
            </defs>
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
                  markerEnd="url(#arrow)"
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
    </div>
  );
}
