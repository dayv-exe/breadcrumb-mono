import { Crumb } from "@/api/models/crumb";
import { crumbMedia } from "@/api/models/crumbMedia";

export type OriginRect = { x: number; y: number; width: number; height: number };

export type StackItem = {
  key: string;
  index: number;
  crumb: Crumb;
  media: crumbMedia;
};

export type VisibleCard = {
  item: StackItem;
  depth: number;
  exiting: boolean;
};