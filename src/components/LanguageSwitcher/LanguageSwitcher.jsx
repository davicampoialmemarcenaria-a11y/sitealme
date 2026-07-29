import { useTranslation } from "react-i18next";

import "./LanguageSwitcher.scss";

export default function LanguageSwitcher() {

    const { i18n } = useTranslation();

    function alterarIdioma() {

        const novoIdioma = i18n.language === "pt" ? "en" : "pt";

        i18n.changeLanguage(novoIdioma);

        localStorage.setItem("lang", novoIdioma);

    }

    return (

        <button
            type="button"
            className="language-switcher"
            onClick={alterarIdioma}
        >

            {i18n.language === "pt"
                ? "ENGLISH 🇺🇸"
                : "PORTUGUÊS 🇧🇷"}

        </button>

    );

}
