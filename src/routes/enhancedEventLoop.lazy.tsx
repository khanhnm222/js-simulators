import { useEffect, useRef, useState } from 'react';
import { createInitialState, step } from '@/engine/enhancedEventLoop';
import type { LoopState } from '@/types/enhancedEventLoop';
import { compileScenario } from '@/libs/complieScenario';
import CodeEditor from '@/components/features/EnhancedEventLoop/CodeEditor';
import QueueColumn from '@/components/features/EnhancedEventLoop/QueueColumn';
import { createLazyFileRoute } from '@tanstack/react-router';
import { usePageTitle } from '@/hooks/usePageTitle';

export const Route = createLazyFileRoute('/enahnced-event-loop' as any)({
  component: EnhancedEventLoopSimulator,
})

const DEFAULT_CODE = `console.log('A');

setTimeout(() => {
  console.log('B'); // Macrotask
}, 0);

Promise.resolve().then(() => {
  console.log('C'); // Microtask
});

console.log('D');`;

export default function EnhancedEventLoopSimulator() {
  const [state, setState] = useState<LoopState>(() => createInitialState());
  const [playing, setPlaying] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  const rafRef = useRef<number | null>(null);
  usePageTitle('Eventloop');
  const handleStep = () => setState(prev => step(prev));
  const handleReset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setState(createInitialState());
  };
  const handleCompile = () => {
    // compile code -> queues
    setState(
      (prev) =>
        compileScenario(code, {
          ...createInitialState() as any,
          tick: prev.tick,
          syncQueue: [],
        }) as any
    );
  };

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      setState(prev => {
        const next = step(prev);
        const noTasks =
          next.syncQueue.length === 0 &&
          next.microtasks.length === 0 &&
          next.macrotasks.length === 0 &&
          next.renderQueue.length === 0 &&
          next.callStack.length === 0;
  
        if (noTasks) {
          // stop tự động
          setPlaying(false);
          return next;
        }
        rafRef.current = requestAnimationFrame(loop);
        return next;
      });
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);  

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">JavaScript Event Loop Simulator</h1>
        <p className="text-sm text-gray-600">
          Script (sync) → Microtasks (drain) → 1 Macrotask → 1 Render mỗi tick.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 flex flex-col gap-6 pb-12">
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={handleStep} className="px-3 py-1 rounded bg-black text-white">Step</button>
          <button
            onClick={() => setPlaying(!playing)}
            className="px-3 py-1 rounded bg-gray-900 text-white"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={handleReset} className="px-3 py-1 rounded border">Reset</button>
        </div>

        <CodeEditor code={code} setCode={setCode} onCompile={handleCompile} />

        <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <QueueColumn title="Call Stack" colorClass="border-stack" items={state.callStack} />
          <QueueColumn title="Script (sync)" colorClass="border-gray-400" items={state.syncQueue} lastRunId={state.lastRunId} />
          <QueueColumn title="Microtasks" colorClass="border-micro" items={state.microtasks} lastRunId={state.lastRunId} />
          <QueueColumn title="Macrotasks" colorClass="border-macro" items={state.macrotasks} lastRunId={state.lastRunId} />
          <QueueColumn title="Render" colorClass="border-render" items={state.renderQueue} lastRunId={state.lastRunId} />
        </section>

        <section className="border rounded-lg bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Timeline</div>
            <div className="text-xs text-gray-500">tick: {state.tick}</div>
          </div>
          <div className="mt-2 max-h-64 overflow-auto text-sm">
            {state.logs.slice(-200).map((l, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-14 shrink-0 text-gray-400">#{l.tick}</div>
                <div className="font-mono">
                  <span className="uppercase mr-2 text-gray-600">{l.action}</span>
                  <span className="text-gray-800">{l.detail}</span>
                </div>
              </div>
            ))}
            {state.logs.length === 0 && <div className="text-gray-400 italic">No logs yet</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
