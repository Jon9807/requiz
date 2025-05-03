//components/Footer,js

import React from "react";
import { Mail, Facebook, Instagram } from "lucide-react";
import "../styles/Footer.css";


export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-social">
          <a href="mailto:ngunhmung623@gmail.com" aria-label="Email" className="footer-icon">
            <Mail size={20}/>
          </a>
          <a href="https://www.facebook.com/share/1GADxj5JsK/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-icon">
            <Facebook size={20}/>
          </a>
          <a href="https://www.instagram.com/n_nhmung?igsh=MWJ5dnJrdjJrMnB3eg==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-icon">
            <Instagram size={20}/>
          </a>
        </div>
      </div>
      <div className="footer-copy">
        © {new Date().getFullYear()} ReQuiz. All rights reserved.
      </div>
    </footer>
  );
}
