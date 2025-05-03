//About.jsx
import React from "react";
import { Mail, Instagram, Facebook } from "lucide-react";
import "../styles/About.css";


export default function About() {

  
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>ReQuiz: Trivia, Your Way</h1>
        <p>
          Your one-stop platform for dynamic, AI-powered quizzes and
          user-created challenges.
        </p>
      </div>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          We believe learning should be fun, flexible, and endlessly
          customizable. ReQuiz empowers you to generate quizzes on any topic,
          dive into community-made challenges, and track your progress over
          time, all ad-free.
        </p>
      </section>

      <section className="about-features">
        <h2>Key Features</h2>
        <ul>
          <li>
            <strong>AI-Generated Questions</strong> Instantly create quizzes
            on any subject.
          </li>
          <li>
            <strong>Custom Quizzes</strong> Build and share your own question
            sets.
          </li>
          <li>
            <strong>Community Challenges</strong> Take on quizzes created and
            ranked by fellow users.
          </li>
          <li>
            <strong>Responsive Dark Theme</strong> Enjoy the same sleek,
            neon-infused UI across all devices.
          </li>
        </ul>
      </section>

      <section className="about-contact">
        <h2>Get Involved</h2>
        <p>Found a bug or have a feature idea? Reach out on:</p>
        <div className="social-links">
          <a
            href="mailto:ngunhmung623@gmail.com"
            aria-label="Email"
            title="Email"
            className="social-icon"
          >
            <Mail size={24} />
          </a>
          <a
            href="https://www.facebook.com/share/1GADxj5JsK/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
            className="social-icon"
          >
            <Facebook size={24} />
          </a>
          <a
            href="https://www.instagram.com/n_nhmung?igsh=MWJ5dnJrdjJrMnB3eg=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
            className="social-icon"
          >
            <Instagram size={24} />
          </a>
        </div>
      </section>
    </div>
  );
}
