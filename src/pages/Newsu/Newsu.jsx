import "./Newsu.scss";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Noticias from "./Noticias/Noticias";
import Heronewsu from "./Heronewsu/Heronewsu";
import Formanewsu from "./Formanewsu/Formanewsu";


function Newsu() {
    return (
        <> 
        <Heronewsu />
        <Formanewsu />
        <Noticias />
        <Footer />
        
           
        </>
    );
}

export default Newsu;