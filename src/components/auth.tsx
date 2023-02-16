import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Auth() {
  const { data: session } = useSession();

  return (
    <div>
      {session && session.user ? (
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="flex items-center">
              <UserCircleIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-2">{session.user.name}</span>
            </Menu.Button>
          </div>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white shadow-lg outline-none">
              <div className="px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-900">
                  {session.user?.email}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {session.user?.name}
                </p>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm`} href={`/channel/${session.user?.id}`}>
                      Account settings
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full px-4 py-2 text-left text-sm`}
                      onClick={() => { signOut(); }}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => { signIn(); }}
          data-testid="sign-in-button"
          aria-label="Sign in"
        >
          <UserCircleIcon className="h-5 w-5 text-gray-400" />
          <span className="ml-2">Sign in</span>
        </button>
      )}
    </div>
  );
}
