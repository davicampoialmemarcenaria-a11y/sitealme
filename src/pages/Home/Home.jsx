import "./Home.scss";

import Hero from "./Hero/Hero";
import ExperienceSection from "./ExperienceSection/ExperienceSection";
import ProjetosSectionHome from "./ProjetosSectionhome/ProjetosSectionHome";
import StatsSection from "./StatsSection/StatsSection";
import TercSessao from "./tercsessao/TercSessao";
import PrinciplesSection from "./PrinciplesSection/PrinciplesSection";
import Footer from "../../components/Footer/Footer";


function Home() {

    return (
        <main className="home">

            <Hero />

            <ExperienceSection />

            <ProjetosSectionHome />

            <StatsSection />

            <TercSessao />

            <PrinciplesSection />


            <div className="home-footer">
                <Footer />
            </div>


        </main>
    );

}

export default Home;