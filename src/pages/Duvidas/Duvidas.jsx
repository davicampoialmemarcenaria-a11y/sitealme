import "./Duvidas.scss";
import Heroduvidas from "./Heroduvidas/Heroduvidas";
import Campo from "./Campo/Campo";
import Footer from "../../components/Footer/Footer";

function Duvidas() {
    return (
        <div className="duvidas">
            <Heroduvidas />
            <Campo />
            <Footer />
        </div>
    );
}

export default Duvidas; 