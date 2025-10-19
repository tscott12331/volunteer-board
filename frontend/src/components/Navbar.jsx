import { Link } from "react-router";
import { supabase } from "../util/api/supabaseClient";

/*
    * Dynamically displays necessary nav links
    * props:
        * user?
            * Supabase Auth user
            * Basic information about the logged in user
*/
export default function Navbar({
    user,
}) {
    // different nav options appear when user is logged in
    const loggedIn = user ? true : false;

    // signs user out 
    const handleSignout = async () => {
        await supabase.auth.signOut();
    }
    
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">StepUp</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link active" to="/">Home</Link>
                        </li>
                        {
                        loggedIn ?
                        <>
                        <li className="nav-item">
                            <Link className="nav-link active" to={"/profile/" + user.id}>Profile</Link>
                        </li>
                        <li className="nav-item">
                            <a 
                                className="nav-link active" 
                                href="#"
                                onClick={handleSignout}
                            >Sign out</a>
                        </li>
                        </>
                        :
                        <>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/signin">Sign in</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/signup">Sign up</Link>
                        </li>
                        </>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
}
