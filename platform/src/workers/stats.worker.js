// Web Worker: fits Cox models off the main thread for large cohorts.
import { fitJobs } from '../lib/cox-jobs.js';

self.onmessage = (e) => {
  const { id, jobs } = e.data;
  try {
    self.postMessage({ id, results: fitJobs(jobs) });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
