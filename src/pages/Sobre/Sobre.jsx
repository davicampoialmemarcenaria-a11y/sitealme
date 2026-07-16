import HeroSobre from "./Hero/HeroSobre";
import Footer from "../../components/Footer/Footer";
import PostitSection from "./PostitSection/PostitSection";
import PrincipioSobre from "./PrincipioSobre/PrincipioSobre";
import Temporal from "./temporal/temporal";
import BotaoJunto from "./BotaoJunto/BotaoJunto";


function Sobre() {
    return (
        <> 
           <HeroSobre />
              <PostitSection />
              <PrincipioSobre />
              <Temporal/>
              <BotaoJunto />
              
              <Footer />
        </>
    );
}

export default Sobre;