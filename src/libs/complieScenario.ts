import type { LoopState } from '@/types/enhancedEventLoop';
import { enqueueSync, enqueueMacro, enqueueMicro, enqueueRender } from '@/engine/enhancedEventLoop';

/**
 * Parser đơn giản dựa trên pattern (regex). Không thực thi JS thật.
 * Hỗ trợ:
 * - console.log('X')
 * - setTimeout(..., 0)
 * - Promise.resolve().then(...)
 * - queueMicrotask(...)
 * - requestAnimationFrame(...)
 */
export function compileScenario(code: string, base: LoopState): LoopState {
  const s: LoopState = {
    ...base,
    callStack: [],
    syncQueue: [],
    microtasks: [],
    macrotasks: [],
    renderQueue: [],
    logs: [...base.logs],
    wasIdle: false,
    lastRunId: undefined,
  };

  const lines = code.split('\n');

  // Regex thô (bạn có thể mở rộng)
  const logRe = /console\.log\((['"`])(.*?)\1\)/;
  const setTimeout0Re = /setTimeout\s*\(\s*\(\s*=>|function\s*\(\)\s*|\/\*.*\*\/\s*\)\s*=>.*\)\s*,\s*0\s*\)/;
  const promiseThenRe = /Promise\.resolve\(\s*\)\.then\s*\(/;
  const queueMicroRe = /queueMicrotask\s*\(/;
  const rafRe = /requestAnimationFrame\s*\(/;

  // Rất đơn giản: tìm console.log trong từng nhóm
  // - Nếu nằm trong then(...) => micro
  // - Nếu nằm trong setTimeout(...,0) => macro
  // - Nếu nằm trong queueMicrotask => micro
  // - Nếu nằm trong requestAnimationFrame => render
  // - Còn lại => sync

  // Cách làm: duyệt tất cả, phân loại theo ngữ cảnh gợi ý qua dòng
  let currentContext: 'sync' | 'macro' | 'micro' | 'render' = 'sync';

  lines.forEach((raw) => {
    const line = raw.trim();

    if (!line) return;

    // context hints (cực kỳ đơn giản – bạn có thể thay bằng parser AST sau)
    if (line.includes('setTimeout') && /,\s*0\s*\)/.test(line)) {
      currentContext = 'macro';
    } else if (promiseThenRe.test(line)) {
      currentContext = 'micro';
    } else if (queueMicroRe.test(line)) {
      currentContext = 'micro';
    } else if (rafRe.test(line)) {
      currentContext = 'render';
    }

    const logMatch = line.match(logRe);
    if (logMatch) {
      const label = `console.log("${logMatch[2]}")`;

      if (currentContext === 'micro') {
        enqueueMicro(s, label, () => {});
      } else if (currentContext === 'macro') {
        enqueueMacro(s, label, () => {});
      } else if (currentContext === 'render') {
        enqueueRender(s, label, () => {});
      } else {
        enqueueSync(s, label, () => {});
      }
    }

    // Reset context heuristics khi thấy đóng block (thô)
    if (line.includes('});') || line.includes('})') || line.includes(');')) {
      currentContext = 'sync';
    }
  });

  return s;
}
