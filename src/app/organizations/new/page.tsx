//Useful documentation:
//https://nextjs.org/docs/app/api-reference/components/form

import Form from 'next/form'
import { createOrganization } from "./actions";
import BackButton from '@/components/BackButton';

export default function NewOrganization() {
  return (
    <main>
        <div className="mt-5 ml-5 flex gap-2">
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
                    className="border border-white bg-black-600 text-white px-4 py-2 rounded hover:bg-gray-700 active:scale-95 transition-all"
                >
                    <p>Create new organization </p>
                </button>
                <BackButton></BackButton>
            </Form>
        </div>
    </main>
  );
}