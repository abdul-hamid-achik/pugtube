import { api } from '@/utils/api';
import type { GetServerSidePropsContext } from 'next';
import { getCsrfToken, signIn } from 'next-auth/react';
import Head from 'next/head';
import React from 'react';
import { useForm } from 'react-hook-form';

// import prisma from "@db";

const MINIMUM_ACTIVITY_TIMEOUT = 850;
type LoginFormValues = {
  csrfToken: string;
  name: string;
  email: string;
  password: string;
};

interface Props {
  csrfToken: string;
}

export default function Page({ csrfToken }: Props) {
  const [isSubmitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit } = useForm<LoginFormValues>();
  const { mutate } = api.users.signup.useMutation({
    onSuccess: async (data) => {
      await signIn('app-login', {
        callbackUrl: '/',
        email: data.email,
        password: data.password,
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setSubmitting(true);
    try {
      mutate(data);
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
        <title>Setup</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="py-12 text-center sm:mx-auto sm:w-full sm:max-w-md" />
      <div className=" mt-8 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center sm:mx-auto sm:w-full sm:max-w-md ">
          <p>Get started by creating an account to setup.</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-2 rounded-sm py-8 px-4 sm:px-10">
            <form className=" text-center " onSubmit={() => handleSubmit(onSubmit)}>
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
              <div className="">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-400"
                >
                  Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    {...register('name')}
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

              <div className="mt-16 flex justify-center space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <p>Creating Account...</p>
                  ) : (
                    <p>Create Account</p>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: { csrfToken: await getCsrfToken({ req: context.req }) },
  };
}
