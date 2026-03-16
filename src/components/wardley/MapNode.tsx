'use client';

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MapNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type MapNodeProps = {
  node: MapNode;
  isSelected: boolean;
  onClick: () => void;
  onNameChange: (newName: string) => void;
};

export default function MapNodeComponent({
  node,
  isSelected,
  onClick,
  onNameChange,
}: MapNodeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: node.id,
    });

  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(node.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(node.name);
  }, [node.name]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (name.trim() === '') {
      setName(node.name); // revert if empty
    } else {
      onNameChange(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setName(node.name);
      setIsEditing(false);
    }
  };

  const style = {
    left: `${node.x}%`,
    top: `${node.y}%`,
    transform: transform
      ? `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px))`
      : 'translate(-50%, -50%)',
    zIndex: isDragging || isSelected || isEditing ? 10 : 1,
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
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-8 text-center text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm font-medium text-card-foreground truncate p-1">
          {node.name}
        </span>
      )}
    </div>
  );
}
