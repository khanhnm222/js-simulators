export type QueueType = 'microtask' | 'macrotask' | 'render';

export type Task = {
  id: string;
  label: string;
  type: QueueType;
  fn: () => void | Promise<void>;
  createdAtTick: number;
};

export type FrameLog = {
  tick: number;
  action: string;
  detail?: string;
};

export type LoopState = {
  tick: number;
  running: boolean;
  callStack: string[];       // tên function đang chạy (mô phỏng)
  microtasks: Task[];
  macrotasks: Task[];
  renderQueue: Task[];
  logs: FrameLog[];
  wasIdle?: boolean;
};
