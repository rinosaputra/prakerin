export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-4xl font-extrabold text-red-600">403</h1>
        <h2 className="text-2xl font-bold text-gray-900">Akses Ditolak</h2>
        <p className="text-gray-600">
          Anda tidak memiliki akses ke halaman ini. Silakan hubungi administrator
          jika ini adalah kesalahan.
        </p>
        <a
          href="/login"
          className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Kembali ke Login
        </a>
      </div>
    </div>
  );
}