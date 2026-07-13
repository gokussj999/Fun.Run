export function resolveWorkerLeaderElection(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env['WORKER_LEADER_ELECTION'] !== 'false';
}
