export default function WarehouseDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Панель работника</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Принято сегодня</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Неопознанные</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Очередь упаковки</p>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
