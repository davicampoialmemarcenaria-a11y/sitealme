import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Heroeua from "./Heroeua/Heroeua";
import SectionMapEua from "./SectionMapEua/SectionMapEua";
import SectionMapBr from "./SectionMapBr/SectionMapBr";



function Eua() {
    return (
        <> 
        
           <Heroeua />
             <SectionMapEua />
             <SectionMapBr />
              <Footer />
        </>
    );
}

export default Eua;