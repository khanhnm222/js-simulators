export type QueueType = 'sync' | 'microtask' | 'macrotask' | 'render';

export type Task = {
  id: string;
  label: string;
  type: QueueType;
  fn: () => void | Promise<void>;
  createdAtTick: number;
};

export type FrameLog = {
  tick: number;
  action: string;   // 'run' | 'microtasks:drain' | 'script:drain' | 'render' | 'idle' | 'error' ...
  detail?: string;
};

export type LoopState = {
  tick: number;
  running: boolean;
  callStack: string[];

  // queues
  syncQueue: Task[];       // 🆕 toàn bộ script đồng bộ
  microtasks: Task[];
  macrotasks: Task[];
  renderQueue: Task[];

  logs: FrameLog[];
  wasIdle: boolean;        // 🆕 chống spam idle
  lastRunId?: string;      // 🆕 để animate task vừa chạy
};
