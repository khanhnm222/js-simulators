import type { LoopState, Task } from '@/types/eventLoop';

export function createInitialState(): LoopState {
  return {
    tick: 0,
    running: false,
    callStack: [],
    microtasks: [],
    macrotasks: [],
    renderQueue: [],
    logs: [],
    wasIdle: false, // ✅ Thêm cờ
  };
}

let idCounter = 0;
const nextId = () => `t${++idCounter}`;

export function makeTask(
  label: string,
  type: Task['type'],
  fn: Task['fn'],
  tick: number,
): Task {
  return { id: nextId(), label, type, fn, createdAtTick: tick };
}

/**
 * Quy tắc tick (đơn giản hóa nhưng đúng tinh thần):
 * 1) Nếu callStack rỗng: chạy toàn bộ microtasks (theo thứ tự FIFO).
 * 2) Lấy 1 macrotask (nếu có) và chạy.
 * 3) Chạy render queue (1 “khung hình”) — tượng trưng cho phase render.
 */
export function step(state: LoopState): LoopState {
  const s: LoopState = {
    ...state,
    callStack: [...state.callStack],
    microtasks: [...state.microtasks],
    macrotasks: [...state.macrotasks],
    renderQueue: [...state.renderQueue],
    logs: [...state.logs],
  };
  s.tick += 1;

  const noTasks =
    s.microtasks.length === 0 &&
    s.macrotasks.length === 0 &&
    s.renderQueue.length === 0;

  // ✅ Chỉ log idle một lần khi vừa chuyển sang trạng thái rảnh
  if (noTasks) {
    if (!s.wasIdle) {
      s.logs.push({ tick: s.tick, action: 'idle' });
      s.wasIdle = true;
    }
    return s;
  }
  s.wasIdle = false;

  // 1) Drain microtasks
  if (s.microtasks.length) {
    s.logs.push({ tick: s.tick, action: 'microtasks:drain' });
    while (s.microtasks.length) {
      const t = s.microtasks.shift()!;
      s.callStack.push(t.label);
      try {
        t.fn();
        s.logs.push({ tick: s.tick, action: 'run', detail: `[micro] ${t.label}` });
      } catch (e) {
        s.logs.push({ tick: s.tick, action: 'error', detail: String(e) });
      } finally {
        s.callStack.pop();
      }
    }
  }

  // 2) One macrotask
  if (s.macrotasks.length) {
    const t = s.macrotasks.shift()!;
    s.callStack.push(t.label);
    try {
      t.fn();
      s.logs.push({ tick: s.tick, action: 'run', detail: `[macro] ${t.label}` });
    } catch (e) {
      s.logs.push({ tick: s.tick, action: 'error', detail: String(e) });
    } finally {
      s.callStack.pop();
    }
  }

  // 3) Render phase (1 frame)
  if (s.renderQueue.length) {
    const t = s.renderQueue.shift()!;
    s.callStack.push(t.label);
    try {
      t.fn();
      s.logs.push({ tick: s.tick, action: 'render', detail: `[render] ${t.label}` });
    } catch (e) {
      s.logs.push({ tick: s.tick, action: 'error', detail: String(e) });
    } finally {
      s.callStack.pop();
    }
  }

  return s;
}

export function enqueueMicro(s: LoopState, label: string, fn: Task['fn']) {
  s.microtasks.push(makeTask(label, 'microtask', fn, s.tick));
}
export function enqueueMacro(s: LoopState, label: string, fn: Task['fn']) {
  s.macrotasks.push(makeTask(label, 'macrotask', fn, s.tick));
}
export function enqueueRender(s: LoopState, label: string, fn: Task['fn']) {
  s.renderQueue.push(makeTask(label, 'render', fn, s.tick));
}
