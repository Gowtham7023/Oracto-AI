import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";

import { Analytics } from "./pages/Analytics";
import { Dashboard } from "./pages/Dashboard";
import { Models } from "./pages/Models";
import { Playground } from "./pages/Playground";
import { Quality } from "./pages/Quality";
import { Requests } from "./pages/Requests";
import { Routing } from "./pages/Routing";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/models" element={<Models />} />
          <Route path="/routing" element={<Routing />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
