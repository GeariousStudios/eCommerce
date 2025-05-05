export default function Home() {
  return (
    <>
      <header className="width-full bg-grid-header border-grid mb-3 flex h-32 items-center justify-center rounded border-2">
        <h1 className="duration-medium text-4xl transition-all md:text-5xl">
          Dashboard
        </h1>
      </header>
      {/* --- Login & news section --- */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* --- Login container --- */}
        <div className="flex w-full flex-col lg:w-1/3">
          {/* --- Login header --- */}
          <div className="bg-grid-header border-grid flex rounded-t border-2 p-2">
            Logga in
          </div>
          {/* --- Login content --- */}
          <div className="bg-grid border-grid flex justify-center rounded-b border-2 border-t-0 p-6 align-middle">
            {/* --- Login form --- */}
            <form className="flex flex-col">
              <label htmlFor="username">Användarnamn</label>
              <input
                id="username"
                type="text"
                className="bg-input border-input mt-3 rounded border-2 p-2"
                placeholder="Skriv här ..."
                spellCheck="false"
              />

              <label htmlFor="password" className="mt-6">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                className="bg-input border-input mt-3 rounded border-2 p-2"
                placeholder="Skriv här ..."
              />

              <button
                type="submit"
                className="bg-button-primary duration-fast hover:bg-button-primary-hover mt-6 cursor-pointer rounded p-2 transition-colors"
              >
                Logga in
              </button>
            </form>
          </div>
        </div>
        {/* --- News container --- */}
        <div className="flex w-full flex-col lg:w-2/3">
          {/* --- News header --- */}
          <div className="bg-grid-header border-grid flex rounded-t border-2 p-2">
            Nyheter
          </div>

          {/* --- News content --- */}
          <div className="bg-grid border-grid flex justify-center rounded-b border-2 border-t-0 p-6 align-middle"></div>
        </div>
      </div>
    </>
  );
}
