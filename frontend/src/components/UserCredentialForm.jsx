import styles from './UserCredentialForm.module.css';
import { useActionState } from "react";

export default function UserCredentialForm({
    isLogin
}) {
    const formAction = () => {};

    const title = isLogin ? "Log in" : "Sign up";
    const anchorText = isLogin ? "Sign up instead" : "Log in instead";
    const anchorLink = isLogin ? "/signup" : "/login";

    const [state, action, isPending] = useActionState(formAction, {});

    return (
        <div className="d-flex flex-grow-1 align-items-center justify-content-center">
            <form 
                className={"card " + styles.credentialCard}
                action={action}
            >
                <header className="card-header">
                    <h2>{title}</h2>
                </header>
                <div className="card-body">
                    <div className="mb-3">
                        <label htmlFor="email-input" className="form-label">Email address</label>
                        <input type="email" className="form-control" id="email-input" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password-input" className="form-label">Password</label>
                        <input type="password" className="form-control" id="password-input" />
                    </div>
                    <div className="mb-3 d-flex gap-2">
                        <div className={styles.signupOption}>
                            <img className="img-thumbnail" src="/placeholder.svg" />
                        </div>
                        <div className={styles.signupOption}>
                            <img className="img-thumbnail" src="/placeholder.svg" />
                        </div>
                        <div className={styles.signupOption}>
                            <img className="img-thumbnail" src="/placeholder.svg" />
                        </div>
                        <div className={styles.signupOption}>
                            <img className="img-thumbnail" src="/placeholder.svg" />
                        </div>
                    </div>
                    <div className="mb-3">
                        <a className="link-primary icon-link link-underline-opacity-75" href={anchorLink}>{anchorText}</a>
                    </div>
                    <button type="submit" className="btn btn-primary">{title}</button>
                </div>
            </form>
        </div>
    );
}
