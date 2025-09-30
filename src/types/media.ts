import { MediaRecord } from '@/lib/media-store';

export type ResolvedMediaItem = {
  id: string;
  src: string;
  record: MediaRecord;
};
