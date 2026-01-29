import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../types/redux';
import { register as registerUser } from '../../reducers/auth/auth';
import { useForm } from 'react-hook-form';
import {
  registerSchema,
  type RegisterFormData,
} from '../../utils/validationSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  selectAuthLoading,
  selectAuthError,
} from '../../reducers/auth/selectors';

export default function Register() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const { isError, errorMessage } = useSelector(selectAuthError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const result = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(result)) {
      navigate('/login');
    }
  };

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-6 text-center'>
        Create Account
      </h2>

      {isError && <p className='text-red-600'>{errorMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <div>
          <label htmlFor='name' className='block text-sm font-medium mb-1'>
            Name
          </label>
          <input
            id='name'
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:outline-none'
            {...register('name')}
          />
          {errors.name && <p className='text-red-600'>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor='email' className='block text-sm font-medium mb-1'>
            Email
          </label>
          <input
            id='email'
            type='email'
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:outline-none'
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
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:outline-none'
            {...register('password')}
          />
          {errors.password && (
            <p className='text-red-600'>{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium mb-1'
          >
            Confirm Password
          </label>
          <input
            id='confirmPassword'
            type='password'
            className='w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:outline-none'
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className='text-red-600'>{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='
    w-full px-4 py-2 rounded-lg
    bg-linear-to-r from-amber-500 to-amber-600
    text-white font-semibold text-center
    shadow-md hover:shadow-lg hover:brightness-110
    transition-all
  '
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className='mt-4 text-center text-sm'>
        Already have an account?{' '}
        <Link to='/login' className='text-amber-600 hover:underline'>
          Sign in
        </Link>
      </p>
    </div>
  );
}
