import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function Auth() {
    const { data: sessionData } = useSession();

    return (
        <div>
            {sessionData && sessionData.user ? (
                <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <Menu.Button className="flex items-center">
                            <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            <span className="ml-2">{sessionData.user.name}</span>
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
                        <Menu.Items className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg outline-none">
                            <div className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {sessionData.user?.email}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {sessionData.user?.name}
                                </p>
                            </div>
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <a
                                            href="#"
                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                } block px-4 py-2 text-sm`}
                                        >
                                            Account settings
                                        </a>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                } block w-full text-left px-4 py-2 text-sm`}
                                            onClick={() => { signOut().catch(error => console.error(error)) }}
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => { signIn().catch(error => console.error(error)) }}
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
