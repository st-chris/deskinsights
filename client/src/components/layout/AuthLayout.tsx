import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 to-orange-100 p-6'>
      <div className='relative w-full max-w-md p-8 bg-white rounded-2xl shadow-xl'>
        <div className='absolute inset-0 -z-10 blur-2xl opacity-30 bg-linear-to-r from-amber-300 via-orange-300 to-yellow-300 rounded-2xl'></div>

        <h1 className='text-3xl font-bold text-center text-amber-700 drop-shadow-sm mb-6'>
          DeskInsights
        </h1>

        <Outlet />
      </div>
    </div>
  );
}
