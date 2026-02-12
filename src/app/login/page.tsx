export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                        This is an example of how we would create a login page with the localhost:3000/login url, and then on this page we can add all of the code to make the page look and act like a login page.
                        {/* The url is determined by what you name the folder in the src/app/ directory */}
                    </h1>
                </div>
            </main>
        </div>
    );
}
