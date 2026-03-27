import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="flex items-center justify-center">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="border border-white rounded p-2 text-white"
          >
            Sign Out
          </button>
        </form>
      </div>
      {/* Section for Organizations */}
      <div>
        {/* Header */}
        <Link href="/organizations">
          <h1>
            Organizations
          </h1>
        </Link>
        {/* Display current organizations */}
          {/* FUTURE WORK HERE */}
        {/* Create new organization button */}
          {/* Link is better than a href for performance */}
        <Link href="/organizations/new">
          <button>Create New Organization </button>
        </Link>
      </div>
    </main>
  );
}
