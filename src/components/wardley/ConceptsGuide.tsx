'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type ConceptsGuideProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const guideContent = [
  {
    title: 'The Value Chain (Y-Axis)',
    content:
      "The Y-axis represents the value chain, ordered from top to bottom. Components at the top are more visible to the user and closer to their needs (e.g., a website's user interface). Components at the bottom are less visible and represent underlying infrastructure or services (e.g., power, compute resources). Mapping your components along this axis helps you understand dependencies and see the flow of value.",
  },
  {
    title: 'Evolution (X-Axis)',
    content:
      "The X-axis shows the stage of evolution for a component, moving from left to right. This isn't about time, but about maturity, ubiquity, and certainty. The four stages are:",
    subItems: [
      {
        title: 'I. Genesis',
        content:
          'This is the realm of the new and unknown. Components here are rare, experimental, and poorly understood. They represent high potential but also high risk.',
      },
      {
        title: 'II. Custom-built',
        content:
          'As an idea proves its worth, we create custom solutions. These are tailored to a specific problem, require specialized knowledge, and are a source of differentiation.',
      },
      {
        title: 'III. Product (+Rental)',
        content:
          'With increasing demand and understanding, components become products or services we can buy or rent. They are more stable, better understood, and offer a balance of features and reliability.',
      },
      {
        title: 'IV. Commodity (+Utility)',
        content:
          'The final stage. Components are now standardized, ubiquitous, and treated as a utility. They are highly stable, well-defined, and competition is based on volume and price (e.g., electricity, basic cloud computing).',
      },
    ],
  },
  {
    title: 'Components & Links',
    content:
      'Everything on a Wardley Map is a component. This could be a practice, data, knowledge, or an activity. Lines (or links) between components show dependency. A line from component A to component B means that A needs B to function. These dependencies are crucial for understanding your system.',
  },
  {
    title: 'Strategic Gameplay',
    content:
      'Once you have a map, you can apply strategic thinking. You can identify which components to build in-house (Genesis/Custom), which to buy (Product), and which to source as a utility (Commodity). This allows you to focus your resources effectively, outsource what is not core to your business, and anticipate market changes.',
  },
];

export default function ConceptsGuide({
  open,
  onOpenChange,
}: ConceptsGuideProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle className="font-headline">Wardley Concepts Guide</SheetTitle>
          <SheetDescription>
            A primer on the core principles of Wardley Mapping.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-4rem)] pr-4 mt-4">
          <Accordion type="single" collapsible defaultValue="item-0">
            {guideContent.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{item.title}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.content}</p>
                  {item.subItems && (
                     <Accordion type="single" collapsible className="mt-4 ml-4 border-l pl-4">
                      {item.subItems.map((subItem, subIndex) => (
                        <AccordionItem value={`subitem-${index}-${subIndex}`} key={subIndex}>
                          <AccordionTrigger className="text-sm">{subItem.title}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {subItem.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
