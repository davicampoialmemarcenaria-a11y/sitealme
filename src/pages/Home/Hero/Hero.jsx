import "./Hero.scss";

import { useEffect, useRef } from "react";

import video from "../../../imgs/videohome.mp4";

import Navbar from "../../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";

function Hero() {

    const navigate = useNavigate();

    const videoRef = useRef(null);

    useEffect(() => {

        if (videoRef.current) {

            videoRef.current.playbackRate = 0.5;

        }

    }, []);

    return (

        <section className="hero">

            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className="hero__video"
            >
                <source src={video} type="video/mp4" />
            </video>

            <div className="hero__overlay"></div>

            <Navbar />

            <div className="hero__content">

                <span>
                    QUALIDADE • SOFISTICAÇÃO • EXCLUSIVIDADE
                </span>

                <h1>
                    Aplicando excelência e criando experiências
                    
                </h1>

                <p>
                    Acompanhamos todas as etapas, do início ao fim, garantindo organização, alinhamento e uma execução fluida em cada detalhe feito
 
                </p>

                <button onClick={() => navigate("/Sobre")}>
    SAIBA MAIS
</button>

            </div>

        </section>

    );

}

export default Hero;