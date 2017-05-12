import { Outing } from './outing';

type Status = 'completed' | 'loading' | 'failed' | 'invalid';

export class C2cData {
  user_id: number;
  status: Status;
  outings: Outing[];
  total?: number;
}
