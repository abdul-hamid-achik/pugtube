import { prisma } from '@/server/db';
export default function WatchPage() {
    return (
        <div>
            <h1>Watch Page</h1>
        </div>
    )
}

export async function getServerSideProps({ params }: { params: { id: string } }) {
    const { id } = params;

    const video = await prisma.video.findUnique({
        where: {
            id
        },
        include: {
            author: true
        }
    })

    return {
        props: {
            video
        },
    };
}