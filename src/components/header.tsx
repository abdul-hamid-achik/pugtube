/* eslint-disable react/jsx-props-no-spreading */
import { RedirectToSignIn, RedirectToSignUp, UserButton, useUser } from '@clerk/nextjs';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

interface FormData {
  query: string
}

export default function Header() {
  const { isSignedIn } = useUser();
  const { register, handleSubmit } = useForm<FormData>();
  const onSubmit = (_data: FormData) => { };


  return (
    <div className="bg-gray-900 py-2">
      <div className="flex items-center">
        <div className="grow">
          <form onSubmit={() => handleSubmit(onSubmit)}>
            <div className="flex items-center justify-between">
              <div className="flex grow items-center space-x-2 rounded-lg bg-gray-800 px-3 py-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <input
                  id="search"
                  placeholder="Search"
                  className="bg-gray-800 text-sm text-white placeholder:text-gray-400 focus:outline-none"
                  aria-label="Search"
                  data-testid="search-input"
                  {...register('query')}
                />
              </div>
              <button
                className="ml-3 rounded bg-gray-600 px-3 py-2 text-white"
                aria-label="Search"
                data-testid="search-button"
                type="submit"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        <div className="ml-auto">
          <Link href="/upload" className="ml-3 rounded bg-gray-600 px-3 py-2 text-white">
            Upload
          </Link>
        </div>
        <div className="ml-auto  px-3 py-2">
          {isSignedIn ? <UserButton /> : <>
            <RedirectToSignIn />
            <RedirectToSignUp />
          </>}
        </div>
      </div>
    </div>
  );
}
