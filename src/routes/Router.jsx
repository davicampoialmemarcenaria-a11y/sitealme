import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Sobre from "../pages/Sobre/Sobre";
import Contato from "../pages/Contato/Contato";
import Eua from "../pages/Eua/Eua";
import Duvidas from "../pages/Duvidas/Duvidas";
import Marceneiro from "../pages/Marceneiro/Marceneiro";

function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/eua" element={<Eua />} />
                <Route path="/duvidas" element={<Duvidas />} />
                <Route path="/marceneiro" element={<Marceneiro />} />

            </Routes>
        </BrowserRouter>
    );
}

export default Router;