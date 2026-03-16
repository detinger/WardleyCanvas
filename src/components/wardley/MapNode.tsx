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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        'absolute flex flex-col items-center group cursor-grab',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      onClick={(e) => {
        if (isEditing) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <div
        className={cn(
          'w-4 h-4 rounded-full shadow-md',
          isSelected
            ? 'bg-primary ring-2 ring-offset-2 ring-primary ring-offset-background'
            : 'bg-muted-foreground'
        )}
      />

      {isEditing ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-32 h-7 mt-2 text-center text-sm cursor-text"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="mt-2 px-2 py-0.5 rounded-md text-center text-sm font-medium text-card-foreground bg-background/70 backdrop-blur-sm shadow-sm whitespace-nowrap"
          onDoubleClick={handleDoubleClick}
        >
          {node.name}
        </div>
      )}
    </div>
  );
}
