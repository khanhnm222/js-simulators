import type { LoopState } from '@/types';
import { enqueueMacro, enqueueMicro, enqueueRender } from '@/engine/eventLoop';

type Props = {
  state: LoopState;
  setState: (s: LoopState) => void;
  onStep: () => void;
  onReset: () => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
};

export default function Controls({
  state, setState, onStep, onReset, playing, setPlaying,
}: Props) {
  const addTimeoutVsPromise = () => {
    const s: LoopState = {
  ...state,
  callStack: [...state.callStack],
  microtasks: [...state.microtasks],
  macrotasks: [...state.macrotasks],
  renderQueue: [...state.renderQueue],
  logs: [...state.logs],
};
    enqueueMacro(s, 'setTimeout(cb)', () => {
      enqueueMicro(s, 'Promise.then A', () => {});
      enqueueMicro(s, 'Promise.then B', () => {});
    });
    enqueueMicro(s, 'Promise.then 1', () => {
      enqueueMicro(s, 'queueMicrotask X', () => {});
    });
    setState(s);
  };

  const addNestedMicro = () => {
    const s: LoopState = {
  ...state,
  callStack: [...state.callStack],
  microtasks: [...state.microtasks],
  macrotasks: [...state.macrotasks],
  renderQueue: [...state.renderQueue],
  logs: [...state.logs],
};
    enqueueMicro(s, 'then outer', () => {
      enqueueMicro(s, 'then inner', () => {
        enqueueMicro(s, 'then inner-2', () => {});
      });
    });
    setState(s);
  };

  const addRenderWork = () => {
    const s: LoopState = {
  ...state,
  callStack: [...state.callStack],
  microtasks: [...state.microtasks],
  macrotasks: [...state.macrotasks],
  renderQueue: [...state.renderQueue],
  logs: [...state.logs],
};
    enqueueRender(s, 'Commit UI Frame', () => {});
    setState(s);
  };

  const addMacroBurst = () => {
    const s: LoopState = {
  ...state,
  callStack: [...state.callStack],
  microtasks: [...state.microtasks],
  macrotasks: [...state.macrotasks],
  renderQueue: [...state.renderQueue],
  logs: [...state.logs],
};
    enqueueMacro(s, 'MessageChannel task', () => {});
    enqueueMacro(s, 'setTimeout 0ms', () => {});
    setState(s);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button onClick={onStep} className="px-3 py-1 rounded bg-black text-white">Step</button>
      <button
        onClick={() => setPlaying(!playing)}
        className="px-3 py-1 rounded bg-gray-900 text-white"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button onClick={onReset} className="px-3 py-1 rounded border">Reset</button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button onClick={addTimeoutVsPromise} className="px-3 py-1 rounded border">
        Scenario: setTimeout vs Promise
      </button>
      <button onClick={addNestedMicro} className="px-3 py-1 rounded border">
        Scenario: Nested microtasks
      </button>
      <button onClick={addMacroBurst} className="px-3 py-1 rounded border">
        Scenario: Macro burst
      </button>
      <button onClick={addRenderWork} className="px-3 py-1 rounded border">
        Add Render Task
      </button>
    </div>
  );
}
