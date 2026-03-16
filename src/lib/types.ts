export type MapNode = {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  stage: 'genesis' | 'custom' | 'product' | 'commodity';
};

export type MapLink = {
  from: string; // nodeId
  to: string; // nodeId
};

export type WardleyMap = {
  id?: string;
  name: string;
  nodes: MapNode[];
  links: MapLink[];
};
