import { Locale } from './locale';

export class Area {
  document_id: number;
  locales: Locale[];
  area_type: 'range' | 'admin_limits' | 'country';
}
