import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import VolunteerDashboard from './components/VolunteerDashboard'

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
            </Routes>
        </Router>
    )
}

export default App
