import "./Navbar.scss";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiMenu } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

import logo from "../../imgs/logobranca.png";

const links = [
    { key: "menu.home", path: "/" },
    { key: "menu.about", path: "/sobre" },
    { key: "menu.projects", path: "/projetos" },
    { key: "menu.contact", path: "/Contato" }
];

const extraLinks = [
    { key: "menu.areas", path: "/eua" },
    { key: "menu.faq", path: "/duvidas" },
    { key: "menu.partner", path: "/marceneiro" },
    { key: "menu.news", path: "/newsu" }
    
];

function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false);

   const { t } = useTranslation();


    

   return (

    <header className="navbar">

        {/* LOGO */}
        <NavLink
            to="/"
            className="navbar__logo"
            onClick={() => setMenuOpen(false)}
        >
            <img src={logo} alt="Logo" />
        </NavLink>

        {/* MENU DESKTOP */}
        <nav className="navbar__menu">

            {links.map((item) => (

                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        isActive ? "active" : ""
                    }
                >

                    {({ isActive }) => (
                        <>

                            {isActive && (

                                <motion.div
                                    layoutId="navbar-indicator"
                                    layout="position"
                                    className="navbar__indicator"
                                    transition={{
                                        type: "spring",
                                        stiffness: 650,
                                        damping: 42,
                                        mass: 0.35
                                    }}
                                />

                            )}

                            <span>{t(item.key)}</span>

                        </>
                    )}

                </NavLink>

            ))}

        </nav>

        {/* HAMBURGER */}
        <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
        >
            <HiMenu />
        </button>

        {/* DROPDOWN (DESKTOP + MOBILE) */}
        <AnimatePresence>

            {menuOpen && (

                <motion.div
                    className="navbar__dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >

                    {/* MOBILE */}

                    <div className="navbar__mobile-sections">

                        <div className="navbar__dropdown-section">

                            <p>{t("menu.navigation")}</p>

                            {links.map((item) => (

                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                >

                                    {t(item.key)}

                                </NavLink>

                            ))}

                        </div>

                        <div className="navbar__dropdown-section">

                            <p>{t("menu.morePages")}</p>

                            {extraLinks.map((item) => (

                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                >

                                    {t(item.key)}

                                </NavLink>

                            ))}

                        </div>
{/* IDIOMA */}

<div className="navbar__dropdown-section">

   

    <LanguageSwitcher />

</div>


                    </div>
                    {/* DESKTOP */}
                    <div className="navbar__desktop-section">

                        <div className="navbar__dropdown-section">

                            <p>{t("menu.morePages")}</p>

                            {extraLinks.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {t(item.key)}
                                </NavLink>
                            ))}

                        </div>

                       <div className="navbar__dropdown-section">

   

    <LanguageSwitcher />

</div>

                    </div>

                </motion.div>

            )}

        </AnimatePresence>

    </header>

);

}

export default Navbar;
