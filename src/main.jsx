import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { Toaster } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./styles/main.scss";


ReactDOM.createRoot(
    document.getElementById("root")
).render(

    <React.StrictMode>

        <App />

        <Toaster

            position="top-right"

            toastOptions={{

                duration: 4000,

                style: {

                    background: "#4b2108",

                    color: "#fff",

                    borderRadius: "6px",

                    fontFamily: "Arial, sans-serif",

                    fontSize: "14px",

                    padding: "14px 18px"

                },

                success: {

                    iconTheme: {

                        primary: "#d88a16",

                        secondary: "#fff"

                    }

                },

                error: {

                    iconTheme: {

                        primary: "#ffb4a2",

                        secondary: "#fff"

                    }

                }

            }}

        />

    </React.StrictMode>

);