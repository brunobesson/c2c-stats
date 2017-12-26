import { Area } from './area';

export type Activity = 'skitouring' | 'snow_ice_mixed' | 'mountain_climbing' | 'rock_climbing' | 'ice_climbing' |
  'hiking' | 'snowshoeing' | 'paragliding' | 'mountain_biking' | 'via_ferrata' | 'slacklining';

export class Outing {
  document_id: number;

  activities: Activity[];

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
