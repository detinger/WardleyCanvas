'use client';

import { useDrag } from 'react-dnd';
import { MapNode } from '@/lib/types';
import { cn } from '@/lib/utils';

type MapNodeProps = {
  node: MapNode;
  isSelected: boolean;
  onClick: () => void;
};

export default function MapNodeComponent({ node, isSelected, onClick }: MapNodeProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node',
    item: { id: node.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const style = {
    left: `${node.x}%`,
    top: `${node.y}%`,
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div
      ref={drag}
      style={style}
      className={cn(
        'absolute cursor-grab p-2 rounded-md shadow-lg bg-card border-2 transition-colors duration-200 ease-in-out',
        'w-32 h-12 flex items-center justify-center text-center',
        isSelected ? 'border-primary shadow-primary/30' : 'border-border',
        isDragging ? 'opacity-50 cursor-grabbing' : 'opacity-100'
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
