import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import MathLesson from './pages/MathLesson'
import Lesson from './pages/Lesson'

import Chapter8Lesson from './pages/Chapter8Lesson' 
import MathSquares from './pages/MathSquares'
import Game from './pages/Game'
import Quiz from './pages/Quiz'
import Rewards from './pages/Rewards'
import TeacherDashboard from './pages/TeacherDashboard'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'


export default function App(){
const location = useLocation();
const isMathLesson = location.pathname === '/lesson/math';
const isProfile = location.pathname === '/profile';
const isDashboard = location.pathname === '/dashboard';
return (
<div>
<Navbar />
<div className={(isMathLesson || isProfile || isDashboard) ? 'container full-width' : 'container'}>
<Routes>
<Route path="/" element={<Home />} />

<Route path="/lesson/:id" element={<Lesson />} />

<Route path="/chapter8" element={<Chapter8Lesson />} /> 
<Route path="/math/squares" element={<MathSquares />} />
<Route path="/game/:id" element={<Game />} />
<Route path="/quiz/:id" element={<Quiz />} />
<Route path="/rewards" element={<Rewards />} />
<Route path="/dashboard" element={<TeacherDashboard />} />
<Route path="/profile" element={<Profile />} />
</Routes>
</div>
</div>
)
}