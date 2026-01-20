import React from "react";
import { Link } from "react-router-dom";
import "./HeaderA.css";

const HeaderA = () => {
    return (
        <header className="admin-header">
            <div className="admin-header-inner">
                <h1 className="logo">
                    <Link to="/">THIANET<span>.</span></Link>
                </h1>
                <div className="brand">
                    <h2 className="brand-title">Panel Admin</h2>
                </div>
            </div>
        </header>
    );
};

export default HeaderA;
