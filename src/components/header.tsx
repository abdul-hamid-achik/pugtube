import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Auth from './auth'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'

interface FormData {
    query: string
}

export default function Header() {
    const { data: sessionData } = useSession()
    const { register, handleSubmit } = useForm<FormData>()
    const onSubmit = (data: FormData) => {
        // send data to the server
        console.log(data)
    }

    console.log(sessionData)

    return (
        <div className="bg-gray-900 py-2">
            <div className="flex items-center">
                <div className="flex-grow">
                    <form onSubmit={() => handleSubmit(onSubmit)}>
                        <div className="flex items-center">
                            <div className="flex-grow flex items-center rounded-lg bg-gray-800 px-3 py-2 space-x-2">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                <label htmlFor="search" className="sr-only">
                                    Search
                                </label>
                                <input
                                    id="search"
                                    placeholder="Search"
                                    className="bg-gray-800 text-sm text-white focus:outline-none placeholder-gray-400"
                                    aria-label="Search"
                                    data-testid="search-input"
                                    {...register('query')}
                                />
                            </div>
                            <button
                                className="ml-3 px-3 py-2 bg-gray-600 text-white rounded"
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
                    <Auth />
                </div>
            </div>
        </div>
    )
}
