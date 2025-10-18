import { supabase } from "./supabaseClient";

export async function signup(previousState, formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    const isOrgTxt = formData.get('is-org');
    const isOrg = isOrgTxt === 'on' ? true : false;
    console.log(email,password,isOrg);

    if(!email || !password) {
        return {
            success: false,
            error: "Insufficient credentials",
        }
    }
    
    console.log(email, password, isOrg);

    try {
        let res = await supabase.auth.signUp({
            email,
            password,
        })

        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        res = await supabase.auth.setSession(res.data.session);
        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        return {
            success: true,
            data: {
                message: "Please check your inbox for a confirmation email",
            }
        }
    } catch(error) {
        console.error(error);
        return {
            success: false,
            error: "Server error",
        }
    }
}

export async function login(previousState, formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    if(!email || !password) {
        return {
            success: false,
            error: "Insufficient credentials",
        }
    }

    try {
        let res = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        res = await supabase.auth.setSession(res.data.session);
        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        return {
            success: true,
            data: {
                message: "Successful login, you will be redirected shortly",
            }
        }
    } catch(error) {
        console.error(error);
        return {
            success: false,
            error: "Server error",
        }
    }
}
