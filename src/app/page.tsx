import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}

// This is the Original Home Page, redirected to dashboard to make new home page.

// import Image from "next/image";
// import Link from "next/link";

// export default function Home() {
//   return (
//     <main className="min-h-screen">
//          <div className="item-center justify-center mx-auto flex max-w-3xl flex-col gap-6 p-6">
//         <form action="/auth/signout" method="POST">
//           <button
//             type="submit"
//             className="border border-white rounded p-2 text-white hover:bg-white/[0.1]"
//           >
//             Sign Out
//           </button>
//         </form>
//       {/* Section for Organizations */}
   
//         {/* Header */}
//         <Link href="/organizations">
//           <button className="border border-white rounded p-2 text-white hover:bg-white/[0.1]">
//             Organizations
//           </button>
//         </Link>
//         {/* Display current organizations */}
//           {/* FUTURE WORK HERE */}
//         {/* Create new organization button */}
//           {/* Link is better than a href for performance */}
//         <Link href="/organizations/new">
//           <button className="border border-white rounded p-2 text-white hover:bg-white/[0.1]">Create New Organization </button>
//         </Link>
//         <Link href="/dashboard">
//           <button className="border border-white rounded p-2 text-white hover:bg-white/[0.1]">Go to Dashboard</button>
//         </Link>
     
//       </div>
//     </main>
//   );
// }
