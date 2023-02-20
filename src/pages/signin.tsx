import type { GetServerSidePropsContext } from 'next';
import {
  getSession,
  getCsrfToken,
  signIn,
  getProviders,
} from 'next-auth/react';
import { filter } from 'lodash';
import type { ClientSafeProvider } from 'next-auth/react';
import Head from 'next/head';
import React from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

const MINIMUM_ACTIVITY_TIMEOUT = 850;
type LoginFormValues = {
  csrfToken: string;
  email: string;
  password: string;
};

interface Props {
  csrfToken: string;
  providers: ClientSafeProvider[];
}

export default function Page({ csrfToken, providers }: Props) {
  const [isSubmitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit } = useForm<LoginFormValues>();

  const handleProviderSignIn = async (provider: ClientSafeProvider) => {
    await signIn(provider.id);
  };
  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    try {
      await signIn('app-login', {
        callbackUrl: '/',
        email: data?.email,
        password: data?.password,
      });

      setTimeout(() => {
        setSubmitting(false);
      }, MINIMUM_ACTIVITY_TIMEOUT);
    } catch (error) {
      console.error(error);
      //   setError(error)
      setSubmitting(false);
    }
  };

  return (
    <div className="flex  min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Sign In</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="py-12 text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" />
      </div>
      <div className=" flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:leading-9">
            Sign In
          </h1>
          <h2>Sign in with an existing account, or create new account.</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-2 rounded-sm py-8 px-4 sm:px-10">
            <form
              className="my-12 text-center"
              onSubmit={() => handleSubmit(onSubmit)}
            >
              <input
                {...register('csrfToken')}
                type="hidden"
                defaultValue={csrfToken}
                hidden
              />
              <div className="">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-400"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    {...register('email')}
                    className="w-full appearance-none border-x-0 border-b border-t-0 border-dashed bg-transparent py-3 text-center text-xl font-medium leading-6 outline-none transition duration-150 ease-in-out placeholder:text-gray-500 focus:outline-none focus:placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <div className="mt-8">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-400"
                  >
                    Password
                  </label>
                </div>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    minLength={12}
                    required
                    {...register('password')}
                    className="w-full appearance-none border-x-0 border-b border-t-0 border-dashed bg-transparent py-3 text-center text-xl font-medium leading-6 outline-none transition duration-150 ease-in-out placeholder:text-gray-500 focus:outline-none focus:placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <p>Signing in...</p>
                  ) : (
                    <p>Sign in</p>
                  )}
                </button>
              </div>
            </form>
            <section className="mt-8 text-center">
              <div className="mb-3 flex flex-col">
                <hr className="mt-1 h-0 border-t" />
                <div className="-mt-3 text-center text-sm">
                  <span className="bg-white px-2">Or with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      handleProviderSignIn(provider).catch((error) => console.error(error));
                    }}
                    className="inline-flex space-x-2"
                  >
                    <p>{provider.name}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (session) {
    return { redirect: { permanent: false, destination: '/' } };
  }

  const csrfToken = await getCsrfToken({ req: context.req });
  const providers = filter(await getProviders(), (provider: ClientSafeProvider) => provider.type !== 'credentials');

  return {
    props: { csrfToken, providers },
  };
}
