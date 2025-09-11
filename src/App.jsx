import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Lesson from './pages/Lesson'
import Chapter8Lesson from './pages/Chapter8Lesson' 
import Game from './pages/Game'
import Quiz from './pages/Quiz'
import Rewards from './pages/Rewards'
import TeacherDashboard from './pages/TeacherDashboard'
import Navbar from './components/Navbar'

export default function App(){
return (
<div>
<Navbar />
<div className="container">
<Routes>
<Route path="/" element={<Home />} />
<Route path="/lesson/:id" element={<Lesson />} />
<Route path="/chapter8" element={<Chapter8Lesson />} /> 
<Route path="/game/:id" element={<Game />} />
<Route path="/quiz/:id" element={<Quiz />} />
<Route path="/rewards" element={<Rewards />} />
<Route path="/dashboard" element={<TeacherDashboard />}
/>
</Routes>
</div>
</div>
)
}