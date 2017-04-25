import { Area } from './area';

export class Outing {
  activities: string[];
  date_start: string;
  date_end: string;
  document_id: number;
  height_diff_up: number;
  areas: Area[];
}
