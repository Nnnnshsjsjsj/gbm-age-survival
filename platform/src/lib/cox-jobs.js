// Shared between the main thread and the worker: fit a list of Cox jobs.
import { coxPH, schoenfeldTest } from '../engine/index.js';

/** @param {Array<{key, X:number[][], times:number[], events:number[], names:string[], schoenfeld?:boolean}>} jobs */
export function fitJobs(jobs) {
  return jobs.map((j) => {
    try {
      const model = coxPH(j.X, j.times, j.events, { names: j.names });
      let sch = null;
      if (j.schoenfeld) {
        try { sch = schoenfeldTest(model, j.X, j.times, j.events); } catch { sch = null; }
      }
      return { key: j.key, model, schoenfeld: sch, n: j.times.length, events: j.events.reduce((a, b) => a + b, 0) };
    } catch (err) {
      return { key: j.key, error: String(err && err.message ? err.message : err) };
    }
  });
}
