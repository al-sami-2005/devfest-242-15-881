const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add success toast state
code = code.replace(
  'const [isMobileOpen, setMobileOpen] = useState(false);',
  `const [isMobileOpen, setMobileOpen] = useState(false);\n  const [showSuccess, setShowSuccess] = useState(false);`
);

// Add success toast UI
const toastHtml = `
          {/* Top Error Toast */}
          {appError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative shadow-subtle animate-in fade-in slide-in-from-top-4 duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium pr-6">{appError.message}</p>
              <button onClick={clearError} className="absolute top-4 right-4 text-red-500/60 hover:text-red-500 transition-colors">
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Success Toast */}
          {showSuccess && !appError && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 relative shadow-subtle animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-400 font-medium pr-6">Package generated successfully and downloaded!</p>
              <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-green-500/60 hover:text-green-500 transition-colors">
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
              </button>
            </div>
          )}
`;
code = code.replace(
  /\{\/\* Top Error Toast \*\/\}[\s\S]*?(?=\{\/\* Header \*\/)/,
  toastHtml
);

// Wrap generatePackage to set showSuccess
code = code.replace(
  /onClick=\{generatePackage\}/,
  `onClick={async () => {
                setShowSuccess(false);
                await generatePackage();
                if (!appError) setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
              }}`
);

fs.writeFileSync('src/App.tsx', code);
