import { adminContract } from './routers/admin';
import { authContract } from './routers/auth';
import { contentContract } from './routers/content';
import { evaluationsContract } from './routers/evaluations';
import { healthContract } from './routers/health';
import { organizationsContract } from './routers/organizations';
import { programsContract } from './routers/programs';
import { usersContract } from './routers/users';
import { commonResponses } from './shared';

export type ApiContract = {
  health: typeof healthContract;
  auth: typeof authContract;
  users: typeof usersContract;
  admin: typeof adminContract;
  evaluations: typeof evaluationsContract;
  content: typeof contentContract;
  organizations: typeof organizationsContract;
  programs: typeof programsContract;
};

const apiRouters: ApiContract = {
  health: healthContract,
  auth: authContract,
  users: usersContract,
  admin: adminContract,
  evaluations: evaluationsContract,
  content: contentContract,
  organizations: organizationsContract,
  programs: programsContract
};
void commonResponses;

export const apiContract: ApiContract = apiRouters;
