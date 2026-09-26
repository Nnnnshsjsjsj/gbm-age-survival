// Small dense linear-algebra helpers (internal to the engine).

export function zeros(n) {
  return new Array(n).fill(0);
}

export function zerosMatrix(n, m = n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = new Array(m).fill(0);
  return out;
}

/** Solve A x = b for symmetric positive-definite A via Cholesky. Returns null if not PD. */
export function choleskySolve(A, b) {
  const n = A.length;
  const L = zerosMatrix(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = A[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(sum > 0)) return null;
        L[i][i] = Math.sqrt(sum);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  const y = zeros(n);
  for (let i = 0; i < n; i++) {
    let sum = b[i];
    for (let k = 0; k < i; k++) sum -= L[i][k] * y[k];
    y[i] = sum / L[i][i];
  }
  const x = zeros(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i];
    for (let k = i + 1; k < n; k++) sum -= L[k][i] * x[k];
    x[i] = sum / L[i][i];
  }
  return x;
}

/** Matrix inverse by Gauss–Jordan elimination with partial pivoting. Throws if singular. */
export function inverse(A) {
  const n = A.length;
  const M = A.map((row, i) => {
    const r = row.slice();
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-300) throw new Error('Matrix is singular');
    if (piv !== col) [M[piv], M[col]] = [M[col], M[piv]];
    const p = M[col][col];
    for (let j = 0; j < 2 * n; j++) M[col][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row.slice(n));
}

/** Solve A x = b (general square A) via Gauss–Jordan. */
export function solve(A, b) {
  const inv = inverse(A);
  return matVec(inv, b);
}

export function matVec(A, v) {
  const n = A.length;
  const out = zeros(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const row = A[i];
    for (let j = 0; j < row.length; j++) s += row[j] * v[j];
    out[i] = s;
  }
  return out;
}

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
