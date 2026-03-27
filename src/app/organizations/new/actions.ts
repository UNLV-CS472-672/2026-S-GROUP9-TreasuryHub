//Where actions referenced in app/organizations/new are defined

//Only runs on server
"use server";

import { createClient } from "@/lib/supabase/server";

//formData : FormData catches the submitted form data on form submission
export async function createOrganization(formData: FormData){
    //Ensuring supabase (database) instance is initialized properly
    const supabase = await createClient();

    //Request user information:
    const whoIsUser = await supabase.auth.getUser();

    //Store user information
    const user = whoIsUser.data.user;

    //Error checking needed here

    //Pull form data:
    const organizationName = formData.get("organizationName") as string;

    //Create an entry into the organizations table
        //I'll remove this later
    if(user != null){
        const organization = await supabase.from("organizations")
                  .insert({
                    org_name: organizationName,
                    //created_by: user.id,
                  })
                  .select("org_id")
                  .single()
    
    //For debugging
    console.log("organization result:", organization);

    //Simpler storage
    const orgID = organization.data?.org_id;

    //Now with the organization made, need to put an entry into the organization's org_members table
    //Set user to be Treasurer.
    await supabase.from("org_members")
                  .insert({
                    user_id: user.id,
                    org_id: orgID,
                    role: 'treasurer',
                  })
    }
}