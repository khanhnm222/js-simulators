import type { LoopState, Task } from '@/types/enhancedEventLoop';

export function createInitialState(): LoopState {
  return {
    tick: 0,
    running: false,
    callStack: [],
    syncQueue: [],
    microtasks: [],
    macrotasks: [],
    renderQueue: [],
    logs: [],
    wasIdle: false,
    lastRunId: undefined
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

export function step(state: LoopState): LoopState {
  const s: LoopState = {
    ...state,
    callStack: [...state.callStack],
    syncQueue: [...state.syncQueue],
    microtasks: [...state.microtasks],
    macrotasks: [...state.macrotasks],
    renderQueue: [...state.renderQueue],
    logs: [...state.logs],
  };
  s.tick += 1;
  s.lastRunId = undefined;

  const noTasks =
    s.syncQueue.length === 0 &&
    s.microtasks.length === 0 &&
    s.macrotasks.length === 0 &&
    s.renderQueue.length === 0;

  // Chỉ log idle 1 lần khi vừa rảnh
  if (noTasks) {
    if (!s.wasIdle) {
      s.logs.push({ tick: s.tick, action: 'idle' });
      s.wasIdle = true;
    }
    return s;
  }
  s.wasIdle = false;

  // 0) Drain all syncQueue (simulate the script run synchronus first)
  if (s.syncQueue.length) {
    s.logs.push({ tick: s.tick, action: 'script:drain' });
    while (s.syncQueue.length) {
      const t = s.syncQueue.shift()!;
      s.callStack.push(t.label);
      try {
        t.fn();
        s.lastRunId = t.id;
        s.logs.push({ tick: s.tick, action: 'run', detail: `[sync] ${t.label}` });
      } catch (e) {
        s.logs.push({ tick: s.tick, action: 'error', detail: String(e) });
      } finally {
        s.callStack.pop();
      }
    }
  }

  // 1) Drain microtasks
  if (s.microtasks.length) {
    s.logs.push({ tick: s.tick, action: 'microtasks:drain' });
    while (s.microtasks.length) {
      const t = s.microtasks.shift()!;
      s.callStack.push(t.label);
      try {
        t.fn();
        s.lastRunId = t.id;
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
      s.lastRunId = t.id;
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
      s.lastRunId = t.id;
      s.logs.push({ tick: s.tick, action: 'render', detail: `[render] ${t.label}` });
    } catch (e) {
      s.logs.push({ tick: s.tick, action: 'error', detail: String(e) });
    } finally {
      s.callStack.pop();
    }
  }

  return s;
}

// Helpers enqueue
export function enqueueSync(s: LoopState, label: string, fn: Task['fn']) {
  s.syncQueue.push(makeTask(label, 'sync', fn, s.tick));
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
