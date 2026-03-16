'use client';

import { useDraggable } from '@dnd-kit/core';
import { MapNode } from '@/lib/types';
import { cn } from '@/lib/utils';

type MapNodeProps = {
  node: MapNode;
  isSelected: boolean;
  onClick: () => void;
};

export default function MapNodeComponent({ node, isSelected, onClick }: MapNodeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
  });

  const style = {
    left: `${node.x}%`,
    top: `${node.y}%`,
    transform: transform
      ? `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px))`
      : 'translate(-50%, -50%)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute cursor-grab p-2 rounded-md shadow-lg bg-card border-2 transition-colors duration-200 ease-in-out',
        'w-32 h-12 flex items-center justify-center text-center',
        isSelected ? 'border-primary shadow-primary/30' : 'border-border',
        isDragging ? 'opacity-50 cursor-grabbing z-10' : 'opacity-100'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-sm font-medium text-card-foreground truncate">
        {node.name}
      </span>
    </div>
  );
}
