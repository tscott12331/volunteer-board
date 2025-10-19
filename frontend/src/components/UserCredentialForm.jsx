import { signin, signup } from '../util/api/auth';
import styles from './UserCredentialForm.module.css';
import { useActionState } from "react";

export default function UserCredentialForm({
    isSignin
}) {
    const formAction = isSignin ? signin : signup;

    const title = isSignin ? "Welcome back" : "Begin volunteering now";
    const cardTitle = isSignin ? "Sign in" : "Sign up";
    const anchorText = isSignin ? "Don't have an account?" : "Already have an account?";
    const anchorLink = isSignin ? "/signup" : "/signin";

    const [state, action, isPending] = useActionState(formAction, undefined);

    if(isSignin && state?.success) {
        location.assign('/');
    }

    return (
        <div className="d-flex flex-column gap-5 align-items-center justify-content-start flex-grow-1 ">
            <h1 className="mt-5 text-body-emphasis">{title}</h1>
            <form 
                className={"card " + styles.credentialCard}
                action={action}
            >
                <header className="card-header">
                    <h2>{cardTitle}</h2>
                </header>
                <div className="card-body">
                    <div className="mb-3">
                        <label htmlFor="email-input" className="form-label">Email address</label>
                        <input type="email" className="form-control" id="email-input" name="email" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password-input" className="form-label">Password</label>
                        <input type="password" className="form-control" id="password-input" name="password" />
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
                    {!isSignin &&
                    <div className="mb-3 form-check">
                        <input type="checkbox" className="form-check-input" id="organization-check-input" name="is-org"/>
                        <label className="form-check-label" htmlFor="organization-check-input">Sign up as organization</label>
                    </div>
                    }
                    <div className="mb-3">
                        <a className="link-primary icon-link link-underline-opacity-75" href={anchorLink}>{anchorText}</a>
                    </div>
                    <button type="submit" className="btn btn-primary">{cardTitle}</button>
                </div>
                {state &&
                    <div className={"card-footer text-" + (state.success ? "success" : "danger")}>
                    {state.success ?
                        state.data.message
                    :
                        state.error
                    }
                    </div>
                }
            </form>
        </div>
    );
}
