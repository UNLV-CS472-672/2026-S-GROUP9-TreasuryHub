//Useful documentation:
//https://nextjs.org/docs/app/api-reference/components/form

import Form from 'next/form'
import { createOrganization } from "./actions";

export default function NewOrganization() {
  return (
    <main>
        <div>
        {/* This action is called upon form submission */}
            <Form action={createOrganization}>
                <input
                    name="organizationName"
                    //Type of input
                    type="text"
                    //Set required input
                    required
                    //Formatting
                    className="border border-white rounded p-2 text-white"
                />

                <button
                    //Type of input
                    type="submit"
                >
                    <p>Create new organization </p>
                </button>
            </Form>
        </div>
    </main>
  );
}