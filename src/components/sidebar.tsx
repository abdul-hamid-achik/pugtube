import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { classNames } from "@/utils/styles";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

function Sidebar({
  update,
  show = false,
}: {
  update: (open: boolean) => void;
  show: boolean;
}) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const navigation = [
    {
      name: "Main",
      href: "/",
      icon: HomeIcon,
      current: router.pathname === "/",
    },
    {
      name: "Upload",
      href: "/upload",
      icon: DocumentArrowUpIcon,
      current: router.pathname === "/upload",
    },
  ];

  const items = [
    // {
    //   id: 1,
    //   name: "Library",
    //   href: "/library",
    //   initial: "L",
    //   current: router.pathname === "/library",
    // },
    // {
    //   id: 2,
    //   name: "History",
    //   href: "/history",
    //   initial: "H",
    //   current: router.pathname === "/history",
    // },
    {
      id: 3,
      name: "Channel",
      href: `/channel/${user?.username}`,
      initial: "Y",
      current: router.pathname === "/channel",
    },
  ];
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={update}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => update(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Transition.Child>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <Image
                    className="h-8 w-auto"
                    src="/favicon.ico"
                    width={32}
                    height={32}
                    alt="pugtube logo"
                  />

                  <h2 className="ml-2 text-xl text-white md:hidden">Pugtube</h2>

                  <h2 className="ml-2 hidden text-xl text-white lg:block">
                    Menu
                  </h2>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={classNames(
                                item.current
                                  ? "bg-gray-800 text-white"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                              )}
                            >
                              <item.icon
                                className="h-6 w-6 shrink-0"
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li>
                      <ul role="list" className="-mx-2 mt-2 space-y-1">
                        {(isSignedIn ? items : []).map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={classNames(
                                item.current
                                  ? "bg-gray-800 text-white"
                                  : "text-gray-200 hover:bg-gray-800 hover:text-white",
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                              )}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white">
                                {item.initial}
                              </span>
                              <span className="truncate">{item.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    {isSignedIn && (
                      <li className="mt-auto">
                        <Link
                          href="/user-profile/"
                          className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                          <Cog6ToothIcon
                            className="h-6 w-6 shrink-0"
                            aria-hidden="true"
                          />
                          Settings
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default Sidebar;
