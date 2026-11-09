import { Crumb } from "@/api/models/crumb";
import { Media } from "@/api/models/media";

export type OriginRect = { x: number; y: number; width: number; height: number };

export type StackItem = {
  key: string;
  index: number;
  crumb: Crumb;
  media: Media;
};

export type VisibleCard = {
  item: StackItem;
  depth: number;
  exiting: boolean;
};