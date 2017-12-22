import { Area } from './area';

export class Outing {
  document_id: number;

  activities: string[];

  date_start: string;
  date_end: string;

  areas: Area[];
  height_diff_up: number;

  ski_rating: string;
  labande_global_rating: string;
  hiking_rating: string;
  ice_rating: string;
  snowshoe_rating: string;
  mtb_up_rating: string;
  mtb_down_rating: string;
  global_rating: string;
  rock_free_rating: string;
  via_ferrata_rating: string;
}
