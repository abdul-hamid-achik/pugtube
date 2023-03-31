import { ReactNode, useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div>
        <Sidebar show={sidebarOpen} update={setSidebarOpen} />
        <div>
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="py-4">
            <div className="flex justify-center sm:px-2 md:max-w-6xl md:px-0 lg:mx-auto lg:px-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Layout;
