import "./Duvidas.scss";
import Heroduvidas from "./Heroduvidas/Heroduvidas";
import Campo from "./Campo/Campo";

function Duvidas() {
    return (
        <div className="duvidas">
            <Heroduvidas />
            <Campo />
        </div>
    );
}

export default Duvidas; 