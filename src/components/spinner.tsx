
export default function Spinner() {
    return (
        <div className="flex items-center justify-center">
            <div className="mr-2 h-6 w-6 animate-spin rounded-full border-4 border-gray-200">
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}
