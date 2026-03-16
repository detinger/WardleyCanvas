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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WardleyMap } from '@/lib/types';
import { Trash2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type LoadMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getMaps: () => WardleyMap[];
  loadMap: (map: WardleyMap) => void;
  deleteMap: (id: string) => void;
};

export default function LoadMapDialog({
  open,
  onOpenChange,
  getMaps,
  loadMap,
  deleteMap,
}: LoadMapDialogProps) {
  const [maps, setMaps] = React.useState<WardleyMap[]>([]);
  
  React.useEffect(() => {
    if (open) {
      setMaps(getMaps());
    }
  }, [open, getMaps]);

  const handleDelete = (id: string) => {
    deleteMap(id);
    setMaps(getMaps());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Load a Saved Map</DialogTitle>
          <DialogDescription>
            Select one of your previously saved maps to continue working.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Map Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maps.length > 0 ? (
                  maps.map((map) => (
                    <TableRow key={map.id}>
                      <TableCell className="font-medium">{map.name}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => loadMap(map)}
                          aria-label={`Load ${map.name}`}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${map.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your map
                                "{map.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(map.id!)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No saved maps found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
