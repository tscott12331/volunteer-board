import { APIError, APISuccess } from "./api-response";
import { supabase } from "./supabaseClient";

export async function signup(previousState, formData) {
    const email = formData.get('email');
    const password = formData.get('password');

    // info from organization checkbox
    const isOrgTxt = formData.get('is-org');
    const isOrg = isOrgTxt === 'on' ? true : false;

    if(!email || !password) return APIError("Insufficient credentials");
    
    try {
        let res = await supabase.auth.signUp({
            email,
            password,
        })

        if(res.error) return APIError(res.error.message);
        
        // const id = res.data.user.id;
        //
        // setting account type not working at the moment
        // if(isOrg) {
        //     res = await supabase.from('profiles')
        //                     .update({
        //                         'account': 'organization'
        //                     })
        //                     .eq('id', id);
        //     console.log(res);
        //
        //     if(res.error) return APIError(res.error.message);
        // }

        return APISuccess({
                message: "Please check your inbox for a confirmation email",
        });
    } catch(error) {
        return APIError("Server error");
    }
}

export async function signin(previousState, formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    if(!email || !password) return APIError("Insufficient credentials");

    try {
        let res = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if(res.error) return APIError(res.error.message);

        return APISuccess({
                message: "Successful login, you will be redirected shortly",
        });
    } catch(error) {
        return APIError("Server error");
    }
}
