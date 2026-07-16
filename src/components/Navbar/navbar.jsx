import "./Navbar.scss";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiMenu } from "react-icons/hi";

import logo from "../../imgs/logobranca.png";

const links = [
    { name: "HOME", path: "/" },
    { name: "SOBRE", path: "/sobre" },
    { name: "PROJETOS", path: "/projetos" },
    { name: "CONTATO", path: "/Contato" }
];

const extraLinks = [
    { name: "ÁREAS DE ATUAÇÃO", path: "/eua" },
    { name: "DÚVIDAS FREQUENTES", path: "/duvidas" },
    { name: "SEJA UM HOMOLOGADO", path: "/marceneiro" },
    { name: "ALME NEWS", path: "/news" }
];

function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false);

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

                                <span>{item.name}</span>

                            </>
                        )}

                    </NavLink>

                ))}

            </nav>            {/* HAMBURGER */}
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
                                <p>Navegação</p>

                                {links.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}

                            </div>

                            <div className="navbar__dropdown-section">
                                <p>Mais páginas</p>

                                {extraLinks.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}

                            </div>

                        </div>

                        {/* DESKTOP */}
                        <div className="navbar__desktop-section">

                            <div className="navbar__dropdown-section">

                                <p>Mais páginas</p>

                                {extraLinks.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}

                            </div>

                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

        </header>

    );

}

export default Navbar;