function ImportNotice({ gameCount }: { gameCount: number }) {
  if (gameCount === 0) return null;

  return (
    <>
      <div className="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4">
        <p className="font-medium text-blue-700">
          We&apos;ve found {gameCount} games in your Steam profile
        </p>
        <p className="mt-2 text-blue-600">
          We&apos;ve filtered games that you already logged into the app with PC
          as a platform and merged different clients of the game (e.g. Call of
          Duty and Call of Duty Multiplayer).
        </p>
      </div>
    </>
  );
}

export { ImportNotice };
