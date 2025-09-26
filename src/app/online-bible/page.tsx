export default function OnlineBiblePage() {
  return (
    <div className="min-h-screen flex flex-col pt-20 bg-gray-900">
      <div className="text-center mb-8 px-4">
        <h1 className="text-5xl font-bold text-white mb-2">Online Bible</h1>
        <p className="text-lg text-gray-400">Powered by Biblica</p>
      </div>
      <iframe
        src="https://www.biblica.com/bible/"
        className="w-full h-[calc(100vh-150px)] border-none"
        title="Online Bible"
      ></iframe>
    </div>
  );
}