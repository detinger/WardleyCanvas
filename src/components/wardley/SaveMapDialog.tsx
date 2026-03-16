'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SaveMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  currentName?: string;
};

export default function SaveMapDialog({
  open,
  onOpenChange,
  onSave,
  currentName,
}: SaveMapDialogProps) {
  const [mapName, setMapName] = React.useState(currentName || '');

  React.useEffect(() => {
    if (open) {
      setMapName(currentName || 'My Wardley Map');
    }
  }, [open, currentName]);

  const handleSave = () => {
    if (mapName.trim()) {
      onSave(mapName.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Save Your Map</DialogTitle>
          <DialogDescription>
            Give your map a name to save it for later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="map-name" className="text-right">
              Name
            </Label>
            <Input
              id="map-name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!mapName.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
