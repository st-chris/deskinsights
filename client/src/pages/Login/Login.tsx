import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../types/redux';
import { login } from '../../reducers/auth/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginFormData } from '../../utils/validationSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  selectAuthLoading,
  selectAuthError,
} from '../../reducers/auth/selectors';

export default function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isLoading = useSelector(selectAuthLoading);
  const { isError, errorMessage } = useSelector(selectAuthError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(login(data));

    if (login.fulfilled.match(result)) {
      navigate('/workspaces');
    }
  };

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-6 text-center'>Sign In</h2>
      {isError && <p className='text-red-600 mb-5'>{errorMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <div>
          <label htmlFor='email' className='block text-sm font-medium mb-1'>
            Email
          </label>
          <input
            id='email'
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:outline-none'
            {...register('email')}
          />
          {errors.email && (
            <p className='text-red-600'>{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor='password' className='block text-sm font-medium mb-1'>
            Password
          </label>
          <input
            id='password'
            type='password'
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:outline-none'
            {...register('password')}
          />
          {errors.password && (
            <p className='text-red-600'>{errors.password.message}</p>
          )}
        </div>
        <button
          type='submit'
          disabled={isLoading}
          className={`
            w-full px-4 py-2 rounded-lg font-semibold text-center transition-all
            ${
              isLoading
                ? 'bg-amber-300 text-white cursor-not-allowed'
                : 'bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:brightness-110'
            }
          `}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className='mt-4 text-center text-sm'>
        Don't have an account?{' '}
        <Link to='/register' className='text-amber-600 hover:underline'>
          Register
        </Link>
      </p>
    </div>
  );
}
