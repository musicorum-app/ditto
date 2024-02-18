// This is an example of a blueprint file, used to generate images using JSX + Tailwind.
// SUpports a limited set of CSS rules (display should be flex or none for example), and no React hooks.
export const configuration = {
    width: 800,
    height: 400
}

export default function ({ title }) {
    // cwntralized text, with gradient from red to bluw
    return (
        <div tw="flex flex-col w-full h-full items-center justify-center">
            <div tw="bg-gray-50 flex w-full">
                <div tw="flex flex-col md:flex-row w-full py-12 px-4 md:items-center justify-between p-8">
                <h2 tw="flex flex-col text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-left">
                    <span>Você é gay?</span>
                    <span tw="text-indigo-600">Old bb rs! // {title} 💋</span>
                </h2>
                </div>
            </div>
        </div>
    )
}

