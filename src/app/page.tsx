import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className="border border-white rounded p-2 text-white"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
