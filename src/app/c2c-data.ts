import { Outing } from './outing';
import { Status } from './status';

export class C2cData {
  user_id: number;
  status: Status;
  outings: Outing[];
  total?: number;
}
