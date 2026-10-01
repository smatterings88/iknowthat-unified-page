import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HostPage } from "@/pages/HostPage";
import { PlayerPage } from "@/pages/PlayerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerPage />} />
        <Route path="/host" element={<HostPage />} />
      </Routes>
    </BrowserRouter>
  );
}
