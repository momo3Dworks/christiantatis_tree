export default function BiblePage() {
  return (
    <div className="w-full h-screen pt-[60px]">
      <iframe
        src="https://www.biblica.com/bible/"
        className="w-full h-full border-0"
        title="Online Bible"
        allowFullScreen
      ></iframe>
    </div>
  );
}
