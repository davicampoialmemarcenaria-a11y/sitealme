import "./Hero.scss";

import { useEffect, useRef } from "react";

import video from "../../../imgs/videohome.mp4";

import Navbar from "../../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Hero() {

    const navigate = useNavigate();
 const { t } = useTranslation();
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
    {t("hero.tag")}
</span>

<h1>
    {t("hero.title")}
</h1>

<p>
    {t("hero.description")}
</p>

<button onClick={() => navigate("/Sobre")}>
    {t("hero.button")}
</button>

            </div>

        </section>

    );

}

export default Hero;