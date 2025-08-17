type Props = {
  code: string;
  setCode: (v: string) => void;
  onCompile: () => void;
};

export default function CodeEditor({ code, setCode, onCompile }: Props) {
  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-semibold">Scenario Code</div>
        <button
          onClick={onCompile}
          className="px-3 py-1 rounded bg-black text-white"
          title="Parse code thành queues"
        >
          Compile ➜ Queues
        </button>
      </div>
      <textarea
        className="w-full h-48 p-3 font-mono text-sm outline-none resize-y"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        placeholder={`console.log('A');\nsetTimeout(() => { console.log('B'); }, 0);\nPromise.resolve().then(() => { console.log('C'); });\nconsole.log('D');`}
      />
    </div>
  );
}
