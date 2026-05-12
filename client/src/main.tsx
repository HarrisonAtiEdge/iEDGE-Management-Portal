// import { createRoot } from "react-dom/client";
// import { ThemeProvider } from "next-themes";
// import App from "./App";
// import "./index.css";

// createRoot(document.getElementById("root")!).render(
//   <ThemeProvider
//     attribute="class"
//     defaultTheme="system"
//     enableSystem
//     storageKey="rest-express-theme"
//   >
//     <App />
//   </ThemeProvider>,
// );

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="rest-express-theme"
    >
      <App />
    </ThemeProvider>
  </BrowserRouter>,
);
