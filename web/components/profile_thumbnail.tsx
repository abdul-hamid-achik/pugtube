import {useSession} from 'next-auth/react'
import Image from 'next/image'
import {AccountsApi, Configuration} from '../client'
import {useQuery} from '@tanstack/react-query';
import {Session} from 'next-auth';

const api = new AccountsApi(new Configuration({basePath: process.env.NEXT_PUBLIC_API_BASE_PATH}))

interface SessionWithUserId extends Session {
    user_id?: string;
}

function ProfileThumbnail() {
    const {data: session} = useSession() as {data: SessionWithUserId}

    const {data} = useQuery(['profile', session?.user_id], () => {
        if (!session?.user_id) return null
        return api.retrieveProfile(session.user_id).then(
            (response) => {
                if (response.statusText !== 'OK') {
                    throw new Error(response.statusText)
                }

                return response
            }
        ).then(response => response.data)
    }, {enabled: !!session?.user_id})

    return (
        <Image src={data?.profile_picture as unknown as string} className="h-8 w-8 rounded-full"
               alt="User thumbnail"/>
    )
}

export default ProfileThumbnail
