import "./Projetosu.scss";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Heroprojetoss from "./heroprojetoss/heroprojetoss";
import CardProjetos from "./CardProjetos/CardProjetos";


function Projetosu() {
    return (
        <> 
        <Heroprojetoss/>
        <CardProjetos/>
        <Footer />
        
           
        </>
    );
}

export default Projetosu;