import { ReactNode } from "react";

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div>
        <div>
          <main className="p-4">
            <div className="flex justify-center md:max-w-6xl md:px-0 lg:mx-auto lg:px-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Layout;
