const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<Sidebar \n        readiness={readiness} \n        language={language} \n        setLanguage={setLanguage} \n        resetProject={resetProject}\n        isMobileOpen={isMobileOpen}\n        setMobileOpen={setMobileOpen}\n      />',
  '<Sidebar \n        readiness={readiness} \n        language={language} \n        setLanguage={setLanguage} \n        resetProject={resetProject}\n        isMobileOpen={isMobileOpen}\n        setMobileOpen={setMobileOpen}\n        checklist={checklist}\n        documents={documents}\n      />'
);

fs.writeFileSync('src/App.tsx', code);
