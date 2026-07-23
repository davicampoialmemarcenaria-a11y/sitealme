import "./Projetosu.scss";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Heroprojetoss from "./heroprojetoss/heroprojetoss";
import CardProjetos from "./CardProjetos/CardProjetos";
import Leipro from "./Leipro/Leipro";
import Ambiente from "./Ambiente/Ambiente";


function Projetosu() {
    return (
        <> 
        <Heroprojetoss/>
        <CardProjetos/>
        <Leipro />
        <Ambiente />
        <Footer />

        
           
        </>
    );
}

export default Projetosu;