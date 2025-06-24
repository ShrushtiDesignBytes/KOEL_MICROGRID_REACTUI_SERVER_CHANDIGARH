import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const location = useLocation(); // Get the current location
    const [active, setActive] = useState(location.pathname); // Initialize active state with current path

    //console.log(location.pathname)
    // Function to handle click and set active state
    const handleLinkClick = (path) => {
       // console.log(path)
        setActive(path);
    };

    return (
        <header className="p-2 w-full bg-gradient-to-r from-custom-green to-custom-dark">
         {location.pathname !== '/excel' &&   <nav>
                <ul className="flex flex-wrap">
                    <Link to="/" onClick={() => handleLinkClick("/")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg 2xl:text-xl ${active === '/' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Overview
                        </li>
                    </Link>
                    <Link to="/solar" onClick={() => handleLinkClick("/solar")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg 2xl:text-xl ${active === '/solar' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Solar
                        </li>
                    </Link>
                    <Link to="/mains" onClick={() => handleLinkClick("/mains")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg 2xl:text-xl ${active === '/mains' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Mains
                        </li>
                    </Link>
                    <Link to="/genset" onClick={() => handleLinkClick("/genset")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg 2xl:text-xl ${active === '/genset' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Genset
                        </li>
                    </Link>
                    <Link to="/alerts" onClick={() => handleLinkClick("/alerts")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg 2xl:text-xl ${active === '/alerts' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Alerts
                        </li>
                    </Link>
                    
                </ul>
            </nav>
        }
        </header>
    );
};

export default Header;
