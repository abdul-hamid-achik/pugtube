/* eslint-disable react/jsx-props-no-spreading */
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment } from "react";
import { useForm } from "react-hook-form";
import { Menu, Transition } from "@headlessui/react";
import Image from "next/image";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "@/utils/styles";

interface FormData {
  term: string;
}

export default function Header({
  setSidebarOpen,
}: {
  setSidebarOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      term: router.query.term as string,
    },
  });
  const onSubmit = (data: FormData) => {
    router.push(`/results/${data.term}`).catch((error) => console.error(error));
  };
  const userNavigation = [
    { name: "Your profile", href: "/user-profile/" },
    { name: "Sign out", href: "/sign-out", onClick: () => signOut() },
  ];

  const anonymousNavigation = [
    { name: "Sign in", href: "/sign-in/" },
    { name: "Don't have an account?", href: "/sign-up/" },
  ];

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-500 bg-gray-700 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Link href="/" className="font-bold text-white">
        Pugtube
      </Link>
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-200"
        onClick={() => setSidebarOpen?.(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form
          className="relative flex flex-1"
          onSubmit={handleSubmit(onSubmit)}
        >
          <label htmlFor="term" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-200"
            aria-hidden="true"
          />
          <input
            id="term"
            className="block h-full w-full border-0 bg-gray-700 py-0 pl-8 pr-0 text-gray-200 placeholder:text-gray-100 focus:ring-0 sm:text-sm"
            placeholder="Search..."
            data-testid="search-input"
            type="search"
            {...register("term", { required: true })}
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-200 hover:text-gray-300"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200/10"
            aria-hidden="true"
          />

          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <Image
                className="h-8 w-8 rounded-full bg-gray-50"
                src={user?.profileImageUrl || "/favicon.ico"}
                width={32}
                height={32}
                alt=""
              />
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-200"
                  aria-hidden="true"
                >
                  {user?.fullName || user?.username}
                </span>
                <ChevronDownIcon
                  className="ml-2 h-5 w-5 text-gray-200"
                  aria-hidden="true"
                />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-gray-700 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {(isSignedIn ? userNavigation : anonymousNavigation).map(
                  ({
                    href,
                    name,
                    onClick = () => {},
                  }: {
                    href: string;
                    name: string;
                    onClick?: () => void;
                  }) => (
                    <Menu.Item key={name}>
                      {({ active }) => (
                        <Link
                          href={href}
                          className={classNames(
                            active ? "bg-gray-50" : "",
                            "block px-3 py-1 text-sm leading-6 text-gray-200"
                          )}
                          onClick={onClick}
                        >
                          {name}
                        </Link>
                      )}
                    </Menu.Item>
                  )
                )}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}
