export default function Navbar({
    user,
}) {
    const loggedIn = user ? true : false;

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="/">StepUp</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="/">Home</a>
                        </li>
                        {
                        loggedIn ?
                        <>
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href={"/profile/" + user.id}>Profile</a>
                        </li>
                        </>
                        :
                        <>
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="/login">Log In</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="/signup">Sign Up</a>
                        </li>
                        </>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
}
