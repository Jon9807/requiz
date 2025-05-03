//App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import UserQuizzes from "./pages/UserQuizzes";
import CreateQuiz from "./pages/CreateQuiz";
import CreateQuizQuestions from "./pages/CreateQuizQuestions";
import EditQuiz from "./pages/EditQuiz";
import PublicQuizzes from "./pages/PublicQuizzes";
import Profile from "./pages/Profile";
import PlayUserQuiz from "./pages/PlayUserQuiz";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQuestions from "./pages/AdminQuestions";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminUsers from "./pages/AdminUsers";
import QuizGenerator from "./pages/QuizGenerator";
import QuizPlay from "./pages/QuizPlay";
import History from "./pages/History";
import About from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="content-wrapper">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/public-quizzes" element={<PublicQuizzes />} />
            <Route path="/generate-quiz" element={<QuizGenerator />} />

            {/* User Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/user-quizzes" element={<UserQuizzes />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route
              path="/create-quiz-questions/:quizId"
              element={<CreateQuizQuestions />}
            />
            <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/play-user-quiz/:quizId" element={<PlayUserQuiz />} />
            <Route path="/play-quiz" element={<QuizPlay />} />
            <Route path="/history" element={<History />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminPanel />}>
              <Route index element={<AdminDashboard />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
