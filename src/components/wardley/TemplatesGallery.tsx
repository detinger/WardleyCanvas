'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { templates } from '@/lib/templates';
import type { WardleyMap } from '@/lib/types';

type TemplatesGalleryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: WardleyMap) => void;
};

export default function TemplatesGallery({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplatesGalleryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Map Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built template as a starting point for your own analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {templates.map((template, index) => (
            <Card
              key={index}
              className="flex flex-col justify-between hover:border-primary transition-colors"
            >
              <CardHeader>
                <CardTitle className="font-headline text-lg">{template.name}</CardTitle>
                <CardDescription>
                  {template.nodes.length} components, {template.links.length} dependencies
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => onSelectTemplate(template)}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
