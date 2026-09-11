const KEY = 'dead-signal-profile-v1';
export function readProfile(storage) {
  try {
    const data = JSON.parse((storage || globalThis.localStorage).getItem(KEY));
    if (data?.version !== 1 || !Array.isArray(data.runs))
      return { version: 1, runs: [] };
    return {
      version: 1,
      runs: data.runs
        .filter(
          (r) =>
            r &&
            typeof r.id === 'string' &&
            typeof r.agent === 'string' &&
            typeof r.date === 'string' &&
            Number.isFinite(r.score) &&
            r.score >= 0 &&
            Number.isFinite(r.wave) &&
            Number.isFinite(r.kills) &&
            Number.isFinite(r.seconds),
        )
        .slice(0, 20),
    };
  } catch {
    return { version: 1, runs: [] };
  }
}
export const localRanking = {
  list() {
    return [...readProfile().runs].sort((a, b) => b.score - a.score);
  },
  submit(run) {
    const profile = readProfile();
    const entry = {
      id: crypto.randomUUID(),
      agent: run.agent.call,
      score: run.score,
      wave: run.wave,
      kills: run.kills,
      seconds: Math.floor(run.seconds),
      won: run.phase === 'won',
      date: new Date().toISOString(),
    };
    profile.runs = [entry, ...profile.runs].slice(0, 20);
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
      return true;
    } catch {
      return false;
    }
  },
};
