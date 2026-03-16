'use client';

import { useDraggable } from '@dnd-kit/core';
import { PlusSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function DraggableComponent() {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: 'new-node-dnd-item',
    data: { type: 'new-node' },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="p-2">
      <div className="flex flex-col items-center gap-2 p-4 border border-dashed rounded-lg cursor-grab hover:bg-accent hover:border-primary transition-colors">
        <PlusSquare className="w-8 h-8 text-muted-foreground" />
        <span className="text-sm font-medium text-center text-muted-foreground">
          New Component
        </span>
      </div>
    </div>
  );
}

export default function EditorSidebar() {
  return (
    <div className="flex flex-col w-56 border-l bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight font-headline">
          Toolbox
        </h2>
        <p className="text-sm text-muted-foreground">Drag components to the map.</p>
      </div>
      <div className="flex-1 p-2">
        <DraggableComponent />
        <Separator className="my-4" />
        <div className="p-4 space-y-2 text-xs text-muted-foreground">
          <h3 className="font-semibold text-foreground">How to use:</h3>
          <p>
            <strong>Add:</strong> Drag a component from the toolbox onto the canvas.
          </p>
          <p>
            <strong>Connect:</strong> Click a component to select it, then click another to create a link.
          </p>
          <p>
            <strong>Rename:</strong> Double-click any component to change its name.
          </p>
        </div>
      </div>
    </div>
  );
}
