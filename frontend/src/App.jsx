import './App.css'
import 'bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import VolunteerDashboard from './components/VolunteerDashboard'
import UserCredentialForm from './components/UserCredentialForm';
import Navbar from './components/Navbar';

function App() {

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<VolunteerDashboard />} />
                <Route path="/signup" element={<UserCredentialForm isLogin={false} />} />
                <Route path="/login" element={<UserCredentialForm isLogin={true} />} />
            </Routes>
        </Router>
    )
}

export default App
